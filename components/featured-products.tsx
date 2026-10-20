'use client'

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

const MAX = 8

/** Portada: buscador, accesos por categoría y una selección de productos destacados. */
export function FeaturedProducts() {
  const { products, categories } = useCatalog()
  const router = useRouter()
  const promos = products.filter((p) => isOnPromotion(p))
  // Las ofertas ya tienen su bloque: acá van los destacados que no están en promo.
  const featured = [...products]
    .filter((p) => !isOnPromotion(p) || promos.length === 0)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, MAX)

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

        {promos.length > 0 && (
          <h3 className="mt-12 font-heading text-xl font-bold uppercase tracking-tight text-foreground">Más productos</h3>
        )}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, i) => (
            <FadeIn key={product.id} delay={Math.min(i, 6) * 50} className="h-full">
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>

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
