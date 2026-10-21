import { buildVariants, EMPTY_PROMOTION } from '@/lib/catalog'
import { createSeed } from '@/lib/seed'
import type { Product, ProductOption, ProductSpec, Promotion, StockStatus, Variant } from '@/lib/types'

/**
 * Catálogo de DEMOSTRACIÓN para presentar el sitio: marcas, medidas, códigos y precios de ejemplo.
 * Se carga desde Panel → Ajustes y se reemplaza por el catálogo real (a mano o con Excel).
 */
export function createDemoProducts(): Product[] {
  const now = new Date().toISOString()
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)
  const IMG = {
    canerias: '/images/canerias.png',
    griferia: '/images/monocomando-cocina.png',
    bano: '/images/hero-bathroom.png',
    termo: '/images/termotanque.png',
  }

  type Extra = {
    sku?: string
    shortDescription?: string
    description?: string
    specs?: ProductSpec[]
    options?: ProductOption[]
    variants?: (o: ProductOption[]) => Variant[]
    promotion?: Partial<Promotion>
    stock?: StockStatus
    featured?: boolean
    tags?: string[]
  }

  const make = (
    slug: string,
    name: string,
    categoryId: string,
    brand: string,
    price: number | null,
    image: string,
    attributes: Record<string, string[]>,
    extra: Extra = {},
  ): Product => {
    const options = extra.options ?? []
    return {
      id: `demo-${slug}`,
      slug,
      name,
      categoryId,
      description: extra.description ?? `${name} ${brand}. Producto de ejemplo del catálogo de demostración.`,
      price,
      promo: !!extra.promotion,
      promotion: { ...EMPTY_PROMOTION, ...extra.promotion },
      brand,
      attributes,
      sku: extra.sku ?? '',
      shortDescription: extra.shortDescription ?? '',
      specs: extra.specs ?? [],
      options,
      featured: extra.featured ?? false,
      active: true,
      stock: extra.stock ?? 'disponible',
      image,
      images: [image],
      variants: extra.variants ? extra.variants(options) : [],
      tags: extra.tags ?? [],
      createdAt: now,
      updatedAt: now,
    }
  }
  const spec = (rows: [string, string][]): ProductSpec[] => rows.map(([label, value]) => ({ label, value }))

  const pp = 'Polipropileno'
  const termofusion = spec([
    ['Sistema', 'Termofusión'],
    ['Presión de trabajo', '20 bar a 20 °C'],
    ['Temperatura máxima', '95 °C'],
    ['Uso', 'Agua fría y caliente'],
    ['Garantía', '10 años'],
  ])

  const demo: Product[] = [
    /* ---------- Cañerías ---------- */
    make('cano-termofusion', 'Caño termofusión x 4 m', 'canerias', 'Acqua System', 6900, IMG.canerias, { tipo: ['Tubo'], material: [pp] }, {
      sku: 'AS-TUB',
      shortDescription: 'Caño de polipropileno para agua fría y caliente. Barra de 4 metros.',
      description:
        'Caño de polipropileno copolímero random para instalaciones de agua fría y caliente por termofusión. Barra de 4 metros. Se une con conexiones del mismo sistema mediante termofusora. Producto de ejemplo del catálogo de demostración.',
      specs: [...termofusion, { label: 'Largo', value: '4 m' }],
      options: [{ name: 'Medida', values: ['20 mm', '25 mm', '32 mm'] }],
      variants: (o) =>
        buildVariants('as-tub', o, [
          { values: ['20 mm'], sku: 'AS-TUB-20', price: 6900, originalPrice: 8500 },
          { values: ['25 mm'], sku: 'AS-TUB-25', price: 9800, originalPrice: 11900 },
          { values: ['32 mm'], sku: 'AS-TUB-32', price: 15400, stock: 'bajo' },
        ]),
      promotion: { originalPrice: 8500, limitedStock: true },
      tags: ['termofusion', 'caño', 'agua'],
    }),
    make('codo-termofusion', 'Codo 90° termofusión', 'canerias', 'Saladillo', 650, IMG.canerias, { tipo: ['Codo'], material: [pp] }, {
      sku: 'SA-COD90',
      shortDescription: 'Codo a 90° hembra-hembra para termofusión.',
      specs: termofusion,
      options: [{ name: 'Medida', values: ['20 mm', '25 mm', '32 mm'] }],
      variants: (o) =>
        buildVariants('sa-cod90', o, [
          { values: ['20 mm'], sku: 'SA-COD90-20', price: 650 },
          { values: ['25 mm'], sku: 'SA-COD90-25', price: 890 },
          { values: ['32 mm'], sku: 'SA-COD90-32', price: 1290 },
        ]),
    }),
    make('tee-termofusion', 'Tee termofusión', 'canerias', 'Saladillo', 1150, IMG.canerias, { tipo: ['Tee'], material: [pp] }, {
      sku: 'SA-TEE',
      shortDescription: 'Tee a 90° para derivaciones en termofusión.',
      specs: termofusion,
      options: [{ name: 'Medida', values: ['20 mm', '25 mm'] }],
      variants: (o) =>
        buildVariants('sa-tee', o, [
          { values: ['20 mm'], sku: 'SA-TEE-20', price: 820 },
          { values: ['25 mm'], sku: 'SA-TEE-25', price: 1150 },
        ]),
      promotion: { discountPercent: 15 },
    }),
    make('union-doble-termofusion', 'Unión doble termofusión', 'canerias', 'Acqua System', 3200, IMG.canerias, { tipo: ['Unión'], material: [pp] }, {
      sku: 'AS-UD',
      specs: termofusion,
      options: [{ name: 'Medida', values: ['20 mm', '25 mm'] }],
      variants: (o) =>
        buildVariants('as-ud', o, [
          { values: ['20 mm'], sku: 'AS-UD-20', price: 3200 },
          { values: ['25 mm'], sku: 'AS-UD-25', price: 4100 },
        ]),
    }),
    make('adaptador-rosca-hembra', 'Adaptador rosca hembra', 'canerias', 'Saladillo', 1700, IMG.canerias, { tipo: ['Adaptador'], material: [pp] }, {
      sku: 'SA-ARH',
      shortDescription: 'Adaptador de termofusión a rosca hembra metálica.',
      specs: termofusion,
      options: [{ name: 'Medida', values: ['20 mm x 1/2"', '25 mm x 3/4"'] }],
      variants: (o) =>
        buildVariants('sa-arh', o, [
          { values: ['20 mm x 1/2"'], sku: 'SA-ARH-2012', price: 1350 },
          { values: ['25 mm x 3/4"'], sku: 'SA-ARH-2534', price: 1700 },
        ]),
    }),
    make('cano-pvc-desague', 'Caño PVC desagüe x 4 m', 'canerias', 'Tigre', 21500, IMG.canerias, { tipo: ['Tubo'], material: ['PVC'] }, {
      sku: 'TG-PVC',
      shortDescription: 'Caño de PVC 3,2 mm para desagües cloacales y pluviales.',
      specs: spec([
        ['Espesor de pared', '3,2 mm'],
        ['Unión', 'Junta elástica'],
        ['Uso', 'Desagüe cloacal y pluvial'],
        ['Largo', '4 m'],
      ]),
      options: [{ name: 'Medida', values: ['40 mm', '63 mm', '110 mm'] }],
      variants: (o) =>
        buildVariants('tg-pvc', o, [
          { values: ['40 mm'], sku: 'TG-PVC-40', price: 7400 },
          { values: ['63 mm'], sku: 'TG-PVC-63', price: 11800 },
          { values: ['110 mm'], sku: 'TG-PVC-110', price: 21500, originalPrice: 26000 },
        ]),
      promotion: { originalPrice: 26000, endsAt: inDays(5) },
      tags: ['desague', 'cloaca'],
    }),
    make('codo-pvc-desague', 'Codo PVC desagüe 90°', 'canerias', 'Awaduct', 1100, IMG.canerias, { tipo: ['Codo'], material: ['PVC'] }, {
      sku: 'AW-COD',
      specs: spec([
        ['Ángulo', '90°'],
        ['Unión', 'Junta elástica'],
        ['Uso', 'Desagüe cloacal y pluvial'],
      ]),
      options: [{ name: 'Medida', values: ['40 mm', '110 mm'] }],
      variants: (o) =>
        buildVariants('aw-cod', o, [
          { values: ['40 mm'], sku: 'AW-COD-40', price: 1100, stock: 'bajo' },
          { values: ['110 mm'], sku: 'AW-COD-110', price: 3900 },
        ]),
    }),

    /* ---------- Griferías ---------- */
    make('monocomando-cocina-arizona', 'Monocomando de cocina caño alto Arizona', 'griferias', 'FV', 98000, IMG.griferia, {
      tipo: ['Monocomando'], linea: ['Arizona'], material: ['Bronce'], instalacion: ['Mesada'],
    }, {
      sku: 'FV-0411-ARZ',
      shortDescription: 'Monocomando para mesada con caño alto giratorio y cartucho cerámico.',
      description:
        'Grifería monocomando para cocina, de instalación en mesada. Caño alto giratorio que facilita el llenado de ollas y cartucho cerámico de 35 mm. Cuerpo de bronce. Producto de ejemplo del catálogo de demostración.',
      specs: spec([
        ['Instalación', 'Mesada, 1 agujero'],
        ['Cartucho', 'Cerámico 35 mm'],
        ['Altura del caño', 'Alto 32 cm / Bajo 18 cm'],
        ['Material', 'Bronce'],
        ['Garantía', '10 años'],
      ]),
      options: [
        { name: 'Color', values: ['Cromo', 'Negro mate'] },
        { name: 'Caño', values: ['Alto', 'Bajo'] },
      ],
      // Combinación que no existe: Negro mate con caño bajo (el sitio la marca como no disponible).
      variants: (o) =>
        buildVariants('fv-arz', o, [
          { values: ['Cromo', 'Alto'], sku: 'FV-0411-ARZ-CR-A', price: 98000, originalPrice: 125000 },
          { values: ['Cromo', 'Bajo'], sku: 'FV-0411-ARZ-CR-B', price: 89000, originalPrice: 112000 },
          { values: ['Negro mate', 'Alto'], sku: 'FV-0411-ARZ-NM-A', price: 129000, originalPrice: 152000 },
        ]),
      promotion: { originalPrice: 125000 },
      featured: true,
    }),
    make('monocomando-lavatorio-libby', 'Monocomando para lavatorio Libby', 'griferias', 'FV', 64000, IMG.griferia, {
      tipo: ['Monocomando'], linea: ['Libby'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Mesada'],
    }, {
      sku: 'FV-0181-LBY',
      specs: spec([
        ['Instalación', 'Mesada, 1 agujero'],
        ['Cartucho', 'Cerámico 35 mm'],
        ['Garantía', '10 años'],
      ]),
    }),
    make('juego-ducha-embutir', 'Juego para ducha de embutir', 'griferias', 'Peirano', 76000, IMG.griferia, {
      tipo: ['Juego de ducha'], linea: ['Línea 30'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Pared'],
    }, {
      sku: 'PE-30-DUCHA',
      specs: spec([
        ['Instalación', 'Embutir en pared'],
        ['Incluye', 'Llaves, transferencia y flor de ducha'],
        ['Garantía', '5 años'],
      ]),
    }),
    make('canilla-servicio', 'Canilla de servicio', 'griferias', 'Hidromet', 9500, IMG.griferia, {
      tipo: ['Canilla'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Pared'],
    }, {
      sku: 'HM-CS',
      options: [{ name: 'Medida', values: ['1/2"', '3/4"'] }],
      variants: (o) =>
        buildVariants('hm-cs', o, [
          { values: ['1/2"'], sku: 'HM-CS-12', price: 9500 },
          { values: ['3/4"'], sku: 'HM-CS-34', price: 12400 },
        ]),
    }),

    /* ---------- Sanitarios (ficha estilo "Detalles de producto") ---------- */
    make('inodoro-bari', 'Inodoro largo Bari', 'sanitarios', 'Ferrum', 145000, IMG.bano, {
      tipo: ['Inodoro'], linea: ['Bari'], sistema: ['Mochila'], instalacion: ['Piso'],
    }, {
      sku: 'FE-IBA',
      shortDescription: 'Inodoro largo de loza para mochila de apoyo.',
      description:
        'Inodoro largo de loza vitrificada, línea Bari. Se combina con la mochila de apoyo Bari para un conjunto completo. Descarga por arrastre. Producto de ejemplo del catálogo de demostración.',
      specs: spec([
        ['Usos', 'Baño'],
        ['Formato', 'Largo'],
        ['Ancho', '36 cm'],
        ['Alto', '40 cm'],
        ['Profundidad', '71 cm'],
        ['Material', 'Loza vitrificada'],
      ]),
      options: [{ name: 'Color', values: ['Blanco', 'Hueso'] }],
      variants: (o) =>
        buildVariants('fe-iba', o, [
          { values: ['Blanco'], sku: 'FE-IBA-B', price: 145000, originalPrice: 172000 },
          { values: ['Hueso'], sku: 'FE-IBA-H', price: 156000, originalPrice: 184000, stock: 'bajo' },
        ]),
      promotion: { originalPrice: 172000, limitedStock: true },
      featured: true,
    }),
    make('bidet-bari', 'Bidet Bari 3 agujeros', 'sanitarios', 'Ferrum', 98000, IMG.bano, {
      tipo: ['Bidet'], linea: ['Bari'], instalacion: ['Piso'],
    }, {
      sku: 'FE-BBA',
      specs: spec([
        ['Agujeros', '3'],
        ['Ancho', '36 cm'],
        ['Profundidad', '54 cm'],
      ]),
      options: [{ name: 'Color', values: ['Blanco', 'Hueso'] }],
      variants: (o) =>
        buildVariants('fe-bba', o, [
          { values: ['Blanco'], sku: 'FE-BBA-B', price: 98000 },
          { values: ['Hueso'], sku: 'FE-BBA-H', price: 105000 },
        ]),
    }),
    make('mochila-bari', 'Mochila de apoyo Bari doble descarga', 'sanitarios', 'Ferrum', 89000, IMG.bano, {
      tipo: ['Mochila'], linea: ['Bari'], color: ['Blanco'], sistema: ['Doble descarga'], instalacion: ['Apoyo'],
    }, {
      sku: 'FE-MBA-B',
      specs: spec([
        ['Descarga', 'Doble (3 y 6 litros)'],
        ['Accionamiento', 'Pulsador superior'],
        ['Material', 'Loza vitrificada'],
      ]),
    }),

    /* ---------- Termotanques ---------- */
    make('termotanque-gas', 'Termotanque a gas de pie', 'termotanques', 'Rheem', 410000, IMG.termo, {
      tipo: ['Gas'], instalacion: ['Pie'],
    }, {
      sku: 'RH-TG',
      shortDescription: 'Termotanque a gas natural con encendido piezoeléctrico.',
      specs: spec([
        ['Gas', 'Natural (convertible a envasado)'],
        ['Encendido', 'Piezoeléctrico'],
        ['Instalación', 'De pie'],
        ['Garantía', '5 años'],
      ]),
      options: [{ name: 'Capacidad', values: ['50 L', '80 L', '120 L'] }],
      variants: (o) =>
        buildVariants('rh-tg', o, [
          { values: ['50 L'], sku: 'RH-TG-50', price: 345000 },
          { values: ['80 L'], sku: 'RH-TG-80', price: 410000, originalPrice: 455000 },
          { values: ['120 L'], sku: 'RH-TG-120', price: 560000, stock: 'sin_stock' },
        ]),
      promotion: { originalPrice: 455000, endsAt: inDays(10) },
    }),
    make('termotanque-electrico', 'Termotanque eléctrico de colgar', 'termotanques', 'Señorial', 285000, IMG.termo, {
      tipo: ['Eléctrico'], instalacion: ['Colgar'],
    }, {
      sku: 'SE-TE',
      specs: spec([
        ['Potencia', '1500 W'],
        ['Instalación', 'De colgar'],
        ['Garantía', '2 años'],
      ]),
      options: [{ name: 'Capacidad', values: ['40 L', '50 L', '80 L'] }],
      variants: (o) =>
        buildVariants('se-te', o, [
          { values: ['40 L'], sku: 'SE-TE-40', price: 249000 },
          { values: ['50 L'], sku: 'SE-TE-50', price: 285000 },
          { values: ['80 L'], sku: 'SE-TE-80', price: 349000 },
        ]),
    }),
  ]

  // Se suman los productos originales del sitio (purificadores, claraboyas, puertas…).
  const base = createSeed().products.filter((p) => !['monocomando-cocina', 'canerias', 'termotanque'].includes(p.id))
  return [...demo, ...base]
}
