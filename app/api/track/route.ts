import { insertEvent } from '@/lib/db'
import type { TrackEvent } from '@/lib/types'

/** Métricas anónimas del sitio: búsquedas, clics a WhatsApp y vistas de producto. */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }

  const ts = new Date().toISOString()
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')
  let event: TrackEvent | null = null

  if (body.type === 'search') {
    const q = str(body.q, 80).trim()
    if (q.length >= 2) event = { type: 'search', ts, q, results: Math.max(0, Number(body.results) || 0) }
  } else if (body.type === 'wa_click') {
    event = { type: 'wa_click', ts, source: str(body.source, 40) || 'sitio', productId: str(body.productId, 80) || undefined }
  } else if (body.type === 'view') {
    const productId = str(body.productId, 80)
    if (productId) event = { type: 'view', ts, productId }
  }

  if (!event) return new Response(null, { status: 400 })
  const e = event
  await insertEvent(e)
  return new Response(null, { status: 204 })
}
