import { Hero } from '@/components/hero'
import { PromotionsSection } from '@/components/promotions-section'
import { FeaturedProducts } from '@/components/featured-products'
import { Features } from '@/components/features'
import { About } from '@/components/about'
import { Contact } from '@/components/contact'
import { Showcase } from '@/components/showcase'
import { Faq } from '@/components/faq'
import { buildFaq, faqJsonLd } from '@/lib/faq'
import { publicGallery } from '@/lib/gallery'
import { isOnPromotion } from '@/lib/catalog'
import { getPublicCatalog, getShell, leanProduct } from '@/lib/public-catalog'

const MAX = 8

export default async function Page() {
  const { settings, products, popularity } = await getPublicCatalog()
  const { categories, categoryCounts } = await getShell()
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
  const gallery = publicGallery(settings)
  const faq = buildFaq(settings, categories)
  return (
    <>
      <Hero settings={settings} />
      <PromotionsSection />
      <FeaturedProducts
        lists={{ destacados: lists.destacados.map(leanProduct), novedades: lists.novedades.map(leanProduct), 'mas-vistos': lists['mas-vistos'].map(leanProduct) }}
        brands={brands}
      />
      <Features categories={categories} counts={categoryCounts} />
      <Showcase local={gallery.local} videos={gallery.videos} equipo={gallery.equipo} address={settings.address} />
      <About settings={settings} />
      <Faq groups={faq} />
      <Contact />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)).replace(/</g, '\\u003c') }} />
    </>
  )
}
