import { cache } from 'react'
import { complementsFor, descendantIds, discountPercent, isOnPromotion } from '@/lib/catalog'
import { getPublicCatalog as loadCatalog } from '@/lib/db'
import type { Product, PublicShell } from '@/lib/types'

/** Una lectura del catálogo por request, aunque la pidan el layout, la página y la metadata. */
export const getPublicCatalog = cache(loadCatalog)

/**
 * Versión liviana para listados, filtros y buscador: sin ficha técnica, con la descripción
 * recortada y como mucho 4 fotos. La ficha de producto usa el producto completo.
 */
export function leanProduct(p: Product): Product {
  return {
    ...p,
    description: p.description.length > 240 ? `${p.description.slice(0, 237).trimEnd()}…` : p.description,
    specs: [],
    images: p.images.slice(0, 4),
    related: [],
  }
}

/** Hash corto (djb2) para detectar cambios en las categorías. */
const hash = (text: string) => {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export const getShell = cache(async (): Promise<PublicShell> => {
  const { settings, categories, products, popularSearches } = await getPublicCatalog()
  const categoryCounts: Record<string, number> = {}
  for (const c of categories) {
    const ids = descendantIds(categories, c.id)
    categoryCounts[c.id] = products.filter((p) => ids.has(p.categoryId)).length
  }
  const promos = products.filter((p) => isOnPromotion(p)).sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0))
  const lastChange = products.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), '')
  return {
    settings,
    categories,
    categoryCounts,
    promos: promos.slice(0, 8).map(leanProduct),
    promoCount: promos.length,
    totalProducts: products.length,
    popularSearches,
    catalogVersion: `${products.length}-${Date.parse(lastChange) || 0}-${settings.showPrices ? 1 : 0}-${hash(JSON.stringify(categories))}`,
  }
})

/** Complementos de un producto ("Completá tu compra"), calculados en el servidor. */
export async function getComplements(product: Product) {
  const { products } = await getPublicCatalog()
  return complementsFor(product, products).map(leanProduct)
}

/** Primera página del catálogo (destacados primero) para que llegue armada desde el servidor. */
export async function getInitialPage(categoryId?: string, size = 12) {
  const { products, categories } = await getPublicCatalog()
  const scope = categoryId ? descendantIds(categories, categoryId) : null
  const list = (scope ? products.filter((p) => scope.has(p.categoryId)) : products)
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured))
  return { items: list.slice(0, size).map(leanProduct), total: list.length }
}
