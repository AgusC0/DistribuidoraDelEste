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
    ? [[...COLUMNS], ['', 'Ej: Codo 90° termofusión 25 mm', 'Agua y cañerías > Cañerías', 'Marca', '1200', '1500', 'disponible', 'si', 'si', 'no', 'Descripción corta', 'codo, conexión', '', 'tipo=Codo; medida=25 mm; material=Polipropileno']]
    : [[...COLUMNS], ...db.products.map((p) => productRow(p, db.categories))]
  const name = template ? 'modelo-productos' : `productos-${new Date().toISOString().slice(0, 10)}`
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  })
}
