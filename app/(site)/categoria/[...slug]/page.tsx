import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductsBrowser } from '@/components/products-browser'
import { categoryPath, categoryUrl, descendantIds, findCategoryByPath } from '@/lib/catalog'
import { getInitialPage, getPublicCatalog } from '@/lib/public-catalog'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600

export async function generateStaticParams() {
  const { categories } = await getPublicCatalog()
  return categories.map((c) => ({ slug: categoryPath(categories, c.id).map((x) => x.slug) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const { categories, products } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) return { title: 'Categoría no encontrada' }
  const ids = descendantIds(categories, category.id)
  const brands = [...new Set(products.filter((p) => ids.has(p.categoryId)).map((p) => p.brand).filter(Boolean))].slice(0, 4)
  // Título con la búsqueda real ("Inodoros en Villa María") y descripción con marcas: así compiten en Google.
  const title = `${category.name} en Villa María`
  const description = [
    category.description || `${category.name} para tu obra o reforma.`,
    brands.length ? `Marcas: ${brands.join(', ')}.` : '',
    'Precios, stock y asesoramiento en Distribuidora del Este, Villa María, Córdoba.',
  ]
    .filter(Boolean)
    .join(' ')
  return {
    title,
    description,
    alternates: { canonical: `/categoria/${slug.join('/')}` },
    openGraph: { title: `${title} | Distribuidora del Este`, description, type: 'website' },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const { categories, products } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) notFound()

  const path = categoryPath(categories, category.id)
  const ids = descendantIds(categories, category.id)
  const items = products.filter((p) => ids.has(p.categoryId)).slice(0, 30)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITE_URL}/productos` },
        ...path.map((c, i) => ({ '@type': 'ListItem', position: i + 3, name: c.name, item: `${SITE_URL}${categoryUrl(categories, c.id)}` })),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: category.name,
      numberOfItems: items.length,
      itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/productos/${p.slug}`, name: p.name })),
    },
  ]

  return (
    <>
      {/* `key`: al pasar de una categoría a otra, los filtros arrancan de cero. */}
      <ProductsBrowser key={category.id} categoryId={category.id} initial={await getInitialPage(category.id)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  )
}
