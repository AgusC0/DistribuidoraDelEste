'use client'

import { PromoBadge } from '@/components/promo-badge'
import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Plus } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { useOrder } from '@/components/order-provider'
import { useQuickView } from '@/components/quick-view'
import { highlight } from '@/lib/search'
import { discountPercent, isOnPromotion, promotionEndsLabel } from '@/lib/catalog'
import { categoryName, displayPrice, formatPrice, hasPrice, minPrice, paymentOptions } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const roundBtn =
  'relative flex size-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:size-10'

/** Tarjeta visual: la foto principal manda (las demás se ven en la ficha). Ojo para la vista rápida. */
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
  const [added, setAdded] = useState(false)
  const href = `/productos/${product.slug}${variantId ? `?v=${variantId}` : ''}`
  const image = product.images[0] || product.image || '/placeholder.svg'

  const onPromo = isOnPromotion(product)
  const pct = onPromo ? discountPercent(product) : null
  const endsLabel = onPromo ? promotionEndsLabel(product) : null
  const isPromoCard = variant === 'promo'
  const hasVariants = product.variants.some((v) => v.price != null)
  const payment = paymentOptions(minPrice(product), settings)

  const openQuick = () => media.current && open(product, media.current.getBoundingClientRect())

  return (
    <article
      className={cn(
        'group/card flex h-full flex-col',
        isPromoCard && 'rounded-2xl bg-card p-2 shadow-sm transition-shadow hover:shadow-lg',
      )}
    >
      <div
        ref={media}
        className={cn(
          'relative aspect-square overflow-hidden rounded-xl bg-secondary transition-shadow group-hover/card:shadow-lg md:rounded-2xl',
          isPromoCard && 'rounded-xl group-hover/card:shadow-none',
        )}
      >
        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`Ver ${product.name}`} tabIndex={-1} />
        <Image
          src={image}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 motion-safe:group-hover/card:scale-[1.03]"
        />

        {/* etiquetas */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[2] flex items-start justify-between gap-2">
          {onPromo ? (
            <PromoBadge percent={pct} size={isPromoCard ? 'md' : 'sm'} />
          ) : (
            <span />
          )}
          {product.stock === 'sin_stock' && (
            <span className="rounded-md bg-foreground/80 px-2 py-1 text-[0.7rem] font-semibold text-background">Sin stock</span>
          )}
        </div>

        {/* acciones: en el celular sólo "agregar" (el resto de la foto lleva a la ficha) */}
        <div className="absolute bottom-2 right-2 z-[2] flex gap-2 transition-[opacity,transform] duration-300 md:bottom-3 md:right-3 md:translate-y-1.5 md:opacity-0 md:group-hover/card:translate-y-0 md:group-hover/card:opacity-100 md:group-focus-within/card:translate-y-0 md:group-focus-within/card:opacity-100">
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
          <button type="button" onClick={openQuick} aria-label={`Vista rápida de ${product.name}`} title="Vista rápida" className={cn(roundBtn, 'hidden md:flex')}>
            <Eye className="size-[18px]" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className={cn('flex flex-1 flex-col px-0.5 pt-2.5 md:px-1 md:pt-3.5', isPromoCard && 'px-2 pb-1.5')}>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground md:text-[0.7rem] md:tracking-[0.18em]">
            {product.brand || categoryName(categories, product.categoryId)}
          </p>
          {product.stock === 'bajo' && (
            <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-warning">Últimas unidades</span>
          )}
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug text-foreground md:mt-1.5 md:text-base">
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
        <div className="mt-auto pt-1.5 md:pt-2">
          {settings.showPrices &&
            (onPromo && product.promotion.originalPrice && product.price != null ? (
              <div className="flex flex-col">
                <s className="text-xs tabular-nums text-muted-foreground">{formatPrice(product.promotion.originalPrice)}</s>
                <span className={cn('font-bold tabular-nums text-promo', isPromoCard ? 'text-2xl' : 'text-lg')}>{formatPrice(product.price)}</span>
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
              </p>
            ))}
          {settings.showPrices && payment && (payment.transfer || payment.installmentsLabel) && (
            <div className="mt-1 flex flex-col text-xs leading-snug">
              {payment.transfer != null && (
                <span className="font-medium text-foreground">
                  {hasVariants ? 'Desde ' : ''}
                  {formatPrice(payment.transfer)} con transferencia
                </span>
              )}
              {payment.installmentsLabel && <span className="text-muted-foreground">{payment.installmentsLabel}</span>}
            </div>
          )}
          {onPromo && (product.promotion.limitedStock || endsLabel) && (
            <p className="mt-1 flex flex-wrap gap-x-2 text-[0.7rem] font-medium text-promo">
              {product.promotion.limitedStock && <span>Hasta agotar stock</span>}
              {endsLabel && <span>{endsLabel}</span>}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
