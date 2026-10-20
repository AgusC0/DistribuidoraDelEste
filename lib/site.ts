import type { Category, OrderItem, Product, StockStatus, Variant, WeeklyHours } from '@/lib/types'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://distribuidoradeleste.com.ar'

export const GENERAL_WA_MESSAGE = 'Hola Distribuidora del Este, quería hacer una consulta.'

export function waLink(whatsappNumber: string, message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}

const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatPrice(price: number | null) {
  return price == null ? 'Consultar precio' : priceFormatter.format(price)
}

/** Precio a mostrar: con variantes de distinto precio, "Desde $X". */
export function displayPrice(product: Product) {
  const prices = product.variants.map((v) => v.price).filter((p): p is number => p != null)
  if (!prices.length) return formatPrice(product.price)
  const min = Math.min(...prices)
  return prices.some((p) => p !== min) ? `Desde ${formatPrice(min)}` : formatPrice(min)
}

/** Precio más bajo (de las variantes, si tienen), para ordenar. */
export function minPrice(product: Product): number | null {
  const prices = product.variants.map((v) => v.price).filter((p): p is number => p != null)
  return prices.length ? Math.min(...prices) : product.price
}

export function hasPrice(product: Product) {
  return product.price != null || product.variants.some((v) => v.price != null)
}

export function productWaMessage(product: Product, variant?: Variant) {
  const price = variant ? variant.price : product.price
  const label = variant ? `${product.name} – ${variant.name}` : product.name
  return `Hola Distribuidora del Este, quería consultar por: ${label}${price != null ? ` (${formatPrice(price)})` : ''}.`
}

/** Mensaje de WhatsApp con todo el pedido armado en el sitio. */
export function orderWaMessage(items: OrderItem[], name?: string, note?: string) {
  const lines = items.map((i) => {
    const label = i.variantName ? `${i.name} – ${i.variantName}` : i.name
    const price = i.price != null ? ` – ${formatPrice(i.price * i.quantity)}` : ''
    return `• ${i.quantity} × ${label}${price}`
  })
  const priced = items.filter((i) => i.price != null)
  const total = priced.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0)
  return [
    `Hola Distribuidora del Este${name ? `, soy ${name}` : ''}. Quiero pedir presupuesto por:`,
    '',
    ...lines,
    '',
    priced.length
      ? `Total estimado: ${formatPrice(total)}${priced.length < items.length ? ' (más los productos a consultar)' : ''}`
      : 'Quedo a la espera del presupuesto.',
    note ? `\nComentario: ${note}` : '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  disponible: 'En stock',
  bajo: 'Últimas unidades',
  sin_stock: 'Sin stock',
}

export function categoryName(categories: Category[], id: string) {
  return categories.find((c) => c.id === id)?.name ?? 'Sin categoría'
}

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* ---------- Horarios ---------- */

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const TIMEZONE = 'America/Argentina/Cordoba'

type Range = [number, number]

export function parseRanges(value: string): Range[] {
  return value
    .split(/[,/]/)
    .map((part) => part.match(/(\d{1,2}):(\d{2})\s*[-–a]+\s*(\d{1,2}):(\d{2})/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [Number(m[1]) * 60 + Number(m[2]), Number(m[3]) * 60 + Number(m[4])])
}

export function formatRanges(value: string) {
  const ranges = parseRanges(value)
  if (!ranges.length) return 'Cerrado'
  const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  return ranges.map(([a, b]) => `${t(a)} – ${t(b)}`).join(' / ')
}

/** Agrupa días consecutivos con el mismo horario: "Lun a Vie", "Sáb". Empieza el lunes. */
export function groupHours(hours: WeeklyHours) {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const groups: { days: number[]; time: string }[] = []
  for (const d of order) {
    const time = formatRanges(hours[d])
    const last = groups.at(-1)
    if (last && last.time === time) last.days.push(d)
    else groups.push({ days: [d], time })
  }
  return groups
    .filter((g) => g.time !== 'Cerrado')
    .map((g) => ({
      label:
        g.days.length === 1
          ? DAY_NAMES[g.days[0]]
          : g.days.length === 2
            ? `${DAY_NAMES[g.days[0]]} y ${DAY_NAMES[g.days[1]]}`
            : `${DAY_NAMES[g.days[0]]} a ${DAY_NAMES[g.days.at(-1)!]}`,
      short:
        g.days.length === 1 ? SHORT_DAYS[g.days[0]] : `${SHORT_DAYS[g.days[0]]} a ${SHORT_DAYS[g.days.at(-1)!]}`,
      time: g.time,
    }))
}

function nowInTimezone(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

export type OpenStatus = { open: boolean; label: string }

export function openStatus(hours: WeeklyHours, date = new Date()): OpenStatus {
  const { day, minutes } = nowInTimezone(date)
  const today = parseRanges(hours[day])
  const current = today.find(([a, b]) => minutes >= a && minutes < b)
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  if (current) return { open: true, label: `Abierto ahora · cierra ${fmt(current[1])}` }

  const later = today.find(([a]) => a > minutes)
  if (later) return { open: false, label: `Cerrado · abre hoy ${fmt(later[0])}` }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7
    const first = parseRanges(hours[d])[0]
    if (first) {
      const when = i === 1 ? 'mañana' : DAY_NAMES[d].toLowerCase()
      return { open: false, label: `Cerrado · abre ${when} ${fmt(first[0])}` }
    }
  }
  return { open: false, label: 'Cerrado' }
}
