'use server'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkCredentials, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { categoryDepth, descendantIds, EMPTY_PROMOTION, MAX_CATEGORY_DEPTH, variantLabel } from '@/lib/catalog'
import { applyImport, type ImportMode, type ImportResult } from '@/lib/catalog-io'
import { parseCsv } from '@/lib/csv'
import { sendTestEmail } from '@/lib/notify'
import { mutateDb, newId, readDb, UPLOADS_DIR } from '@/lib/db'
import { createDemoProducts } from '@/lib/demo-catalog'
import { createCategories } from '@/lib/seed'
import { requireAdmin } from '@/lib/session'
import { slugify } from '@/lib/site'
import type {
  CategoryFilter,
  Database,
  LeadStatus,
  OrderStatus,
  Product,
  ProductOption,
  ProductSpec,
  Promotion,
  Settings,
  StockStatus,
  Variant,
  WeeklyHours,
} from '@/lib/types'

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string> }

const str = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? '').trim().slice(0, max)

const isStock = (v: unknown): v is StockStatus => v === 'disponible' || v === 'bajo' || v === 'sin_stock'

function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  try {
    return typeof value === 'string' && value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function refreshSite() {
  revalidatePath('/', 'layout')
}

/* ---------- Sesión ---------- */

const attempts = new Map<string, { count: number; until: number }>()

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const entry = attempts.get(ip)
  if (entry && entry.until > Date.now()) {
    const min = Math.ceil((entry.until - Date.now()) / 60000)
    return { message: `Demasiados intentos. Probá de nuevo en ${min} min.` }
  }

  if (!(await checkCredentials(String(fd.get('user') ?? ''), String(fd.get('password') ?? '')))) {
    const count = (entry?.count ?? 0) + 1
    // 5 intentos fallidos bloquean 5 minutos.
    attempts.set(ip, count >= 5 ? { count: 0, until: Date.now() + 5 * 60000 } : { count, until: 0 })
    return { message: 'Usuario o contraseña incorrectos.' }
  }

  attempts.delete(ip)
  const store = await cookies()
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  const next = String(fd.get('next') ?? '')
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}

/* ---------- Imágenes ---------- */

const IMAGE_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
}

async function saveUpload(file: File): Promise<string> {
  const ext = IMAGE_TYPES[file.type]
  if (!ext) throw new Error('Formato no soportado. Usá JPG, PNG, WEBP o AVIF.')
  if (file.size > 4 * 1024 * 1024) throw new Error('La imagen supera los 4 MB.')
  await fs.mkdir(UPLOADS_DIR, { recursive: true })
  const name = `${newId()}${ext}`
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()))
  return `/media/${name}`
}

/* ---------- Productos ---------- */

