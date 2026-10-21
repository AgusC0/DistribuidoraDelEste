import { CATEGORIES_VERSION, createCategories } from '@/lib/seed'
import type { Category, Database, Product } from '@/lib/types'

/**
 * Actualización de las categorías de bases existentes a la estructura actual:
 * - migrateCategoryTree: desde la estructura original (Baño / Griferías / Agua y cañerías / Aberturas y techos).
 * - upgradeCategoryTree: desde versiones intermedias de la estructura nueva (una sola vez por versión).
 *
 * Los productos que no tienen una subcategoría segura NO van a una categoría inventada: quedan en el
 * rubro que corresponde (sin subcategoría) para revisarlos a mano desde el panel.
 */

/** Ids de la estructura anterior que dejan de existir o cambian de lugar. */
export const LEGACY_CATEGORY_IDS = new Set([
  'griferias',
  'agua-y-canerias',
  'aberturas-y-techos',
  'inodoros',
  'bidets',
  'mochilas-y-depositos',
  'lavatorios-y-bachas',
  'canillas-de-servicio',
  'canerias',
  'purificadores',
  'puertas-pvc',
])

const has = (p: Product, key: string, re: RegExp) => (p.attributes[key] ?? []).some((v) => re.test(v))

/** Nueva categoría de un producto según la categoría vieja, su tipo y su nombre. */
export function reclassify(p: Product): string {
  const name = p.name
  switch (p.categoryId) {
    case 'inodoros':
    case 'bidets':
    case 'mochilas-y-depositos':
      // Un kit de reparación es un repuesto, no un sanitario.
      return has(p, 'tipo', /repuesto/i) ? 'repuestos-sanitarios' : 'sanitarios'
    case 'lavatorios-y-bachas':
      if (has(p, 'tipo', /vanitory/i) || /vanitory/i.test(name)) return 'vanitory'
      if (has(p, 'material', /acero/i)) return 'bachas-de-acero'
      return 'bano' // lavatorios y bachas de loza: sin subcategoría segura
    case 'accesorios-bano':
      return has(p, 'tipo', /espejo/i) || /espejo/i.test(name) ? 'espejo' : 'accesorios-bano'
    case 'canillas-de-servicio':
      return has(p, 'tipo', /llave de paso|v[aá]lvula/i) ? 'accesorios-conduccion' : 'sistema-conduccion'
    case 'canerias':
      if (has(p, 'tipo', /tubo/i) || /^caño/i.test(name)) return 'canos'
      if (has(p, 'tipo', /herramienta|insumo/i) || !Object.keys(p.attributes).length) return 'sistema-conduccion'
      return 'accesorios-conduccion'
    case 'tanques-de-agua':
      return /bomba/i.test(name) ? 'bombas-de-agua' : 'tanques-de-agua'
    case 'termotanques':
      return has(p, 'tipo', /calef[oó]n/i) || /calef[oó]n/i.test(name) ? 'calefones' : 'termotanques'
    case 'purificadores':
      return 'filtros-de-agua'
    case 'puertas-pvc':
      return 'puertas-plegadizas'
    case 'claraboyas':
      return 'claraboyas'
    case 'griferias':
      return 'bano'
    case 'agua-y-canerias':
      return 'sistema-conduccion'
    case 'aberturas-y-techos':
      return isSkylight(p) ? 'claraboyas' : 'puertas-plegadizas'
    default:
      return p.categoryId
  }
}

const isSkylight = (p: Product) => has(p, 'tipo', /claraboya|domo/i) || /claraboya|domo/i.test(p.name)

export function reclassifyProducts(products: Product[]): Product[] {
  return products.map((p) => ({ ...p, categoryId: reclassify(p) }))
}

/** Padre nuevo para una categoría propia (creada a mano) que colgaba de una categoría vieja. */
const LEGACY_PARENT: Record<string, string | null> = {
  griferias: 'bano',
  'agua-y-canerias': 'sistema-conduccion',
  'aberturas-y-techos': 'bano',
  canerias: 'sistema-conduccion',
  purificadores: 'cocina',
  'lavatorios-y-bachas': 'bano',
  'canillas-de-servicio': 'sistema-conduccion',
  inodoros: 'sanitarios',
  bidets: 'sanitarios',
  'mochilas-y-depositos': 'sanitarios',
  'puertas-pvc': 'bano',
  claraboyas: 'bano',
}

/** Categorías por defecto que dejaron de existir → a dónde pasan sus productos. */
const REMOVED: Record<string, string | ((p: Product) => string)> = {
  'claraboya-y-puerta-plegable': (p) => (isSkylight(p) ? 'claraboyas' : 'puertas-plegadizas'),
  'bateas-de-acero': 'bachas-de-acero',
  'agua-gas-y-cloaca': 'sistema-conduccion',
  vastagos: 'repuestos-griferias',
  cocinas: 'anafes',
  bacha: 'cocina',
  'piletas-para-lavadero': 'cocina',
  'a-lena': 'calefaccion',
  'ladrillo-comun': 'construccion',
  revestimientos: 'construccion',
  ceramica: 'construccion',
  membranas: 'membrana-asfaltica',
}

