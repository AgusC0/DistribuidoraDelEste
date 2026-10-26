import path from 'node:path'
import type postgres from 'postgres'
import { EMPTY_PROMOTION } from '@/lib/catalog'
import { ensureReady, getSql } from '@/lib/db/client'
import { CATEGORIES_VERSION, createSeed } from '@/lib/seed'
import type { Category, Database, Lead, Order, OrderItem, Product, PublicCatalog, Settings, TrackEvent, Variant } from '@/lib/types'

/**
 * Acceso a datos sobre PostgreSQL (tablas en db/migrations).
 *
 * - Lecturas del sitio: el catálogo (ajustes, categorías, productos y variantes) se cachea en memoria y sólo
 *   se vuelve a leer cuando cambia (contador `catalog_version` en la tabla meta). Miles de visitas no consultan
 *   la base miles de veces.
 * - Escrituras del panel (`mutateDb`): la función trabaja sobre una copia y al terminar se guardan, en una
 *   transacción, sólo las filas que cambiaron.
 * - Caminos calientes (métricas, pedidos, consultas): inserciones directas (`insertEvent`, `insertOrder`, `insertLead`).
 * Las fotos subidas siguen en disco (UPLOADS_DIR).
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')
export const UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'uploads')

/** Las métricas se guardan 13 meses; el panel lee las de los últimos 90 días. */
const EVENTS_RETENTION_DAYS = 400
const EVENTS_WINDOW_DAYS = 90

type Catalog = { version: string; settings: Settings; categories: Category[]; products: Product[]; categoriesVersion: number }

const shared = globalThis as typeof globalThis & {
  __ddeCatalog?: Catalog
  __ddeQueue?: Promise<unknown>
  __ddeStats?: { at: number; popularSearches: string[]; popularity: Record<string, number> }
}
shared.__ddeQueue ??= Promise.resolve()

/* ---------- Filas ↔ dominio ---------- */

type Row = Record<string, unknown>
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v))
const num = (v: unknown) => (v == null ? null : Number(v))

const toCategory = (r: Row): Category => ({
  id: r.id as string,
  slug: r.slug as string,
  name: r.name as string,
  description: r.description as string,
  order: r.sort_order as number,
  parentId: (r.parent_id as string | null) ?? null,
  filters: (r.filters as Category['filters']) ?? [],
  brands: (r.brands as string[]) ?? [],
  seoTitle: (r.seo_title as string) || undefined,
  seoText: (r.seo_text as string) || undefined,
})

const toVariant = (r: Row): Variant => ({
  id: r.id as string,
  name: r.name as string,
  options: (r.options as Record<string, string>) ?? {},
  sku: r.sku as string,
  price: num(r.price),
  originalPrice: num(r.original_price),
  stock: r.stock as Variant['stock'],
  imageIndex: num(r.image_index),
})

function toProduct(r: Row, variants: Variant[]): Product {
  const images = (r.images as string[]) ?? []
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    categoryId: r.category_id as string,
    description: r.description as string,
    price: num(r.price),
    promo: r.promo as boolean,
    promotion: {
      ...EMPTY_PROMOTION,
      originalPrice: num(r.promo_original_price),
      discountPercent: num(r.promo_discount_percent),
      startsAt: (r.promo_starts_at as string | null) ?? null,
      endsAt: (r.promo_ends_at as string | null) ?? null,
      limitedStock: r.promo_limited_stock as boolean,
    },
    brand: r.brand as string,
    attributes: (r.attributes as Record<string, string[]>) ?? {},
    featured: r.featured as boolean,
    active: r.active as boolean,
    stock: r.stock as Product['stock'],
    sku: r.sku as string,
    shortDescription: r.short_description as string,
    specs: (r.specs as Product['specs']) ?? [],
    options: (r.options as Product['options']) ?? [],
    related: (r.related as string[]) ?? [],
    image: images[0] ?? '/placeholder.svg',
    images,
    variants,
    tags: (r.tags as string[]) ?? [],
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  }
}

