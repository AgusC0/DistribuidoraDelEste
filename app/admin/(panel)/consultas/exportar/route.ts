import { readDb } from '@/lib/db'
import { isAdmin } from '@/lib/session'

const cell = (v: string) => `"${v.replace(/"/g, '""')}"`

export async function GET() {
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 })
  const db = await readDb()
  const rows = [
    ['Fecha', 'Nombre', 'Teléfono', 'Producto', 'Mensaje', 'Estado', 'Notas'],
    ...db.leads.map((l) => [
      new Date(l.createdAt).toLocaleString('es-AR'),
      l.name,
      l.phone,
      l.product,
      l.message,
      l.status,
      l.notes,
    ]),
  ]
  // BOM para que Excel abra bien los acentos.
  const csv = '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="consultas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