function uniqueSlug(db: Database, base: string, exceptId?: string) {
  const root = slugify(base) || 'producto'
  let slug = root
  let i = 2
  while (db.products.some((p) => p.slug === slug && p.id !== exceptId)) slug = `${root}-${i++}`
  return slug
}

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const id = str(fd, 'id', 80)
  const name = str(fd, 'name', 120)
  const categoryId = str(fd, 'categoryId', 80)
  const priceRaw = str(fd, 'price', 20).replace(/[^\d]/g, '')
  const errors: Record<string, string> = {}
  if (name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.'
  if (!categoryId) errors.categoryId = 'Elegí una categoría.'

  // Galería: `imageOrder` trae el orden final; cada ítem es una URL existente o "new:<n>"
  // (el n-ésimo archivo de `newImages`). La primera foto es la principal.
  const files = fd.getAll('newImages').filter((f): f is File => f instanceof File && f.size > 0)
  const images: string[] = []
  try {
    for (const token of parseJson<string[]>(fd.get('imageOrder'), []).slice(0, 12)) {
      if (token.startsWith('new:')) {
        const file = files[Number(token.slice(4))]
        if (file) images.push(await saveUpload(file))
      } else if (token.startsWith('/')) {
        images.push(token.slice(0, 300))
      }
    }
  } catch (e) {
    errors.image = (e as Error).message
  }

  const money = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null)
  const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

  // Opciones (ejes de variación): Medida → [20 mm, 25 mm]. Máximo 3 ejes y 30 valores por eje.
  const options: ProductOption[] = []
  for (const o of parseJson<Partial<ProductOption>[]>(fd.get('options'), []).slice(0, 3)) {
    const name = text(o.name, 40)
    const values = [...new Set((Array.isArray(o.values) ? o.values : []).map((v) => text(v, 60)).filter(Boolean))].slice(0, 30)
    if (name && values.length && !options.some((x) => x.name.toLowerCase() === name.toLowerCase())) options.push({ name, values })
  }

  // Variantes: combinaciones de esas opciones, cada una con código, precio, stock y foto.
  const seenCombos = new Set<string>()
  const variants: Variant[] = []
  for (const v of parseJson<Partial<Variant>[]>(fd.get('variants'), []).slice(0, 120)) {
    const values: Record<string, string> = {}
    for (const o of options) {
      const value = text(v.options?.[o.name], 60)
      if (o.values.includes(value)) values[o.name] = value
    }
    if (Object.keys(values).length !== options.length) continue
    const combo = variantLabel(values, options)
    if (seenCombos.has(combo)) continue
    seenCombos.add(combo)
    const imageIndex = typeof v.imageIndex === 'number' && v.imageIndex >= 0 && v.imageIndex < 12 ? Math.floor(v.imageIndex) : null
    variants.push({
      id: typeof v.id === 'string' && /^[\w-]{1,60}$/.test(v.id) ? v.id : newId('v_'),
      name: combo,
      options: values,
      sku: text(v.sku, 40),
      price: money(v.price),
      originalPrice: money(v.originalPrice),
      stock: isStock(v.stock) ? v.stock : 'disponible',
      imageIndex,
    })
  }

  // Ficha técnica: filas Etiqueta → Valor (Ancho → 39 cm).
  const specs: ProductSpec[] = parseJson<Partial<ProductSpec>[]>(fd.get('specs'), [])
    .map((r) => ({ label: text(r.label, 40), value: text(r.value, 120) }))
    .filter((r) => r.label && r.value)
    .slice(0, 40)

  if (Object.keys(errors).length) return { errors, message: 'Revisá los campos marcados.' }

  const stock = isStock(str(fd, 'stock')) ? (str(fd, 'stock') as StockStatus) : 'disponible'
  const price = priceRaw ? Number(priceRaw) : null

  // Promoción: estado del producto, con precio anterior, % y vigencia opcionales.
  const isDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const originalRaw = str(fd, 'promoOriginalPrice', 20).replace(/[^\d]/g, '')
  const percentRaw = Number(str(fd, 'promoDiscountPercent', 5).replace(/[^\d]/g, ''))
  const promotion: Promotion = {
    originalPrice: originalRaw ? Number(originalRaw) : null,
    discountPercent: percentRaw >= 1 && percentRaw <= 99 ? percentRaw : null,
    startsAt: isDate(str(fd, 'promoStartsAt', 10)),
    endsAt: isDate(str(fd, 'promoEndsAt', 10)),
    limitedStock: fd.get('promoLimitedStock') === 'on',
  }
  if (promotion.originalPrice != null && price != null && promotion.originalPrice <= price) {
    return { errors: { promoOriginalPrice: 'El precio anterior tiene que ser mayor al precio actual.' }, message: 'Revisá los campos marcados.' }
  }
  if (promotion.startsAt && promotion.endsAt && promotion.endsAt < promotion.startsAt) {
    return { errors: { promoEndsAt: 'La fecha de fin es anterior a la de inicio.' }, message: 'Revisá los campos marcados.' }
  }

  // Atributos para los filtros de la categoría: { tipo: ['Codo'], medida: ['20 mm', '25 mm'] }.
  const attributes: Record<string, string[]> = {}
  for (const [key, values] of Object.entries(parseJson<Record<string, unknown>>(fd.get('attributes'), {}))) {
    if (!/^[a-z0-9-]{1,40}$/.test(key) || !Array.isArray(values)) continue
    const clean = [...new Set(values.map((v) => String(v).trim().slice(0, 60)).filter(Boolean))].slice(0, 30)
    if (clean.length) attributes[key] = clean
  }

  const savedId = await mutateDb((db) => {
    const now = new Date().toISOString()
    const data = {
      name,
      categoryId,
      description: str(fd, 'description', 1000),
      price,
      promo: fd.get('promo') === 'on',
      promotion,
      brand: str(fd, 'brand', 60),
      sku: str(fd, 'sku', 40),
      shortDescription: str(fd, 'shortDescription', 200),
      specs,
      options,
      related: parseJson<unknown[]>(fd.get('related'), [])
        .filter((x): x is string => typeof x === 'string' && x !== id && db.products.some((p) => p.id === x))
        .slice(0, 12),
      attributes,
      featured: fd.get('featured') === 'on',
      active: fd.get('active') === 'on',
      stock,
      image: images[0] ?? '/placeholder.svg',
      images,
      variants,
      tags: str(fd, 'tags', 500)
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    }
    const existing = db.products.find((p) => p.id === id)
    if (existing) {
      Object.assign(existing, data, {
        slug: uniqueSlug(db, str(fd, 'slug', 120) || name, existing.id),
        updatedAt: now,
      })
      return existing.id
    }
    const product: Product = {
      id: newId('p_'),
      slug: uniqueSlug(db, str(fd, 'slug', 120) || name),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
    db.products.unshift(product)
    return product.id
  })

  refreshSite()
  if (!id) redirect(`/admin/productos/${savedId}?creado=1`)
  return { ok: true, message: 'Cambios guardados.' }
}

