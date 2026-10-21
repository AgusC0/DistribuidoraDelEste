import type { Lead, Settings } from '@/lib/types'

/**
 * Aviso por email de cada consulta nueva, vía Resend (https://resend.com, plan gratis: 3.000 emails/mes).
 * Variables de entorno:
 *   RESEND_API_KEY  clave de la API (obligatoria para enviar)
 *   EMAIL_FROM      remitente con dominio verificado en Resend, ej: "Web Distribuidora <avisos@tudominio.com.ar>".
 *                   Sin dominio verificado, Resend sólo permite enviar al email de la propia cuenta.
 */

export type NotifyResult = { sent: boolean; error?: string }

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY
}

async function send(to: string, subject: string, html: string, text: string): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: false, error: 'Falta configurar RESEND_API_KEY en el servidor.' }
  if (!to) return { sent: false, error: 'No hay un email cargado para recibir avisos.' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Web Distribuidora del Este <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      return { sent: false, error: body.message ?? `Resend respondió ${res.status}.` }
    }
    return { sent: true }
  } catch (e) {
    return { sent: false, error: (e as Error).message }
  }
}

export async function notifyNewLead(lead: Lead, settings: Settings, adminUrl: string, kind: 'consulta' | 'pedido' = 'consulta') {
  const section = kind === 'pedido' ? 'pedidos' : 'consultas'
  const heading = kind === 'pedido' ? 'Nuevo pedido desde la web' : 'Nueva consulta desde la web'
  const rows: [string, string][] = [
    ['Nombre', lead.name],
    ['Teléfono', lead.phone || '—'],
    ['Producto', lead.product],
    ['Mensaje', lead.message || '—'],
  ]
  const html = `
<div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2937">
  <h2 style="color:#2F5F26;margin:0 0 12px">${heading}</h2>
  <table style="border-collapse:collapse;width:100%">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;vertical-align:top;width:90px">${k}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;white-space:pre-line">${escape(v)}</td></tr>`,
      )
      .join('')}
  </table>
  <p style="margin:20px 0"><a href="${adminUrl}/admin/${section}" style="background:#2F5F26;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Ver en el panel</a></p>
  <p style="color:#9ca3af;font-size:12px">${escape(settings.businessName)}</p>
</div>`
  const text = `${heading}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nVer en el panel: ${adminUrl}/admin/${section}`
  return send(settings.notifyEmail, `${kind === 'pedido' ? 'Nuevo pedido' : 'Nueva consulta'}: ${lead.name} – ${lead.product}`.slice(0, 120), html, text)
}

export async function sendTestEmail(settings: Settings) {
  return send(
    settings.notifyEmail,
    'Prueba de avisos – Distribuidora del Este',
    '<p style="font-family:Arial,sans-serif">¡Funciona! Vas a recibir un email como este cada vez que llegue una consulta desde la web.</p>',
    '¡Funciona! Vas a recibir un email como este cada vez que llegue una consulta desde la web.',
  )
}
