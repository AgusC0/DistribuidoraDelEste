'use server'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { checkCredentials, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { applyImport, type ImportMode, type ImportResult } from '@/lib/catalog-io'
import { parseCsv } from '@/lib/csv'
import { sendTestEmail } from '@/lib/notify'
import { mutateDb, newId, readDb, UPLOADS_DIR } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { slugify } from '@/lib/site'
import type { Database, LeadStatus, Product, Settings, StockStatus, Variant, WeeklyHours } from '@/lib/types'

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

  const variants: Variant[] = parseJson<Partial<Variant>[]>(fd.get('variants'), [])
    .filter((v) => typeof v.name === 'string' && v.name.trim())
    .slice(0, 40)
    .map((v) => ({
      id: typeof v.id === 'string' && v.id ? v.id.slice(0, 40) : newId('v_'),
      name: String(v.name).trim().slice(0, 80),
      price: typeof v.price === 'number' && Number.isFinite(v.price) && v.price >= 0 ? Math.round(v.price) : null,
      stock: isStock(v.stock) ? v.stock : 'disponible',
    }))

  if (Object.keys(errors).length) return { errors, message: 'Revisá los campos marcados.' }

  const stock = isStock(str(fd, 'stock')) ? (str(fd, 'stock') as StockStatus) : 'disponible'

  const savedId = await mutateDb((db) => {
    const now = new Date().toISOString()
    const data = {
      name,
      categoryId,
      description: str(fd, 'description', 1000),
      price: priceRaw ? Number(priceRaw) : null,
      promo: fd.get('promo') === 'on',
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

/** Ajuste masivo de precios por porcentaje (p. ej. +8% por inflación). */
export async function adjustPrices(ids: string[], percent: number) {
  await requireAdmin()
  if (!Number.isFinite(percent) || percent < -90 || percent > 500) return
  await mutateDb((db) => {
    const now = new Date().toISOString()
    for (const p of db.products) {
      if (ids.includes(p.id) && p.price != null) {
        p.price = Math.round((p.price * (1 + percent / 100)) / 10) * 10
        p.updatedAt = now
      }
    }
  })
  refreshSite()
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
  if (file.size > 2 * 1024 * 1024) return { message: 'La planilla supera los 2 MB.' }
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
  const result = await mutateDb((db): FormState => {
    const slug = slugify(name)
    if (db.categories.some((c) => c.slug === slug && c.id !== id)) {
      return { errors: { name: 'Ya existe una categoría con ese nombre.' } }
    }
    const existing = db.categories.find((c) => c.id === id)
    if (existing) {
      existing.name = name
      existing.slug = slug
      existing.description = str(fd, 'description', 200)
    } else {
      db.categories.push({
        id: slug,
        name,
        slug,
        description: str(fd, 'description', 200),
        order: db.categories.length,
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
    const list = [...db.categories].sort((a, b) => a.order - b.order)
    const i = list.findIndex((c) => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    list.forEach((c, order) => (c.order = order))
    db.categories = list
  })
  refreshSite()
}

export async function deleteCategory(id: string): Promise<FormState> {
  await requireAdmin()
  const result = await mutateDb((db): FormState => {
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
    db.events = Array.isArray(data.events) ? data.events : []
  })
  refreshSite()
  return { ok: true, message: 'Respaldo restaurado.' }
}
