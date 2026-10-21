'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { ProductCard } from '@/components/product-card'
import { useCatalog } from '@/components/catalog-provider'
import { discountPercent } from '@/lib/catalog'
import { cn } from '@/lib/utils'

/**
 * Promociones de la portada: sección propia entre el hero y el catálogo, con fondo cálido
 * y una composición distinta al listado (la mejor oferta en grande cuando hay varias).
 */
export function PromotionsSection() {
  const { promos, promoCount } = useCatalog()
  if (!promos.length) return null

  const featured = promos.length >= 5
  const shown = promos.slice(0, featured ? 5 : 4)
  const best = discountPercent(promos[0])

  return (
    <section id="promociones" aria-labelledby="promociones-title" className="scroll-mt-16 bg-promo/[0.07] py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-md bg-promo px-2 py-1 text-xs font-bold uppercase tracking-wider text-promo-foreground">Promo</span>
            <h2 id="promociones-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Promociones
            </h2>
            <p className="text-base text-muted-foreground">
              Precios especiales por tiempo limitado{best ? <> · <strong className="font-semibold text-promo">hasta {best}% OFF</strong></> : null}
            </p>
          </div>
          <Link
            href="/productos?oferta=1"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:text-promo hover:underline"
          >
            Ver todas las promociones ({promoCount})
            <ArrowRight className="size-4" />
          </Link>
        </FadeIn>

        <div
          className={cn(
            '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0',
            'sm:grid-cols-2 lg:grid-cols-4',
          )}
        >
          {shown.map((p, i) => (
            <div
              key={p.id}
              className={cn('w-[70%] shrink-0 snap-start sm:w-auto', featured && i === 0 && 'sm:col-span-2 lg:row-span-2')}
            >
              <ProductCard product={p} variant="promo" priority={i < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
