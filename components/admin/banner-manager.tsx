'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmButton, FormMessage, Panel, SubmitButton, Switch } from '@/components/admin/ui'
import { addBanner, deleteBanner, moveBanner, updateBanner, type FormState } from '@/app/admin/actions'
import type { Banner } from '@/lib/types'

const selectClass =
  'h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
const fileClass = 'text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium'

/** A dónde puede llevar un banner (también se puede pegar cualquier link). */
const DESTINATIONS = [
  { value: '', label: 'A ningún lado (solo se ve)' },
  { value: '/productos?oferta=1', label: 'Todas las promociones' },
  { value: '/productos', label: 'Todo el catálogo' },
  { value: '/#contacto', label: 'Contacto' },
  { value: '/#local', label: 'El local' },
]
const isPreset = (v: string) => DESTINATIONS.some((d) => d.value === v)

function LinkField({ value, onChange, name }: { value: string; onChange: (v: string) => void; name?: string }) {
  const custom = !isPreset(value)
  return (
    <div className="flex flex-col gap-2">
      <select
        value={custom ? '__custom' : value}
        onChange={(e) => onChange(e.target.value === '__custom' ? 'https://' : e.target.value)}
        aria-label="A dónde lleva"
        className={selectClass}
      >
        {DESTINATIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
        <option value="__custom">Otro link (una categoría, un producto, Instagram…)</option>
      </select>
      {custom && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/productos?categoria=termotanques  o  https://…"
          aria-label="Link del banner"
          className="h-10"
        />
      )}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  )
}

export function BannerManager({ items }: { items: Banner[] }) {
  return (
    <div className="flex flex-col gap-6">
      <UploadForm />
      <Panel>
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">Banners cargados</h2>
        {items.length === 0 ? (
          <p className="mt-3 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
            Todavía no hay banners. Mientras no haya ninguno, esta parte no aparece en el sitio.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">El orden es el de esta lista. Si hay más de uno, en el sitio rotan solos.</p>
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((b, i) => (
                <BannerCard key={b.id} item={b} first={i === 0} last={i === items.length - 1} />
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  )
}

function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [link, setLink] = useState('/productos?oferta=1')
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await addBanner(prev, fd)
    if (result.ok) formRef.current?.reset()
    return result
  }, {})
  return (
    <Panel>
      <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">Agregar banner</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Imagen horizontal (recomendado 1800 × 600 px) en JPG, PNG o WEBP de hasta 10 MB. Si querés que en el celular se vea mejor, subí
        también una versión cuadrada (1080 × 1080 px).
      </p>
      <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Imagen
          <input type="file" name="image" required accept="image/jpeg,image/png,image/webp,image/avif" className={fileClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Versión para celular (opcional)
          <input type="file" name="mobileImage" accept="image/jpeg,image/png,image/webp,image/avif" className={fileClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
          Descripción
          <Input name="alt" maxLength={200} placeholder="Ej: Promo monocomando de cocina $38.000" className="h-10" />
          <span className="text-xs font-normal text-muted-foreground">Qué dice el banner. Ayuda a Google y a quien usa lector de pantalla.</span>
        </label>
        <div className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
          Al tocarlo lleva a
          <LinkField value={link} onChange={setLink} name="link" />
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <SubmitButton>
            <ImagePlus />
            Subir banner
          </SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
    </Panel>
  )
}

function BannerCard({ item, first, last }: { item: Banner; first: boolean; last: boolean }) {
  const [pending, start] = useTransition()
  const [alt, setAlt] = useState(item.alt)
  const [link, setLink] = useState(item.link)
  const [error, setError] = useState('')
  const save = (patch: Parameters<typeof updateBanner>[1]) =>
    start(async () => {
      const r = await updateBanner(item.id, patch)
      setError(r.message ?? '')
    })
  return (
    <li className={`flex flex-col gap-3 rounded-xl border border-border p-3 ${item.active ? '' : 'opacity-60'}`}>
      <div className="flex gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.alt} loading="lazy" className="aspect-[3/1] min-w-0 flex-1 rounded-lg bg-muted object-cover" />
        {item.mobileImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.mobileImage} alt="" loading="lazy" className="size-16 shrink-0 rounded-lg bg-muted object-cover" title="Versión para celular" />
        )}
      </div>
      <Input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => alt !== item.alt && save({ alt })}
        placeholder="Descripción"
        aria-label="Descripción"
        className="h-9"
      />
      <LinkField
        value={link}
        onChange={(v) => {
          setLink(v)
          if (isPreset(v)) save({ link: v })
        }}
      />
      {!isPreset(link) && (
        <Button type="button" size="sm" variant="outline" disabled={pending || link === item.link} onClick={() => save({ link })}>
          Guardar link
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={item.active} disabled={pending} onChange={() => save({ active: !item.active })} label="Visible en el sitio" />
          Visible
        </label>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon-sm" variant="ghost" disabled={first || pending} aria-label="Subir" onClick={() => start(() => moveBanner(item.id, -1))}>
            <ArrowUp />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" disabled={last || pending} aria-label="Bajar" onClick={() => start(() => moveBanner(item.id, 1))}>
            <ArrowDown />
          </Button>
          <ConfirmButton
            title="¿Eliminar este banner?"
            description="Se quita de la portada y se borra la imagen del servidor."
            onConfirm={() => deleteBanner(item.id)}
            variant="ghost"
            size="icon-sm"
            aria-label="Eliminar"
          >
            <Trash2 />
          </ConfirmButton>
        </div>
      </div>
    </li>
  )
}
