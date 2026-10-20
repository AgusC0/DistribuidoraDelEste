import type { MetadataRoute } from 'next'
import { getPublicCatalog } from '@/lib/db'
import { categoryUrl } from '@/lib/catalog'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getPublicCatalog()
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/productos`, changeFrequency: 'weekly', priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE_URL}${categoryUrl(categories, c.id)}`, changeFrequency: 'weekly' as const, priority: 0.85 })),
    ...products.map((p) => ({
      url: `${SITE_URL}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
