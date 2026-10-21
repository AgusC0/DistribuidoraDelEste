'use client'

import { PromoBadge } from '@/components/promo-badge'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Banknote, Check, ChevronLeft, ChevronRight, Copy, CreditCard, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToOrderButton } from '@/components/add-to-order'
import { CompletePurchase } from '@/components/complete-purchase'
import { rememberProduct } from '@/components/recently-viewed'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog } from '@/components/catalog-provider'
import { categoryPath, isOnPromotion, promotionEndsLabel } from '@/lib/catalog'
import { displayPrice, formatPrice, hasPrice, minPrice, paymentOptions, productWaMessage, STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Product, StockStatus, Variant } from '@/lib/types'

/* ---------- Galería ---------- */

export function ProductGallery({
  product,
  index: controlled,
  onIndexChange,
  discount,
}: {
  product: Product
  /** Foto visible (controlada desde afuera, p. ej. al elegir una variante con foto propia). */
  index?: number
  onIndexChange?: (index: number) => void
  discount?: number | null
}) {
  const images = product.images.length ? product.images : [product.image || '/placeholder.svg']
  const [inner, setInner] = useState(0)
  const index = Math.min(controlled ?? inner, images.length - 1)
  const setIndex = (i: number) => {
    setInner(i)
    onIndexChange?.(i)
  }
  const go = (dir: 1 | -1) => setIndex((index + dir + images.length) % images.length)

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
      >
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? product.name : `${product.name} – foto ${i + 1}`}
            fill
            priority={i === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={cn('object-cover transition-opacity duration-300', i === index ? 'opacity-100' : 'opacity-0')}
            aria-hidden={i !== index}
          />
        ))}
        {isOnPromotion(product) && (
          <PromoBadge percent={discount} size="md" className="absolute left-4 top-4" />
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-opacity hover:bg-background sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur transition-opacity hover:bg-background sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background tabular-nums">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Fotos del producto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary transition-colors sm:size-20',
                i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Selección de variante ---------- */

const SWATCHES: Record<string, string> = {
  blanco: '#ffffff',
  negro: '#1f1f1f',
  'negro mate': '#2b2b2b',
  cromo: 'linear-gradient(135deg,#f4f4f5,#a1a1aa,#f4f4f5)',
  cromado: 'linear-gradient(135deg,#f4f4f5,#a1a1aa,#f4f4f5)',
  hueso: '#efe6d2',
  gris: '#9ca3af',
  beige: '#e8dcc4',
  cedro: '#8a5a3b',
  dorado: 'linear-gradient(135deg,#f6e27a,#c9a227,#f6e27a)',
  'acero inoxidable': 'linear-gradient(135deg,#e5e7eb,#9ca3af,#e5e7eb)',
}
const swatchFor = (value: string) => SWATCHES[value.trim().toLowerCase()]

/** Estado de selección de opciones → variante, compartido por la ficha y la vista rápida. */
export function useVariantSelection(product: Product, initialVariantId?: string | null) {
  const initial = (): Record<string, string> => {
    const fromId = product.variants.find((v) => v.id === initialVariantId)
    if (fromId) return { ...fromId.options }
    if (product.variants.length === 1) return { ...product.variants[0].options }
    // Una opción con un solo valor se elige sola.
    return Object.fromEntries(product.options.filter((o) => o.values.length === 1).map((o) => [o.name, o.values[0]]))
  }
  const [selected, setSelected] = useState<Record<string, string>>(initial)

  const variant = useMemo(
    () =>
      product.options.length
        ? product.variants.find((v) => product.options.every((o) => v.options[o.name] === selected[o.name]))
        : undefined,
    [product, selected],
  )

  /** Variante que existiría si se elige `value` en la opción `name` (con el resto como está). */
  const candidateFor = (name: string, value: string): Variant | undefined => {
    const next = { ...selected, [name]: value }
    return product.variants.find((v) => product.options.every((o) => !next[o.name] || v.options[o.name] === next[o.name]))
  }

  const choose = (name: string, value: string) => {
    setSelected((current) => {
      const next = { ...current, [name]: value }
      // Si la combinación no existe, se conservan sólo las elecciones compatibles con la nueva.
      const exists = product.variants.some((v) => product.options.every((o) => !next[o.name] || v.options[o.name] === next[o.name]))
      if (exists) return next
      const compatible = product.variants.find((v) => v.options[name] === value)
      return compatible ? { [name]: value, ...Object.fromEntries(product.options.filter((o) => o.name !== name).map((o) => [o.name, compatible.options[o.name]])) } : { [name]: value }
    })
  }

  const selectVariant = (v: Variant) => setSelected({ ...v.options })

  return { selected, variant, choose, candidateFor, selectVariant }
}

function VariantSelector({
  product,
  selected,
  choose,
  candidateFor,
}: {
  product: Product
  selected: Record<string, string>
  choose: (name: string, value: string) => void
  candidateFor: (name: string, value: string) => Variant | undefined
}) {
  const { settings } = useCatalog()
  return (
    <div className="flex flex-col gap-4">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="mb-2 text-sm text-muted-foreground">
            {option.name}:{' '}
            <strong className="font-semibold text-foreground">{selected[option.name] ?? `Elegí ${option.name.toLowerCase()}`}</strong>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.name}>
            {option.values.map((value) => {
              const candidate = candidateFor(option.name, value)
              const active = selected[option.name] === value
              const unavailable = !candidate
              const noStock = candidate?.stock === 'sin_stock'
              const swatch = swatchFor(value)
              const singleAxis = product.options.length === 1
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={unavailable}
                  title={unavailable ? 'No disponible en esta combinación' : noStock ? 'Sin stock' : undefined}
                  onClick={() => choose(option.name, value)}
                  className={cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    active ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40',
                    (unavailable || noStock) && !active && 'border-dashed text-muted-foreground',
                    noStock && 'line-through decoration-muted-foreground/60',
                  )}
                >
                  {swatch && (
                    <span aria-hidden="true" className="size-4 shrink-0 rounded-full border border-border" style={{ background: swatch }} />
                  )}
                  {value}
                  {singleAxis && settings.showPrices && candidate?.price != null && (
                    <span className="text-xs font-normal text-muted-foreground no-underline">{formatPrice(candidate.price)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

/* ---------- Precio, stock y acciones ---------- */

const stockStyle = (s: StockStatus) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
    s === 'disponible' && 'bg-success/10 text-success',
    s === 'bajo' && 'bg-warning/15 text-warning',
    s === 'sin_stock' && 'bg-muted text-muted-foreground',
  )

/** Descuento de lo que se ve: el de la variante elegida o el del producto. */
export function shownDiscount(product: Product, variant?: Variant) {
  if (!isOnPromotion(product)) return null
  const original = variant ? variant.originalPrice : product.promotion.originalPrice
  const price = variant ? variant.price : product.price
  if (original && price != null && original > price) return Math.round(((original - price) / original) * 100)
  return product.promotion.discountPercent ?? null
}

function SkuLine({ sku }: { sku: string }) {
  const [copied, setCopied] = useState(false)
  if (!sku) return null
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(sku)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      title="Copiar código"
    >
      Código: <span className="font-mono font-medium text-foreground">{sku}</span>
      {copied ? <Check className="size-3.5 text-whatsapp" /> : <Copy className="size-3.5" />}
    </button>
  )
}

/**
 * Precio, variante, cantidad y acciones (pedido / WhatsApp). Se usa en la ficha y en la vista rápida.
 * `selection` permite compartir la variante elegida con la galería y la ficha técnica.
 */
export function ProductPurchase({
  product,
  compact = false,
  selection: external,
}: {
  product: Product
  compact?: boolean
  selection?: ReturnType<typeof useVariantSelection>
}) {
  const own = useVariantSelection(product)
  const { selected, variant, choose, candidateFor } = external ?? own
  const { settings } = useCatalog()
  const [quantity, setQuantity] = useState(1)

  const hasVariants = product.variants.length > 0
  const needsChoice = hasVariants && !variant
  const onPromo = isOnPromotion(product)
  const pct = shownDiscount(product, variant)
  const endsLabel = onPromo ? promotionEndsLabel(product) : null
  const stock = variant ? variant.stock : product.stock
  const price = variant ? variant.price : null
  const original = variant ? variant.originalPrice : product.promotion.originalPrice
  const showOldPrice = settings.showPrices && onPromo && original != null && (variant ? variant.price : product.price) != null
  const sku = variant?.sku || product.sku
  const payment = paymentOptions(variant ? variant.price : minPrice(product), settings)

  return (
    <div className="flex flex-col gap-5">
      {!compact && <SkuLine sku={sku} />}

      <div className="flex flex-col gap-1">
        {onPromo && (
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-promo">
            <PromoBadge percent={pct} size="md" className="shadow-none" />
            {product.promotion.limitedStock && <span>Hasta agotar stock</span>}
            {endsLabel && <span>· {endsLabel}</span>}
          </div>
        )}
        {showOldPrice && (
          <p className="text-sm text-muted-foreground">
            Antes <s className="tabular-nums">{formatPrice(original)}</s>
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {settings.showPrices ? (
            <p
              className={cn(
                'font-heading font-bold tabular-nums',
                (variant ? price != null : hasPrice(product))
                  ? cn(compact ? 'text-2xl' : 'text-4xl', onPromo ? 'text-promo' : 'text-foreground')
                  : 'text-xl text-muted-foreground',
              )}
              aria-live="polite"
            >
              {variant ? formatPrice(price) : displayPrice(product)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sumalo a tu pedido y te enviamos el presupuesto por WhatsApp.</p>
          )}
          {needsChoice ? (
            <span className={stockStyle('disponible')}>Elegí una opción para ver el stock</span>
          ) : (
            <span className={stockStyle(stock)}>
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {stock === 'bajo' ? 'Últimas unidades en stock' : STOCK_LABEL[stock]}
            </span>
          )}
        </div>
        {settings.showPrices && payment && (payment.transfer != null || payment.installmentsLabel) && (
          <div className="mt-2 flex flex-col gap-1.5 rounded-xl bg-secondary/60 p-3 text-sm">
            {payment.transfer != null && (
              <p className="flex flex-wrap items-center gap-x-2">
                <Banknote aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-bold tabular-nums text-foreground">{formatPrice(payment.transfer)}</span>
                <span className="text-muted-foreground">
                  con transferencia ({settings.transferDiscount}% OFF) · ahorrás {formatPrice(payment.saving)}
                </span>
              </p>
            )}
            {payment.installmentsLabel && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <CreditCard aria-hidden="true" className="size-4 shrink-0" />
                {payment.installmentsLabel}
              </p>
            )}
          </div>
        )}
        {settings.showPrices && settings.priceNote && !compact && <p className="mt-1 text-xs text-muted-foreground">{settings.priceNote}</p>}
      </div>

      {hasVariants && <VariantSelector product={product} selected={selected} choose={choose} candidateFor={candidateFor} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 items-center self-start rounded-lg border border-input" role="group" aria-label="Cantidad">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Restar uno"
            className="flex size-12 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(999, Math.max(1, Number(e.target.value) || 1)))}
            aria-label="Cantidad"
            className="h-full w-14 border-x border-input bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(999, q + 1))}
            aria-label="Sumar uno"
            className="flex size-12 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {needsChoice ? (
          <Button size="lg" disabled className="h-12 flex-1 text-base">
            Elegí {product.options.filter((o) => !selected[o.name]).map((o) => o.name.toLowerCase()).join(' y ') || 'una opción'}
          </Button>
        ) : (
          <AddToOrderButton product={product} variant={variant} quantity={quantity} className="h-12 flex-1 text-base" />
        )}
      </div>

      <Button
        size="lg"
        variant="outline"
        nativeButton={false}
        className="h-12 border-whatsapp/40 text-base text-whatsapp hover:bg-whatsapp/10 hover:text-whatsapp"
        render={<WaLink source="producto" productId={product.id} message={productWaMessage(product, variant)} />}
      >
        <WhatsappIcon className="size-5" />
        Consultar ahora por WhatsApp
      </Button>
    </div>
  )
}

/* ---------- Ficha técnica ---------- */

/** Filas de "Detalles del producto": marca, código, variante elegida, filtros de la categoría y ficha técnica. */
export function productSpecRows(product: Product, categories: ReturnType<typeof useCatalog>['categories'], variant?: Variant) {
  const rows: { label: string; value: string }[] = []
  if (product.brand) rows.push({ label: 'Marca', value: product.brand })
  const sku = variant?.sku || product.sku
  if (sku) rows.push({ label: 'Código', value: sku })
  const path = categoryPath(categories, product.categoryId)
  if (path.length) rows.push({ label: 'Categoría', value: path.map((c) => c.name).join(' › ') })
  for (const option of product.options) {
    const value = variant?.options[option.name]
    rows.push({ label: option.name, value: value ?? option.values.join(' · ') })
  }
  const category = categories.find((c) => c.id === product.categoryId)
  const optionNames = new Set(product.options.map((o) => o.name.toLowerCase()))
  for (const [key, values] of Object.entries(product.attributes)) {
    const label = category?.filters.find((f) => f.key === key)?.label ?? key.charAt(0).toUpperCase() + key.slice(1)
    if (!optionNames.has(label.toLowerCase()) && values.length) rows.push({ label, value: values.join(', ') })
  }
  const used = new Set(rows.map((r) => r.label.toLowerCase()))
  for (const spec of product.specs) if (!used.has(spec.label.toLowerCase())) rows.push(spec)
  return rows
}

export function SpecsTable({ rows }: { rows: { label: string; value: string }[] }) {
  if (!rows.length) return null
  return (
    <dl className="overflow-hidden rounded-xl border border-border">
      {rows.map((r, i) => (
        <div key={r.label} className={cn('grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-3 text-sm', i % 2 === 0 && 'bg-secondary/50')}>
          <dt className="text-muted-foreground">{r.label}</dt>
          <dd className="font-medium text-foreground">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ---------- Ficha completa (página de producto) ---------- */

export function ProductShowcase({
  product,
  complements,
  children,
}: {
  product: Product
  complements: Product[]
  children?: React.ReactNode
}) {
  const { categories } = useCatalog()
  const selection = useVariantSelection(product)
  const { variant, selectVariant } = selection
  const [imageIndex, setImageIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const purchaseRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)

  // ?v=<id> deja compartir el link con la variante ya elegida. Se lee después de montar
  // (el HTML del servidor no conoce la URL) para no generar diferencias de hidratación.
  useEffect(() => {
    const fromUrl = product.variants.find((v) => v.id === new URLSearchParams(window.location.search).get('v'))
    if (fromUrl) selectVariant(fromUrl)
    rememberProduct(product.id)
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  useEffect(() => {
    if (!ready) return
    if (variant?.imageIndex != null) setImageIndex(variant.imageIndex)
    const url = new URL(window.location.href)
    if (variant) url.searchParams.set('v', variant.id)
    else url.searchParams.delete('v')
    window.history.replaceState(window.history.state, '', url)
  }, [variant, ready])

  // Barra fija en el celular cuando el bloque de compra queda fuera de pantalla.
  useEffect(() => {
    const node = purchaseRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const category = categories.find((c) => c.id === product.categoryId)
  const rows = productSpecRows(product, categories, variant)

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery product={product} index={imageIndex} onIndexChange={setImageIndex} discount={shownDiscount(product, variant)} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
              {product.brand && <span className="text-foreground">{product.brand}</span>}
              {product.brand && category && <span className="text-muted-foreground/50">·</span>}
              {category && <span className="text-primary">{category.name}</span>}
            </p>
            <h1 className="font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-foreground text-balance sm:text-4xl">
              {product.name}
              {variant && <span className="block text-xl font-semibold normal-case tracking-normal text-muted-foreground">{variant.name}</span>}
            </h1>
            {product.shortDescription && <p className="text-base text-muted-foreground text-pretty">{product.shortDescription}</p>}
          </div>

          <div ref={purchaseRef}>
            <ProductPurchase product={product} selection={selection} />
          </div>
          {children}
        </div>
      </div>

      <CompletePurchase product={product} variant={variant} complements={complements} />
      <StickyBuyBar product={product} variant={variant} visible={showBar} onChoose={() => purchaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />

      <div className="mt-14 grid grid-cols-1 gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="descripcion-title">
          <h2 id="descripcion-title" className="mb-4 font-heading text-2xl font-bold uppercase tracking-tight">
            Descripción
          </h2>
          <div className="flex flex-col gap-3 text-base leading-relaxed text-muted-foreground">
            {(product.description || 'Consultanos por medidas, marcas y disponibilidad.').split(/\n+/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {product.variants.length > 1 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
                Variantes disponibles ({product.variants.length})
              </h3>
              <VariantsTable product={product} activeId={variant?.id} onPick={(v) => Object.entries(v.options).forEach(([k, val]) => selection.choose(k, val))} />
            </div>
          )}
        </section>
        <section aria-labelledby="detalles-title">
          <h2 id="detalles-title" className="mb-4 font-heading text-2xl font-bold uppercase tracking-tight">
            Detalles del producto
          </h2>
          <SpecsTable rows={rows} />
        </section>
      </div>
    </>
  )
}

/** Tabla con todas las variantes: combinación, código, precio y stock. Un clic la elige arriba. */
function VariantsTable({ product, activeId, onPick }: { product: Product; activeId?: string; onPick: (v: Variant) => void }) {
  const { settings } = useCatalog()
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{product.options.map((o) => o.name).join(' / ') || 'Opción'}</th>
            <th className="px-3 py-2 font-medium">Código</th>
            {settings.showPrices && <th className="px-3 py-2 text-right font-medium">Precio</th>}
            <th className="px-3 py-2 font-medium">Stock</th>
          </tr>
        </thead>
        <tbody>
          {product.variants.map((v) => (
            <tr
              key={v.id}
              onClick={() => {
                onPick(v)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={cn('cursor-pointer border-t border-border transition-colors hover:bg-muted/50', v.id === activeId && 'bg-primary/5')}
            >
              <td className="px-3 py-2 font-medium">{v.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{v.sku || '—'}</td>
              {settings.showPrices && <td className="px-3 py-2 text-right tabular-nums">{formatPrice(v.price)}</td>}
              <td className={cn('px-3 py-2 text-xs font-semibold', v.stock === 'disponible' ? 'text-success' : v.stock === 'bajo' ? 'text-warning' : 'text-muted-foreground')}>
                {STOCK_LABEL[v.stock]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Barra inferior fija (sólo celular): precio y agregar al pedido sin volver arriba. */
function StickyBuyBar({ product, variant, visible, onChoose }: { product: Product; variant?: Variant; visible: boolean; onChoose: () => void }) {
  const { settings } = useCatalog()
  const needsChoice = product.variants.length > 0 && !variant
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300 md:hidden',
        visible ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          {settings.showPrices && (
            <p className={cn('text-base font-bold tabular-nums', isOnPromotion(product) ? 'text-promo' : 'text-foreground')}>
              {variant ? formatPrice(variant.price) : displayPrice(product)}
            </p>
          )}
        </div>
        {needsChoice ? (
          <Button className="h-11 px-4" onClick={onChoose}>
            Elegir opción
          </Button>
        ) : (
          <AddToOrderButton product={product} variant={variant} size="default" className="h-11 px-4" label="Agregar" />
        )}
      </div>
    </div>
  )
}
