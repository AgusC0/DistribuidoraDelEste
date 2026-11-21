type Payload =
  | { type: 'search'; q: string; results: number }
  | { type: 'wa_click'; source: string; productId?: string }
  | { type: 'view'; productId: string }

/** Acciones que solo se informan a Google y Meta (no se guardan en las métricas del panel). */
type AdEvent =
  | { type: 'add_to_order'; productId: string; name: string; price?: number | null; quantity: number }
  | { type: 'call' }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

/** Replica la métrica en Google Analytics, si está configurado en Ajustes. */
function sendToGoogle(payload: Payload | AdEvent) {
  if (!window.gtag) return
  if (payload.type === 'search') window.gtag('event', 'search', { search_term: payload.q })
  if (payload.type === 'wa_click') window.gtag('event', 'generate_lead', { method: 'whatsapp', source: payload.source })
  if (payload.type === 'view') window.gtag('event', 'view_item', { items: [{ item_id: payload.productId }] })
  if (payload.type === 'add_to_order') window.gtag('event', 'add_to_cart', { items: [{ item_id: payload.productId, item_name: payload.name, quantity: payload.quantity }] })
  if (payload.type === 'call') window.gtag('event', 'generate_lead', { method: 'llamada' })
}

/**
 * Eventos estándar del Píxel de Meta, para optimizar las publicidades:
 * pedir presupuesto = Lead, WhatsApp o llamada = Contact, ver producto = ViewContent, agregar = AddToCart.
 */
function sendToMeta(payload: Payload | AdEvent) {
  if (!window.fbq) return
  if (payload.type === 'search') window.fbq('track', 'Search', { search_string: payload.q })
  if (payload.type === 'view') window.fbq('track', 'ViewContent', { content_ids: [payload.productId], content_type: 'product' })
  if (payload.type === 'add_to_order') {
    window.fbq('track', 'AddToCart', {
      content_ids: [payload.productId],
      content_name: payload.name,
      content_type: 'product',
      ...(payload.price ? { value: payload.price * payload.quantity, currency: 'ARS' } : {}),
    })
  }
  if (payload.type === 'call') window.fbq('track', 'Contact', { method: 'llamada' })
  if (payload.type === 'wa_click') {
    // El pedido armado es el contacto más valioso: se marca como Lead (presupuesto pedido).
    if (payload.source === 'pedido' || payload.source === 'formulario') window.fbq('track', 'Lead', { source: payload.source })
    else window.fbq('track', 'Contact', { method: 'whatsapp', source: payload.source, ...(payload.productId ? { content_ids: [payload.productId] } : {}) })
  }
}

/** Avisa a Google y Meta de una acción para las publicidades, sin guardarla en el panel. */
export function trackAd(event: AdEvent) {
  try {
    sendToGoogle(event)
    sendToMeta(event)
  } catch {
    // Las métricas nunca deben romper la experiencia.
  }
}

/** Envía una métrica sin bloquear la navegación (también funciona al salir a WhatsApp). */
export function track(payload: Payload) {
  try {
    sendToGoogle(payload)
    sendToMeta(payload)
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return
    void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    // Las métricas nunca deben romper la experiencia.
  }
}
