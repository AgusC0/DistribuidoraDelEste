import { getPublicCatalog, getShell, leanProduct } from '@/lib/public-catalog'

/** Último catálogo armado, para no rehacer el JSON en cada pedido mientras no cambie. */
let memo: { version: string; body: string } | null = null

/**
 * Catálogo completo en versión liviana, para filtrar y buscar en el navegador.
 * Con `?v=` igual a la versión vigente se cachea un año: una versión nueva cambia la URL.
 */
export async function GET(request: Request) {
  const { catalogVersion } = await getShell()
  if (memo?.version !== catalogVersion) {
    const { products, popularity } = await getPublicCatalog()
    memo = { version: catalogVersion, body: JSON.stringify({ products: products.map(leanProduct), popularity }) }
  }
  const current = new URL(request.url).searchParams.get('v') === catalogVersion
  return new Response(memo.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': current ? 'public, max-age=31536000, immutable' : 'no-store',
    },
  })
}