const toLead = (r: Row): Lead => ({
  id: r.id as string,
  name: r.name as string,
  phone: r.phone as string,
  product: r.product as string,
  message: r.message as string,
  status: r.status as Lead['status'],
  notes: r.notes as string,
  createdAt: iso(r.created_at),
})

const toOrder = (r: Row, items: OrderItem[]): Order => ({
  id: r.id as string,
  number: r.number as number,
  name: r.name as string,
  note: r.note as string,
  items,
  estimatedTotal: Number(r.estimated_total),
  status: r.status as Order['status'],
  saleAmount: num(r.sale_amount),
  notes: r.notes as string,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
})

const toEvent = (r: Row): TrackEvent => {
  const ts = iso(r.ts)
  if (r.type === 'search') return { type: 'search', ts, q: (r.q as string) ?? '', results: (r.results as number) ?? 0 }
  if (r.type === 'view') return { type: 'view', ts, productId: r.product_id as string }
  return { type: 'wa_click', ts, source: (r.source as string) ?? 'sitio', productId: (r.product_id as string) ?? undefined }
}

/* ---------- Preparación ---------- */

/** Base nueva: ajustes y categorías por defecto (el catálogo arranca vacío). */
async function seedIfEmpty() {
  const sql = getSql()
  const [exists] = await sql`SELECT 1 FROM settings WHERE id = 1`
  if (exists) return
  const seed = createSeed()
  await sql.begin(async (tx) => {
    await tx`INSERT INTO settings (id, data) VALUES (1, ${tx.json(seed.settings as never)})`
    await upsertCategories(tx, seed.categories)
    await tx`INSERT INTO meta (key, value) VALUES ('catalog_version', '1'), ('categories_version', ${String(CATEGORIES_VERSION)})
             ON CONFLICT (key) DO NOTHING`
  })
  console.log('[db] base inicializada con ajustes y categorías')
}

const ready = () => ensureReady(seedIfEmpty)

/* ---------- Catálogo (cacheado por versión) ---------- */

async function currentVersion(sql: postgres.Sql | postgres.TransactionSql) {
  const [row] = await sql<{ value: string }[]>`SELECT value FROM meta WHERE key = 'catalog_version'`
  return row?.value ?? '0'
}

async function loadCatalog(): Promise<Catalog> {
  await ready()
  const sql = getSql()
  const version = await currentVersion(sql)
  if (shared.__ddeCatalog?.version === version) return shared.__ddeCatalog
  const [settingsRow, categoryRows, productRows, variantRows, metaRows] = await Promise.all([
    sql`SELECT data FROM settings WHERE id = 1`,
    sql`SELECT * FROM categories ORDER BY sort_order, name`,
    sql`SELECT * FROM products ORDER BY created_at DESC`,
    sql`SELECT * FROM variants ORDER BY product_id, position`,
    sql`SELECT key, value FROM meta`,
  ])
  const byProduct = new Map<string, Variant[]>()
  for (const v of variantRows) {
    const list = byProduct.get(v.product_id as string) ?? []
    list.push(toVariant(v))
    byProduct.set(v.product_id as string, list)
  }
  const meta = Object.fromEntries(metaRows.map((r) => [r.key, r.value]))
  const catalog: Catalog = {
    version,
    // Los ajustes nuevos que agregue el código toman su valor por defecto.
    settings: { ...createSeed().settings, ...(settingsRow[0]?.data as Settings) },
    categories: categoryRows.map(toCategory),
    products: productRows.map((r) => toProduct(r, byProduct.get(r.id as string) ?? [])),
    categoriesVersion: Number(meta.categories_version ?? CATEGORIES_VERSION),
  }
  shared.__ddeCatalog = catalog
  return catalog
}

async function loadLeads(sql: postgres.Sql) {
  return (await sql`SELECT * FROM leads ORDER BY created_at DESC`).map(toLead)
}

