import { readDb } from '@/lib/db'
import { isAdmin } from '@/lib/session'

export async function GET() {
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 })
  const db = await readDb()
  return new Response(JSON.stringify(db, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="respaldo-distribuidora-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
