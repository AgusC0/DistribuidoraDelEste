import { categoryUrl } from '@/lib/catalog'
import { groupHours } from '@/lib/site'
import type { Category, Settings } from '@/lib/types'

export type FaqItem = { question: string; answer: string; link?: { href: string; label: string } }
export type FaqGroup = { title: string; description: string; items: FaqItem[] }

const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`

/**
 * Preguntas frecuentes de la portada. Las del negocio se arman con los datos de Ajustes y las marcas de cada
 * categoría, así nunca quedan desactualizadas. Se publican también como FAQPage para Google.
 */
export function buildFaq(settings: Settings, categories: Category[]): FaqGroup[] {
  const cat = (id: string) => categories.find((c) => c.id === id)
  const url = (id: string) => (cat(id) ? categoryUrl(categories, id) : '/productos')
  const brands = (id: string) => cat(id)?.brands ?? []

  const hours = groupHours(settings.hours)
    .map((h) => `${h.label}: ${h.time}`)
    .join('. ')

  const payments = [
    settings.transferDiscount > 0 ? `transferencia bancaria con ${settings.transferDiscount}% de descuento` : 'transferencia bancaria',
    'efectivo',
    settings.installments > 0
      ? `tarjeta en hasta ${settings.installments} cuotas${settings.installmentsInterestFree ? ' sin interés' : ''}`
      : 'tarjeta',
  ]

  const termoBrands = brands('termotanques')
  const griferiaBrands = brands('griferias-de-bano')

  return [
    {
      title: 'Sobre Distribuidora del Este',
      description: 'Lo que más nos consultan sobre el local, los horarios y cómo comprar.',
      items: [
        {
          question: '¿Dónde queda Distribuidora del Este?',
          answer: `Estamos en ${settings.address}. Podés venir al local a ver los productos en exhibición o escribirnos por WhatsApp al ${settings.phoneDisplay}.`,
          link: settings.mapsUrl ? { href: settings.mapsUrl, label: 'Cómo llegar' } : undefined,
        },
        {
          question: '¿Qué horarios de atención tienen?',
          answer: hours ? `${hours}.` : 'Consultanos por WhatsApp los horarios de atención.',
        },
        {
          question: '¿Cómo pido un presupuesto?',
          answer:
            'Agregá los productos que necesitás con el botón "Agregar al pedido", elegí las cantidades y mandá la lista completa por WhatsApp en un solo mensaje. Te respondemos con el presupuesto y la disponibilidad. También podés escribirnos directamente contándonos qué necesitás.',
          link: { href: '/productos', label: 'Ver el catálogo' },
        },
        {
          question: '¿Qué formas de pago aceptan?',
          answer: `Podés pagar con ${list(payments)}. Si tenés dudas sobre una forma de pago en particular, consultanos al hacer el pedido.`,
        },
        {
          question: '¿Qué venden?',
          answer:
            'Somos casa de sanitarios: termotanques, claraboyas, puertas plegadizas, griferías, sanitarios, vanitorys, cañerías y conexiones para agua, gas y cloaca, tanques, bombas, repuestos de sanitarios y griferías, y materiales de construcción.',
          link: { href: '/productos', label: 'Ver todas las categorías' },
        },
        ...(termoBrands.length
          ? [
              {
                question: '¿Qué marcas de termotanques tienen?',
                answer: `Trabajamos con ${list(termoBrands)}, en modelos a gas, eléctricos y solares de distintas capacidades.`,
                link: { href: url('termotanques'), label: 'Ver termotanques' },
              },
            ]
          : []),
        ...(griferiaBrands.length
          ? [
              {
                question: '¿Qué marcas de griferías trabajan?',
                answer: `Tenemos griferías ${list(griferiaBrands)}, además de repuestos para que no tengas que cambiar toda la grifería por una pieza.`,
                link: { href: url('griferias-de-bano'), label: 'Ver griferías' },
              },
            ]
          : []),
      ],
    },
    {
      title: 'Consejos para elegir',
      description: 'Respuestas cortas a las dudas más comunes antes de comprar. Si tu caso es distinto, te asesoramos.',
      items: [
        {
          question: '¿Qué capacidad de termotanque necesito?',
          answer:
            'Como referencia, calculá entre 30 y 40 litros por persona: un termotanque de 50 a 80 litros alcanza para 1 a 3 personas, y uno de 110 a 150 litros para 4 a 6. Si usan mucha agua caliente a la vez (dos baños, bañera), conviene ir a la capacidad siguiente.',
          link: { href: url('termotanques'), label: 'Ver termotanques' },
        },
        {
          question: '¿Termotanque a gas o eléctrico?',
          answer:
            'Si tenés gas natural, el termotanque a gas suele recuperar más rápido y costar menos de usar. El eléctrico es la opción cuando no hay gas o no se puede ventilar: se instala en cualquier lugar, sin salida de gases. Con garrafa también hay modelos a gas envasado.',
        },
        {
          question: '¿Para qué sirve una claraboya?',
          answer:
            'Una claraboya es una ventana en el techo que deja entrar luz natural (y en algunos modelos, ventila). Es ideal para baños, pasillos y ambientes sin ventanas. Se elige por la medida del hueco y el tipo de techo.',
          link: { href: url('claraboyas'), label: 'Ver claraboyas' },
        },
        {
          question: '¿Puerta plegadiza o corrediza?',
          answer:
            'La plegadiza se pliega sobre sí misma, ocupa muy poco lugar y es la más económica: muy usada en baños, placares y lavaderos. La corrediza se desliza junto a la pared, cierra mejor y se ve más prolija, pero necesita espacio libre al costado para abrir.',
          link: { href: url('puertas-plegadizas'), label: 'Ver puertas plegadizas' },
        },
        {
          question: '¿Qué caño uso para la instalación de agua?',
          answer:
            'Para agua fría y caliente, lo más usado hoy es el caño de termofusión (polipropileno): se une con calor, no pierde y dura muchos años. Para desagües y cloacas se usa caño de PVC o polipropileno sanitario. Traé el plano o las medidas y te armamos la lista.',
          link: { href: url('sistema-conduccion'), label: 'Ver cañerías y conexiones' },
        },
        {
          question: 'Mi canilla gotea, ¿tengo que cambiar toda la grifería?',
          answer:
            'Casi nunca. En la mayoría de los casos alcanza con cambiar el cuerito, el vástago o el cartucho. Traé la pieza vieja o una foto con la marca y el modelo, y te damos el repuesto correcto.',
          link: { href: url('repuestos-griferias'), label: 'Ver repuestos de griferías' },
        },
      ],
    },
  ]
}

/** Datos estructurados FAQPage: pueden aparecer como preguntas desplegables en Google. */
export function faqJsonLd(groups: FaqGroup[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: groups.flatMap((g) =>
      g.items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
    ),
  }
}
