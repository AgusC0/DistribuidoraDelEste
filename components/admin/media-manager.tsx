'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Film, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmButton, FormMessage, Panel, SubmitButton, Switch } from '@/components/admin/ui'
import { addGalleryItem, deleteGalleryItem, moveGalleryItem, updateGalleryItem, type FormState } from '@/app/admin/actions'
import { GALLERY_SECTIONS } from '@/lib/gallery'
import type { GalleryItem, GallerySection } from '@/lib/types'

const selectClass =
  'h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** Subir fotos y videos del local y del equipo, ordenarlos y elegir cuáles se ven en el sitio. */
export function MediaManager({ items }: { items: GalleryItem[] }) {
  return (
    <div className="flex flex-col gap-6">
      <UploadForm />
      {GALLERY_SECTIONS.map((s) => (
        <Panel key={s.id}>
          <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">{s.label}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{s.hint}</p>
          {items.filter((i) => i.section === s.id).length === 0 ? (
            <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              Todavía no hay {s.id === 'videos' ? 'videos' : 'fotos'} acá. Mientras esté vacía, esta parte no aparece en el sitio.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items
                .filter((i) => i.section === s.id)
                .map((item, index, list) => (
                  <MediaCard key={item.id} item={item} first={index === 0} last={index === list.length - 1} />
                ))}
            </ul>
          )}
        </Panel>
      ))}
    </div>
  )
}

function UploadForm() {
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await addGalleryItem(prev, fd)
    if (result.ok) {
      formRef.current?.reset()
      setIsVideo(false)
    }
    return result
  }, {})
  const [isVideo, setIsVideo] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <Panel>
      <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">Agregar foto o video</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Fotos JPG, PNG o WEBP de hasta 10 MB. Videos MP4 de hasta 80 MB (los grabados con el celular funcionan bien; si
        pesan más, mandalos por WhatsApp y descargalos, que ahí se comprimen).
      </p>
      <form ref={formRef} action={action} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
          Archivo
          <input
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setIsVideo(e.target.files?.[0]?.type.startsWith('video/') ?? false)}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </label>
        {isVideo ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Portada del video (opcional)
            <input
              type="file"
              name="poster"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <span className="text-xs font-normal text-muted-foreground">La imagen que se ve antes de darle play.</span>
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            ¿Dónde va?
            <select name="section" defaultValue="local" className={selectClass}>
              <option value="local">El local</option>
              <option value="equipo">El equipo</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Título
          <Input name="title" maxLength={80} placeholder={isVideo ? 'Ej: Recorré el local' : 'Ej: Salón de ventas'} className="h-10" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
          Descripción para Google
          <Input
            name="alt"
            maxLength={200}
            placeholder="Ej: Exhibición de termotanques en el salón de Distribuidora del Este, Villa María"
            className="h-10"
          />
          <span className="text-xs font-normal text-muted-foreground">
            Qué se ve en la foto. Ayuda a aparecer en Google Imágenes y a quien usa lector de pantalla.
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <SubmitButton>
            {isVideo ? <Film /> : <ImagePlus />}
            Subir
          </SubmitButton>
          <FormMessage state={state} />
        </div>
      </form>
    </Panel>
  )
}

function MediaCard({ item, first, last }: { item: GalleryItem; first: boolean; last: boolean }) {
  const [pending, start] = useTransition()
  const [title, setTitle] = useState(item.title)
  const [alt, setAlt] = useState(item.alt)
  const save = (patch: Parameters<typeof updateGalleryItem>[1]) => start(() => updateGalleryItem(item.id, patch))
  return (
    <li className={`flex flex-col gap-3 rounded-xl border border-border p-3 ${item.active ? '' : 'opacity-60'}`}>
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {item.kind === 'video' ? (
          <video src={item.src} poster={item.poster} controls preload="none" className="aspect-video w-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.src} alt={item.alt} loading="lazy" className="aspect-video w-full object-cover" />
        )}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== item.title && save({ title })}
        placeholder="Título"
        aria-label="Título"
        className="h-9"
      />
      <Input
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onBlur={() => alt !== item.alt && save({ alt })}
        placeholder="Descripción para Google"
        aria-label="Descripción para Google"
        className="h-9"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={item.active} disabled={pending} onChange={() => save({ active: !item.active })} label="Visible en el sitio" />
          Visible
        </label>
        {item.kind === 'image' && (
          <select
            value={item.section}
            disabled={pending}
            onChange={(e) => save({ section: e.target.value as GallerySection })}
            aria-label="Sección"
            className={`${selectClass} h-9`}
          >
            <option value="local">El local</option>
            <option value="equipo">El equipo</option>
          </select>
        )}
        <div className="flex items-center gap-1">
          <Button type="button" size="icon-sm" variant="ghost" disabled={first || pending} aria-label="Subir" onClick={() => start(() => moveGalleryItem(item.id, -1))}>
            <ArrowUp />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" disabled={last || pending} aria-label="Bajar" onClick={() => start(() => moveGalleryItem(item.id, 1))}>
            <ArrowDown />
          </Button>
          <ConfirmButton
            title="¿Eliminar este archivo?"
            description="Se quita del sitio. Si lo subiste desde el panel, también se borra del servidor."
            onConfirm={() => deleteGalleryItem(item.id)}
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
