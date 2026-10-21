'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Eye, Plus, ShieldCheck } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { useOrder } from '@/components/order-provider'
import { useQuickView } from '@/components/quick-view'
import { highlight } from '@/lib/search'
import { discountPercent, isOnPromotion, promotionEndsLabel } from '@/lib/catalog'
import { categoryName, displayPrice, formatPrice, hasPrice, STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const roundBtn =
  'relative flex size-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

/** Tarjeta visual: la foto manda. Flechas para ver más fotos, ojo para la vista rápida. */
export function ProductCard({
  product,
  query = '',
  priority = false,
  variant = 'default',
  variantId,
}: {
  product: Product
  query?: string
  priority?: boolean
  /** `promo`: versión destacada para la sección de ofertas. */
  variant?: 'default' | 'promo'
  /** Variante a preseleccionar al abrir la ficha (p. ej. la medida filtrada en el catálogo). */
  variantId?: string
}) {
  const { categories, settings } = useCatalog()
  const { add } = useOrder()
  const { open } = useQuickView()
  const media = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [added, setAdded] = useState(false)
  const href = `/productos/${product.slug}${variantId ? `?v=${variantId}` : ''}`
  const images = product.images.length ? product.images : [product.image || '/placeholder.svg']
  const many = images.length > 1

  const onPromo = isOnPromotion(product)
  const pct = onPromo ? discountPercent(product) : null
  const endsLabel = onPromo ? promotionEndsLabel(product) : null
  const isPromoCard = variant === 'promo'

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length)
  const openQuick = () => media.current && open(product, media.current.getBoundingClientRect())

  return (
    <article
      className={cn(
        'group/card flex h-full flex-col',
        isPromoCard && 'rounded-3xl bg-card p-2.5 shadow-sm ring-1 ring-promo/25 transition-shadow hover:shadow-xl hover:ring-promo/50',
      )}
    >
      <div
        ref={media}
        className={cn(
          'relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary shadow-xs ring-1 ring-border/60 transition-shadow group-hover/card:shadow-lg',
          isPromoCard && 'aspect-square shadow-none ring-0 group-hover/card:shadow-none',
        )}
      >
        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`Ver ${product.name}`} tabIndex={-1} />
        {images.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? product.name : ''}
            fill
            priority={priority && i === 0}
            sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-[opacity,transform] duration-500 motion-safe:group-hover/card:scale-[1.03]',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}

        {/* etiquetas */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[2] flex items-start justify-between gap-2">
          {onPromo ? (
            <span
              className={cn(
                'rounded-full bg-promo font-bold uppercase tracking-wide text-promo-foreground shadow-sm',
                isPromoCard ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-[0.7rem]',
              )}
            >
              {pct ? `-${pct}%` : 'Oferta'}
            </span>
          ) : (
            <span />
          )}
          {product.stock === 'sin_stock' && (
            <span className="rounded-full bg-foreground/80 px-2.5 py-1 text-[0.7rem] font-semibold text-background">Sin stock</span>
          )}
        </div>

        {/* flechas entre fotos */}
        {many && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={`Foto anterior de ${product.name}`}
              className="absolute left-2 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center text-foreground/80 transition-opacity hover:text-foreground md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft className="size-6 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={`Foto siguiente de ${product.name}`}
              className="absolute right-2 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center text-foreground/80 transition-opacity hover:text-foreground md:opacity-0 md:group-hover/card:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight className="size-6 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" strokeWidth={1.5} />
            </button>
            <div className="pointer-events-none absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5" aria-hidden="true">
              {images.map((src, i) => (
                <span key={src} className={cn('h-1.5 rounded-full bg-background shadow transition-all', i === index ? 'w-4' : 'w-1.5 opacity-60')} />
              ))}
            </div>
          </>
        )}

        {/* acciones */}
        <div className="absolute bottom-3 right-3 z-[2] flex gap-2 transition-[opacity,transform] duration-300 md:translate-y-1.5 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100">
          <button
            type="button"
            onClick={() => {
              if (product.variants.length) return openQuick()
              add(product)
              setAdded(true)
              setTimeout(() => setAdded(false), 1400)
            }}
            aria-label={product.variants.length ? `Elegir opción de ${product.name}` : `Agregar ${product.name} al pedido`}
            title={product.variants.length ? 'Elegir opción' : 'Agregar al pedido'}
            className={cn(roundBtn, added && 'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp hover:text-whatsapp-foreground')}
          >
            <Plus className={cn('size-[18px] transition-transform', added && 'rotate-45 scale-0')} strokeWidth={1.75} />
            {added && <span className="absolute text-sm font-bold">✓</span>}
          </button>
          <button type="button" onClick={openQuick} aria-label={`Vista rápida de ${product.name}`} title="Vista rápida" className={roundBtn}>
            <Eye className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col px-1 pt-3.5', isPromoCard && 'px-2 pb-1.5')}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {product.brand || categoryName(categories, product.categoryId)}
          </p>
          {product.stock !== 'sin_stock' && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider',
                product.stock === 'bajo' ? 'text-promo' : 'text-whatsapp',
              )}
            >
              <ShieldCheck aria-label={product.stock === 'bajo' ? 'Últimas unidades' : 'En stock'} className="size-3.5" />
              <span className="hidden sm:inline">{product.stock === 'bajo' ? 'Últimas' : STOCK_LABEL.disponible}</span>
            </span>
          )}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-base leading-snug text-foreground">
          <Link href={href} className="hover:text-primary focus-visible:underline focus-visible:outline-none">
            {highlight(product.name, query).map((s, i) =>
              s.match ? (
                <mark key={i} className="rounded-sm bg-accent/35 text-inherit">
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </Link>
        </h3>
        <div className="mt-auto pt-2">
          {settings.showPrices &&
            (onPromo && product.promotion.originalPrice && product.price != null ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {isPromoCard && 'Antes '}
                  <s className="tabular-nums">{formatPrice(product.promotion.originalPrice)}</s>
                </span>
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className={cn('font-bold tabular-nums text-promo', isPromoCard ? 'text-2xl' : 'text-lg')}>
                    {formatPrice(product.price)}
                  </span>
                  {pct && <span className="text-xs font-bold text-promo">{pct}% OFF</span>}
                </span>
              </div>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    !hasPrice(product) ? 'text-sm font-normal text-muted-foreground' : onPromo ? 'font-bold text-promo' : 'text-foreground',
                    onPromo && isPromoCard && hasPrice(product) && 'text-2xl',
                  )}
                >
                  {displayPrice(product)}
                </span>
                {onPromo && pct && <span className="text-xs font-bold text-promo">{pct}% OFF</span>}
              </p>
            ))}
          {onPromo && (product.promotion.limitedStock || endsLabel) && (
            <p className="mt-1 flex flex-wrap gap-x-2 text-[0.7rem] font-semibold uppercase tracking-wide text-promo">
              {product.promotion.limitedStock && <span>Hasta agotar stock</span>}
              {endsLabel && <span>{endsLabel}</span>}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
