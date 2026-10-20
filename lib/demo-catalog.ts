import { EMPTY_PROMOTION } from '@/lib/catalog'
import { createSeed } from '@/lib/seed'
import type { Product, Promotion, StockStatus } from '@/lib/types'

/**
 * Catálogo de DEMOSTRACIÓN para presentar el sitio: marcas, medidas y precios de ejemplo.
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

  const make = (
    slug: string,
    name: string,
    categoryId: string,
    brand: string,
    price: number | null,
    image: string,
    attributes: Record<string, string[]>,
    extra: { promotion?: Partial<Promotion>; description?: string; stock?: StockStatus; featured?: boolean; tags?: string[] } = {},
  ): Product => ({
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
    featured: extra.featured ?? false,
    active: true,
    stock: extra.stock ?? 'disponible',
    image,
    images: [image],
    variants: [],
    tags: extra.tags ?? [],
    createdAt: now,
    updatedAt: now,
  })

  const pp = 'Polipropileno'
  const demo: Product[] = [
    // Cañerías
    make('cano-termofusion-20', 'Caño termofusión 20 mm x 4 m', 'canerias', 'Acqua System', 6900, IMG.canerias, { tipo: ['Tubo'], medida: ['20 mm'], material: [pp] }, {
      promotion: { originalPrice: 8500, limitedStock: true },
      tags: ['termofusion', 'caño', 'agua'],
    }),
    make('cano-termofusion-25', 'Caño termofusión 25 mm x 4 m', 'canerias', 'Acqua System', 9800, IMG.canerias, { tipo: ['Tubo'], medida: ['25 mm'], material: [pp] }),
    make('codo-termofusion-20', 'Codo 90° termofusión 20 mm', 'canerias', 'Saladillo', 650, IMG.canerias, { tipo: ['Codo'], medida: ['20 mm'], material: [pp] }),
    make('codo-termofusion-25', 'Codo 90° termofusión 25 mm', 'canerias', 'Saladillo', 890, IMG.canerias, { tipo: ['Codo'], medida: ['25 mm'], material: [pp] }),
    make('tee-termofusion-25', 'Tee termofusión 25 mm', 'canerias', 'Saladillo', 1150, IMG.canerias, { tipo: ['Tee'], medida: ['25 mm'], material: [pp] }, {
      promotion: { discountPercent: 15 },
    }),
    make('union-doble-20', 'Unión doble termofusión 20 mm', 'canerias', 'Acqua System', 3200, IMG.canerias, { tipo: ['Unión'], medida: ['20 mm'], material: [pp] }),
    make('adaptador-25', 'Adaptador rosca hembra 25 mm x 3/4"', 'canerias', 'Saladillo', 1700, IMG.canerias, { tipo: ['Adaptador'], medida: ['25 mm'], material: [pp] }),
    make('cano-pvc-110', 'Caño PVC desagüe 110 mm x 4 m', 'canerias', 'Tigre', 21500, IMG.canerias, { tipo: ['Tubo'], medida: ['110 mm'], material: ['PVC'] }, {
      promotion: { originalPrice: 26000, endsAt: inDays(5) },
      tags: ['desague', 'cloaca'],
    }),
    make('cano-pvc-40', 'Caño PVC desagüe 40 mm x 4 m', 'canerias', 'Tigre', 7400, IMG.canerias, { tipo: ['Tubo'], medida: ['40 mm'], material: ['PVC'] }),
    make('codo-pvc-110', 'Codo PVC 110 mm a 90°', 'canerias', 'Awaduct', 3900, IMG.canerias, { tipo: ['Codo'], medida: ['110 mm'], material: ['PVC'] }),
    make('codo-pvc-40', 'Codo PVC 40 mm a 90°', 'canerias', 'Awaduct', 1100, IMG.canerias, { tipo: ['Codo'], medida: ['40 mm'], material: ['PVC'] }, { stock: 'bajo' }),

    // Griferías
    make('monocomando-cocina-arizona', 'Monocomando de cocina caño alto', 'griferias', 'FV', 98000, IMG.griferia, {
      tipo: ['Monocomando'], linea: ['Arizona'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Mesada'],
    }, { promotion: { originalPrice: 125000 }, featured: true }),
    make('monocomando-lavatorio', 'Monocomando para lavatorio', 'griferias', 'FV', 64000, IMG.griferia, {
      tipo: ['Monocomando'], linea: ['Libby'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Mesada'],
    }),
    make('juego-ducha-embutir', 'Juego para ducha de embutir', 'griferias', 'Peirano', 76000, IMG.griferia, {
      tipo: ['Juego de ducha'], linea: ['Línea 30'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Pared'],
    }),
    make('canilla-servicio', 'Canilla de servicio 1/2"', 'griferias', 'Hidromet', 9500, IMG.griferia, {
      tipo: ['Canilla'], color: ['Cromo'], material: ['Bronce'], instalacion: ['Pared'],
    }),

    // Sanitarios
    make('inodoro-bari', 'Inodoro largo Bari', 'sanitarios', 'Ferrum', 145000, IMG.bano, {
      tipo: ['Inodoro'], linea: ['Bari'], color: ['Blanco'], sistema: ['Mochila'], instalacion: ['Piso'],
    }, { promotion: { originalPrice: 172000, limitedStock: true }, featured: true }),
    make('bidet-bari', 'Bidet Bari 3 agujeros', 'sanitarios', 'Ferrum', 98000, IMG.bano, {
      tipo: ['Bidet'], linea: ['Bari'], color: ['Blanco'], instalacion: ['Piso'],
    }),
    make('mochila-bari', 'Mochila de apoyo Bari doble descarga', 'sanitarios', 'Ferrum', 89000, IMG.bano, {
      tipo: ['Mochila'], linea: ['Bari'], color: ['Blanco'], sistema: ['Doble descarga'], instalacion: ['Apoyo'],
    }),

    // Termotanques
    make('termotanque-gas-80', 'Termotanque a gas 80 L', 'termotanques', 'Rheem', 410000, IMG.termo, {
      tipo: ['Gas'], capacidad: ['80 L'], instalacion: ['Pie'],
    }, { promotion: { originalPrice: 455000, endsAt: inDays(10) } }),
    make('termotanque-electrico-50', 'Termotanque eléctrico 50 L', 'termotanques', 'Señorial', 285000, IMG.termo, {
      tipo: ['Eléctrico'], capacidad: ['50 L'], instalacion: ['Colgar'],
    }),
  ]

  // Se suman los productos originales del sitio (purificadores, claraboyas, puertas…).
  const base = createSeed().products.filter((p) => !['monocomando-cocina', 'canerias', 'termotanque'].includes(p.id))
  return [...demo, ...base]
}
