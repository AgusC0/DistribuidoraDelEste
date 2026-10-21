import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { ProductTable } from '@/components/admin/product-table'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Promociones' }

/** Los productos en promo, con la misma tabla de Productos ya filtrada. */
export default async function PromotionsPage() {
  const db = await readDb()
  const count = db.products.filter((p) => p.promo).length
  return (
    <>
      <PageHeader
        title="Promociones"
        description={`${count} ${count === 1 ? 'producto en promoción' : 'productos en promoción'}. Para sumar más: en "Todos", seleccioná los productos y tocá "Promoción". Aparecen primero en la portada y en el menú Productos.`}
      />
      <ProductTable initialStatus="promo" products={db.products} categories={[...db.categories].sort((a, b) => a.order - b.order)} />
    </>
  )
}
