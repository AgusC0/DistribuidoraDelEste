import { createCategories } from '@/lib/seed'
import type { Category, Database, Product } from '@/lib/types'

/**
 * Paso de la estructura de categorías anterior (Baño / Griferías / Agua y cañerías / Aberturas y techos)
 * a la actual (Sistema conducción / Rep. sanitarios / Baño / Cocina / Calefacción / Construcción).
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
  'claraboyas',
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
      if (has(p, 'material', /acero/i)) return 'bateas-de-acero'
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
    case 'claraboyas':
      return 'claraboya-y-puerta-plegable'
    case 'griferias':
      return 'bano'
    case 'agua-y-canerias':
      return 'sistema-conduccion'
    case 'aberturas-y-techos':
      return 'claraboya-y-puerta-plegable'
    default:
      return p.categoryId
  }
}

/** Completa el tipo de las claraboyas y puertas, que ahora comparten subcategoría y se filtran por tipo. */
function completeType(p: Product): Product {
  if (p.categoryId !== 'claraboya-y-puerta-plegable' || p.attributes.tipo?.length) return p
  const tipo = /claraboya|domo/i.test(p.name) ? 'Claraboya' : /puerta|cerradura/i.test(p.name) ? 'Plegadiza' : null
  return tipo ? { ...p, attributes: { ...p.attributes, tipo: [tipo] } } : p
}

export function reclassifyProducts(products: Product[]): Product[] {
  return products.map((p) => completeType({ ...p, categoryId: reclassify(p) }))
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

/** Bases que ya tenían la estructura nueva con el nombre abreviado: se pasa al nombre comercial. */
export function renameAbbreviatedCategories(db: Database) {
  const rep = db.categories.find((c) => c.id === 'repuestos-sanitarios')
  if (rep?.name === 'Rep. sanitarios') rep.name = 'Repuestos sanitarios'
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
}
