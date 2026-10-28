import type { Category } from '@/lib/types'

/**
 * Contenido SEO por categoría: título para Google y texto local que se muestra debajo de los productos.
 * Cada categoría compite por su búsqueda ("termotanques villa maria", "claraboyas villa maria"…), así que
 * el título va corto (Google muestra ~60 caracteres) con la palabra clave primero, y el texto suma
 * sinónimos reales de cómo busca la gente (ej: puertas "corredizas"). Desde el panel se puede reemplazar
 * por categoría (campos "Título para Google" y "Texto para Google").
 * Sólo afirmaciones verdaderas del negocio: local en Villa María, asesoramiento y presupuesto por WhatsApp.
 */
type SeoEntry = {
  /** Título sin el nombre del negocio (se agrega solo). */
  title?: string
  /** Párrafos del texto local. */
  text?: string[]
  /** Sinónimos y búsquedas relacionadas: suman al buscador del sitio y al texto. */
  keywords?: string[]
}

export const CATEGORY_SEO: Record<string, SeoEntry> = {
  'sistema-conduccion': {
    title: 'Caños para agua, gas y cloaca en Villa María',
    text: [
      'Todo para instalaciones de agua, gas y cloaca en Villa María: caños de termofusión, epoxi, PVC y polietileno, conexiones y accesorios, tanques y bombas de agua.',
      'Trabajamos con las marcas que eligen los instaladores de la zona y te asesoramos para que compres la medida y el sistema correctos para tu obra.',
    ],
    keywords: ['cañerías', 'plomería', 'termofusión', 'desagüe', 'instalación de gas'],
  },
  canos: {
    title: 'Caños de termofusión, epoxi y PVC en Villa María',
    text: [
      'Caños para agua fría y caliente, gas y desagües en Villa María: termofusión, epoxi, PVC y polietileno, en las medidas más usadas en obra.',
    ],
    keywords: ['caños de agua', 'caños para gas', 'tubos', 'cañerías'],
  },
  'accesorios-conduccion': {
    title: 'Accesorios para cañerías en Villa María',
    text: ['Codos, tees, cuplas, uniones, llaves de paso y conexiones para terminar tu instalación de agua, gas o cloaca.'],
    keywords: ['conexiones', 'codos', 'llaves de paso', 'termofusión'],
  },
  'tanques-de-agua': {
    title: 'Tanques de agua en Villa María',
    text: [
      'Tanques de agua tricapa, bicapa y de acero inoxidable en Villa María, con sus accesorios: flotantes, kits de instalación y más.',
      'Te ayudamos a elegir la capacidad según cuántas personas viven en la casa.',
    ],
    keywords: ['tanque de agua', 'tanque tricapa', 'cisterna', 'tinaco'],
  },
  'bombas-de-agua': {
    text: ['Bombas presurizadoras y elevadoras de agua en Villa María, para mejorar la presión en duchas y canillas o subir agua al tanque.'],
    keywords: ['bomba presurizadora', 'bomba elevadora', 'presión de agua'],
  },
  'repuestos-sanitarios': {
    text: [
      'Repuestos sanitarios en Villa María: mecanismos de mochila, flotantes, válvulas, asientos y piezas para inodoros, bidets y depósitos.',
      'Traé la pieza vieja o una foto y te ayudamos a encontrar el repuesto justo.',
    ],
    keywords: ['repuestos de inodoro', 'mecanismo de mochila', 'flotante', 'válvula de descarga'],
  },
  'repuestos-griferias': {
    title: 'Repuestos de griferías en Villa María',
    text: [
      'Repuestos para griferías en Villa María: vástagos, cartuchos, cabezales, aireadores y piezas para monocomandos y canillas.',
      'Traé la pieza o una foto de la grifería y te decimos cuál es el repuesto que corresponde.',
    ],
    keywords: ['vástagos', 'cartuchos', 'cueritos', 'repuestos de canillas'],
  },
  bano: {
    title: 'Sanitarios y griferías para baño en Villa María',
    text: [
      'Todo para el baño en Villa María: griferías, inodoros, bidets, mochilas, vanitorys, espejos, botiquines, tablas de inodoro y accesorios.',
      'Armá tu baño completo con la misma línea y pedí el presupuesto por WhatsApp.',
    ],
    keywords: ['artículos de baño', 'sanitarios', 'griferías de baño'],
  },
  'griferias-de-bano': {
    text: ['Griferías para baño en Villa María: monocomandos de lavatorio, juegos de ducha y de bidet, en cromo, negro y otros acabados.'],
    keywords: ['canillas de baño', 'monocomando', 'juego de ducha'],
  },
  sanitarios: {
    title: 'Sanitarios en Villa María: inodoros y bidets',
    text: [
      'Sanitarios en Villa María: inodoros, bidets, mochilas y depósitos de loza, por línea completa para que combinen en tu baño.',
    ],
    keywords: ['inodoros', 'bidets', 'mochilas', 'loza sanitaria'],
  },
  'accesorios-bano': {
    text: ['Accesorios para baño en Villa María: toalleros, portarrollos, jaboneras, percheros y barrales, en distintos acabados.'],
    keywords: ['toallero', 'portarrollos', 'accesorios de baño'],
  },
  'puertas-plegadizas': {
    title: 'Puertas plegadizas en Villa María',
    text: [
      'Puertas plegadizas de PVC en Villa María, también conocidas como puertas corredizas o plegables: ideales para baños, placares y ambientes donde no entra una puerta de abrir.',
      'Consultá medidas y colores, y te pasamos el presupuesto por WhatsApp.',
    ],
    keywords: ['puertas corredizas', 'puertas plegables', 'puertas de PVC', 'puerta plegadiza'],
  },
  claraboyas: {
    title: 'Claraboyas en Villa María',
    text: [
      'Claraboyas y domos en Villa María para iluminar con luz natural baños, pasillos y ambientes sin ventanas, en distintas medidas para techos de losa y chapa.',
      'Te asesoramos sobre la medida y la colocación según tu techo.',
    ],
    keywords: ['claraboya', 'domo', 'tragaluz', 'luz cenital'],
  },
  'tabla-inodoro': {
    title: 'Tablas de inodoro en Villa María',
    text: ['Tablas de inodoro de madera y plásticas en Villa María, para las líneas de inodoro más comunes.'],
    keywords: ['asiento de inodoro', 'tapa de inodoro'],
  },
  vanitory: {
    title: 'Vanitorys en Villa María',
    text: ['Vanitorys de pie y suspendidos con bacha en Villa María, en distintas medidas para aprovechar el espacio de tu baño.'],
    keywords: ['mueble de baño', 'vanitory con bacha'],
  },
  cocina: {
    title: 'Bachas y griferías de cocina en Villa María',
    text: [
      'Todo para la cocina y el lavadero en Villa María: anafes, campanas, griferías, filtros purificadores, bachas de acero y piletas de lavadero.',
    ],
    keywords: ['bacha de cocina', 'pileta de cocina', 'grifería de cocina'],
  },
  anafes: {
    title: 'Anafes en Villa María',
    keywords: ['anafe a gas', 'cocina empotrable'],
  },
  'filtros-de-agua': {
    title: 'Filtros purificadores de agua en Villa María',
    text: ['Filtros y purificadores de agua en Villa María para tomar y cocinar con agua más rica, bajo mesada o sobre la canilla.'],
    keywords: ['purificador de agua', 'filtro de agua'],
  },
  'bachas-de-acero': {
    text: ['Bachas de acero inoxidable simples y dobles en Villa María, para cocina, en las medidas más usadas.'],
    keywords: ['pileta de acero', 'bacha de cocina'],
  },
  calefaccion: {
    title: 'Termotanques y calefacción en Villa María',
    text: [
      'Termotanques, calefones, calefactores, salamandras y estufas de fundición en Villa María.',
      'Te ayudamos a elegir el equipo según tu casa: tipo de gas, cantidad de personas y espacio disponible.',
    ],
    keywords: ['calefacción', 'agua caliente', 'estufas'],
  },
  termotanques: {
    title: 'Termotanques en Villa María',
    text: [
      'Termotanques a gas, eléctricos y solares en Villa María, de las principales marcas y en todas las capacidades.',
      'Te asesoramos para elegir los litros según cuántas personas viven en la casa y el tipo de gas o instalación que tenés, y te pasamos el presupuesto por WhatsApp.',
    ],
    keywords: ['termotanque a gas', 'termotanque eléctrico', 'termotanque solar', 'agua caliente'],
  },
  calefones: {
    title: 'Calefones en Villa María',
    keywords: ['calefón a gas', 'agua caliente'],
  },
  calefactores: { title: 'Calefactores en Villa María', keywords: ['calefactor a gas', 'estufa a gas'] },
  salamandras: { title: 'Salamandras en Villa María', keywords: ['salamandra a leña', 'estufa a leña'] },
  'estufas-de-fundicion': { title: 'Estufas de fundición en Villa María', keywords: ['estufa a leña', 'estufa de hierro'] },
  construccion: {
    title: 'Materiales de construcción en Villa María',
    text: [
      'Materiales para la construcción en Villa María: arena, cemento, cal, pegamento cerámico, pastinas, hidrófugos e impermeabilizantes y membranas asfálticas.',
      'Además de sanitarios y conducción de agua, tenés todo para tu obra o reforma en un solo lugar.',
    ],
    keywords: ['materiales para la construcción', 'materiales de obra', 'materiales para reformas'],
  },
  cal: { title: 'Cal Hercal en Villa María', keywords: ['cal hidráulica', 'cal'] },
  sika: { title: 'Productos Sika en Villa María', keywords: ['impermeabilizantes', 'aditivos'] },
  protex: { title: 'Productos Protex en Villa María', keywords: ['impermeabilizantes'] },
  ceresita: { title: 'Ceresita en Villa María', keywords: ['hidrófugo', 'impermeabilizante'] },
}

