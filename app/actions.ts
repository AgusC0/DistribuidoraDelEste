'use server'

import { after } from 'next/server'
import { getCatalog, insertLead, insertOrder, newId } from '@/lib/db'
import { notifyNewLead } from '@/lib/notify'
import { SITE_URL } from '@/lib/site'
import type { Lead, Order, OrderItem } from '@/lib/types'

export type LeadState = { ok: boolean; error?: string }

/** Guarda la consulta (formulario de contacto o pedido) antes de abrir WhatsApp y avisa por email. */
export async function submitLead(input: {
  name: string
  phone: string
  product: string
  message: string
  website?: string
}): Promise<LeadState> {
  // Campo trampa: los bots lo completan, las personas no lo ven.
  if (input.website) return { ok: true }

  const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = clean(input.name, 80)
  if (name.length < 2) return { ok: false, error: 'Ingresá tu nombre.' }

  const lead: Lead = {
    id: newId('c_'),
    name,
    phone: clean(input.phone, 40),
    product: clean(input.product, 120),
    message: clean(input.message, 2000),
    status: 'nuevo',
    notes: '',
    createdAt: new Date().toISOString(),
  }
  await insertLead(lead)
  const { settings } = await getCatalog()

  // El email sale después de responder, así el visitante no espera.
  after(async () => {
    const result = await notifyNewLead(lead, settings, SITE_URL)
    if (!result.sent && process.env.RESEND_API_KEY) console.error('[aviso por email]', result.error)
  })
  return { ok: true }
}

export type OrderInput = {
  name: string
  note: string
  items: { productId: string; variantId?: string; quantity: number }[]
}

/**
 * Registra el pedido que se manda por WhatsApp. Nombres, códigos y precios salen del catálogo
 * (no de lo que manda el navegador), así el panel muestra datos confiables.
 */
export async function submitOrder(input: OrderInput, message: string): Promise<{ ok: boolean; number?: number }> {
  const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const raw = Array.isArray(input?.items) ? input.items.slice(0, 60) : []

  const catalog = await getCatalog()
  const byId = new Map(catalog.products.map((p) => [p.id, p]))
  const result = await (async () => {
    const items: OrderItem[] = []
    for (const r of raw) {
      const product = byId.get(r?.productId)
      if (!product) continue
      const variant = r.variantId ? product.variants.find((v) => v.id === r.variantId) : undefined
      items.push({
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        variantName: variant?.name,
        sku: variant?.sku || product.sku || undefined,
        price: variant ? variant.price : product.price,
        quantity: Math.min(999, Math.max(1, Math.round(Number(r.quantity) || 1))),
      })
    }
    if (!items.length) return null
    const now = new Date().toISOString()
    // El número correlativo lo asigna la base (sin repetirse aunque lleguen dos pedidos a la vez).
    const order = await insertOrder({
      id: newId('o_'),
      name: clean(input.name, 80),
      note: clean(input.note, 500),
      items,
      estimatedTotal: items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0),
      status: 'nuevo',
      saleAmount: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
    return { order, settings: catalog.settings }
  })()
  if (!result) return { ok: false }

  const { order, settings } = result
  after(async () => {
    const lead: Lead = {
      id: order.id,
      name: order.name || 'Cliente sin nombre',
      phone: '',
      product: `Pedido #${order.number} (${order.items.length} ${order.items.length === 1 ? 'producto' : 'productos'})`,
      message: clean(message, 3000),
      status: 'nuevo',
      notes: '',
      createdAt: order.createdAt,
    }
    const sent = await notifyNewLead(lead, settings, SITE_URL, 'pedido')
    if (!sent.sent && process.env.RESEND_API_KEY) console.error('[aviso por email]', sent.error)
  })
  return { ok: true, number: order.number }
}
