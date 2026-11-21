'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/fade-in'
import { ProductCard } from '@/components/product-card'
import { useCatalog } from '@/components/catalog-provider'
import { categoryUrl, rootCategories } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { Eyebrow } from '@/components/brand-waves'

const MAX = 8

export type Tab = 'destacados' | 'novedades' | 'mas-vistos'
const TABS: { value: Tab; label: string }[] = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'mas-vistos', label: 'Más vistos' },
]

/** Portada: accesos por categoría y una selección del catálogo (las promociones van en su propia sección, arriba). */
/** Las listas y las marcas se calculan en el servidor (ver la portada): acá sólo llegan 8 productos por pestaña. */
export function FeaturedProducts({ lists }: { lists: Record<Tab, Product[]> }) {
  const { categories, categoryCounts, totalProducts } = useCatalog()
  const [tab, setTab] = useState<Tab>('destacados')
  const rowRef = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: 'smooth' })
  const tabs = TABS.filter((t) => lists[t.value].length >= (t.value === 'mas-vistos' ? 4 : 1))
  const current = tabs.some((t) => t.value === tab) ? tab : 'destacados'

  return (
    <section id="catalogo" aria-labelledby="catalogo-title" className="scroll-mt-16 md:scroll-mt-20 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow>Catálogo</Eyebrow>
            <h2 id="catalogo-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Productos
            </h2>
            <p className="max-w-xl text-base text-muted-foreground">Armá tu pedido con todo lo que necesitás y pedí el presupuesto por WhatsApp.</p>
          </div>
          <Link href="/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Ver catálogo completo ({totalProducts})
            <ArrowRight className="size-4" />
          </Link>
        </FadeIn>

        <FadeIn delay={60} className="mt-8">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {rootCategories(categories)
              .filter((c) => (categoryCounts[c.id] ?? 0) > 0)
              .map((c) => (
                <li key={c.id} className="shrink-0">
                  <Link
                    href={categoryUrl(categories, c.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {c.name}
                    <span className="text-xs tabular-nums opacity-60">
                      {categoryCounts[c.id] ?? 0}
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
        {/* Una sola fila deslizable: la portada muestra una muestra, el catálogo completo está a un toque. */}
        <div className="relative mt-6">
        <div
          ref={rowRef}
          role="tabpanel"
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {lists[current].map((product) => (
            <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-12px)]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {/* Flechas en la compu (en el celular se desliza con el dedo); sin barra de desplazamiento a la vista. */}
        {lists[current].length > 4 && (
          <>
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Ver productos anteriores"
              className="absolute -left-5 top-[38%] hidden size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:text-primary lg:flex"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Ver más productos"
              className="absolute -right-5 top-[38%] hidden size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:text-primary lg:flex"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" nativeButton={false} className="h-12 px-8 text-base" render={<Link href="/productos" />}>
            Ver todos los productos
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
