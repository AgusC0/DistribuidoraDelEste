'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/fade-in'
import { ProductCard } from '@/components/product-card'
import { SearchBox } from '@/components/search-box'
import { PromotionsSection } from '@/components/promotions-section'
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

/** Portada: buscador, accesos por categoría y una selección de productos destacados. */
export function FeaturedProducts() {
  const { products, categories, popularity } = useCatalog()
  const router = useRouter()
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
        <FadeIn className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Catálogo</p>
            <h2
              id="catalogo-title"
              className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl"
            >
              Productos destacados
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Armá tu pedido con todo lo que necesitás y pedí el presupuesto por WhatsApp.
            </p>
          </div>
          <SearchBox placeholder="¿Qué estás buscando?" className="w-full lg:max-w-md" />
        </FadeIn>

        <FadeIn delay={60} className="mt-8">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {rootCategories(categories).map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={categoryUrl(categories, c.id)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  {c.name}
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {products.filter((p) => descendantIds(categories, c.id).has(p.categoryId)).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </FadeIn>

        {promos.length > 0 && (
          <FadeIn delay={80} className="mt-8">
            <PromotionsSection products={promos} onSeeAll={() => router.push('/productos?oferta=1')} />
          </FadeIn>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-2 border-b border-border" role="tablist" aria-label="Selección de productos">
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
          <div className="mt-14">
            <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-foreground">Marcas que trabajamos</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {brands.map((b) => (
                <li key={b.name}>
                  <Link
                    href={`/productos?marca=${encodeURIComponent(b.name)}`}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 font-heading text-sm font-semibold uppercase tracking-wide transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {b.name}
                    <span className="font-sans text-xs font-normal normal-case tracking-normal text-muted-foreground">{b.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button size="lg" nativeButton={false} className="h-12 px-8 text-base" render={<Link href="/productos" />}>
            Ver catálogo completo ({products.length})
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
