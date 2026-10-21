import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { CategoryManager } from '@/components/admin/category-manager'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Categorías' }

export default async function CategoriesPage() {
  const db = await readDb()
  const categories = [...db.categories].sort((a, b) => a.order - b.order)
  const counts = Object.fromEntries(categories.map((c) => [c.id, db.products.filter((p) => p.categoryId === c.id).length]))
  return (
    <>
      <PageHeader title="Categorías" description="Organizan el catálogo y los filtros del sitio. El orden es el mismo que ve el cliente." help="categorias" />
      <CategoryManager categories={categories} counts={counts} />
    </>
  )
}
