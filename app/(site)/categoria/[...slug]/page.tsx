import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductsBrowser } from '@/components/products-browser'
import { categoryPath, categoryUrl, childCategories, descendantIds, findCategoryByPath } from '@/lib/catalog'
import { categoryLabel, categorySeoText, categorySeoTitle, clip } from '@/lib/category-seo'
import { getInitialPage, getPublicCatalog } from '@/lib/public-catalog'
import { OG_IMAGE, SITE_URL } from '@/lib/site'
import type { Category, Product } from '@/lib/types'

export const revalidate = 3600

export async function generateStaticParams() {
  const { categories } = await getPublicCatalog()
  return categories.map((c) => ({ slug: categoryPath(categories, c.id).map((x) => x.slug) }))
}

/** Marcas de la categoría con productos: primero las que trabaja el negocio (en su orden), después el resto. */
function categoryBrands(category: Category, categories: Category[], products: Product[]) {
  const ids = descendantIds(categories, category.id)
  const present = [...new Set(products.filter((p) => ids.has(p.categoryId)).map((p) => p.brand).filter(Boolean))]
  const listed = [...(category.brands ?? []), ...childCategories(categories, category.id).flatMap((c) => c.brands ?? [])]
  const lower = new Map(present.map((b) => [b.toLowerCase(), b]))
  const ordered = listed.map((b) => lower.get(b.toLowerCase())).filter((b): b is string => !!b)
  return [...new Set([...ordered, ...present])]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params
  const { categories, products, settings } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) return { title: 'Categoría no encontrada' }
  const ids = descendantIds(categories, category.id)
  // Título con la búsqueda real ("Termotanques en Villa María", ~60 caracteres con el nombre del negocio)
  // y descripción con lo que la gente quiere saber: qué hay, qué marcas y dónde.
  const title = categorySeoTitle(category, categories)
  const brands = categoryBrands(category, categories, products).slice(0, 4)
  const intro = categorySeoText(category, categories, [], settings.address)[0]
  // ~160 caracteres (lo que muestra Google): qué hay, marcas y cómo pedir.
  const description = clip(
    [clip(intro, 110), brands.length ? `Marcas: ${brands.slice(0, 3).join(', ')}.` : '', 'Presupuesto por WhatsApp.'].filter(Boolean).join(' '),
    160,
  )
  return {
    title,
    description,
    alternates: { canonical: `/categoria/${slug.join('/')}` },
    // Una categoría sin productos existe (para cargarle productos), pero Google no la indexa.
    ...(products.some((p) => ids.has(p.categoryId)) ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title: `${title} | Distribuidora del Este`, description, type: 'website', locale: 'es_AR', images: [OG_IMAGE] },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const { categories, products, settings } = await getPublicCatalog()
  const category = findCategoryByPath(categories, slug)
  if (!category) notFound()

  const path = categoryPath(categories, category.id)
  const ids = descendantIds(categories, category.id)
  const inCategory = products.filter((p) => ids.has(p.categoryId))
  const items = inCategory.slice(0, 30)
  const brands = categoryBrands(category, categories, products)
  const seoTitle = categorySeoTitle(category, categories)
  const seoText = categorySeoText(category, categories, brands, settings.address)

  // Enlaces internos: subcategorías (en un rubro) o categorías hermanas (en una subcategoría), sólo con productos.
  const count = (id: string) => products.filter((p) => descendantIds(categories, id).has(p.categoryId)).length
  const related = (category.parentId ? childCategories(categories, category.parentId) : childCategories(categories, category.id))
    .filter((c) => c.id !== category.id && count(c.id) > 0)
    .slice(0, 10)
  const parent = categories.find((c) => c.id === category.parentId)

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
      '@type': 'CollectionPage',
      name: seoTitle,
      url: `${SITE_URL}${categoryUrl(categories, category.id)}`,
      about: category.name,
      isPartOf: { '@id': `${SITE_URL}/#negocio` },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: inCategory.length,
        itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/productos/${p.slug}`, name: p.name })),
      },
    },
  ]

  return (
    <>
      {/* `key`: al pasar de una categoría a otra, los filtros arrancan de cero. */}
      <ProductsBrowser key={category.id} categoryId={category.id} initial={await getInitialPage(category.id)} />

      {/* Texto local para Google (y para quien quiere saber más): va debajo para no empujar los productos. */}
      {inCategory.length > 0 && (
        <section aria-labelledby="seo-title" className="border-t border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:px-8">
            <div className="max-w-3xl">
              <h2 id="seo-title" className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                {seoTitle}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {seoText.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
            {(related.length > 0 || parent) && (
              <nav aria-label="Categorías relacionadas">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {category.parentId ? `Más en ${parent?.name}` : `Dentro de ${category.name}`}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {related.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={categoryUrl(categories, c.id)}
                        className="inline-flex h-9 items-center rounded-full bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        {categoryLabel(c, categories)}
                      </Link>
                    </li>
                  ))}
                  {parent && (
                    <li>
                      <Link
                        href={categoryUrl(categories, parent.id)}
                        className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-primary hover:underline"
                      >
                        Ver todo {parent.name}
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            )}
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  )
}
