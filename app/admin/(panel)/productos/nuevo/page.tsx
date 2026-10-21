import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { ProductForm } from '@/components/admin/product-form'
import { catalogSuggestions } from '@/lib/catalog'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const db = await readDb()
  const suggestions = catalogSuggestions(db.products)
  return (
    <>
      <PageHeader title="Nuevo producto" description="Completá los datos y publicalo en el catálogo." help="producto" />
      <ProductForm
        categories={[...db.categories].sort((a, b) => a.order - b.order)}
        brands={suggestions.brands}
        attributeSuggestions={suggestions.attributes}
        catalogProducts={db.products.map((p) => ({ id: p.id, name: p.name, image: p.image, brand: p.brand }))}
      />
    </>
  )
}
