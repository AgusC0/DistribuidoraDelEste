import { slugify } from '@/lib/site'
import type { Category, Database } from '@/lib/types'

const now = '2026-01-01T00:00:00.000Z'


export function createSeed(): Database {
  return {
    version: 1,
    categoriesVersion: CATEGORIES_VERSION,
    settings: {
      businessName: 'Distribuidora del Este SRL',
      tagline: 'Sanitarista en Villa María, Córdoba',
      phoneDisplay: '353 418-1819',
      whatsappNumber: '5493534181819',
      email: 'distribuidoradeleste23@gmail.com',
      address: 'Av. Presidente Perón 1001, Villa María, Córdoba',
      mapsUrl:
        'https://www.google.com/maps/search/?api=1&query=Av.+Presidente+Peron+1001+Villa+Maria+Cordoba',
      mapsEmbedUrl:
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d799.8825352796204!2d-63.23053915165842!3d-32.416519832226975!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95cc42ed83f59769%3A0x58dafcce3fa44711!2sDistribuidora%20Del%20Este!5e0!3m2!1ses-419!2sar!4v1787065060311!5m2!1ses-419!2sar',
      instagram: 'https://instagram.com/distribuidora_del_este',
      instagramHandle: '@distribuidora_del_este',
      facebook: 'https://www.facebook.com/profile.php?id=100063635046976',
      hours: [
        '',
        '08:00-12:00, 15:00-19:00',
        '08:00-12:00, 15:00-19:00',
        '08:00-12:00, 15:00-19:00',
        '08:00-12:00, 15:00-19:00',
        '08:00-12:00, 15:00-19:00',
        '08:30-12:30',
      ],
      heroTitle: 'Todo en sanitarios y conducción de agua',
      heroSubtitle:
        'Diseño y calidad para tu hogar o proyecto. Marcas nacionales e importadas, asesoramiento técnico y atención personalizada.',
      announcementEnabled: false,
      announcementText: 'Promo del mes: monocomando de cocina a $38.000',
      priceNote: 'Consultá formas de pago, disponibilidad y envío por WhatsApp.',
      transferDiscount: 0,
      installments: 0,
      installmentsInterestFree: true,
      showPrices: true,
      notifyEmail: 'distribuidoradeleste23@gmail.com',
      gaId: '',
      googleVerification: '',
      googleReviewUrl: '',
    },
    categories: createCategories(),
    // El catálogo arranca vacío: los productos reales se cargan desde el panel (a mano o con Excel).
    products: [],
    leads: [],
    orders: [],
    events: [],
  }
}

const f = (...labels: string[]) => labels.map((label) => ({ key: slugify(label), label }))

/** Sube cuando cambia la estructura por defecto: las bases existentes se actualizan una vez (ver lib/category-migration.ts). */
export const CATEGORIES_VERSION = 2

/**
 * Rubros y subcategorías del catálogo, tal cual los definió el cliente (Rubro → Subcategoría → Productos),
 * con las marcas que trabaja en cada una. Los ids se usan en la URL: se conservan los que ya existían
 * y las URLs que cambiaron redirigen (ver next.config.mjs). Los rubros sólo filtran por marca.
 */
