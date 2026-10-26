import { productQuality, type QualityCheck } from '@/lib/quality'
import type { Category, Product } from '@/lib/types'

export type AdminQuality = Record<string, { score: number; checks: QualityCheck[] }>

/**
 * Filas livianas para la tabla de productos del panel: sólo lo que la tabla muestra, busca y edita.
 * La calidad de cada ficha se calcula acá, en el servidor (necesita la descripción y la ficha técnica
 * completas, que no hace falta mandar al navegador). Con miles de productos la página pesa varias veces menos.
 */
export function adminRows(products: Product[], categories: Category[]) {
  const quality: AdminQuality = {}
  const rows = products.map((p): Product => {
    const q = productQuality(p, categories)
    quality[p.id] = { score: q.score, checks: q.checks.filter((c) => !c.ok) }
    return {
      ...p,
      description: '',
      shortDescription: '',
      specs: [],
      options: [],
      related: [],
      attributes: {},
      images: p.images.slice(0, 1),
      variants: p.variants.map((v) => ({ ...v, options: {} })),
    }
  })
  return { rows, quality }
}