export async function toggleProduct(id: string, field: 'active' | 'promo' | 'featured') {
  await requireAdmin()
  await mutateDb((db) => {
    const p = db.products.find((x) => x.id === id)
    if (p) {
      p[field] = !p[field]
      p.updatedAt = new Date().toISOString()
    }
  })
  refreshSite()
}

export async function setProductStock(id: string, stock: StockStatus) {
  await requireAdmin()
  await mutateDb((db) => {
    const p = db.products.find((x) => x.id === id)
    if (p) {
      p.stock = stock
      p.updatedAt = new Date().toISOString()
    }
  })
  refreshSite()
}

export async function setProductPrice(id: string, price: number | null) {
  await requireAdmin()
  await mutateDb((db) => {
    const p = db.products.find((x) => x.id === id)
    if (p) {
      p.price = price != null && Number.isFinite(price) && price >= 0 ? Math.round(price) : null
      p.updatedAt = new Date().toISOString()
    }
  })
  refreshSite()
}

/** Precio de una variante y/o su stock, desde la tabla de productos. */
export async function setVariantQuick(productId: string, variantId: string, patch: { price?: number | null; stock?: StockStatus }) {
  await requireAdmin()
  await mutateDb((db) => {
    const p = db.products.find((x) => x.id === productId)
    const v = p?.variants.find((x) => x.id === variantId)
    if (!p || !v) return
    if ('price' in patch) {
      const price = patch.price
      v.price = price != null && Number.isFinite(price) && price >= 0 ? Math.round(price) : null
    }
    if (patch.stock && isStock(patch.stock)) v.stock = patch.stock
    p.updatedAt = new Date().toISOString()
  })
  refreshSite()
}

/** Redondea a la decena, como se ven los precios en el mostrador. */
const round10 = (n: number) => Math.round(n / 10) * 10

/** Ajuste masivo de precios por porcentaje (p. ej. +8% por inflación). Incluye variantes y precios anteriores. */
export async function adjustPrices(ids: string[], percent: number) {
  await requireAdmin()
  if (!Number.isFinite(percent) || percent < -90 || percent > 500) return
  const factor = 1 + percent / 100
  const scale = (n: number | null) => (n == null ? null : round10(n * factor))
  await mutateDb((db) => {
    const now = new Date().toISOString()
    for (const p of db.products) {
      if (!ids.includes(p.id)) continue
      p.price = scale(p.price)
      p.promotion.originalPrice = scale(p.promotion.originalPrice)
      for (const v of p.variants) {
        v.price = scale(v.price)
        v.originalPrice = scale(v.originalPrice)
      }
      p.updatedAt = now
    }
  })
  refreshSite()
}

