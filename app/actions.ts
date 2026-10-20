'use server'

import { after } from 'next/server'
import { mutateDb, newId } from '@/lib/db'
import { notifyNewLead } from '@/lib/notify'
import { SITE_URL } from '@/lib/site'
import type { Lead } from '@/lib/types'

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
  const settings = await mutateDb((db) => {
    db.leads.unshift(lead)
    return db.settings
  })

  // El email sale después de responder, así el visitante no espera.
  after(async () => {
    const result = await notifyNewLead(lead, settings, SITE_URL)
    if (!result.sent && process.env.RESEND_API_KEY) console.error('[aviso por email]', result.error)
  })
  return { ok: true }
}
