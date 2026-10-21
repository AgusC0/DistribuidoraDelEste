import { complementsFor } from '@/lib/catalog'
import { getPublicCatalog, leanProduct } from '@/lib/public-catalog'

/**
 * Productos puntuales por id (el pedido, los vistos recientemente), sin bajar todo el catálogo.
 * `?complementos=1` suma lo que se suele comprar junto con ellos.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const ids = (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, 60)
  const { products } = await getPublicCatalog()
  const byId = new Map(products.map((p) => [p.id, p]))
  const items = ids.map((id) => byId.get(id)).filter((p) => p !== undefined)

  let complements: typeof items = []
  if (params.get('complementos') === '1') {
    const taken = new Set(ids)
    for (const p of items) {
      for (const c of complementsFor(p, products, 6)) {
        if (!taken.has(c.id)) {
          taken.add(c.id)
          complements.push(c)
        }
      }
    }
    complements = complements.slice(0, 6)
  }
  return Response.json(
    { items: items.map(leanProduct), complements: complements.map(leanProduct) },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' } },
  )
}
