import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductsBrowser } from '@/components/products-browser'
import { categoryPath, findCategoryByPath } from '@/lib/catalog'
import { getPublicCatalog } from '@/lib/db'

export const revalidate = 3600

export async function generateStaticParams() {
  const { categories } = await getPublicCatalog()
  return categories.map((c) => ({ slug: categoryPath(categories, c.id).map((x) => x.slug) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const { categories } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) return { title: 'Categoría no encontrada' }
  const names = categoryPath(categories, category.id).map((c) => c.name)
  return {
    title: names.reverse().join(' – '),
    description: category.description || `${category.name} en Distribuidora del Este, Villa María.`,
    alternates: { canonical: `/categoria/${slug.join('/')}` },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const { categories } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) notFound()
  // `key`: al pasar de una categoría a otra, los filtros arrancan de cero.
  return <ProductsBrowser key={category.id} categoryId={category.id} />
}
