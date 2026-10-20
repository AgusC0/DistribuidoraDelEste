'use client'

import { ArrowRight, Flame } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { discountPercent } from '@/lib/catalog'
import type { Product } from '@/lib/types'

/**
 * Bloque de ofertas: va siempre antes del catálogo general y se diferencia visualmente.
 * Los productos siguen apareciendo también en el listado general, con su badge.
 */
export function PromotionsSection({
  products,
  max = 4,
  title = 'Ofertas destacadas',
  subtitle,
  onSeeAll,
}: {
  products: Product[]
  max?: number
  title?: string
  subtitle?: string
  onSeeAll?: () => void
}) {
  if (!products.length) return null
  const sorted = [...products].sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0))
  const shown = sorted.slice(0, max)
  const best = discountPercent(sorted[0])

  return (
    <section
      aria-labelledby="ofertas-title"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-promo/15 via-promo/5 to-background p-4 ring-1 ring-promo/25 sm:p-6"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-promo/15 blur-3xl" />
      <div className="relative mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-promo text-promo-foreground shadow-md">
            <Flame className="size-6" />
          </span>
          <div>
            <h2 id="ofertas-title" className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle ??
                `${products.length} ${products.length === 1 ? 'producto' : 'productos'} en promoción${best ? ` · hasta ${best}% OFF` : ''}`}
            </p>
          </div>
        </div>
        {onSeeAll && products.length > max && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex items-center gap-1.5 rounded-full bg-promo px-4 py-2 text-sm font-semibold text-promo-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Ver las {products.length} ofertas
            <ArrowRight className="size-4" />
          </button>
        )}
      </div>
      <div className="relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {shown.map((p, i) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} variant="promo" priority={i < 2} />
          </div>
        ))}
      </div>
    </section>
  )
}