export type BulkOperation =
  | { type: 'active'; value: boolean }
  | { type: 'featured'; value: boolean }
  | { type: 'stock'; value: StockStatus }
  | { type: 'category'; categoryId: string }
  | { type: 'promo_on'; percent: number; endsAt: string | null; limitedStock: boolean }
  | { type: 'promo_off' }
  | { type: 'delete' }

/** Acciones sobre varios productos a la vez, desde la barra de selección. Devuelve cuántos cambió. */
export async function bulkUpdateProducts(ids: string[], op: BulkOperation): Promise<number> {
  await requireAdmin()
  const selected = new Set(ids)
  const count = await mutateDb((db) => {
    const now = new Date().toISOString()
    if (op.type === 'delete') {
      const before = db.products.length
      db.products = db.products.filter((p) => !selected.has(p.id))
      for (const p of db.products) p.related = p.related.filter((id) => !selected.has(id))
      return before - db.products.length
    }
    if (op.type === 'category' && !db.categories.some((c) => c.id === op.categoryId)) return 0

    let n = 0
    for (const p of db.products) {
      if (!selected.has(p.id)) continue
      n++
      p.updatedAt = now
      if (op.type === 'active') p.active = op.value
      else if (op.type === 'featured') p.featured = op.value
      else if (op.type === 'stock' && isStock(op.value)) {
        p.stock = op.value
        for (const v of p.variants) v.stock = op.value
      } else if (op.type === 'category') p.categoryId = op.categoryId
      else if (op.type === 'promo_on') {
        const pct = Math.min(90, Math.max(0, Math.round(op.percent) || 0))
        const endsAt = op.endsAt && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(op.endsAt) ? op.endsAt : null
        // El descuento se calcula siempre sobre el precio de lista, aunque ya estuviera en promo.
        if (pct > 0) {
          if (p.price != null) {
            const list = p.promotion.originalPrice ?? p.price
            p.promotion.originalPrice = list
            p.price = round10(list * (1 - pct / 100))
          }
          for (const v of p.variants) {
            if (v.price == null) continue
            const list = v.originalPrice ?? v.price
            v.originalPrice = list
            v.price = round10(list * (1 - pct / 100))
          }
          p.promotion.discountPercent = pct
        }
        p.promotion.startsAt = null
        p.promotion.endsAt = endsAt
        p.promotion.limitedStock = op.limitedStock
        p.promo = true
      } else if (op.type === 'promo_off') {
        // Vuelve al precio de lista.
        if (p.promotion.originalPrice != null) p.price = p.promotion.originalPrice
        for (const v of p.variants) {
          if (v.originalPrice != null) v.price = v.originalPrice
          v.originalPrice = null
        }
        p.promotion = { ...EMPTY_PROMOTION }
        p.promo = false
      }
    }
    return n
  })
  refreshSite()
  return count
}

export async function duplicateProduct(id: string) {
  await requireAdmin()
  const newProductId = await mutateDb((db) => {
    const p = db.products.find((x) => x.id === id)
    if (!p) return null
    const now = new Date().toISOString()
    const copy: Product = {
      ...p,
      id: newId('p_'),
      name: `${p.name} (copia)`,
      slug: uniqueSlug(db, `${p.name} copia`),
      active: false,
      createdAt: now,
      updatedAt: now,
    }
    db.products.unshift(copy)
    return copy.id
  })
  refreshSite()
  if (newProductId) redirect(`/admin/productos/${newProductId}`)
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  await mutateDb((db) => {
    db.products = db.products.filter((p) => p.id !== id)
  })
  refreshSite()
}

/* ---------- Importar planilla ---------- */

export type ImportState = FormState & { result?: ImportResult; applied?: boolean }

