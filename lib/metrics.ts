import { TIMEZONE } from '@/lib/site'
import type { Database, TrackEvent } from '@/lib/types'

const DAY = 86_400_000

const dayKey = (date: Date | string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date(date)) // YYYY-MM-DD

export function dailySeries(events: TrackEvent[], type: TrackEvent['type'], days: number) {
  const counts = new Map<string, number>()
  for (const e of events) if (e.type === type) counts.set(dayKey(e.ts), (counts.get(dayKey(e.ts)) ?? 0) + 1)
  const out: { date: string; label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = dayKey(d)
    out.push({
      date: key,
      label: new Intl.DateTimeFormat('es-AR', { timeZone: TIMEZONE, day: 'numeric', month: 'short' }).format(d),
      value: counts.get(key) ?? 0,
    })
  }
  return out
}

function countBetween(events: TrackEvent[], type: TrackEvent['type'], from: number, to: number) {
  let n = 0
  for (const e of events) {
    const t = Date.parse(e.ts)
    if (e.type === type && t >= from && t < to) n++
  }
  return n
}

/** Valor de los últimos `days` días y variación % contra el período anterior. */
export function periodCompare(events: TrackEvent[], type: TrackEvent['type'], days: number) {
  const now = Date.now()
  const current = countBetween(events, type, now - days * DAY, now)
  const previous = countBetween(events, type, now - 2 * days * DAY, now - days * DAY)
  const delta = previous === 0 ? null : Math.round(((current - previous) / previous) * 100)
  return { current, previous, delta }
}

export function productRanking(db: Database, days: number) {
  const since = Date.now() - days * DAY
  const stats = new Map<string, { views: number; clicks: number }>()
  for (const e of db.events) {
    if (Date.parse(e.ts) < since) continue
    if ((e.type === 'view' || e.type === 'wa_click') && e.productId) {
      const s = stats.get(e.productId) ?? { views: 0, clicks: 0 }
      if (e.type === 'view') s.views++
      else s.clicks++
      stats.set(e.productId, s)
    }
  }
  return db.products
    .map((p) => ({ product: p, ...(stats.get(p.id) ?? { views: 0, clicks: 0 }) }))
    .filter((r) => r.views + r.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views)
}

export function clicksBySource(events: TrackEvent[], days: number) {
  const since = Date.now() - days * DAY
  const map = new Map<string, number>()
  for (const e of events) {
    if (e.type === 'wa_click' && Date.parse(e.ts) >= since) map.set(e.source, (map.get(e.source) ?? 0) + 1)
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

export const SOURCE_LABEL: Record<string, string> = {
  pedido: 'Pedido armado en la web',
  tarjeta: 'Tarjeta de producto',
  producto: 'Página de producto',
  hero: 'Portada',
  header: 'Encabezado',
  'menu-movil': 'Menú móvil',
  flotante: 'Botón flotante',
  formulario: 'Formulario de contacto',
  contacto: 'Sección contacto',
  footer: 'Pie de página',
  nosotros: 'Sección nosotros',
  buscador: 'Buscador (sin resultados)',
  'catalogo-sin-resultados': 'Catálogo (sin resultados)',
}
