import type { Metadata } from 'next'
import Link from 'next/link'
import { FileSpreadsheet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/ui'
import { ProductTable } from '@/components/admin/product-table'
import { PriceVisibilityToggle } from '@/components/admin/price-visibility'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Productos' }

export default async function ProductsPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader
        title="Productos"
        description="Publicá, editá precios y stock. Los cambios se ven en el sitio al instante."
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
      <ProductTable products={db.products} categories={[...db.categories].sort((a, b) => a.order - b.order)} />
    </>
  )
}