export function createCategories(): Category[] {
  const root = (id: string, name: string, description: string, order: number, brands: string[] = []): Category => ({
    id,
    name,
    slug: id,
    description,
    order,
    parentId: null,
    filters: [],
    brands,
  })
  const sub = (
    parentId: string,
    id: string,
    name: string,
    description: string,
    order: number,
    filters: Category['filters'],
    brands: string[] = [],
  ): Category => ({
    id,
    name,
    slug: id,
    description,
    order,
    parentId,
    filters,
    brands,
  })
  const griferias = ['FV', 'Mozart', 'Bayco', 'IPS', 'Vasser']
  return [
    // "Agua + gas + cloaca" es la bajada del rubro (así figura en la estructura del cliente), no una subcategoría.
    root('sistema-conduccion', 'Sistema de conducción', 'Agua + gas + cloaca: caños, accesorios, tanques y bombas de agua.', 0),
    sub('sistema-conduccion', 'canos', 'Caños', 'Caños para agua, gas y cloaca.', 0, f('Material', 'Medida'), ['H3', 'Duratop', 'Acqua System', 'Sigas', 'Epoxi', 'IPS', 'Tuboforte']),
    sub('sistema-conduccion', 'accesorios-conduccion', 'Accesorios', 'Codos, tees, cuplas, llaves de paso y demás conexiones.', 1, f('Tipo', 'Material', 'Medida')),
    sub('sistema-conduccion', 'tanques-de-agua', 'Tanque de agua', 'Tanques de agua tricapa, bicapa y de acero inoxidable.', 2, f('Capacidad', 'Material', 'Color'), ['Rotoplas', 'Mayper', 'Tinacos', 'Affinity']),
    sub('sistema-conduccion', 'bombas-de-agua', 'Bombas de agua', 'Bombas presurizadoras y elevadoras de agua.', 3, f('Tipo'), ['Rowa', 'Pluvius', 'Cafu']),

    root('repuestos-sanitarios', 'Repuestos sanitarios', 'Repuestos para sanitarios.', 1, ['Ferrum', 'Roca', 'Capea', 'Pringles']),

    root('repuestos-griferias', 'Repuestos griferías', 'Repuestos para griferías.', 2, griferias),

    root('bano', 'Baño', 'Griferías, sanitarios, accesorios, vanitorys, espejos y botiquines para tu baño.', 3),
    sub('bano', 'griferias-de-bano', 'Griferías', 'Monocomandos de lavatorio, juegos de ducha y de bidet.', 0, f('Tipo', 'Línea', 'Color', 'Instalación'), griferias),
    sub('bano', 'sanitarios', 'Sanitarios', 'Inodoros, bidets, mochilas y depósitos.', 1, f('Tipo', 'Línea', 'Color', 'Sistema'), ['Ferrum']),
    sub('bano', 'accesorios-bano', 'Accesorios para baño', 'Toalleros, portarrollos, jaboneras y barrales.', 2, f('Tipo', 'Color'), ['Peirano', 'Hydros', 'Genebre', 'Mozart']),
    sub('bano', 'puertas-plegadizas', 'Puerta plegadiza', 'Puertas plegadizas de PVC y sus accesorios.', 3, f('Color', 'Medida'), ['Claraluz']),
    sub('bano', 'claraboyas', 'Claraboya', 'Claraboyas y domos para iluminación natural.', 4, f('Medida', 'Material'), ['Claraluz']),
    sub('bano', 'tabla-inodoro', 'Tablas inodoro', 'Tablas de inodoro de madera y plásticas.', 5, f('Material', 'Color'), ['Cotrabo', 'Daccord', 'Monkoto', 'Ferrum', 'Mozart']),
    sub('bano', 'vanitory', 'Vanitory', 'Vanitorys de pie y suspendidos con bacha.', 6, f('Medida', 'Instalación'), ['Amoblamiento JC', 'Schneider']),
    sub('bano', 'espejo', 'Espejos', 'Espejos para baño.', 7, f('Medida')),
    sub('bano', 'botiquines', 'Botiquines', 'Botiquines con espejo para baño.', 8, f('Medida')),

    root('cocina', 'Cocina', 'Anafes, campanas, griferías, filtros purificadores, bachas y piletas de lavadero.', 4),
    sub('cocina', 'anafes', 'Anafe', 'Anafes a gas y eléctricos.', 0, f('Tipo'), ['Abrasol', 'Brogas']),
    sub('cocina', 'campanas', 'Campanas de cocina', 'Campanas y purificadores de cocina.', 1, f('Tipo', 'Medida'), ['Al-nes', 'Dhinox']),
    sub('cocina', 'griferias-de-cocina', 'Griferías', 'Monocomandos y canillas para mesada y pared.', 2, f('Tipo', 'Línea', 'Color'), griferias),
    sub('cocina', 'filtros-de-agua', 'Filtro purificador', 'Purificadores y filtros para tomar agua más rica.', 3, f('Tipo', 'Instalación'), ['Rotoplas']),
    sub('cocina', 'bachas-de-acero', 'Bachas de acero', 'Bachas de acero inoxidable simples y dobles.', 4, f('Medida'), ['Masecor', 'Dhinox']),
    sub('cocina', 'piletas-lavadero-marmolina', 'Piletas lavadero marmolina', 'Piletas de lavadero de marmolina.', 5, f('Medida'), ['Campagnolo']),
    sub('cocina', 'piletas-lavadero-plasticas', 'Piletas lavadero plásticas', 'Piletas de lavadero plásticas.', 6, f('Medida', 'Color'), ['Astrid', 'Concorplast']),

    root('calefaccion', 'Calefacción', 'Termotanques, calefactores, calefones, salamandras y estufas de fundición.', 5),
    sub('calefaccion', 'termotanques', 'Termotanques', 'Termotanques a gas, eléctricos y solares.', 0, f('Tipo', 'Capacidad', 'Instalación'), ['Ecotermo', 'Rotoplas', 'Señorial', 'Saiar', 'Rheem', 'Kacemaster', 'Sherman']),
    sub('calefaccion', 'calefactores', 'Calefactor', 'Calefactores a gas.', 1, f('Tipo'), ['Volcán']),
    sub('calefaccion', 'calefones', 'Calefón', 'Calefones a gas.', 2, f('Tipo', 'Capacidad'), ['Volcán']),
    sub('calefaccion', 'salamandras', 'Salamandra', 'Salamandras a leña.', 3, f('Tipo')),
    sub('calefaccion', 'estufas-de-fundicion', 'Estufa de fundición', 'Estufas de hierro fundido a leña.', 4, f('Tipo')),

    root('construccion', 'Construcción', 'Arena, cemento, cal, pegamentos, pastinas, impermeabilizantes y membranas.', 6),
    sub('construccion', 'arena', 'Arena', 'Arena fina y gruesa.', 0, []),
    sub('construccion', 'cemento', 'Cemento', 'Cemento portland y de albañilería.', 1, []),
    sub('construccion', 'cal', 'Hercal', 'Cal hidráulica Hercal.', 2, []),
    sub('construccion', 'pegamento-ceramico', 'Pegamento cerámico', 'Adhesivos para cerámicos y porcelanatos.', 3, []),
    sub('construccion', 'pastina', 'Pastina', 'Pastinas para juntas.', 4, []),
    sub('construccion', 'sika', 'Sika', 'Productos Sika para la construcción.', 5, []),
    sub('construccion', 'protex', 'Protex', 'Productos Protex para la construcción.', 6, []),
    sub('construccion', 'ceresita', 'Ceresita', 'Hidrófugos y productos Ceresita.', 7, []),
    sub('construccion', 'membrana-asfaltica', 'Membrana asfáltica', 'Membranas asfálticas para techos.', 8, []),

    root('herramientas', 'Herramientas', 'Próximamente.', 7),
  ]
}
