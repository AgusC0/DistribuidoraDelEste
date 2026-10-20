import { normalize } from '@/lib/search'
import { slugify } from '@/lib/site'
import type { Category, Product, StockStatus, Variant } from '@/lib/types'

/** Columnas de la planilla de productos (exportar / importar). */
export const COLUMNS = [
  'id',
  'nombre',
  'categoria',
  'precio',
  'stock',
  'publicado',
  'promo',
  'destacado',
  'descripcion',
  'etiquetas',
  'opciones',
] as const

const STOCK_IN: Record<string, StockStatus> = {
  disponible: 'disponible',
  'en stock': 'disponible',
  si: 'disponible',
  bajo: 'bajo',
  'ultimas unidades': 'bajo',
  sin_stock: 'sin_stock',
  'sin stock': 'sin_stock',
  no: 'sin_stock',
}

const yes = (v: string) => ['si', 's', 'x', '1', 'true', 'verdadero'].includes(normalize(v.trim()))
const priceIn = (v: string): number | null => {
  const digits = v.replace(/,\d{1,2}$/, '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

/** Opciones en una celda: "40x40=12000 | 50x60=15000 | 60x60" (precio opcional). */
export function variantsToCell(variants: Variant[]) {
  return variants.map((v) => (v.price != null ? `${v.name}=${v.price}` : v.name)).join(' | ')
}

function variantsFromCell(cell: string, previous: Variant[]): Variant[] {
  return cell
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, price] = part.split('=').map((s) => s.trim())
      const prev = previous.find((v) => normalize(v.name) === normalize(name))
      return {
        id: prev?.id ?? `v_${slugify(name)}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        price: price ? priceIn(price) : null,
        stock: prev?.stock ?? 'disponible',
      }
    })
}

export function productRow(p: Product, categories: Category[]) {
  return [
    p.id,
    p.name,
    categories.find((c) => c.id === p.categoryId)?.name ?? '',
    p.price ?? '',
    p.stock === 'disponible' ? 'disponible' : p.stock === 'bajo' ? 'bajo' : 'sin stock',
    p.active ? 'si' : 'no',
    p.promo ? 'si' : 'no',
    p.featured ? 'si' : 'no',
    p.description,
    p.tags.join(', '),
    variantsToCell(p.variants),
  ]
}

export type ImportMode = 'todo' | 'precios'

export type ImportResult = {
  created: string[]
  updated: string[]
  unchanged: number
  newCategories: string[]
  errors: string[]
}

/**
 * Aplica las filas de la planilla sobre el catálogo (muta `products` y `categories`).
 * Busca cada fila por `id` y, si no, por nombre. En modo "precios" sólo toca precios.
 */
export function applyImport(
  rows: string[][],
  products: Product[],
  categories: Category[],
  mode: ImportMode,
  makeId: () => string,
): ImportResult {
  const result: ImportResult = { created: [], updated: [], unchanged: 0, newCategories: [], errors: [] }
  if (rows.length < 2) {
    result.errors.push('La planilla está vacía o no tiene encabezados.')
    return result
  }
  const header = rows[0].map((h) => normalize(h.trim()))
  const col = (name: (typeof COLUMNS)[number]) => header.indexOf(name)
  if (col('nombre') === -1 && col('id') === -1) {
    result.errors.push('Falta la columna "nombre" (o "id"). Exportá la planilla desde el panel para usarla de modelo.')
    return result
  }
  const now = new Date().toISOString()

  rows.slice(1).forEach((r, i) => {
    const line = i + 2
    const get = (name: (typeof COLUMNS)[number]) => (col(name) === -1 ? undefined : (r[col(name)] ?? '').trim())
    const id = get('id')
    const name = get('nombre')
    const existing =
      (id && products.find((p) => p.id === id)) ||
      (name ? products.find((p) => normalize(p.name) === normalize(name)) : undefined)

    if (!existing && mode === 'precios') {
      result.errors.push(`Fila ${line}: no encontramos "${name || id}" en el catálogo.`)
      return
    }

    const before = existing ? JSON.stringify(existing) : ''
    const target: Product =
      existing ??
      ({
        id: makeId(),
        slug: '',
        name: '',
        categoryId: '',
        description: '',
        price: null,
        promo: false,
        featured: false,
        active: true,
        stock: 'disponible',
        image: '/placeholder.svg',
        images: [],
        variants: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
      } satisfies Product)

    const price = get('precio')
    if (price !== undefined) target.price = priceIn(price)
    const options = get('opciones')
    if (options !== undefined && mode === 'precios' && options) {
      // En modo precios sólo actualiza el precio de opciones que ya existen.
      for (const v of variantsFromCell(options, target.variants)) {
        const prev = target.variants.find((x) => x.id === v.id)
        if (prev) prev.price = v.price
      }
    }

    if (mode === 'todo') {
      if (name) target.name = name.slice(0, 120)
      if (!target.name || target.name.length < 3) {
        result.errors.push(`Fila ${line}: falta el nombre del producto.`)
        return
      }
      const catName = get('categoria')
      if (catName) {
        let cat = categories.find((c) => normalize(c.name) === normalize(catName))
        if (!cat) {
          const slug = slugify(catName)
          cat = { id: slug, slug, name: catName, description: '', order: categories.length }
          categories.push(cat)
          result.newCategories.push(catName)
        }
        target.categoryId = cat.id
      }
      if (!target.categoryId) {
        result.errors.push(`Fila ${line}: "${target.name}" no tiene categoría.`)
        return
      }
      const stock = get('stock')
      if (stock) target.stock = STOCK_IN[normalize(stock)] ?? target.stock
      const publicado = get('publicado')
      if (publicado) target.active = yes(publicado)
      const promo = get('promo')
      if (promo) target.promo = yes(promo)
      const destacado = get('destacado')
      if (destacado) target.featured = yes(destacado)
      const desc = get('descripcion')
      if (desc !== undefined) target.description = desc.slice(0, 1000)
      const tags = get('etiquetas')
      if (tags !== undefined)
        target.tags = tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      if (options !== undefined) target.variants = variantsFromCell(options, target.variants)
    }

    if (!existing) {
      let slug = slugify(target.name) || 'producto'
      for (let n = 2; products.some((p) => p.slug === slug); n++) slug = `${slugify(target.name)}-${n}`
      target.slug = slug
      products.unshift(target)
      result.created.push(target.name)
    } else if (JSON.stringify(target) !== before) {
      target.updatedAt = now
      result.updated.push(target.name)
    } else {
      result.unchanged++
    }
  })
  return result
}