const list = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items.at(-1)}` : (items[0] ?? ''))

/** Título para Google (sin el nombre del negocio): el editado en el panel, el definido acá o "Nombre en Villa María". */
export function categorySeoTitle(category: Category, categories: Category[]) {
  if (category.seoTitle?.trim()) return category.seoTitle.trim()
  if (CATEGORY_SEO[category.id]?.title) return CATEGORY_SEO[category.id].title!
  // Si otra categoría se llama igual (Griferías de Baño y de Cocina), se aclara el rubro para no repetir títulos.
  const parent = categories.find((c) => c.id === category.parentId)
  const repeated = parent && categories.some((c) => c.id !== category.id && c.name === category.name)
  return `${category.name}${repeated ? ` de ${parent.name.toLowerCase()}` : ''} en Villa María`
}

/** Párrafos del texto local de la categoría (el del panel, el de acá o uno armado con sus marcas). */
export function categorySeoText(category: Category, categories: Category[], brands: string[], address: string): string[] {
  if (category.seoText?.trim()) return category.seoText.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const base = CATEGORY_SEO[category.id]?.text ?? [
    `${categorySeoTitle(category, categories)}: ${category.description ? category.description.charAt(0).toLowerCase() + category.description.slice(1) : 'consultá modelos, medidas y disponibilidad.'}`,
  ]
  const shown = brands.slice(0, 6)
  return [
    ...base,
    ...(shown.length ? [`Trabajamos marcas como ${list(shown)}.`] : []),
    `Visitanos en ${address}, o armá tu pedido en la web y te pasamos el presupuesto por WhatsApp.`,
  ]
}

/** Sinónimos de búsqueda de la categoría (para el buscador del sitio). */
export const categoryKeywords = (id: string) => CATEGORY_SEO[id]?.keywords ?? []

/** Nombre corto para enlaces internos: el del título SEO sin la ciudad (si es simple) o el nombre. */
export function categoryLabel(category: Category, categories: Category[]) {
  const title = categorySeoTitle(category, categories)
  return title.endsWith(' en Villa María') && !title.includes(':') ? title.slice(0, -' en Villa María'.length) : category.name
}

/** Recorta un texto para la descripción de Google (~160 caracteres) sin cortar palabras. */
export function clip(text: string, max: number) {
  if (text.length <= max) return text
  const cut = text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[,:;.]$/, '')
  return `${cut}…`
}
