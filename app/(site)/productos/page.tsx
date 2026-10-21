import type { Metadata } from 'next'
import { ProductsBrowser } from '@/components/products-browser'
import { getInitialPage } from '@/lib/public-catalog'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Catálogo de productos',
  description:
    'Catálogo completo de Distribuidora del Este: griferías, purificadores, claraboyas, puertas de PVC, cañerías y termotanques en Villa María.',
  alternates: { canonical: '/productos' },
}

export default async function ProductsPage() {
  return <ProductsBrowser initial={await getInitialPage()} />
}
