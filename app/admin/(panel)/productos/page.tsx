import type { Metadata } from 'next'
import Link from 'next/link'
import { FileSpreadsheet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/ui'
import { ProductTable, type ProductStatusFilter } from '@/components/admin/product-table'
import { PriceVisibilityToggle } from '@/components/admin/price-visibility'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Productos' }

const STATUSES: ProductStatusFilter[] = ['todos', 'publicados', 'ocultos', 'promo', 'sin_stock', 'incompletos']

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const [{ estado }, db] = await Promise.all([searchParams, readDb()])
  const initialStatus = STATUSES.find((s) => s === estado) ?? 'todos'
  return (
    <>
      <PageHeader
        title="Productos"
        description="Publicá, editá precios y stock. Los cambios se ven en el sitio al instante."
        help="productos"
        actions={
          <>
            <Button variant="outline" nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos/importar" />}>
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
            <Button nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos/nuevo" />}>
              <Plus className="size-4" />
              Nuevo producto
            </Button>
          </>
        }
      />
      <PriceVisibilityToggle showPrices={db.settings.showPrices} className="mb-6" />
      <ProductTable
        key={initialStatus}
        initialStatus={initialStatus}
        products={db.products}
        categories={[...db.categories].sort((a, b) => a.order - b.order)}
      />
    </>
  )
}
