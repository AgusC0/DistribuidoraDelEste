import { Hero } from '@/components/hero'
import { BannersSection } from '@/components/banners-section'
import { TilesSection } from '@/components/tiles-section'
import { PromotionsSection } from '@/components/promotions-section'
import { BrandMarquee } from '@/components/brand-marquee'
import { FeaturedProducts } from '@/components/featured-products'
import { Features } from '@/components/features'
import { LocalInfo } from '@/components/about'
import { Contact } from '@/components/contact'
import { SocialSection } from '@/components/social-section'
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
  const tiles = (settings.tiles ?? []).filter((t) => t.active && t.image)
  const gallery = publicGallery(settings)
  const faq = buildFaq(settings, categories)
  return (
    <>
      <Hero settings={settings} />
      {/* Un solo fondo claro para toda la portada: las secciones van en bloques, sin cortes de color. */}
      <div className="bg-secondary/40">
      <BannersSection />
      {tiles.length ? <TilesSection tiles={tiles} /> : <Features categories={categories} counts={categoryCounts} />}
      <PromotionsSection />
      <FeaturedProducts
        lists={{ destacados: lists.destacados.map(leanProduct), novedades: lists.novedades.map(leanProduct), 'mas-vistos': lists['mas-vistos'].map(leanProduct) }}
      />
      <BrandMarquee brands={brands} />
      <SocialSection posts={(settings.socialPosts ?? []).filter((p) => p.active)} instagram={settings.instagram} facebook={settings.facebook} />
      <Showcase local={gallery.local} videos={gallery.videos} equipo={gallery.equipo} address={settings.address} />
      <LocalInfo settings={settings} />
      <Faq groups={faq} />
      </div>
      <Contact />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)).replace(/</g, '\\u003c') }} />
    </>
  )
}
