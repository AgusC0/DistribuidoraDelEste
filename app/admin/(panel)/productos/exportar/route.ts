import { COLUMNS, productRow } from '@/lib/catalog-io'
import { toCsv } from '@/lib/csv'
import { readDb } from '@/lib/db'
import { isAdmin } from '@/lib/session'

/** Planilla de productos para abrir y editar en Excel. */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 })
  const db = await readDb()
  const template = new URL(request.url).searchParams.has('modelo')
  const rows = template
    ? [[...COLUMNS], ['', 'Ej: Inodoro largo blanco', 'Sanitarios', '85000', 'disponible', 'si', 'no', 'no', 'Descripción corta', 'inodoro, baño', '']]
    : [[...COLUMNS], ...db.products.map((p) => productRow(p, db.categories))]
  const name = template ? 'modelo-productos' : `productos-${new Date().toISOString().slice(0, 10)}`
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  })
}
