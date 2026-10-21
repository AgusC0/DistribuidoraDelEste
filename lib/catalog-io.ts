import { normalize } from '@/lib/search'
import { slugify } from '@/lib/site'
import { categoryPath, EMPTY_PROMOTION, variantLabel } from '@/lib/catalog'
import type { Category, Product, ProductOption, ProductSpec, StockStatus, Variant } from '@/lib/types'

/** Columnas de la planilla de productos (exportar / importar). */
export const COLUMNS = [
  'id',
  'codigo',
  'nombre',
  'categoria',
  'marca',
  'precio',
  'precio_anterior',
  'stock',
  'publicado',
  'promo',
  'destacado',
  'descripcion_corta',
  'descripcion',
  'etiquetas',
  'opciones_nombres',
  'opciones',
  'atributos',
  'ficha',
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

/**
 * Variantes en una celda: "20 mm / Blanco = 6900 # COD-123 | 25 mm / Blanco = 9800".
 * Precio y código son opcionales. Los nombres de las opciones van en "opciones_nombres" ("Medida / Color").
 */
export function variantsToCell(variants: Variant[]) {
  return variants
    .map((v) => `${v.name}${v.price != null ? ` = ${v.price}` : ''}${v.sku ? ` # ${v.sku}` : ''}`)
    .join(' | ')
}

function variantsFromCell(cell: string, optionNames: string[], previous: Variant[]): { options: ProductOption[]; variants: Variant[] } {
  const names = optionNames.length ? optionNames : ['Opción']
  const options: ProductOption[] = names.map((name) => ({ name, values: [] }))
  const variants: Variant[] = []
  for (const part of cell.split('|').map((x) => x.trim()).filter(Boolean)) {
    const [left, sku = ''] = part.split('#').map((x) => x.trim())
    const [label, price] = left.split('=').map((x) => x.trim())
    // ' / ' (con espacios) separa opciones; así una medida como 1/2" no se corta.
    const values = label.split(/\s+\/\s+/).map((x) => x.trim())
    const combo: Record<string, string> = {}
    names.forEach((name, i) => {
      const value = values[i]
      if (!value) return
      combo[name] = value
      if (!options[i].values.includes(value)) options[i].values.push(value)
    })
    if (Object.keys(combo).length !== names.length) continue
    const name = variantLabel(combo, options)
    const prev = previous.find((v) => normalize(v.name) === normalize(name))
    variants.push({
      id: prev?.id ?? `v_${slugify(name)}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      options: combo,
      sku: sku || prev?.sku || '',
      price: price ? priceIn(price) : null,
      originalPrice: prev?.originalPrice ?? null,
      stock: prev?.stock ?? 'disponible',
      imageIndex: prev?.imageIndex ?? null,
    })
  }
  return { options: options.filter((o) => o.values.length), variants }
}

/** Ficha técnica en una celda: "Ancho=39 cm; Alto=42,5 cm; Garantía=1 año". */
export function specsToCell(specs: ProductSpec[]) {
  return specs.map((r) => `${r.label}=${r.value}`).join('; ')
}

function specsFromCell(cell: string): ProductSpec[] {
  return cell
    .split(';')
    .map((part) => {
      const [label, ...rest] = part.split('=')
      return { label: (label ?? '').trim(), value: rest.join('=').trim() }
    })
    .filter((r) => r.label && r.value)
}

/** Atributos en una celda: "tipo=Codo; medida=20 mm, 25 mm". */
export function attributesToCell(attributes: Record<string, string[]>) {
  return Object.entries(attributes)
    .map(([key, values]) => `${key}=${values.join(', ')}`)
    .join('; ')
}

function attributesFromCell(cell: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const part of cell.split(';')) {
    const [rawKey, rawValues] = part.split('=')
    const key = slugify(rawKey ?? '')
    const values = (rawValues ?? '').split(',').map((v) => v.trim()).filter(Boolean)
    if (key && values.length) out[key] = values
  }
  return out
}

/** "Agua y cañerías > Cañerías" para subcategorías; el nombre solo para rubros. */
function categoryLabel(categories: Category[], id: string) {
  const path = categoryPath(categories, id)
  return path.map((c) => c.name).join(' > ')
}

export function productRow(p: Product, categories: Category[]) {
  return [
    p.id,
    p.sku,
    p.name,
    categoryLabel(categories, p.categoryId),
    p.brand,
    p.price ?? '',
    p.promotion.originalPrice ?? '',
    p.stock === 'disponible' ? 'disponible' : p.stock === 'bajo' ? 'bajo' : 'sin stock',
    p.active ? 'si' : 'no',
    p.promo ? 'si' : 'no',
    p.featured ? 'si' : 'no',
    p.shortDescription,
    p.description,
    p.tags.join(', '),
    p.options.map((o) => o.name).join(' / '),
    variantsToCell(p.variants),
    attributesToCell(p.attributes),
    specsToCell(p.specs),
  ]
}

/**
 * Busca la categoría de la planilla. Acepta "Rubro > Subcategoría" o sólo el nombre.
 * Si no existe, la crea (y su rubro, si hace falta).
 */
function resolveCategory(categories: Category[], label: string, result: ImportResult): Category {
  const parts = label.split('>').map((p) => p.trim()).filter(Boolean)
  let parent: Category | undefined
  for (const [i, name] of parts.entries()) {
    const isLast = i === parts.length - 1
    let cat = categories.find(
      (c) => normalize(c.name) === normalize(name) && (parts.length === 1 ? true : (c.parentId ?? null) === (parent?.id ?? null)),
    )
    if (!cat) {
      let slug = slugify(name) || 'categoria'
      for (let n = 2; categories.some((c) => c.slug === slug); n++) slug = `${slugify(name)}-${n}`
      cat = {
        id: slug,
        slug,
        name,
        description: '',
        order: categories.filter((c) => (c.parentId ?? null) === (parent?.id ?? null)).length,
        parentId: parent?.id ?? null,
        filters: [],
      }
      categories.push(cat)
      result.newCategories.push(isLast && parent ? `${parent.name} > ${name}` : name)
    }
    parent = cat
  }
  return parent!
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
        promotion: { ...EMPTY_PROMOTION },
        brand: '',
        attributes: {},
        sku: '',
        shortDescription: '',
        specs: [],
        options: [],
        related: [],
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
    const previous = get('precio_anterior')
    if (previous !== undefined) target.promotion = { ...target.promotion, originalPrice: priceIn(previous) }
    const options = get('opciones')
    const optionNames = (get('opciones_nombres') ?? target.options.map((o) => o.name).join(' / '))
      .split(/\s+\/\s+/)
      .map((x) => x.trim())
      .filter(Boolean)
    if (options !== undefined && mode === 'precios' && options) {
      // En modo precios sólo actualiza el precio de variantes que ya existen.
      for (const v of variantsFromCell(options, optionNames, target.variants).variants) {
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
      if (catName) target.categoryId = resolveCategory(categories, catName, result).id
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
      if (options !== undefined) {
        const parsed = variantsFromCell(options, optionNames, target.variants)
        target.options = parsed.options
        target.variants = parsed.variants
      }
      const sku = get('codigo')
      if (sku !== undefined) target.sku = sku.slice(0, 40)
      const short = get('descripcion_corta')
      if (short !== undefined) target.shortDescription = short.slice(0, 200)
      const ficha = get('ficha')
      if (ficha !== undefined) target.specs = specsFromCell(ficha)
      const brand = get('marca')
      if (brand !== undefined) target.brand = brand.slice(0, 60)
      const attrs = get('atributos')
      if (attrs !== undefined) target.attributes = attributesFromCell(attrs)
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
