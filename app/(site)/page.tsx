import { Hero } from '@/components/hero'
import { PromotionsSection } from '@/components/promotions-section'
import { FeaturedProducts } from '@/components/featured-products'
import { Features } from '@/components/features'
import { About } from '@/components/about'
import { Contact } from '@/components/contact'
import { isOnPromotion } from '@/lib/catalog'
import { getPublicCatalog, leanProduct } from '@/lib/public-catalog'

const MAX = 8

export default async function Page() {
  const { settings, products, popularity } = await getPublicCatalog()
  // Tres miradas del catálogo: lo que elige el negocio, lo último que entró y lo que más mira la gente.
  const hasPromos = products.some((p) => isOnPromotion(p))
  const lists = {
    destacados: products
      .filter((p) => !hasPromos || !isOnPromotion(p))
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, MAX),
    novedades: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX),
    'mas-vistos': products
      .filter((p) => (popularity[p.id] ?? 0) > 0)
      .sort((a, b) => (popularity[b.id] ?? 0) - (popularity[a.id] ?? 0))
      .slice(0, MAX),
  }
  const brandCount = new Map<string, number>()
  for (const p of products) if (p.brand) brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1)
  const brands = [...brandCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([name]) => name)
  return (
    <>
      <Hero settings={settings} />
      <PromotionsSection />
      <FeaturedProducts
        lists={{ destacados: lists.destacados.map(leanProduct), novedades: lists.novedades.map(leanProduct), 'mas-vistos': lists['mas-vistos'].map(leanProduct) }}
        brands={brands}
      />
      <Features />
      <About settings={settings} />
      <Contact />
    </>
  )
}
