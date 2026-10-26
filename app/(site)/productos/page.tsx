import type { Metadata } from 'next'
import { ProductsBrowser } from '@/components/products-browser'
import { getInitialPage } from '@/lib/public-catalog'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Catálogo de productos en Villa María',
  description:
    'Catálogo completo de Distribuidora del Este en Villa María: termotanques, claraboyas, puertas plegadizas, repuestos, sanitarios, griferías y materiales de construcción.',
  alternates: { canonical: '/productos' },
}

export default async function ProductsPage() {
  return <ProductsBrowser initial={await getInitialPage()} />
}