/** Importa productos desde un CSV de Excel. `apply` = "0" sólo muestra qué cambiaría. */
export async function importProducts(_prev: ImportState, fd: FormData): Promise<ImportState> {
  await requireAdmin()
  const file = fd.get('file')
  if (!(file instanceof File) || file.size === 0) return { message: 'Elegí la planilla (.csv).' }
  // 20 MB alcanzan para decenas de miles de filas (2.500 productos con variantes rondan 2–4 MB).
  if (file.size > 20 * 1024 * 1024) return { message: 'La planilla supera los 20 MB. Dividila en dos archivos.' }
  if (/\.xlsx?$/i.test(file.name)) {
    return { message: 'En Excel usá Archivo → Guardar como → "CSV (delimitado por comas)" y subí ese archivo.' }
  }
  const rows = parseCsv(await file.text())
  const mode: ImportMode = fd.get('mode') === 'precios' ? 'precios' : 'todo'
  const apply = fd.get('apply') === '1'

  if (!apply) {
    const db = await readDb()
    const result = applyImport(rows, structuredClone(db.products), structuredClone(db.categories), mode, () => newId('p_'))
    return { result, applied: false }
  }
  const result = await mutateDb((db) => applyImport(rows, db.products, db.categories, mode, () => newId('p_')))
  refreshSite()
  return {
    result,
    applied: true,
    ok: true,
    message: `Listo: ${result.created.length} creados y ${result.updated.length} actualizados.`,
  }
}

/* ---------- Categorías ---------- */

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const id = str(fd, 'id', 80)
  const name = str(fd, 'name', 60)
  if (name.length < 2) return { errors: { name: 'Ingresá un nombre.' } }
  // Filtros propios: la clave sale del nombre ("Tipo de sanitario" → tipo-de-sanitario).
  const filters: CategoryFilter[] = []
  for (const label of parseJson<unknown[]>(fd.get('filters'), [])) {
    const clean = String(label).trim().slice(0, 40)
    const key = slugify(clean)
    if (key && !filters.some((x) => x.key === key)) filters.push({ key, label: clean })
  }
  const result = await mutateDb((db): FormState => {
    const slug = slugify(name)
    if (db.categories.some((c) => c.slug === slug && c.id !== id)) {
      return { errors: { name: 'Ya existe una categoría con ese nombre.' } }
    }
    // Hasta 3 niveles (Baño → Sanitarios → Inodoros). Una categoría no puede quedar dentro de sí misma.
    const parentRaw = str(fd, 'parentId', 80)
    const parent = db.categories.find((c) => c.id === parentRaw)
    if (parentRaw && !parent) return { errors: { parentId: 'Elegí una ubicación válida.' } }
    const existing = db.categories.find((c) => c.id === id)
    if (existing && parent && descendantIds(db.categories, existing.id).has(parent.id)) {
      return { errors: { parentId: 'No puede quedar dentro de sí misma ni de una de sus subcategorías.' } }
    }
    const subtreeHeight = (catId: string): number => {
      const children = db.categories.filter((c) => c.parentId === catId)
      return 1 + (children.length ? Math.max(...children.map((c) => subtreeHeight(c.id))) : 0)
    }
    const parentDepth = parent ? categoryDepth(db.categories, parent.id) : 0
    if (parentDepth + (existing ? subtreeHeight(existing.id) : 1) > MAX_CATEGORY_DEPTH) {
      return { errors: { parentId: `El catálogo admite hasta ${MAX_CATEGORY_DEPTH} niveles (ej: Baño → Sanitarios → Inodoros).` } }
    }
    const parentId = parent?.id ?? null
    if (existing) {
      if (existing.parentId !== parentId) existing.order = db.categories.filter((c) => c.parentId === parentId).length
      existing.name = name
      existing.slug = slug
      existing.description = str(fd, 'description', 200)
      existing.parentId = parentId
      existing.filters = filters
    } else {
      db.categories.push({
        id: slug,
        name,
        slug,
        description: str(fd, 'description', 200),
        order: db.categories.filter((c) => (c.parentId ?? null) === parentId).length,
        parentId,
        filters,
      })
    }
    return { ok: true, message: existing ? 'Categoría actualizada.' : 'Categoría creada.' }
  })
  if (result.ok) refreshSite()
  return result
}

