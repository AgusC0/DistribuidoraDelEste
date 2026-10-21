import { buildVariants, EMPTY_PROMOTION } from '@/lib/catalog'
import { slugify } from '@/lib/site'
import type { Product, ProductOption, ProductSpec, Promotion, StockStatus } from '@/lib/types'

/**
 * Más productos de DEMOSTRACIÓN (unos 150) para probar el sitio con un catálogo de tamaño real:
 * filtros, búsqueda, paginación, promociones, variantes, stock y fichas incompletas.
 * Marcas reales del rubro con precios, códigos y medidas de ejemplo. Es determinístico:
 * cargarlo dos veces da el mismo catálogo.
 */
export function createExtraDemoProducts(): Product[] {
  const DAY = 86_400_000
  const now = Date.now()
  const inDays = (n: number) => new Date(now + n * DAY).toISOString().slice(0, 10)
  const IMG = {
    bano: '/images/hero-bathroom.png',
    griferia: '/images/monocomando-cocina.png',
    canerias: '/images/canerias.png',
    termo: '/images/termotanque.png',
    purificador: '/images/purificador-max.png',
    purificador2: '/images/purificador-essential.png',
    puerta: '/images/puerta-pvc.png',
    claraboya: '/images/claraboya.png',
    // Sin foto a propósito: sirve para probar "Fichas incompletas".
    none: '/placeholder.svg',
  }
  const spec = (rows: [string, string][]): ProductSpec[] => rows.map(([label, value]) => ({ label, value }))
  const round = (n: number) => Math.round(n / 100) * 100

  type Variation = { option: string; values: string[]; prices: number[]; stock?: (StockStatus | undefined)[] }
  type Def = {
    name: string
    category: string
    brand: string
    price: number | null
    image: string
    attributes: Record<string, string[]>
    sku: string
    short?: string
    description?: string
    specs?: [string, string][]
    variation?: Variation
    /** % de descuento: el precio de lista se calcula a partir del precio promocional. */
    promo?: { percent: number; endsInDays?: number; limitedStock?: boolean }
    stock?: StockStatus
    featured?: boolean
    hidden?: boolean
    tags?: string[]
  }

  const products: Product[] = []
  const used = new Set<string>()

  const add = (d: Def) => {
    let slug = slugify(`${d.name} ${d.brand}`)
    for (let n = 2; used.has(slug); n++) slug = `${slugify(`${d.name} ${d.brand}`)}-${n}`
    used.add(slug)
    const i = products.length
    const options: ProductOption[] = d.variation ? [{ name: d.variation.option, values: d.variation.values }] : []
    const pct = d.promo?.percent ?? 0
    const listOf = (price: number) => (pct ? round(price / (1 - pct / 100)) : null)
    const variants = d.variation
      ? buildVariants(`x${i}`, options, d.variation.values.map((value, k) => ({
          values: [value],
          sku: `${d.sku}-${slugify(value).toUpperCase().replace(/-/g, '')}`,
          price: d.variation!.prices[k],
          originalPrice: pct ? listOf(d.variation!.prices[k]) : null,
          stock: d.variation!.stock?.[k] ?? 'disponible',
        })))
      : []
    const promotion: Promotion = d.promo
      ? {
          ...EMPTY_PROMOTION,
          originalPrice: !d.variation && d.price != null ? listOf(d.price) : null,
          discountPercent: pct,
          endsAt: d.promo.endsInDays != null ? inDays(d.promo.endsInDays) : null,
          limitedStock: !!d.promo.limitedStock,
        }
      : { ...EMPTY_PROMOTION }
    // Fechas de alta escalonadas para que "Más nuevos" y "Novedades" tengan sentido.
    const created = new Date(now - (i % 90) * DAY - i * 60_000).toISOString()
    products.push({
      id: `demo-x-${slug}`,
      slug,
      name: d.name,
      categoryId: d.category,
      description:
        d.description ??
        `${d.name} marca ${d.brand}. ${d.short ?? ''} Consultá disponibilidad, colores y medidas por WhatsApp. Producto de ejemplo del catálogo de demostración.`.replace(
          /\s+/g,
          ' ',
        ),
      price: d.price,
      promo: !!d.promo,
      promotion,
      brand: d.brand,
      attributes: d.attributes,
      sku: d.sku,
      shortDescription: d.short ?? '',
      specs: spec(d.specs ?? []),
      options,
      related: [],
      featured: !!d.featured,
      active: !d.hidden,
      stock: d.stock ?? 'disponible',
      image: d.image,
      images: d.image === IMG.none ? [] : [d.image],
      variants,
      tags: d.tags ?? [],
      createdAt: created,
      updatedAt: created,
    })
  }

  /* ---------- Sanitarios: líneas completas (inodoro, bidet, mochila) ---------- */
  const lines: { brand: string; line: string; base: number; colors: string[]; promo?: number; featured?: boolean }[] = [
    { brand: 'Ferrum', line: 'Andina', base: 98000, colors: ['Blanco', 'Hueso'] },
    { brand: 'Ferrum', line: 'Marina', base: 112000, colors: ['Blanco'], promo: 12 },
    { brand: 'Ferrum', line: 'Espacio', base: 168000, colors: ['Blanco', 'Negro mate'], featured: true },
    { brand: 'Ferrum', line: 'Avignon', base: 189000, colors: ['Blanco'] },
    { brand: 'Roca', line: 'Mónaco', base: 121000, colors: ['Blanco', 'Pergamon'], promo: 10 },
    { brand: 'Roca', line: 'Dama', base: 154000, colors: ['Blanco'] },
    { brand: 'Roca', line: 'Victoria', base: 92000, colors: ['Blanco'] },
    { brand: 'Deca', line: 'Riviera', base: 134000, colors: ['Blanco', 'Gris'] },
  ]
  lines.forEach((l, k) => {
    const colorVar = (base: number): Variation | undefined =>
      l.colors.length > 1 ? { option: 'Color', values: l.colors, prices: l.colors.map((_, c) => round(base * (1 + c * 0.12))) } : undefined
    const attrs = (tipo: string, sistema: string, instalacion: string) => ({
      tipo: [tipo],
      linea: [l.line],
      color: l.colors,
      sistema: [sistema],
      instalacion: [instalacion],
    })
    const code = `${l.brand.slice(0, 2).toUpperCase()}-${slugify(l.line).slice(0, 3).toUpperCase()}`
    add({
      name: `Inodoro largo ${l.line}`,
      category: 'inodoros',
      brand: l.brand,
      price: l.base,
      image: IMG.bano,
      attributes: attrs('Inodoro largo', 'Mochila de apoyo', 'Al piso'),
      sku: `${code}-IL`,
      short: `Inodoro largo de loza vitrificada, línea ${l.line}.`,
      specs: [
        ['Material', 'Loza vitrificada'],
        ['Descarga', 'Vertical'],
        ['Distancia de la pared', '23 cm'],
        ['Garantía', '10 años'],
      ],
      variation: colorVar(l.base),
      promo: l.promo ? { percent: l.promo, endsInDays: 6 + k } : undefined,
      featured: l.featured,
      tags: ['inodoro', 'sanitario', 'water'],
    })
    add({
      name: `Bidet ${l.line} 3 agujeros`,
      category: 'bidets',
      brand: l.brand,
      price: round(l.base * 0.72),
      image: IMG.bano,
      attributes: attrs('Bidet', 'Grifería de 3 agujeros', 'Al piso'),
      sku: `${code}-BD`,
      short: `Bidet de 3 agujeros para combinar con el inodoro ${l.line}.`,
      specs: [
        ['Material', 'Loza vitrificada'],
        ['Agujeros', '3'],
        ['Garantía', '10 años'],
      ],
      variation: colorVar(l.base * 0.72),
      stock: k === 3 ? 'bajo' : undefined,
    })
    add({
      name: `Mochila de apoyo ${l.line}`,
      category: 'mochilas-y-depositos',
      brand: l.brand,
      price: round(l.base * 0.68),
      image: k % 3 === 2 ? IMG.none : IMG.bano,
      attributes: attrs('Mochila', 'Doble descarga', 'De apoyo'),
      sku: `${code}-MO`,
      short: 'Mochila de apoyo con mecanismo de doble descarga 3/6 litros.',
      specs: [
        ['Descarga', 'Doble: 3 y 6 litros'],
        ['Mecanismo', 'Incluido'],
      ],
      stock: k === 5 ? 'sin_stock' : undefined,
    })
  })
  add({
    name: 'Inodoro con mochila incorporada Bari',
    category: 'inodoros',
    brand: 'Ferrum',
    price: 239000,
    image: IMG.bano,
    attributes: { tipo: ['Inodoro largo'], linea: ['Bari'], color: ['Blanco'], sistema: ['Mochila incorporada'], instalacion: ['Al piso'] },
    sku: 'FE-BAR-MI',
    short: 'Inodoro y mochila en una sola pieza, fácil de limpiar.',
    specs: [['Descarga', 'Doble: 3 y 6 litros'], ['Garantía', '10 años']],
    promo: { percent: 18, endsInDays: 3, limitedStock: true },
    featured: true,
  })
  add({
    name: 'Inodoro suspendido Espacio',
    category: 'inodoros',
    brand: 'Ferrum',
    price: 215000,
    image: IMG.bano,
    attributes: { tipo: ['Inodoro suspendido'], linea: ['Espacio'], color: ['Blanco'], sistema: ['Depósito de embutir'], instalacion: ['De colgar'] },
    sku: 'FE-ESP-SU',
    short: 'Inodoro de colgar para depósito de embutir. Requiere bastidor.',
    specs: [['Instalación', 'Suspendido en pared'], ['Garantía', '10 años']],
  })
  add({
    name: 'Depósito de embutir con bastidor',
    category: 'mochilas-y-depositos',
    brand: 'Roca',
    price: 265000,
    image: IMG.none,
    attributes: { tipo: ['Depósito de embutir'], sistema: ['Doble descarga'], instalacion: ['De embutir'] },
    sku: 'RO-DEP-BAS',
    short: 'Depósito para inodoro suspendido, con estructura metálica.',
  })
  add({
    name: 'Kit de reparación para mochila',
    category: 'mochilas-y-depositos',
    brand: 'IDEAL',
    price: 18500,
    image: IMG.none,
    attributes: { tipo: ['Repuesto'] },
    sku: 'ID-KIT-MO',
    short: 'Válvula de entrada y descarga universal.',
    tags: ['repuesto', 'flotante', 'valvula'],
  })

  /* ---------- Lavatorios y bachas ---------- */
  ;[
    { name: 'Lavatorio con pedestal Andina', brand: 'Ferrum', price: 76000, tipo: 'Con pedestal', material: 'Loza', medida: ['55 cm'], inst: 'Al piso' },
    { name: 'Lavatorio con pedestal Mónaco', brand: 'Roca', price: 89000, tipo: 'Con pedestal', material: 'Loza', medida: ['56 cm'], inst: 'Al piso' },
    { name: 'Bacha de apoyo redonda', brand: 'Ferrum', price: 58000, tipo: 'De apoyo', material: 'Loza', medida: ['40 cm', '45 cm'], inst: 'Sobre mesada', promo: 15 },
    { name: 'Bacha de apoyo rectangular', brand: 'Roca', price: 69000, tipo: 'De apoyo', material: 'Loza', medida: ['50 cm', '60 cm'], inst: 'Sobre mesada' },
    { name: 'Bacha de embutir oval', brand: 'Deca', price: 42000, tipo: 'De embutir', material: 'Loza', medida: ['42 cm'], inst: 'Bajo mesada' },
    { name: 'Bacha de acero inoxidable simple', brand: 'Johnson', price: 54000, tipo: 'De cocina', material: 'Acero inoxidable', medida: ['52 cm', '60 cm'], inst: 'De embutir', featured: true },
    { name: 'Bacha de acero inoxidable doble', brand: 'Johnson', price: 98000, tipo: 'De cocina', material: 'Acero inoxidable', medida: ['74 cm', '80 cm'], inst: 'De embutir' },
    { name: 'Vanitory con bacha 60 cm', brand: 'Mosconi', price: 189000, tipo: 'Vanitory', material: 'Melamina', medida: ['60 cm'], inst: 'Al piso', stock: 'bajo' as StockStatus },
    { name: 'Vanitory suspendido 80 cm', brand: 'Mosconi', price: 245000, tipo: 'Vanitory', material: 'Melamina', medida: ['80 cm'], inst: 'Suspendido' },
    { name: 'Lavatorio de colgar compacto', brand: 'Ferrum', price: 39000, tipo: 'De colgar', material: 'Loza', medida: ['40 cm'], inst: 'De colgar' },
  ].forEach((b, k) =>
    add({
      name: b.name,
      category: 'lavatorios-y-bachas',
      brand: b.brand,
      price: b.price,
      image: k === 8 ? IMG.none : IMG.bano,
      attributes: { tipo: [b.tipo], material: [b.material], medida: b.medida, instalacion: [b.inst] },
      sku: `${b.brand.slice(0, 2).toUpperCase()}-LB${k + 1}`,
      short: `${b.tipo} de ${b.material.toLowerCase()}.`,
      specs: [['Material', b.material], ['Instalación', b.inst]],
      variation: b.medida.length > 1 ? { option: 'Medida', values: b.medida, prices: b.medida.map((_, m) => round(b.price * (1 + m * 0.18))) } : undefined,
      promo: b.promo ? { percent: b.promo, endsInDays: 12 } : undefined,
      featured: b.featured,
      stock: b.stock,
      tags: ['bacha', 'pileta', 'lavamanos'],
    }),
  )

  /* ---------- Accesorios para baño ---------- */
  const accesorios: [string, number, string][] = [
    ['Toallero barral 60 cm', 21500, 'Toallero'],
    ['Toallero argolla', 12800, 'Toallero'],
    ['Portarrollos con tapa', 11900, 'Portarrollos'],
    ['Jabonera de pared', 9800, 'Jabonera'],
    ['Percha doble', 7600, 'Percha'],
    ['Portacepillos', 8900, 'Portacepillos'],
    ['Kit de accesorios 5 piezas', 54000, 'Kit'],
    ['Espejo rectangular 60 x 80', 46000, 'Espejo'],
    ['Repisa de vidrio 50 cm', 15900, 'Repisa'],
    ['Barral para cortina extensible', 18700, 'Barral'],
    ['Agarradera de seguridad 40 cm', 24500, 'Agarradera'],
    ['Dispenser de jabón líquido', 13900, 'Dispenser'],
  ]
  accesorios.forEach(([name, price, tipo], k) => {
    const brand = ['FV', 'Peirano', 'Hidromet'][k % 3]
    const colors = tipo === 'Espejo' || tipo === 'Repisa' ? [] : ['Cromo', 'Negro mate', 'Acero satinado']
    add({
      name: `${name} ${brand === 'FV' ? 'Libby' : brand === 'Peirano' ? 'Celta' : 'Prisma'}`,
      category: 'accesorios-bano',
      brand,
      price,
      image: k % 4 === 3 ? IMG.none : IMG.griferia,
      attributes: { tipo: [tipo], material: [tipo === 'Espejo' ? 'Vidrio' : 'Bronce cromado'], color: colors.length ? colors : ['Transparente'] },
      sku: `${brand.slice(0, 2).toUpperCase()}-AC${k + 1}`,
      short: `${tipo} para baño, terminación de primera calidad.`,
      variation: colors.length ? { option: 'Color', values: colors, prices: colors.map((_, c) => round(price * (1 + c * 0.15))) } : undefined,
      promo: k === 6 ? { percent: 20, endsInDays: 5, limitedStock: true } : undefined,
      hidden: k === 11,
    })
  })

  /* ---------- Griferías de baño y cocina ---------- */
  const griferias: { name: string; cat: string; brand: string; line: string; price: number; tipo: string; inst: string; promo?: number; featured?: boolean }[] = [
    { name: 'Monocomando para lavatorio Arizona', cat: 'griferias-de-bano', brand: 'FV', line: 'Arizona', price: 72000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada' },
    { name: 'Juego para bidet Arizona', cat: 'griferias-de-bano', brand: 'FV', line: 'Arizona', price: 81000, tipo: 'Juego de bidet', inst: 'Sobre loza' },
    { name: 'Juego para ducha Arizona con transferencia', cat: 'griferias-de-bano', brand: 'FV', line: 'Arizona', price: 118000, tipo: 'Juego de ducha', inst: 'De embutir', promo: 15 },
    { name: 'Monocomando para lavatorio Puelo', cat: 'griferias-de-bano', brand: 'FV', line: 'Puelo', price: 58000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada' },
    { name: 'Juego para ducha Puelo', cat: 'griferias-de-bano', brand: 'FV', line: 'Puelo', price: 86000, tipo: 'Juego de ducha', inst: 'De embutir' },
    { name: 'Monocomando para lavatorio Kansas', cat: 'griferias-de-bano', brand: 'FV', line: 'Kansas', price: 94000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada', featured: true },
    { name: 'Monocomando para lavatorio Celta', cat: 'griferias-de-bano', brand: 'Peirano', line: 'Celta', price: 61000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada' },
    { name: 'Juego para ducha Celta', cat: 'griferias-de-bano', brand: 'Peirano', line: 'Celta', price: 79000, tipo: 'Juego de ducha', inst: 'De embutir', promo: 10 },
    { name: 'Monocomando para lavatorio Bali', cat: 'griferias-de-bano', brand: 'Peirano', line: 'Bali', price: 67000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada' },
    { name: 'Monocomando para lavatorio alto Aris', cat: 'griferias-de-bano', brand: 'Piazza', line: 'Aris', price: 89000, tipo: 'Monocomando lavatorio', inst: 'Sobre mesada' },
    { name: 'Flor de ducha cuadrada 20 cm', cat: 'griferias-de-bano', brand: 'Hidromet', line: 'Prisma', price: 34000, tipo: 'Flor de ducha', inst: 'De pared' },
    { name: 'Ducha de mano con flexible', cat: 'griferias-de-bano', brand: 'Hidromet', line: 'Prisma', price: 21000, tipo: 'Ducha de mano', inst: 'De pared' },
    { name: 'Columna de ducha con monocomando', cat: 'griferias-de-bano', brand: 'Piazza', line: 'Aris', price: 245000, tipo: 'Columna de ducha', inst: 'De pared', promo: 22 },
    { name: 'Monocomando de cocina Puelo', cat: 'griferias-de-cocina', brand: 'FV', line: 'Puelo', price: 69000, tipo: 'Monocomando cocina', inst: 'Sobre mesada' },
    { name: 'Monocomando de cocina con ducha extraíble', cat: 'griferias-de-cocina', brand: 'FV', line: 'Kansas', price: 132000, tipo: 'Monocomando cocina', inst: 'Sobre mesada', featured: true },
    { name: 'Monocomando de cocina Celta', cat: 'griferias-de-cocina', brand: 'Peirano', line: 'Celta', price: 64000, tipo: 'Monocomando cocina', inst: 'Sobre mesada', promo: 12 },
    { name: 'Canilla de cocina de pared', cat: 'griferias-de-cocina', brand: 'Hidromet', line: 'Clásica', price: 28000, tipo: 'Canilla de pared', inst: 'De pared' },
    { name: 'Juego de cocina de mesada', cat: 'griferias-de-cocina', brand: 'Peirano', line: 'Bali', price: 54000, tipo: 'Juego de cocina', inst: 'Sobre mesada' },
    { name: 'Monocomando de cocina Aris', cat: 'griferias-de-cocina', brand: 'Piazza', line: 'Aris', price: 98000, tipo: 'Monocomando cocina', inst: 'Sobre mesada' },
    { name: 'Canilla filtro para purificador', cat: 'griferias-de-cocina', brand: 'Hidromet', line: 'Clásica', price: 19500, tipo: 'Canilla filtro', inst: 'Sobre mesada' },
  ]
  griferias.forEach((g, k) => {
    const colors = g.tipo.includes('Monocomando') ? ['Cromo', 'Negro mate', 'Oro cepillado'] : []
    add({
      name: g.name,
      category: g.cat,
      brand: g.brand,
      price: g.price,
      image: IMG.griferia,
      attributes: { tipo: [g.tipo], linea: [g.line], color: colors.length ? colors : ['Cromo'], material: ['Bronce'], instalacion: [g.inst] },
      sku: `${g.brand.slice(0, 2).toUpperCase()}-${slugify(g.line).slice(0, 3).toUpperCase()}-${k + 1}`,
      short: `${g.tipo}, línea ${g.line}. Cartucho cerámico.`,
      specs: [
        ['Material', 'Bronce'],
        ['Cartucho', 'Cerámico 35 mm'],
        ['Garantía', '5 años'],
      ],
      variation: colors.length ? { option: 'Color', values: colors, prices: [g.price, round(g.price * 1.25), round(g.price * 1.4)], stock: [undefined, undefined, k % 2 ? 'bajo' : 'sin_stock'] } : undefined,
      promo: g.promo ? { percent: g.promo, endsInDays: 4 + (k % 9) } : undefined,
      featured: g.featured,
      tags: ['griferia', 'canilla'],
    })
  })

  /* ---------- Canillas de servicio ---------- */
  ;[
    ['Canilla para lavarropas', 8900, 'Lavarropas'],
    ['Canilla esférica para jardín', 7400, 'Jardín'],
    ['Canilla con pico para manguera', 9900, 'Jardín'],
    ['Llave de paso esférica', 6800, 'Llave de paso'],
    ['Canilla de servicio cromada', 12500, 'Lavadero'],
    ['Canilla temporizada', 38000, 'Temporizada'],
    ['Canilla de pared para lavadero', 14800, 'Lavadero'],
    ['Válvula de retención', 11200, 'Válvula'],
  ].forEach(([name, price, tipo], k) =>
    add({
      name: name as string,
      category: 'canillas-de-servicio',
      brand: ['Hidromet', 'FV', 'Peirano'][k % 3],
      price: price as number,
      image: k % 3 === 1 ? IMG.none : IMG.griferia,
      attributes: { tipo: [tipo as string], material: ['Bronce'], instalacion: ['De pared'] },
      sku: `CS-${k + 1}`,
      variation: { option: 'Medida', values: ['1/2"', '3/4"'], prices: [price as number, round((price as number) * 1.3)] },
      stock: k === 5 ? 'bajo' : undefined,
    }),
  )

  /* ---------- Cañerías ---------- */
  const termofusion = { option: 'Medida', values: ['20 mm', '25 mm', '32 mm'] }
  ;[
    ['Codo 45° termofusión', 'Codo', 'Saladillo', [720, 980, 1450]],
    ['Cupla termofusión', 'Cupla', 'Saladillo', [480, 650, 990]],
    ['Tee reducción termofusión', 'Tee', 'Acqua System', [1350, 1720, 2400]],
    ['Buje de reducción termofusión', 'Buje', 'Acqua System', [520, 690, 1050]],
    ['Tapa termofusión', 'Tapa', 'Saladillo', [390, 520, 780]],
    ['Llave de paso termofusión', 'Llave de paso', 'Acqua System', [8900, 11800, 16500]],
    ['Curva termofusión', 'Curva', 'Saladillo', [1100, 1450, 2100]],
    ['Unión doble con rosca macho', 'Unión', 'Acqua System', [3900, 4800, 6900]],
    ['Adaptador rosca macho', 'Adaptador', 'Saladillo', [1500, 1950, 2900]],
    ['Termofusora 800 W con dados', 'Herramienta', 'Acqua System', null],
  ].forEach(([name, tipo, brand, prices], k) =>
    add({
      name: name as string,
      category: 'canerias',
      brand: brand as string,
      price: prices ? (prices as number[])[0] : 89000,
      image: IMG.canerias,
      attributes: { tipo: [tipo as string], material: ['Polipropileno'] },
      sku: `TF-${k + 1}`,
      short: 'Para instalaciones de agua fría y caliente por termofusión.',
      specs: [['Sistema', 'Termofusión'], ['Presión de trabajo', '20 bar a 20 °C'], ['Temperatura máxima', '95 °C']],
      variation: prices ? { ...termofusion, prices: prices as number[] } : undefined,
      promo: k === 5 ? { percent: 15, endsInDays: 9 } : k === 9 ? { percent: 10, limitedStock: true } : undefined,
      featured: k === 9,
      tags: ['termofusion', 'agua', 'conexion'],
    }),
  )
  const desague = { option: 'Medida', values: ['40 mm', '50 mm', '63 mm', '110 mm'] }
  ;[
    ['Ramal PVC desagüe 45°', 'Ramal', [1900, 2400, 3300, 6900]],
    ['Curva PVC desagüe 90°', 'Curva', [1300, 1700, 2500, 5200]],
    ['Cupla PVC desagüe', 'Cupla', [600, 800, 1200, 2600]],
    ['Tapa de inspección PVC', 'Tapa', [null, null, 4900, 7800]],
    ['Sifón PVC', 'Sifón', [3800, 4600, null, null]],
  ].forEach(([name, tipo, prices], k) => {
    const pairs = desague.values.map((v, i) => [v, (prices as (number | null)[])[i]] as const).filter(([, p]) => p != null)
    add({
      name: name as string,
      category: 'canerias',
      brand: k % 2 ? 'Awaduct' : 'Tigre',
      price: pairs[0][1],
      image: IMG.canerias,
      attributes: { tipo: [tipo as string], material: ['PVC'] },
      sku: `PV-${k + 1}`,
      short: 'Para desagües cloacales y pluviales.',
      specs: [['Material', 'PVC 3,2 mm'], ['Uso', 'Desagüe']],
      variation: { option: 'Medida', values: pairs.map(([v]) => v), prices: pairs.map(([, p]) => p as number) },
      tags: ['desague', 'pvc', 'cloaca'],
    })
  })
  ;[
    ['Pileta de patio PVC con rejilla', 'Pileta de patio', 'Awaduct', 8900],
    ['Rejilla de acero inoxidable 15 x 15', 'Rejilla', 'Awaduct', 9600],
    ['Caño de polietileno para agua x 100 m', 'Tubo', 'Tigre', 145000],
    ['Flexible mallado para canilla 40 cm', 'Flexible', 'Hidromet', 4200],
    ['Cinta de teflón x 10 m', 'Insumo', 'Fusión', 900],
    ['Pegamento para PVC 250 cc', 'Insumo', 'Tigre', 6800],
    ['Caño de cobre para gas x 3 m', 'Tubo', 'Hidro3', 52000],
    ['Válvula de esfera para gas', 'Llave de paso', 'Hidro3', 16400],
  ].forEach(([name, tipo, brand, price], k) =>
    add({
      name: name as string,
      category: 'canerias',
      brand: brand as string,
      price: price as number,
      image: k === 6 ? IMG.none : IMG.canerias,
      attributes: { tipo: [tipo as string], material: [k === 6 || k === 7 ? 'Cobre' : k === 2 ? 'Polietileno' : 'PVC'] },
      sku: `CA-${k + 1}`,
      stock: k === 2 ? 'bajo' : undefined,
      promo: k === 3 ? { percent: 25, endsInDays: 2, limitedStock: true } : undefined,
      tags: k === 4 ? ['teflon', 'sellador'] : [],
    }),
  )

  /* ---------- Tanques de agua ---------- */
  ;[
    ['Tanque tricapa', 'Rotoplas', 'Tricapa', ['500 L', '850 L', '1100 L', '2500 L'], [158000, 214000, 259000, 498000], 'Beige'],
    ['Tanque bicapa', 'Waterplast', 'Bicapa', ['600 L', '1000 L'], [129000, 176000], 'Negro'],
    ['Tanque cuatricapa', 'Eternit', 'Cuatricapa', ['500 L', '1000 L'], [175000, 268000], 'Blanco'],
    ['Cisterna enterrable', 'Rotoplas', 'Tricapa', ['2800 L', '5000 L'], [690000, 1090000], 'Negro'],
    ['Tanque de reserva horizontal', 'Waterplast', 'Bicapa', ['1500 L'], [289000], 'Celeste'],
  ].forEach(([name, brand, material, caps, prices, color], k) =>
    add({
      name: name as string,
      category: 'tanques-de-agua',
      brand: brand as string,
      price: (prices as number[])[0],
      image: k === 3 ? IMG.none : IMG.purificador2,
      attributes: { capacidad: caps as string[], material: [material as string], color: [color as string] },
      sku: `TQ-${k + 1}`,
      short: `Tanque ${String(material).toLowerCase()} para agua potable, con tapa a rosca.`,
      specs: [['Capas', String(material)], ['Uso', 'Agua potable'], ['Garantía', '15 años']],
      variation: (caps as string[]).length > 1 ? { option: 'Capacidad', values: caps as string[], prices: prices as number[] } : undefined,
      promo: k === 0 ? { percent: 12, endsInDays: 15 } : undefined,
      featured: k === 0,
      tags: ['tanque', 'agua', 'reserva'],
    }),
  )
  ;[
    ['Flotante para tanque 1/2"', 'Flotante', 'Hidromet', 9800],
    ['Kit de instalación para tanque', 'Kit', 'Rotoplas', 32000],
    ['Bomba presurizadora 120 W', 'Bomba', 'Rowa', 168000],
  ].forEach(([name, tipo, brand, price], k) =>
    add({
      name: name as string,
      category: 'tanques-de-agua',
      brand: brand as string,
      price: price as number,
      image: IMG.none,
      attributes: { capacidad: [], material: [tipo === 'Bomba' ? 'Metal' : 'Plástico'], color: ['Negro'] },
      sku: `TQA-${k + 1}`,
      stock: k === 2 ? 'bajo' : undefined,
      tags: tipo === 'Bomba' ? ['presurizadora', 'presion'] : [],
    }),
  )

  /* ---------- Termotanques ---------- */
  ;[
    ['Termotanque a gas multigas', 'Orbis', 'A gas', ['50 L', '80 L'], [389000, 459000], 'De pie'],
    ['Termotanque eléctrico de pie', 'Señorial', 'Eléctrico', ['80 L', '110 L'], [359000, 429000], 'De pie'],
    ['Termotanque a gas de colgar', 'Longvie', 'A gas', ['50 L'], [435000], 'De colgar'],
    ['Calefón a gas tiro natural', 'Orbis', 'Calefón', ['14 L/min'], [329000], 'De colgar'],
    ['Termotanque solar', 'Ecotermo', 'Solar', ['150 L', '200 L'], [890000, 1050000], 'En techo'],
    ['Termotanque eléctrico compacto', 'Ecotermo', 'Eléctrico', ['30 L'], [215000], 'De colgar'],
  ].forEach(([name, brand, tipo, caps, prices, inst], k) =>
    add({
      name: name as string,
      category: 'termotanques',
      brand: brand as string,
      price: (prices as number[])[0],
      image: IMG.termo,
      attributes: { tipo: [tipo as string], capacidad: caps as string[], instalacion: [inst as string] },
      sku: `TT-${k + 1}`,
      short: `${tipo} ${(caps as string[]).length > 1 ? `de ${(caps as string[]).join(' a ')}` : (caps as string[])[0]}.`,
      specs: [['Tipo', String(tipo)], ['Instalación', String(inst)], ['Garantía', k === 4 ? '10 años' : '5 años']],
      variation: (caps as string[]).length > 1 ? { option: 'Capacidad', values: caps as string[], prices: prices as number[], stock: [undefined, k === 1 ? 'sin_stock' : undefined] } : undefined,
      promo: k === 3 ? { percent: 14, endsInDays: 7 } : undefined,
      featured: k === 4,
      tags: tipo === 'Calefón' ? ['calefon', 'agua caliente'] : ['agua caliente'],
    }),
  )

  /* ---------- Purificadores ---------- */
  ;[
    ['Purificador bajo mesada 3 etapas', 'Bajo mesada', 189000, IMG.purificador],
    ['Purificador de ósmosis inversa', 'Ósmosis inversa', 389000, IMG.purificador],
    ['Filtro de agua para canilla', 'Filtro de canilla', 24000, IMG.purificador2],
    ['Cartucho de repuesto sedimentos', 'Repuesto', 12500, IMG.none],
    ['Filtro central para toda la casa', 'Filtro central', 145000, IMG.purificador2],
    ['Jarra purificadora 2,5 L', 'Jarra', 28000, IMG.purificador2],
  ].forEach(([name, tipo, price, image], k) =>
    add({
      name: name as string,
      category: 'purificadores',
      brand: k % 2 ? 'PSA' : 'Rotoplas',
      price: price as number,
      image: image as string,
      attributes: { tipo: [tipo as string], instalacion: [tipo === 'Jarra' ? 'Portátil' : tipo === 'Filtro central' ? 'Entrada de red' : 'Bajo mesada'] },
      sku: `PU-${k + 1}`,
      short: 'Agua más rica y sin cloro para tomar y cocinar.',
      promo: k === 1 ? { percent: 20, endsInDays: 11, limitedStock: true } : undefined,
      featured: k === 1,
    }),
  )

  /* ---------- Aberturas y techos ---------- */
  ;[
    ['Puerta plegadiza PVC lisa', ['Blanco', 'Roble', 'Gris'], [96000, 104000, 104000]],
    ['Puerta plegadiza PVC con visor', ['Blanco', 'Roble'], [118000, 128000]],
    ['Puerta plegadiza PVC doble hoja', ['Blanco'], [182000]],
    ['Cerradura para puerta plegadiza', ['Blanco', 'Marrón'], [14500, 14500]],
  ].forEach(([name, colors, prices], k) =>
    add({
      name: name as string,
      category: 'puertas-pvc',
      brand: 'Plegamax',
      price: (prices as number[])[0],
      image: k === 3 ? IMG.none : IMG.puerta,
      attributes: { tipo: [k === 3 ? 'Accesorio' : 'Plegadiza'], color: colors as string[], medida: k === 3 ? [] : ['0,80 x 2,05 m'] },
      sku: `PP-${k + 1}`,
      variation: (colors as string[]).length > 1 ? { option: 'Color', values: colors as string[], prices: prices as number[] } : undefined,
      promo: k === 0 ? { percent: 10, endsInDays: 20 } : undefined,
    }),
  )
  ;[
    ['Claraboya de policarbonato 60 x 60', '60 x 60 cm', 'Policarbonato', 88000],
    ['Claraboya de acrílico 80 x 80', '80 x 80 cm', 'Acrílico', 129000],
    ['Domo redondo 50 cm', '50 cm', 'Acrílico', 74000],
    ['Claraboya con ventilación 60 x 60', '60 x 60 cm', 'Acrílico', null],
  ].forEach(([name, medida, material, price], k) =>
    add({
      name: name as string,
      category: 'claraboyas',
      brand: 'Domus',
      price: price as number | null,
      image: IMG.claraboya,
      attributes: { medida: [medida as string], material: [material as string] },
      sku: `CL-${k + 1}`,
      short: 'Luz natural para ambientes interiores.',
      stock: k === 2 ? 'sin_stock' : undefined,
    }),
  )

  return products
}
