import { slugify, TIMEZONE } from '@/lib/site'
import type { Category, Product, ProductOption, Promotion, Variant } from '@/lib/types'

/* ---------- Árbol de categorías ---------- */

export const EMPTY_PROMOTION: Promotion = {
  originalPrice: null,
  discountPercent: null,
  startsAt: null,
  endsAt: null,
  limitedStock: false,
}

export const sortCategories = (list: Category[]) => [...list].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'))

export const rootCategories = (categories: Category[]) => sortCategories(categories.filter((c) => !c.parentId))

export const childCategories = (categories: Category[], parentId: string) =>
  sortCategories(categories.filter((c) => c.parentId === parentId))

/** Ruta desde el rubro hasta la categoría: [Baño, Cañerías]. */
export function categoryPath(categories: Category[], id: string): Category[] {
  const path: Category[] = []
  let current = categories.find((c) => c.id === id)
  while (current && path.length < 5) {
    path.unshift(current)
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined
  }
  return path
}

/** La categoría y todas sus subcategorías. */
export function descendantIds(categories: Category[], id: string): Set<string> {
  const ids = new Set([id])
  let added = true
  while (added) {
    added = false
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id)
        added = true
      }
    }
  }
  return ids
}

export function categoryUrl(categories: Category[], id: string) {
  const path = categoryPath(categories, id)
  return path.length ? `/categoria/${path.map((c) => c.slug).join('/')}` : '/productos'
}

export function findCategoryByPath(categories: Category[], slugs: string[]): Category | undefined {
  let parentId: string | null = null
  let found: Category | undefined
  for (const slug of slugs) {
    found = categories.find((c) => c.slug === slug && (c.parentId ?? null) === parentId)
    if (!found) return undefined
    parentId = found.id
  }
  return found
}

/* ---------- Promociones ---------- */

/** Fecha de hoy en Córdoba (YYYY-MM-DD), para que la promo cambie a medianoche local. */
const today = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(now)

/** Promoción vigente: activa y dentro de sus fechas. */
export function isOnPromotion(p: Product, now = new Date()) {
  if (!p.promo) return false
  const d = today(now)
  if (p.promotion.startsAt && d < p.promotion.startsAt) return false
  if (p.promotion.endsAt && d > p.promotion.endsAt) return false
  return true
}

/** % de descuento: calculado del precio anterior, o el que se cargó a mano. */
export function discountPercent(p: Product): number | null {
  const { originalPrice, discountPercent: manual } = p.promotion
  if (originalPrice && p.price != null && originalPrice > p.price) {
    return Math.round(((originalPrice - p.price) / originalPrice) * 100)
  }
  return manual && manual > 0 ? Math.round(manual) : null
}

/** "Termina hoy", "Termina mañana", "Quedan 3 días" (sólo si termina en una semana o menos). */
export function promotionEndsLabel(p: Product, now = new Date()): string | null {
  if (!p.promotion.endsAt) return null
  const days = Math.round((Date.parse(p.promotion.endsAt) - Date.parse(today(now))) / 86_400_000)
  if (days < 0 || days > 7) return null
  return days === 0 ? 'Termina hoy' : days === 1 ? 'Termina mañana' : `Quedan ${days} días`
}

/* ---------- Atributos para filtros ---------- */

/** Valores de un filtro para un producto: sus atributos más las opciones de variantes con el mismo nombre. */
export const attributeValues = (p: Product, key: string) => [...new Set([...(p.attributes[key] ?? []), ...optionValuesForFilter(p, key)])]

/** Ordena valores de filtro de forma natural: "20 mm" < "25 mm" < "110 mm". */
export function sortValues(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }))
}

/** Marcas y valores de filtros ya usados, para sugerirlos en el formulario de producto. */
export function catalogSuggestions(products: Product[]) {
  const brands = sortValues([...new Set(products.map((p) => p.brand).filter(Boolean))])
  const attributes: Record<string, string[]> = {}
  for (const p of products) {
    for (const [key, values] of Object.entries(p.attributes)) attributes[key] = [...new Set([...(attributes[key] ?? []), ...values])]
  }
  for (const key of Object.keys(attributes)) attributes[key] = sortValues(attributes[key])
  return { brands, attributes }
}

/* ---------- Variantes ---------- */

/** "25 mm / Blanco", en el orden de las opciones del producto. */
export function variantLabel(values: Record<string, string>, options: ProductOption[]) {
  const ordered = options.map((o) => values[o.name]).filter(Boolean)
  return ordered.length ? ordered.join(' / ') : Object.values(values).join(' / ')
}

/** Todas las combinaciones posibles de las opciones (Medida × Color…). */
export function combinations(options: ProductOption[]): Record<string, string>[] {
  return options
    .filter((o) => o.values.length)
    .reduce<Record<string, string>[]>(
      (acc, o) => acc.flatMap((combo) => o.values.map((v) => ({ ...combo, [o.name]: v }))),
      [{}],
    )
    .filter((c) => Object.keys(c).length)
}

type VariantRow = Partial<Omit<Variant, 'options' | 'name'>> & { values: string[] }

/** Arma variantes a partir de filas de valores, en el orden de las opciones. */
export function buildVariants(idPrefix: string, options: ProductOption[], rows: VariantRow[]): Variant[] {
  return rows.map((row) => {
    const values = Object.fromEntries(options.map((o, i) => [o.name, row.values[i]]).filter(([, v]) => v))
    return {
      id: row.id ?? `${idPrefix}-${row.values.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: variantLabel(values, options),
      options: values,
      sku: row.sku ?? '',
      price: row.price ?? null,
      originalPrice: row.originalPrice ?? null,
      stock: row.stock ?? 'disponible',
      imageIndex: row.imageIndex ?? null,
    }
  })
}

/** Valores de una opción de variante que coincide con un filtro (opción "Medida" ↔ filtro "medida"). */
export function optionValuesForFilter(p: Product, key: string): string[] {
  const option = p.options.find((o) => slugify(o.name) === key)
  if (!option) return []
  return option.values.filter((v) => !p.variants.length || p.variants.some((variant) => variant.options[option.name] === v))
}