export async function moveCategory(id: string, dir: -1 | 1) {
  await requireAdmin()
  await mutateDb((db) => {
    // Se ordena entre hermanos (rubros entre rubros, subcategorías dentro de su rubro).
    const target = db.categories.find((c) => c.id === id)
    if (!target) return
    const list = db.categories
      .filter((c) => (c.parentId ?? null) === (target.parentId ?? null))
      .sort((a, b) => a.order - b.order)
    const i = list.findIndex((c) => c.id === id)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    list.forEach((c, order) => (c.order = order))
  })
  refreshSite()
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin()
  const result = await mutateDb((db): FormState => {
    const children = db.categories.filter((c) => c.parentId === id).length
    if (children) return { message: `No se puede eliminar: tiene ${children} subcategoría(s). Movelas o eliminalas primero.` }
    const used = db.products.filter((p) => p.categoryId === id).length
    if (used) return { message: `No se puede eliminar: tiene ${used} producto(s). Movelos a otra categoría primero.` }
    db.categories = db.categories.filter((c) => c.id !== id)
    return { ok: true }
  })
  if (result.ok) refreshSite()
  return result
}

/* ---------- Consultas ---------- */

export async function setLeadStatus(id: string, status: LeadStatus) {
  await requireAdmin()
  await mutateDb((db) => {
    const lead = db.leads.find((l) => l.id === id)
    if (lead) lead.status = status
  })
  revalidatePath('/admin', 'layout')
}

export async function saveLeadNotes(id: string, notes: string) {
  await requireAdmin()
  await mutateDb((db) => {
    const lead = db.leads.find((l) => l.id === id)
    if (lead) lead.notes = notes.slice(0, 1000)
  })
  revalidatePath('/admin', 'layout')
}

export async function deleteLead(id: string) {
  await requireAdmin()
  await mutateDb((db) => {
    db.leads = db.leads.filter((l) => l.id !== id)
  })
  revalidatePath('/admin', 'layout')
}

/* ---------- Pedidos ---------- */

const ORDER_STATUSES: OrderStatus[] = ['nuevo', 'presupuestado', 'vendido', 'perdido']

export async function setOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin()
  if (!ORDER_STATUSES.includes(status)) return
  await mutateDb((db) => {
    const order = db.orders.find((o) => o.id === id)
    if (!order) return
    order.status = status
    // Al marcarlo vendido arranca con el total estimado; después se corrige si se vendió otra cosa.
    if (status === 'vendido' && order.saleAmount == null && order.estimatedTotal > 0) order.saleAmount = order.estimatedTotal
    order.updatedAt = new Date().toISOString()
  })
  revalidatePath('/admin', 'layout')
}

export async function saveOrderSale(id: string, amount: number | null) {
  await requireAdmin()
  await mutateDb((db) => {
    const order = db.orders.find((o) => o.id === id)
    if (!order) return
    order.saleAmount = amount != null && Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null
    order.updatedAt = new Date().toISOString()
  })
  revalidatePath('/admin', 'layout')
}

export async function saveOrderNotes(id: string, notes: string) {
  await requireAdmin()
  await mutateDb((db) => {
    const order = db.orders.find((o) => o.id === id)
    if (order) order.notes = notes.slice(0, 1000)
  })
  revalidatePath('/admin', 'layout')
}

export async function deleteOrder(id: string) {
  await requireAdmin()
  await mutateDb((db) => {
    db.orders = db.orders.filter((o) => o.id !== id)
  })
  revalidatePath('/admin', 'layout')
}

