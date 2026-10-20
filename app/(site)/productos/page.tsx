import type { Metadata } from 'next'
import { ProductsBrowser } from '@/components/products-browser'

export const metadata: Metadata = {
  title: 'Catálogo de productos',
  description:
    'Catálogo completo de Distribuidora del Este: griferías, purificadores, claraboyas, puertas de PVC, cañerías y termotanques en Villa María.',
  alternates: { canonical: '/productos' },
}

export default function ProductsPage() {
  return <ProductsBrowser />
}