async function loadOrders(sql: postgres.Sql) {
  const [rows, items] = await Promise.all([
    sql`SELECT * FROM orders ORDER BY created_at DESC`,
    sql`SELECT * FROM order_items ORDER BY order_id, position`,
  ])
  const byOrder = new Map<string, OrderItem[]>()
  for (const i of items) {
    const list = byOrder.get(i.order_id as string) ?? []
    list.push({
      productId: i.product_id as string,
      variantId: (i.variant_id as string) ?? undefined,
      name: i.name as string,
      variantName: (i.variant_name as string) ?? undefined,
      sku: (i.sku as string) ?? undefined,
      price: num(i.price),
      quantity: i.quantity as number,
    })
    byOrder.set(i.order_id as string, list)
  }
  return rows.map((r) => toOrder(r, byOrder.get(r.id as string) ?? []))
}

async function loadEvents(sql: postgres.Sql) {
  return (await sql`SELECT * FROM events WHERE ts > now() - make_interval(days => ${EVENTS_WINDOW_DAYS}) ORDER BY ts`).map(toEvent)
}

/**
 * Todo lo que necesita el panel: catálogo, consultas, pedidos y métricas de los últimos 90 días.
 * Para el sitio público usar getPublicCatalog (no carga consultas, pedidos ni métricas).
 */
export async function readDb(): Promise<Database> {
  // Espera las escrituras en curso para no leer un estado a medias.
  await shared.__ddeQueue!.catch(() => {})
  return readAll()
}

/** Lectura completa sin esperar la cola (la usa mutateDb desde adentro de la cola). */
async function readAll(): Promise<Database> {
  const catalog = await loadCatalog()
  const sql = getSql()
  const [leads, orders, events] = await Promise.all([loadLeads(sql), loadOrders(sql), loadEvents(sql)])
  return {
    version: 1,
    categoriesVersion: catalog.categoriesVersion,
    settings: catalog.settings,
    categories: catalog.categories,
    products: catalog.products,
    leads,
    orders,
    events,
  }
}

/* ---------- Escrituras ---------- */

type Tx = postgres.TransactionSql

async function upsertCategories(tx: Tx, list: Category[]) {
  if (!list.length) return
  const rows = list.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? '',
    sort_order: c.order ?? 0,
    parent_id: c.parentId ?? null,
    filters: tx.json((c.filters ?? []) as never),
    brands: c.brands ?? [],
    seo_title: c.seoTitle ?? '',
    seo_text: c.seoText ?? '',
  }))
  await tx`
    INSERT INTO categories ${tx(rows)}
    ON CONFLICT (id) DO UPDATE SET slug = excluded.slug, name = excluded.name, description = excluded.description,
      sort_order = excluded.sort_order, parent_id = excluded.parent_id, filters = excluded.filters, brands = excluded.brands,
      seo_title = excluded.seo_title, seo_text = excluded.seo_text`
}

const dateOrNull = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

