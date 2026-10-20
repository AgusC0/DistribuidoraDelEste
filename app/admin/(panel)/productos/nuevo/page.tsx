import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { ProductForm } from '@/components/admin/product-form'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader title="Nuevo producto" description="Completá los datos y publicalo en el catálogo." />
      <ProductForm categories={[...db.categories].sort((a, b) => a.order - b.order)} />
    </>
  )
}
