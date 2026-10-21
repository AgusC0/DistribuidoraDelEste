import type { MetadataRoute } from 'next'
import { getPublicCatalog } from '@/lib/db'
import { categoryUrl, descendantIds } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getPublicCatalog()
  // Sólo categorías con productos: una página vacía no le sirve a nadie (ni a Google).
  const withProducts = categories.filter((c) => {
    const ids = descendantIds(categories, c.id)
    return products.some((p) => ids.has(p.categoryId))
  })
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/productos`, changeFrequency: 'weekly', priority: 0.9 },
    ...withProducts.map((c) => ({ url: `${SITE_URL}${categoryUrl(categories, c.id)}`, changeFrequency: 'weekly' as const, priority: 0.85 })),
    ...products.map((p) => ({
      url: `${SITE_URL}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
