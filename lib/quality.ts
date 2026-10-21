import { effectiveFilters, optionValuesForFilter } from '@/lib/catalog'
import { hasPrice } from '@/lib/site'
import type { Category, Product } from '@/lib/types'

export type QualityCheck = { label: string; points: number; ok: boolean; hint: string }

/** Una ficha con este puntaje o más se considera completa. */
export const QUALITY_GOOD = 80

/**
 * Puntaje de 0 a 100 de qué tan completa está la ficha. Prioriza lo que más pesa para vender
 * y para Google: foto, precio, descripción, marca, código y ficha técnica.
 */
export function productQuality(product: Product, categories: Category[]): { score: number; checks: QualityCheck[] } {
  const realImages = product.images.filter((src) => src && !src.includes('placeholder'))
  const filters = effectiveFilters(categories, product.categoryId)
  // Un filtro cuenta como cargado si está en los atributos o es un eje de las variantes (ej: Medida).
  const missingFilters = filters.filter((f) => !product.attributes[f.key]?.length && !optionValuesForFilter(product, f.key).length)
  const skuOk = product.variants.length ? product.variants.every((v) => v.sku) : !!product.sku

  const checks: QualityCheck[] = [
    { label: 'Foto', points: 20, ok: realImages.length > 0, hint: 'Subí al menos una foto del producto.' },
    { label: 'Precio', points: 15, ok: hasPrice(product), hint: 'Cargá el precio (o el de cada variante).' },
    { label: 'Descripción', points: 10, ok: product.description.trim().length >= 80, hint: 'Escribí una descripción de al menos 80 caracteres.' },
    { label: 'Marca', points: 10, ok: !!product.brand, hint: 'Indicá la marca.' },
    { label: 'Código', points: 10, ok: skuOk, hint: product.variants.length ? 'Falta el código de alguna variante.' : 'Cargá el código del producto.' },
    { label: 'Ficha técnica', points: 10, ok: product.specs.length >= 2, hint: 'Sumá al menos 2 datos técnicos (medidas, material, garantía…).' },
    {
      label: 'Filtros',
      points: 10,
      ok: missingFilters.length === 0,
      hint: `Completá: ${missingFilters.map((f) => f.label).join(', ')}. Sin esto no aparece al filtrar.`,
    },
    { label: 'Más fotos', points: 5, ok: realImages.length >= 2, hint: 'Una segunda foto (detalle, medidas, colocado) ayuda a decidir.' },
    { label: 'Bajada', points: 5, ok: !!product.shortDescription.trim(), hint: 'Agregá una descripción corta debajo del título.' },
    { label: 'Sinónimos', points: 5, ok: product.tags.length > 0, hint: 'Sumá etiquetas o sinónimos para el buscador.' },
  ]
  const score = checks.reduce((s, c) => s + (c.ok ? c.points : 0), 0)
  return { score, checks }
}

export const qualityTone = (score: number) => (score >= QUALITY_GOOD ? 'good' : score >= 50 ? 'mid' : 'low')