async function upsertProducts(tx: Tx, list: Product[]) {
  if (!list.length) return
  // De a lotes: una planilla de miles de productos no arma una sola consulta gigante.
  for (let i = 0; i < list.length; i += 500) {
    const chunk = list.slice(i, i + 500)
    const rows = chunk.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category_id: p.categoryId,
      brand: p.brand ?? '',
      sku: p.sku ?? '',
      description: p.description ?? '',
      short_description: p.shortDescription ?? '',
      price: p.price,
      promo: p.promo,
      promo_original_price: p.promotion?.originalPrice ?? null,
      promo_discount_percent: p.promotion?.discountPercent ?? null,
      promo_starts_at: dateOrNull(p.promotion?.startsAt ?? null),
      promo_ends_at: dateOrNull(p.promotion?.endsAt ?? null),
      promo_limited_stock: p.promotion?.limitedStock ?? false,
      featured: p.featured,
      active: p.active,
      stock: p.stock,
      attributes: tx.json((p.attributes ?? {}) as never),
      specs: tx.json((p.specs ?? []) as never),
      options: tx.json((p.options ?? []) as never),
      related: p.related ?? [],
      images: p.images ?? [],
      tags: p.tags ?? [],
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }))
    await tx`
      INSERT INTO products ${tx(rows)}
      ON CONFLICT (id) DO UPDATE SET slug = excluded.slug, name = excluded.name, category_id = excluded.category_id,
        brand = excluded.brand, sku = excluded.sku, description = excluded.description, short_description = excluded.short_description,
        price = excluded.price, promo = excluded.promo, promo_original_price = excluded.promo_original_price,
        promo_discount_percent = excluded.promo_discount_percent, promo_starts_at = excluded.promo_starts_at,
        promo_ends_at = excluded.promo_ends_at, promo_limited_stock = excluded.promo_limited_stock, featured = excluded.featured,
        active = excluded.active, stock = excluded.stock, attributes = excluded.attributes, specs = excluded.specs,
        options = excluded.options, related = excluded.related, images = excluded.images, tags = excluded.tags,
        created_at = excluded.created_at, updated_at = excluded.updated_at`
    // Las variantes se reemplazan completas (es lo que se edita junto en la ficha).
    await tx`DELETE FROM variants WHERE product_id IN ${tx(chunk.map((p) => p.id))}`
    const variantRows = chunk.flatMap((p) =>
      p.variants.map((v, position) => ({
        product_id: p.id,
        id: v.id,
        position,
        name: v.name,
        options: tx.json((v.options ?? {}) as never),
        sku: v.sku ?? '',
        price: v.price,
        original_price: v.originalPrice,
        stock: v.stock,
        image_index: v.imageIndex,
      })),
    )
    for (let j = 0; j < variantRows.length; j += 1000) await tx`INSERT INTO variants ${tx(variantRows.slice(j, j + 1000))}`
  }
}

async function upsertLeads(tx: Tx, list: Lead[]) {
  if (!list.length) return
  const rows = list.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    product: l.product,
    message: l.message,
    status: l.status,
    notes: l.notes,
    created_at: l.createdAt,
  }))
  await tx`
    INSERT INTO leads ${tx(rows)}
    ON CONFLICT (id) DO UPDATE SET name = excluded.name, phone = excluded.phone, product = excluded.product,
      message = excluded.message, status = excluded.status, notes = excluded.notes`
}

async function upsertOrders(tx: Tx, list: Order[]) {
  if (!list.length) return
  const rows = list.map((o) => ({
    id: o.id,
    number: o.number,
    name: o.name,
    note: o.note,
    estimated_total: o.estimatedTotal,
    status: o.status,
    sale_amount: o.saleAmount,
    notes: o.notes,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  }))
  await tx`
    INSERT INTO orders ${tx(rows)}
    ON CONFLICT (id) DO UPDATE SET number = excluded.number, name = excluded.name, note = excluded.note,
      estimated_total = excluded.estimated_total, status = excluded.status, sale_amount = excluded.sale_amount,
      notes = excluded.notes, updated_at = excluded.updated_at`
  await tx`DELETE FROM order_items WHERE order_id IN ${tx(list.map((o) => o.id))}`
  const items = list.flatMap((o) =>
    o.items.map((i, position) => ({
      order_id: o.id,
      position,
      product_id: i.productId,
      variant_id: i.variantId ?? null,
      name: i.name,
      variant_name: i.variantName ?? null,
      sku: i.sku ?? null,
      price: i.price,
      quantity: i.quantity,
    })),
  )
  if (items.length) await tx`INSERT INTO order_items ${tx(items)}`
}

/** Filas nuevas o cambiadas y ids borrados entre dos listas (comparando por contenido). */
function diff<T extends { id: string }>(before: T[], after: T[]) {
  const prev = new Map(before.map((x) => [x.id, JSON.stringify(x)]))
  const upserts = after.filter((x) => prev.get(x.id) !== JSON.stringify(x))
  const ids = new Set(after.map((x) => x.id))
  const deleted = before.filter((x) => !ids.has(x.id)).map((x) => x.id)
  return { upserts, deleted }
}

async function bumpCatalog(tx: Tx) {
  const [row] = await tx<{ value: string }[]>`INSERT INTO meta (key, value) VALUES ('catalog_version', '1')
           ON CONFLICT (key) DO UPDATE SET value = (meta.value::bigint + 1)::text RETURNING value`
  return row.value
}

