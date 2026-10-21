import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight, Headphones, ShieldCheck, Wrench } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ProductShowcase } from '@/components/product-detail'
import { RecentlyViewed } from '@/components/recently-viewed'
import { ProductView } from '@/components/product-view'
import { getPublicCatalog } from '@/lib/db'
import { categoryPath, categoryUrl } from '@/lib/catalog'
import { categoryName, SITE_URL } from '@/lib/site'

export const revalidate = 3600

export async function generateStaticParams() {
  const { products } = await getPublicCatalog()
  return products.map((p) => ({ slug: p.slug }))
}

async function getProduct(slug: string) {
  const catalog = await getPublicCatalog()
  const product = catalog.products.find((p) => p.slug === slug)
  return { catalog, product }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const { product, catalog } = await getProduct(slug)
  if (!product) return { title: 'Producto no encontrado' }
  // "Inodoro largo Bari Ferrum – Inodoros": nombre + marca (si no está en el nombre) + categoría.
  const withBrand = product.brand && !product.name.toLowerCase().includes(product.brand.toLowerCase()) ? `${product.name} ${product.brand}` : product.name
  const title = `${withBrand} – ${categoryName(catalog.categories, product.categoryId)}`
  const base = product.shortDescription || product.description
  const description = `${base.length > 150 ? `${base.slice(0, 147)}…` : base} En Distribuidora del Este, Villa María.`
  return {
    title,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: { title, description, images: product.images, type: 'website' },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { product, catalog } = await getProduct(slug)
  if (!product) notFound()

  const category = catalog.categories.find((c) => c.id === product.categoryId)
  const related = catalog.products
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .concat(catalog.products.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && p.featured))
    .slice(0, 4)

  const siblings = catalog.products
    .filter((p) => p.categoryId === product.categoryId)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const position = siblings.findIndex((p) => p.id === product.id)
  const prev = position > 0 ? siblings[position - 1] : undefined
  const next = position >= 0 && position < siblings.length - 1 ? siblings[position + 1] : undefined

  const variantPrices = product.variants.map((v) => v.price).filter((v): v is number => v != null)
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITE_URL}/productos` },
      ...categoryPath(catalog.categories, product.categoryId).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 3,
        name: c.name,
        item: `${SITE_URL}${categoryUrl(catalog.categories, c.id)}`,
      })),
    ],
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((src) => `${SITE_URL}${src}`),
    category: category?.name,
    ...(product.sku && { sku: product.sku }),
    ...(product.brand && { brand: { '@type': 'Brand', name: product.brand } }),
    ...(variantPrices.length > 1 && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'ARS',
        lowPrice: Math.min(...variantPrices),
        highPrice: Math.max(...variantPrices),
        offerCount: variantPrices.length,
      },
    }),
    ...(product.price != null && variantPrices.length <= 1 && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'ARS',
        price: product.price,
        availability:
          product.stock === 'sin_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: `${SITE_URL}/productos/${product.slug}`,
      },
    }),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <ProductView productId={product.id} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-4" />
          <li>
            <Link href="/productos" className="hover:text-foreground">
              Productos
            </Link>
          </li>
          {categoryPath(catalog.categories, product.categoryId).map((c) => (
            <li key={c.id} className="flex items-center gap-1">
              <ChevronRight aria-hidden="true" className="size-4" />
              <Link href={categoryUrl(catalog.categories, c.id)} className="hover:text-foreground">
                {c.name}
              </Link>
            </li>
          ))}
          <ChevronRight aria-hidden="true" className="size-4" />
          <li aria-current="page" className="font-medium text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>
        {(prev || next) && (
          <div className="flex items-center gap-1 text-sm">
            {prev && (
              <Link
                href={`/productos/${prev.slug}`}
                title={prev.name}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
                Anterior
              </Link>
            )}
            {next && (
              <Link
                href={`/productos/${next.slug}`}
                title={next.name}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Siguiente
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      <ProductShowcase product={product}>
        <ul className="grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, text: 'Calidad garantizada' },
            { icon: Wrench, text: 'Asesoramiento técnico' },
            { icon: Headphones, text: 'Atención personalizada' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-sm text-foreground">
              <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
              {text}
            </li>
          ))}
        </ul>
      </ProductShowcase>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 border-t border-border pt-12">
          <h2 id="related-title" className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
            También te puede interesar
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbLd]).replace(/</g, '\\u003c') }}
      />
    </div>
  )
}
