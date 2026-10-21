'use client'

import { useActionState, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GalleryEditor } from '@/components/admin/gallery-editor'
import { RelatedPicker, type PickerProduct } from '@/components/admin/related-picker'
import { SpecsEditor } from '@/components/admin/specs-editor'
import { VariantsEditor } from '@/components/admin/variants-editor'
import { FieldError, FormMessage, inputClass, Panel, SubmitButton, submitKeepingValues } from '@/components/admin/ui'
import { saveProduct, type FormState } from '@/app/admin/actions'
import { formatPrice, slugify, STOCK_LABEL } from '@/lib/site'
import { flattenCategories } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Category, Product, StockStatus } from '@/lib/types'

const labelClass = 'text-sm font-medium text-foreground'
const hintClass = 'text-xs text-muted-foreground'

export function ProductForm({
  product,
  categories,
  created,
  brands = [],
  attributeSuggestions = {},
  catalogProducts = [],
}: {
  product?: Product
  categories: Category[]
  created?: boolean
  /** Marcas ya cargadas, para sugerirlas y evitar "Tigre" / "tigre" / "TIGRE". */
  brands?: string[]
  /** Valores usados en otros productos por cada filtro (tipo → Codo, Tee…). */
  attributeSuggestions?: Record<string, string[]>
  /** Todos los productos, para elegir complementos. */
  catalogProducts?: PickerProduct[]
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProduct,
    created ? { ok: true, message: 'Producto creado.' } : {},
  )
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!product)
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [promo, setPromo] = useState(product?.promo ?? false)
  const [sku, setSku] = useState(product?.sku ?? '')
  const [originalPrice, setOriginalPrice] = useState(product?.promotion.originalPrice?.toString() ?? '')
  const [manualPercent, setManualPercent] = useState(product?.promotion.discountPercent?.toString() ?? '')
  const [attrs, setAttrs] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(product?.attributes ?? {}).map(([k, v]) => [k, v.join(', ')])),
  )
  const selectedCategory = categories.find((c) => c.id === categoryId)
  const categoryFilters = selectedCategory?.filters ?? []
  const attributesValue = JSON.stringify(
    Object.fromEntries(
      categoryFilters
        .map((f) => [f.key, (attrs[f.key] ?? '').split(',').map((v) => v.trim()).filter(Boolean)] as const)
        .filter(([, v]) => v.length),
    ),
  )
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [preview, setPreview] = useState(product?.image ?? '')

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  const e = state.errors ?? {}
  const priceNumber = price.replace(/\D/g, '') ? Number(price.replace(/\D/g, '')) : null
  const originalNumber = originalPrice ? Number(originalPrice) : null
  const promoPercent =
    originalNumber && priceNumber != null && originalNumber > priceNumber
      ? Math.round(((originalNumber - priceNumber) / originalNumber) * 100)
      : manualPercent
        ? Number(manualPercent)
        : null

  function addTag(raw: string) {
    const parts = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && !tags.includes(t))
    if (parts.length) setTags((t) => [...t, ...parts])
    setTagInput('')
  }

  return (
    <form onSubmit={submitKeepingValues(action)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <input type="hidden" name="id" value={product?.id ?? ''} />
      <input type="hidden" name="tags" value={tags.join(',')} />

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Panel data-guide="producto-info" className="flex flex-col gap-5">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Información</h2>

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className={labelClass}>
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              required
              aria-invalid={!!e.name}
              aria-describedby="name-err"
              className={inputClass}
              placeholder="Ej: Monocomando de Cocina"
            />
            <FieldError id="name-err" message={e.name} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="slug" className={labelClass}>
              Dirección web
            </label>
            <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
              <span className="pl-3 text-sm text-muted-foreground">/productos/</span>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(ev) => {
                  setSlugTouched(true)
                  setSlug(slugify(ev.target.value))
                }}
                className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
              />
            </div>
            <p className={hintClass}>Se genera sola a partir del nombre. Cambiarla rompe los enlaces viejos.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="categoryId" className={labelClass}>
                Categoría <span className="text-destructive">*</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={categoryId}
                onChange={(ev) => setCategoryId(ev.target.value)}
                aria-invalid={!!e.categoryId}
                className={inputClass}
              >
                {flattenCategories(categories).map(({ category: c, depth }) => (
                  <option key={c.id} value={c.id} className={depth === 1 ? 'font-semibold' : undefined}>
                    {'   '.repeat(depth - 1)}
                    {depth > 1 ? '└ ' : ''}
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError message={e.categoryId} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="brand" className={labelClass}>
                Marca
              </label>
              <input
                id="brand"
                name="brand"
                list="brand-list"
                defaultValue={product?.brand ?? ''}
                placeholder="Ej: Tigre, FV, Rotoplas"
                className={inputClass}
              />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <p className={hintClass}>Aparece como filtro “Marca” en el catálogo.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="price" className={labelClass}>
                Precio (ARS)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  id="price"
                  name="price"
                  inputMode="numeric"
                  value={price}
                  onChange={(ev) => setPrice(ev.target.value.replace(/[^\d]/g, ''))}
                  placeholder="Vacío = Consultar precio"
                  className={cn(inputClass, 'pl-7 tabular-nums')}
                />
              </div>
              <p className={hintClass}>{priceNumber != null ? `Se muestra como ${formatPrice(priceNumber)}` : 'Se muestra "Consultar precio".'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[12rem_1fr]">
            <div className="flex flex-col gap-2">
              <label htmlFor="sku" className={labelClass}>
                Código / referencia
              </label>
              <input
                id="sku"
                name="sku"
                value={sku}
                onChange={(ev) => setSku(ev.target.value.toUpperCase())}
                placeholder="Ej: FE-IBA"
                className={cn(inputClass, 'font-mono')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="shortDescription" className={labelClass}>
                Bajada corta
              </label>
              <input
                id="shortDescription"
                name="shortDescription"
                defaultValue={product?.shortDescription ?? ''}
                maxLength={200}
                placeholder="Una línea debajo del título. Ej: Inodoro largo de loza para mochila de apoyo."
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className={labelClass}>
              Descripción completa
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              className={cn(inputClass, 'h-auto py-2 leading-relaxed')}
              placeholder="Materiales, medidas, colores, marca…"
            />
            <p className={cn(hintClass, 'text-right')}>{description.length}/1000</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tag-input" className={labelClass}>
              Palabras clave para el buscador
            </label>
            <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags((list) => list.filter((x) => x !== t))}
                    aria-label={`Quitar ${t}`}
                    className="rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                id="tag-input"
                value={tagInput}
                onChange={(ev) => {
                  if (ev.target.value.endsWith(',')) addTag(ev.target.value)
                  else setTagInput(ev.target.value)
                }}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter') {
                    ev.preventDefault()
                    addTag(tagInput)
                  } else if (ev.key === 'Backspace' && !tagInput && tags.length) {
                    setTags((list) => list.slice(0, -1))
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length ? '' : 'canilla, grifo, cromada…'}
                className="h-7 min-w-32 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <p className={hintClass}>
              Sinónimos y palabras que usa la gente (ej: "calefón" para termotanques). Separalas con coma o Enter.
            </p>
          </div>
        </Panel>

        <Panel data-guide="producto-filtros" className="flex flex-col gap-4">
          <input type="hidden" name="attributes" value={attributesValue} />
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Filtros del catálogo</h2>
            <p className={hintClass}>
              Lo que se completa acá aparece como filtro en {selectedCategory?.name ?? 'la categoría'}. Varios valores separados por
              coma (ej: 20 mm, 25 mm).
            </p>
          </div>
          {categoryFilters.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categoryFilters.map((f) => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label htmlFor={`attr-${f.key}`} className={labelClass}>
                    {f.label}
                  </label>
                  <input
                    id={`attr-${f.key}`}
                    list={`attr-list-${f.key}`}
                    value={attrs[f.key] ?? ''}
                    onChange={(ev) => setAttrs((a) => ({ ...a, [f.key]: ev.target.value }))}
                    className={inputClass}
                  />
                  <datalist id={`attr-list-${f.key}`}>
                    {(attributeSuggestions[f.key] ?? []).map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              Esta categoría no tiene filtros propios. Se configuran en Panel → Categorías.
            </p>
          )}
        </Panel>

        <Panel data-guide="producto-fotos" className="flex flex-col gap-4">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Fotos</h2>
          <GalleryEditor
            key={product?.updatedAt ?? 'nuevo'}
            initial={product?.images ?? []}
            error={e.image}
            onMainChange={setPreview}
          />
        </Panel>

        <Panel data-guide="producto-variantes" className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Opciones y variantes</h2>
            <p className={hintClass}>
              Medidas, colores o capacidades. Cada combinación tiene su código, precio, stock y foto. Opcional.
            </p>
          </div>
          <VariantsEditor
            key={product?.updatedAt ?? 'nuevo'}
            initialOptions={product?.options ?? []}
            initialVariants={product?.variants ?? []}
            baseSku={sku}
            imageCount={product?.images.length ?? 0}
          />
        </Panel>

        <Panel data-guide="producto-complementos" className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Complementos</h2>
            <p className={hintClass}>Productos que se compran junto con este. Aparecen en “Completá tu compra” y en el pedido.</p>
          </div>
          <RelatedPicker key={product?.updatedAt ?? 'nuevo'} products={catalogProducts} initial={product?.related ?? []} currentId={product?.id} />
        </Panel>

        <Panel data-guide="producto-ficha" className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Ficha técnica</h2>
            <p className={hintClass}>Se muestra en “Detalles del producto”: medidas, garantía, material, origen…</p>
          </div>
          <SpecsEditor key={product?.updatedAt ?? 'nuevo'} initial={product?.specs ?? []} />
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel data-guide="producto-estado" className="flex flex-col gap-4">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Estado</h2>
          {[
            { name: 'active', label: 'Publicado', hint: 'Visible en el sitio', checked: product?.active ?? true },
            { name: 'featured', label: 'Destacado', hint: 'Aparece primero en el catálogo', checked: product?.featured ?? false },
          ].map((f) => (
            <label key={f.name} className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" name={f.name} defaultChecked={f.checked} className="mt-0.5 size-4 accent-primary" />
              <span>
                <span className="block text-sm font-medium">{f.label}</span>
                <span className={hintClass}>{f.hint}</span>
              </span>
            </label>
          ))}
          <div className="flex flex-col gap-2">
            <label htmlFor="stock" className={labelClass}>
              Stock
            </label>
            <select id="stock" name="stock" defaultValue={product?.stock ?? 'disponible'} className={inputClass}>
              {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STOCK_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </Panel>

        <Panel data-guide="producto-promo" className={cn('flex flex-col gap-4 transition-colors', promo && 'ring-2 ring-promo/40')}>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="promo" checked={promo} onChange={(ev) => setPromo(ev.target.checked)} className="mt-0.5 size-4 accent-promo" />
            <span>
              <span className="block font-heading text-base font-semibold uppercase tracking-wide">En promoción</span>
              <span className={hintClass}>Aparece primero en “Ofertas” y con su badge en todo el catálogo. No cambia la categoría.</span>
            </span>
          </label>
          <div className={cn('flex flex-col gap-4', !promo && 'hidden')}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="promoOriginalPrice" className={labelClass}>
                Precio anterior (tachado)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  id="promoOriginalPrice"
                  name="promoOriginalPrice"
                  inputMode="numeric"
                  value={originalPrice}
                  onChange={(ev) => setOriginalPrice(ev.target.value.replace(/[^\d]/g, ''))}
                  aria-invalid={!!e.promoOriginalPrice}
                  placeholder="Ej: 120000"
                  className={cn(inputClass, 'pl-7 tabular-nums')}
                />
              </div>
              <FieldError message={e.promoOriginalPrice} />
              <p className={hintClass}>El precio promocional es el “Precio” de arriba.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="promoDiscountPercent" className={labelClass}>
                % OFF (si no hay precio anterior)
              </label>
              <input
                id="promoDiscountPercent"
                name="promoDiscountPercent"
                inputMode="numeric"
                value={manualPercent}
                onChange={(ev) => setManualPercent(ev.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                placeholder="Ej: 20"
                className={cn(inputClass, 'tabular-nums')}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="promoStartsAt" className={labelClass}>
                  Desde
                </label>
                <input id="promoStartsAt" name="promoStartsAt" type="date" defaultValue={product?.promotion.startsAt ?? ''} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="promoEndsAt" className={labelClass}>
                  Hasta
                </label>
                <input
                  id="promoEndsAt"
                  name="promoEndsAt"
                  type="date"
                  defaultValue={product?.promotion.endsAt ?? ''}
                  aria-invalid={!!e.promoEndsAt}
                  className={inputClass}
                />
                <FieldError message={e.promoEndsAt} />
              </div>
            </div>
            <p className={cn(hintClass, '-mt-2')}>Opcional. Fuera de esas fechas la promo se oculta sola.</p>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="promoLimitedStock"
                defaultChecked={product?.promotion.limitedStock ?? false}
                className="size-4 accent-promo"
              />
              <span className="text-sm font-medium">Mostrar “Hasta agotar stock”</span>
            </label>
            {promoPercent != null && (
              <p className="rounded-lg bg-promo/10 px-3 py-2 text-sm font-semibold text-promo">
                Se muestra como {promoPercent}% OFF
                {originalNumber && priceNumber != null && ` · antes ${formatPrice(originalNumber)}, ahora ${formatPrice(priceNumber)}`}
              </p>
            )}
          </div>
        </Panel>

        <Panel data-guide="producto-vista">
          <h2 className="mb-3 font-heading text-base font-semibold uppercase tracking-wide">Vista previa</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="relative aspect-[4/3] bg-secondary">
              {preview && <Image src={preview} alt="" fill sizes="320px" className="object-cover" unoptimized={preview.startsWith('blob:')} />}
              {promo && (
                <Badge className="absolute left-3 top-3 bg-promo uppercase text-promo-foreground">
                  {promoPercent ? `-${promoPercent}%` : 'Oferta'}
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide">{name || 'Nombre del producto'}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{description || 'Descripción del producto.'}</p>
              <p className={cn('mt-1 font-heading font-bold', priceNumber != null ? 'text-lg text-primary' : 'text-sm text-muted-foreground')}>
                {formatPrice(priceNumber)}
              </p>
            </div>
          </div>
        </Panel>

        <div data-guide="producto-guardar" className="sticky bottom-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg lg:static lg:shadow-xs">
          <FormMessage state={state} />
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos" />}>
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            <SubmitButton pending={pending} className="flex-1">{product ? 'Guardar cambios' : 'Crear producto'}</SubmitButton>
          </div>
          {product && (
            <a href={`/productos/${product.slug}`} target="_blank" rel="noopener noreferrer" className="text-center text-sm text-primary hover:underline">
              Ver en el sitio
            </a>
          )}
        </div>
      </div>
    </form>
  )
}
