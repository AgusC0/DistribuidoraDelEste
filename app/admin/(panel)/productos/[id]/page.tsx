import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/ui'
import { ProductForm } from '@/components/admin/product-form'
import { catalogSuggestions } from '@/lib/catalog'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Editar producto' }

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ creado?: string }>
}) {
  const [{ id }, { creado }] = await Promise.all([params, searchParams])
  const db = await readDb()
  const suggestions = catalogSuggestions(db.products)
  const product = db.products.find((p) => p.id === id)
  if (!product) notFound()

  return (
    <>
      <PageHeader title={product.name} description={`Última modificación: ${new Date(product.updatedAt).toLocaleString('es-AR')}`} />
      <ProductForm
        product={product}
        categories={[...db.categories].sort((a, b) => a.order - b.order)}
        brands={suggestions.brands}
        attributeSuggestions={suggestions.attributes}
        created={creado === '1'}
      />
    </>
  )
}