/**
 * Modifica datos desde el panel: `fn` trabaja sobre una copia completa y al terminar se guardan, en una
 * transacción, sólo las filas que cambiaron. Las escrituras van en fila para que dos acciones no se pisen.
 * Asignar `db.events = [...]` reemplaza las métricas (vaciar o restaurar un respaldo).
 */
export function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = shared.__ddeQueue!.then(async () => {
    const before = await readAll()
    const draft: Database = structuredClone(before)
    const originalEvents = draft.events
    const result = await fn(draft)

    const settingsChanged = JSON.stringify(before.settings) !== JSON.stringify(draft.settings)
    const categories = diff(before.categories, draft.categories)
    const products = diff(before.products, draft.products)
    const leads = diff(before.leads, draft.leads)
    const orders = diff(before.orders, draft.orders)
    const catalogChanged =
      settingsChanged ||
      categories.upserts.length + categories.deleted.length + products.upserts.length + products.deleted.length > 0 ||
      draft.categoriesVersion !== before.categoriesVersion

    let version: string | null = null
    await getSql().begin(async (tx) => {
      if (settingsChanged) {
        await tx`UPDATE settings SET data = ${tx.json(draft.settings as never)}, updated_at = now() WHERE id = 1`
      }
      if (products.deleted.length) await tx`DELETE FROM products WHERE id IN ${tx(products.deleted)}`
      await upsertCategories(tx, categories.upserts)
      await upsertProducts(tx, products.upserts)
      if (categories.deleted.length) await tx`DELETE FROM categories WHERE id IN ${tx(categories.deleted)}`
      if (leads.deleted.length) await tx`DELETE FROM leads WHERE id IN ${tx(leads.deleted)}`
      await upsertLeads(tx, leads.upserts)
      if (orders.deleted.length) await tx`DELETE FROM orders WHERE id IN ${tx(orders.deleted)}`
      await upsertOrders(tx, orders.upserts)
      if (draft.events !== originalEvents) {
        await tx`DELETE FROM events`
        await insertEvents(tx, draft.events)
      }
      if (draft.categoriesVersion !== before.categoriesVersion) {
        await tx`INSERT INTO meta (key, value) VALUES ('categories_version', ${String(draft.categoriesVersion ?? CATEGORIES_VERSION)})
                 ON CONFLICT (key) DO UPDATE SET value = excluded.value`
      }
      if (catalogChanged) version = await bumpCatalog(tx)
    })
    // El catálogo en memoria pasa a ser lo recién guardado: no hace falta volver a leerlo de la base.
    if (version) {
      shared.__ddeCatalog = {
        version,
        settings: draft.settings,
        categories: [...draft.categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es')),
        products: draft.products,
        categoriesVersion: draft.categoriesVersion ?? CATEGORIES_VERSION,
      }
    }
    return result
  })
  shared.__ddeQueue = run.catch(() => {})
  return run
}

/* ---------- Inserciones directas (sitio público) ---------- */

async function insertEvents(sql: postgres.Sql | Tx, events: TrackEvent[]) {
  const rows = events.map((e) => ({
    type: e.type,
    ts: e.ts,
    product_id: e.type === 'search' ? null : (e.productId ?? null),
    source: e.type === 'wa_click' ? e.source : null,
    q: e.type === 'search' ? e.q : null,
    results: e.type === 'search' ? e.results : null,
  }))
  for (let i = 0; i < rows.length; i += 1000) await sql`INSERT INTO events ${sql(rows.slice(i, i + 1000))}`
}

/** Registra una métrica (búsqueda, clic a WhatsApp o vista). De vez en cuando purga las de más de 13 meses. */
export async function insertEvent(event: TrackEvent) {
  await ready()
  const sql = getSql()
  await insertEvents(sql, [event])
  if (Math.random() < 0.002) await sql`DELETE FROM events WHERE ts < now() - make_interval(days => ${EVENTS_RETENTION_DAYS})`
}

