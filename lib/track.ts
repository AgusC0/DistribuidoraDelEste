type Payload =
  | { type: 'search'; q: string; results: number }
  | { type: 'wa_click'; source: string; productId?: string }
  | { type: 'view'; productId: string }

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** Replica la métrica en Google Analytics, si está configurado en Ajustes. */
function sendToGoogle(payload: Payload) {
  if (!window.gtag) return
  if (payload.type === 'search') window.gtag('event', 'search', { search_term: payload.q })
  if (payload.type === 'wa_click') window.gtag('event', 'generate_lead', { method: 'whatsapp', source: payload.source })
  if (payload.type === 'view') window.gtag('event', 'view_item', { items: [{ item_id: payload.productId }] })
}

/** Envía una métrica sin bloquear la navegación (también funciona al salir a WhatsApp). */
export function track(payload: Payload) {
  try {
    sendToGoogle(payload)
    const body = JSON.stringify(payload)
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return
    void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    // Las métricas nunca deben romper la experiencia.
  }
}
