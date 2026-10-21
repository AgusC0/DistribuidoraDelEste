import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgePercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/admin/empty-state'
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
        description={count ? `${count} ${count === 1 ? 'producto en promoción' : 'productos en promoción'}. Se muestran en una sección especial de la portada, en el menú Productos y con la etiqueta PROMO.` : undefined}
        help="promociones"
      />
      {count ? (
        <ProductTable initialStatus="promo" products={db.products} categories={[...db.categories].sort((a, b) => a.order - b.order)} />
      ) : (
        <EmptyState
          icon={BadgePercent}
          title="No hay productos en promoción"
          steps={[
            'Andá a Productos y marcá las casillas de los productos que querés poner en oferta.',
            'En la barra que aparece, tocá "Promoción".',
            'Elegí el % de descuento, la fecha de fin (opcional) y si es hasta agotar stock.',
          ]}
        >
          Las promociones aparecen en una sección especial de la portada, en el menú Productos del sitio y con la etiqueta PROMO en todo el catálogo.
          <div className="mt-6">
            <Button nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos" />}>
              Ir a Productos
            </Button>
          </div>
        </EmptyState>
      )}
    </>
  )
}
