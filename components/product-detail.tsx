'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToOrderButton } from '@/components/add-to-order'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { displayPrice, formatPrice, hasPrice, productWaMessage, STOCK_LABEL } from '@/lib/site'
import { useCatalog } from '@/components/catalog-provider'
import { cn } from '@/lib/utils'
import type { Product, StockStatus } from '@/lib/types'

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length ? product.images : [product.image || '/placeholder.svg']
  const [index, setIndex] = useState(0)
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length)

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
        {product.promo && (
          <Badge className="absolute left-4 top-4 bg-promo uppercase tracking-wide text-promo-foreground">Promo</Badge>
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

const stockClass = (s: StockStatus) =>
  cn(
    'rounded-full px-3 py-1 text-xs font-semibold',
    s === 'disponible' && 'bg-whatsapp/15 text-whatsapp',
    s === 'bajo' && 'bg-promo/15 text-promo',
    s === 'sin_stock' && 'bg-muted text-muted-foreground',
  )

/** Precio, selector de variante, cantidad y acciones (pedido / WhatsApp). */
export function ProductPurchase({ product, compact = false }: { product: Product; compact?: boolean }) {
  const hasVariants = product.variants.length > 0
  const groupName = useId()
  const [variantId, setVariantId] = useState<string | null>(hasVariants && product.variants.length === 1 ? product.variants[0].id : null)
  const [quantity, setQuantity] = useState(1)
  const variant = product.variants.find((v) => v.id === variantId)

  const { settings } = useCatalog()
  const price = variant ? variant.price : null
  const stock = variant ? variant.stock : product.stock
  const needsChoice = hasVariants && !variant

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        {settings.showPrices ? (
          <p
            className={cn(
              'font-heading font-bold',
              (variant ? price != null : hasPrice(product))
                ? cn(compact ? 'text-2xl' : 'text-3xl', 'text-primary')
                : 'text-xl text-muted-foreground',
            )}
            aria-live="polite"
          >
            {variant ? formatPrice(price) : displayPrice(product)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sumalo a tu pedido y te enviamos el presupuesto por WhatsApp.</p>
        )}
        <span className={stockClass(stock)}>{STOCK_LABEL[stock]}</span>
      </div>

      {hasVariants && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-foreground">
            Elegí una opción{variant && <span className="font-normal text-muted-foreground">: {variant.name}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  'cursor-pointer rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40',
                  v.id === variantId ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40',
                  v.stock === 'sin_stock' && 'text-muted-foreground line-through decoration-muted-foreground/60',
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => setVariantId(v.id)}
                  className="sr-only"
                />
                {v.name}
                {v.price != null && <span className="ml-1.5 text-xs font-normal opacity-80">{formatPrice(v.price)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

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
            Elegí una opción para agregar
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
