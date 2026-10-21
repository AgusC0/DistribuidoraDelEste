'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/fade-in'
import { ProductCard } from '@/components/product-card'
import { useCatalog } from '@/components/catalog-provider'
import { categoryUrl, descendantIds, isOnPromotion, rootCategories } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const MAX = 8

type Tab = 'destacados' | 'novedades' | 'mas-vistos'
const TABS: { value: Tab; label: string }[] = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'mas-vistos', label: 'Más vistos' },
]

/** Portada: accesos por categoría y una selección del catálogo (las promociones van en su propia sección, arriba). */
export function FeaturedProducts() {
  const { products, categories, popularity } = useCatalog()
  const promos = products.filter((p) => isOnPromotion(p))
  const [tab, setTab] = useState<Tab>('destacados')

  // Tres miradas del catálogo: lo que elige el negocio, lo último que entró y lo que más mira la gente.
  const lists: Record<Tab, Product[]> = {
    destacados: [...products]
      .filter((p) => !isOnPromotion(p) || promos.length === 0)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, MAX),
    novedades: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX),
    'mas-vistos': [...products]
      .filter((p) => (popularity[p.id] ?? 0) > 0)
      .sort((a, b) => (popularity[b.id] ?? 0) - (popularity[a.id] ?? 0))
      .slice(0, MAX),
  }
  const tabs = TABS.filter((t) => lists[t.value].length >= (t.value === 'mas-vistos' ? 4 : 1))
  const current = tabs.some((t) => t.value === tab) ? tab : 'destacados'

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))]
    .map((b) => ({ name: b, count: products.filter((p) => p.brand === b).length }))
    .sort((a, b) => b.count - a.count)

  return (
    <section id="catalogo" aria-labelledby="catalogo-title" className="scroll-mt-16 bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="catalogo-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Productos
            </h2>
            <p className="max-w-xl text-base text-muted-foreground">Armá tu pedido con todo lo que necesitás y pedí el presupuesto por WhatsApp.</p>
          </div>
          <Link href="/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Ver catálogo completo ({products.length})
            <ArrowRight className="size-4" />
          </Link>
        </FadeIn>

        <FadeIn delay={60} className="mt-8">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {rootCategories(categories).map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={categoryUrl(categories, c.id)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {c.name}
                  <span className="text-xs tabular-nums opacity-60">
                    {products.filter((p) => descendantIds(categories, c.id).has(p.categoryId)).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-border" role="tablist" aria-label="Selección de productos">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={current === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 font-heading text-base font-semibold uppercase tracking-wide transition-colors',
                current === t.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {lists[current].map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {brands.length > 1 && (
          <div className="mt-16 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-8">
            <h3 className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Marcas que trabajamos</h3>
            <ul className="flex flex-wrap gap-x-7 gap-y-3">
              {brands.map((b) => (
                <li key={b.name}>
                  <Link
                    href={`/productos?marca=${encodeURIComponent(b.name)}`}
                    className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground/70 transition-colors hover:text-primary"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button size="lg" nativeButton={false} className="h-12 px-8 text-base" render={<Link href="/productos" />}>
            Ver todos los productos
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
