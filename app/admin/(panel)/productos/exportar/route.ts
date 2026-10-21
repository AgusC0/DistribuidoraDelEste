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
    ? [[...COLUMNS], [
          '',
          'COD-001',
          'Ej: Codo 90° termofusión',
          'Agua y cañerías > Cañerías',
          'Marca',
          '890',
          '',
          'disponible',
          'si',
          'no',
          'no',
          'Codo a 90° para termofusión',
          'Descripción completa del producto',
          'codo, conexión',
          'Medida',
          '20 mm = 650 # COD-001-20 | 25 mm = 890 # COD-001-25 | 32 mm = 1290 # COD-001-32',
          'tipo=Codo; material=Polipropileno',
          'Presión de trabajo=20 bar; Garantía=1 año',
        ]]
    : [[...COLUMNS], ...db.products.map((p) => productRow(p, db.categories))]
  const name = template ? 'modelo-productos' : `productos-${new Date().toISOString().slice(0, 10)}`
  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}.csv"`,
    },
  })
}