/** Nombres por defecto anteriores: si una categoría conserva uno de estos, pasa al nombre actual. */
const PREVIOUS_NAMES: Record<string, string[]> = {
  'sistema-conduccion': ['Sistema conducción'],
  'repuestos-sanitarios': ['Rep. sanitarios'],
  'tanques-de-agua': ['Tanques de agua'],
  'puertas-plegadizas': ['Puertas plegadizas'],
  claraboyas: ['Claraboyas'],
  'tabla-inodoro': ['Tabla inodoro'],
  espejo: ['Espejo'],
  campanas: ['Campanas'],
  'filtros-de-agua': ['Filtro de agua'],
  termotanques: ['Termotanque'],
  cal: ['Cal'],
}

/** Descripciones por defecto anteriores de los rubros (si no se editaron, pasan a la actual). */
const PREVIOUS_DESCRIPTIONS = new Set([
  'Caños, conexiones y accesorios para agua, gas y cloaca, y tanques de agua.',
  'Agua + gas + cloaca: caños, accesorios y tanques de agua.',
  'Repuestos para griferías y sanitarios.',
  'Griferías, sanitarios, vanitorys y accesorios para renovar o construir tu baño.',
  'Cocinas, campanas, griferías, filtros de agua, bachas y piletas.',
  'Termotanques, calefones, calefactores, salamandras y bombas de agua.',
  'Materiales para obra: ladrillos, cemento, arena, cal y revestimientos.',
])

/**
 * Lleva una base con una versión anterior de la estructura nueva a la actual, una sola vez
 * (después se respetan los cambios hechos desde el panel, como el orden):
 * 1. Las categorías por defecto que ya no existen pasan sus productos (y subcategorías propias) a su reemplazo.
 * 2. Se agregan las categorías nuevas y las existentes se ubican según la estructura (rubro y orden).
 * 3. Nombres y descripciones se actualizan sólo si conservan el texto por defecto anterior: lo editado se respeta.
 */
export function upgradeCategoryTree(db: Database) {
  if ((db.categoriesVersion ?? 1) >= CATEGORIES_VERSION) return
  const find = (id: string) => db.categories.find((c) => c.id === id)

  for (const [oldId, target] of Object.entries(REMOVED)) {
    const old = find(oldId)
    if (!old) continue
    for (const p of db.products) if (p.categoryId === oldId) p.categoryId = typeof target === 'function' ? target(p) : target
    for (const c of db.categories) if (c.parentId === oldId) c.parentId = old.parentId
    db.categories = db.categories.filter((c) => c.id !== oldId)
  }

  for (const f of createCategories()) {
    const c = find(f.id)
    if (!c) {
      db.categories.push({ ...f })
      continue
    }
    c.parentId = f.parentId
    c.order = f.order
    if (PREVIOUS_NAMES[f.id]?.includes(c.name)) {
      c.name = f.name
      c.description = f.description
      c.filters = f.filters
    }
    if (!f.parentId && PREVIOUS_DESCRIPTIONS.has(c.description)) c.description = f.description
    if (!c.brands?.length) c.brands = f.brands
  }
  db.categoriesVersion = CATEGORIES_VERSION
}

/** ¿La base todavía tiene la estructura anterior? */
export function hasLegacyCategories(db: Database) {
  return db.categories.some((c) => LEGACY_CATEGORY_IDS.has(c.id)) && !db.categories.some((c) => c.id === 'sistema-conduccion')
}

/**
 * Migra una base con la estructura anterior: pone las categorías nuevas, reclasifica los productos
 * y conserva las categorías creadas a mano (colgándolas del rubro nuevo que corresponde).
 * De las categorías que siguen existiendo se conserva la descripción si se había editado.
 */
export function migrateCategoryTree(db: Database) {
  const fresh = createCategories()
  const freshIds = new Set(fresh.map((c) => c.id))
  const previous = new Map(db.categories.map((c) => [c.id, c]))

  const categories: Category[] = fresh.map((c) => {
    const old = previous.get(c.id)
    return old?.description && old.parentId === c.parentId ? { ...c, description: old.description } : c
  })
  for (const c of db.categories) {
    if (freshIds.has(c.id) || LEGACY_CATEGORY_IDS.has(c.id)) continue
    const parentId = c.parentId ? (freshIds.has(c.parentId) ? c.parentId : (LEGACY_PARENT[c.parentId] ?? null)) : null
    categories.push({ ...c, parentId })
  }
  db.categories = categories
  db.products = reclassifyProducts(db.products)
  db.categoriesVersion = CATEGORIES_VERSION
}