export async function insertLead(lead: Lead) {
  await ready()
  await getSql().begin((tx) => upsertLeads(tx, [lead]))
}

/** Guarda un pedido con el número siguiente (correlativo, sin repetirse aunque lleguen dos a la vez). */
export async function insertOrder(order: Omit<Order, 'number'>): Promise<Order> {
  await ready()
  return getSql().begin(async (tx) => {
    await tx`LOCK TABLE orders IN SHARE ROW EXCLUSIVE MODE`
    const [{ next }] = await tx<{ next: number }[]>`SELECT COALESCE(MAX(number), 0) + 1 AS next FROM orders`
    const full = { ...order, number: Number(next) }
    await upsertOrders(tx, [full])
    return full
  })
}

/* ---------- Sitio público ---------- */

/** Catálogo completo (incluye productos ocultos y precios reales), cacheado por versión. Para uso del servidor. */
export async function getCatalog() {
  const { settings, categories, products } = await loadCatalog()
  return { settings, categories, products }
}

/** Búsquedas más hechas y productos más vistos/consultados (calculado en la base, cacheado 5 minutos). */
async function publicStats() {
  const cached = shared.__ddeStats
  if (cached && Date.now() - cached.at < 300_000) return cached
  const sql = getSql()
  const [searches, popular] = await Promise.all([
    sql<{ term: string }[]>`
      SELECT lower(trim(q)) AS term FROM events
      WHERE type = 'search' AND ts > now() - interval '30 days' AND length(trim(q)) >= 3
      GROUP BY 1 ORDER BY count(*) DESC LIMIT 6`,
    sql<{ product_id: string; score: number }[]>`
      SELECT product_id, sum(CASE WHEN type = 'wa_click' THEN 2 ELSE 1 END)::int AS score FROM events
      WHERE product_id IS NOT NULL AND type IN ('view', 'wa_click') AND ts > now() - interval '30 days'
      GROUP BY product_id`,
  ])
  const stats = {
    at: Date.now(),
    popularSearches: searches.map((s) => s.term),
    popularity: Object.fromEntries(popular.map((p) => [p.product_id, p.score])),
  }
  shared.__ddeStats = stats
  return stats
}

export async function getPublicCatalog(): Promise<PublicCatalog> {
  const catalog = await loadCatalog()
  const stats = await publicStats()
  const active = catalog.products.filter((p) => p.active)
  return {
    settings: catalog.settings,
    categories: [...catalog.categories].sort((a, b) => a.order - b.order),
    // Con los precios ocultos no se mandan al navegador: tampoco aparecen en el código de la página.
    products: catalog.settings.showPrices
      ? active
      : active.map((p) => ({
          ...p,
          price: null,
          promotion: { ...p.promotion, originalPrice: null },
          variants: p.variants.map((v) => ({ ...v, price: null, originalPrice: null })),
        })),
    popularSearches: stats.popularSearches,
    popularity: stats.popularity,
  }
}

/* ---------- Métricas (sobre las cargadas por readDb) ---------- */

/** Vistas + consultas a WhatsApp (que pesan el doble) por producto en los últimos `days` días. */
export function productPopularity(events: TrackEvent[], days: number) {
  const since = Date.now() - days * 86_400_000
  const score: Record<string, number> = {}
  for (const e of events) {
    if (Date.parse(e.ts) < since) continue
    if (e.type === 'view') score[e.productId] = (score[e.productId] ?? 0) + 1
    if (e.type === 'wa_click' && e.productId) score[e.productId] = (score[e.productId] ?? 0) + 2
  }
  return score
}

export function topSearches(events: TrackEvent[], days: number, limit: number) {
  const since = Date.now() - days * 86_400_000
  const counts = new Map<string, { term: string; count: number; zero: number }>()
  for (const e of events) {
    if (e.type !== 'search' || Date.parse(e.ts) < since) continue
    const term = e.q.trim().toLowerCase()
    if (term.length < 3) continue
    const entry = counts.get(term) ?? { term, count: 0, zero: 0 }
    entry.count++
    if (e.results === 0) entry.zero++
    counts.set(term, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

export function newId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
