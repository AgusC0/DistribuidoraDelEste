import { promises as fs } from 'node:fs'
import path from 'node:path'
import { EMPTY_PROMOTION } from '@/lib/catalog'
import { hasLegacyCategories, migrateCategoryTree, upgradeCategoryTree } from '@/lib/category-migration'
import { createSeed } from '@/lib/seed'
import type { Database, PublicCatalog, TrackEvent } from '@/lib/types'

/**
 * Base de datos en un archivo JSON. Ideal para un comercio con un catálogo chico y un
 * servidor Node persistente (VPS, Railway, Render, etc.). Para un hosting sin disco
 * persistente (Vercel), reemplazar `readDb`/`mutateDb` por Postgres, Supabase o KV:
 * el resto de la app sólo habla con estas funciones.
 */
export const DATA_DIR = process.env.DATA_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'data')
const DB_FILE = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'db.json')
export const UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, 'uploads')

const MAX_EVENTS = 5000

// La cola vive en globalThis: Next puede cargar este módulo más de una vez (acciones, rutas de API)
// y con una cola por copia dos escrituras simultáneas se pisaban.
const shared = globalThis as typeof globalThis & { __ddeDbQueue?: Promise<unknown> }
shared.__ddeDbQueue ??= Promise.resolve()

/** Completa campos que agregaron versiones nuevas, para que un db.json viejo siga funcionando. */
function migrate(db: Database): Database {
  const defaults = createSeed().settings
  db.settings = { ...defaults, ...db.settings }
  db.orders ??= []
  // Estructura de categorías anterior → actual (reclasifica productos, conserva categorías propias).
  if (hasLegacyCategories(db)) migrateCategoryTree(db)
  upgradeCategoryTree(db)
  for (const c of db.categories) {
    c.parentId ??= null
    c.filters ??= []
  }
  for (const p of db.products) {
    p.images = p.images?.length ? p.images : p.image ? [p.image] : []
    p.image = p.images[0] ?? '/placeholder.svg'
    p.variants ??= []
    p.brand ??= ''
    p.attributes ??= {}
    p.promotion = { ...EMPTY_PROMOTION, ...p.promotion }
    p.sku ??= ''
    p.shortDescription ??= ''
    p.specs ??= []
    p.related ??= []
    // Variantes viejas (sólo nombre) → una opción genérica "Opción".
    if (!p.options) {
      p.options = p.variants.length ? [{ name: 'Opción', values: p.variants.map((v) => v.name) }] : []
    }
    p.variants = p.variants.map((v) => ({
      ...v,
      options: v.options ?? (p.options[0] ? { [p.options[0].name]: v.name } : {}),
      sku: v.sku ?? '',
      originalPrice: v.originalPrice ?? null,
      imageIndex: v.imageIndex ?? null,
    }))
  }
  return db
}

async function load(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    return migrate(JSON.parse(raw) as Database)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    const seed = createSeed()
    await save(seed)
    return seed
  }
}

async function save(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const json = JSON.stringify(db, null, 2)
  // Escritura atómica: archivo temporal único + rename, para no dejar un JSON a medias.
  const tmp = `${DB_FILE}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  await fs.writeFile(tmp, json, 'utf8')
  try {
    await fs.rename(tmp, DB_FILE)
  } catch {
    // En Windows el rename falla si otro proceso tiene el archivo abierto: escribimos directo.
    await fs.writeFile(DB_FILE, json, 'utf8')
    await fs.rm(tmp, { force: true })
  }
}

export async function readDb(): Promise<Database> {
  // Espera a que terminen las escrituras pendientes para no leer un estado viejo.
  await shared.__ddeDbQueue!.catch(() => {})
  return load()
}

/** Ejecuta las escrituras en serie para que dos requests no se pisen. */
export function mutateDb<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = shared.__ddeDbQueue!.then(async () => {
    const db = await load()
    const result = await fn(db)
    if (db.events.length > MAX_EVENTS) db.events = db.events.slice(-MAX_EVENTS)
    await save(db)
    return result
  })
  shared.__ddeDbQueue = run.catch(() => {})
  return run
}

export async function getPublicCatalog(): Promise<PublicCatalog> {
  const db = await readDb()
  const active = db.products.filter((p) => p.active)
  return {
    settings: db.settings,
    categories: [...db.categories].sort((a, b) => a.order - b.order),
    // Con los precios ocultos no se mandan al navegador: tampoco aparecen en el código de la página.
    products: db.settings.showPrices
      ? active
      : active.map((p) => ({
          ...p,
          price: null,
          promotion: { ...p.promotion, originalPrice: null },
          variants: p.variants.map((v) => ({ ...v, price: null, originalPrice: null })),
        })),
    popularSearches: topSearches(db.events, 30, 6).map((s) => s.term),
    popularity: productPopularity(db.events, 30),
  }
}

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