/* ---------- Ajustes ---------- */

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const whatsappNumber = str(fd, 'whatsappNumber', 20).replace(/\D/g, '')
  const errors: Record<string, string> = {}
  if (whatsappNumber.length < 10) errors.whatsappNumber = 'Número completo con código de país, sin + ni espacios (ej: 5493534181819).'
  const email = str(fd, 'email', 120)
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.'
  const notifyEmail = str(fd, 'notifyEmail', 120)
  if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) errors.notifyEmail = 'Email inválido.'
  const gaId = str(fd, 'gaId', 20).toUpperCase()
  if (gaId && !/^G-[A-Z0-9]{4,}$/.test(gaId)) errors.gaId = 'Tiene que empezar con G- (ej: G-AB12CD34EF).'
  const hours = Array.from({ length: 7 }, (_, d) => str(fd, `hours-${d}`, 80)) as WeeklyHours
  hours.forEach((h, d) => {
    if (h && !/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/.test(h)) errors[`hours-${d}`] = 'Formato: 08:00-12:00, 15:00-19:00'
  })
  if (Object.keys(errors).length) return { errors, message: 'Revisá los campos marcados.' }

  const settings: Omit<Settings, 'showPrices'> = {
    businessName: str(fd, 'businessName', 100),
    tagline: str(fd, 'tagline', 160),
    phoneDisplay: str(fd, 'phoneDisplay', 40),
    whatsappNumber,
    email,
    address: str(fd, 'address', 160),
    mapsUrl: str(fd, 'mapsUrl', 500),
    mapsEmbedUrl: str(fd, 'mapsEmbedUrl', 1000),
    instagram: str(fd, 'instagram', 200),
    instagramHandle: str(fd, 'instagramHandle', 60),
    facebook: str(fd, 'facebook', 200),
    hours,
    heroTitle: str(fd, 'heroTitle', 120),
    heroSubtitle: str(fd, 'heroSubtitle', 300),
    announcementEnabled: fd.get('announcementEnabled') === 'on',
    announcementText: str(fd, 'announcementText', 160),
    priceNote: str(fd, 'priceNote', 200),
    transferDiscount: Math.min(50, Math.max(0, Math.round(Number(str(fd, 'transferDiscount', 3).replace(/[^\d]/g, '')) || 0))),
    installments: Math.min(24, Math.max(0, Math.round(Number(str(fd, 'installments', 3).replace(/[^\d]/g, '')) || 0))),
    installmentsInterestFree: fd.get('installmentsInterestFree') === 'on',
    notifyEmail,
    gaId,
    googleVerification: str(fd, 'googleVerification', 120).replace(/^.*content="([^"]+)".*$/, '$1'),
    googleReviewUrl: str(fd, 'googleReviewUrl', 300),
  }
  await mutateDb((db) => {
    // "Mostrar precios" se maneja con su propio switch; el formulario de ajustes no lo toca.
    db.settings = { ...settings, showPrices: db.settings.showPrices }
  })
  refreshSite()
  return { ok: true, message: 'Ajustes guardados. El sitio ya muestra los cambios.' }
}

/** Muestra u oculta todos los precios del sitio público. */
export async function setShowPrices(show: boolean) {
  await requireAdmin()
  await mutateDb((db) => {
    db.settings.showPrices = show
  })
  refreshSite()
}

export async function testNotification(): Promise<FormState> {
  await requireAdmin()
  const db = await readDb()
  const result = await sendTestEmail(db.settings)
  return result.sent
    ? { ok: true, message: `Email de prueba enviado a ${db.settings.notifyEmail}. Revisá también la carpeta de spam.` }
    : { message: `No se pudo enviar: ${result.error}` }
}

export async function clearEvents() {
  await requireAdmin()
  await mutateDb((db) => {
    db.events = []
  })
  revalidatePath('/admin', 'layout')
}

/** Reemplaza categorías y productos por el catálogo de demostración (no toca consultas ni ajustes). */
export async function loadDemoCatalog(): Promise<FormState> {
  await requireAdmin()
  const count = await mutateDb((db) => {
    db.categories = createCategories()
    db.products = createDemoProducts()
    return db.products.length
  })
  refreshSite()
  return { ok: true, message: `Catálogo de demostración cargado: ${count} productos.` }
}

export async function restoreBackup(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin()
  const file = fd.get('backup')
  if (!(file instanceof File) || file.size === 0) return { message: 'Elegí un archivo de respaldo (.json).' }
  let data: Database
  try {
    data = JSON.parse(await file.text())
  } catch {
    return { message: 'El archivo no es un JSON válido.' }
  }
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.categories) || !data.settings) {
    return { message: 'El archivo no parece un respaldo de este sitio.' }
  }
  await mutateDb((db) => {
    db.settings = data.settings
    db.categories = data.categories
    db.products = data.products
    db.leads = Array.isArray(data.leads) ? data.leads : []
    db.orders = Array.isArray(data.orders) ? data.orders : []
    db.events = Array.isArray(data.events) ? data.events : []
  })
  refreshSite()
  return { ok: true, message: 'Respaldo restaurado.' }
}
