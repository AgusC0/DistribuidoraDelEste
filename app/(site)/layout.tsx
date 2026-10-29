import type { Metadata } from 'next'
import Script from 'next/script'
import { CatalogProvider } from '@/components/catalog-provider'
import { OrderDrawer } from '@/components/order-drawer'
import { OrderProvider } from '@/components/order-provider'
import { QuickViewProvider } from '@/components/quick-view'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { WhatsappFloat } from '@/components/whatsapp-float'
import { getShell } from '@/lib/public-catalog'
import { categoryUrl, rootCategories } from '@/lib/catalog'
import { categorySeoTitle } from '@/lib/category-seo'
import { GOOGLE_SITE_VERIFICATION, parseRanges, placeFromMapsEmbed, SITE_URL } from '@/lib/site'

// Se regenera al guardar cambios desde el panel (revalidatePath) y, como mínimo, cada hora.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getShell()
  return { verification: { google: settings.googleVerification || GOOGLE_SITE_VERIFICATION } }
}

const DAY_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Sólo lo liviano: el catálogo completo ya no viaja en cada página.
  const shell = await getShell()
  const { settings } = shell

  const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  // Negocio local (HardwareStore): lo que Google usa para el mapa y las búsquedas "… en Villa María".
  // Coordenadas y ficha salen del mapa cargado en Ajustes; los rubros enlazan a cada categoría.
  const place = placeFromMapsEmbed(settings.mapsEmbedUrl)
  const rubros = rootCategories(shell.categories).filter((c) => (shell.categoryCounts[c.id] ?? 0) > 0)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    '@id': `${SITE_URL}/#negocio`,
    name: settings.businessName,
    alternateName: 'Distribuidora del Este',
    description: `${settings.tagline}. Termotanques, claraboyas, puertas plegadizas, repuestos sanitarios y de griferías, sanitarios, griferías y materiales de construcción.`,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo/logo-distribuidora-del-este.png`,
    image: [`${SITE_URL}/images/logo/logo-distribuidora-del-este.png`, `${SITE_URL}/images/local/local-distribuidora-del-este-villa-maria.jpg`],
    telephone: `+${settings.whatsappNumber}`,
    email: settings.email,
    priceRange: '$$',
    currenciesAccepted: 'ARS',
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address.split(',')[0],
      addressLocality: 'Villa María',
      postalCode: '5900',
      addressRegion: 'Córdoba',
      addressCountry: 'AR',
    },
    ...(place.latitude != null && { geo: { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude } }),
    ...((place.mapUrl || settings.mapsUrl) && { hasMap: place.mapUrl ?? settings.mapsUrl }),
    areaServed: ['Villa María', 'Villa Nueva', 'Departamento General San Martín, Córdoba'].map((name) => ({ '@type': 'Place', name })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Rubros',
      itemListElement: rubros.map((c) => ({
        '@type': 'OfferCatalog',
        name: c.name,
        description: categorySeoTitle(c, shell.categories),
        url: `${SITE_URL}${categoryUrl(shell.categories, c.id)}`,
      })),
    },
    openingHoursSpecification: settings.hours.flatMap((value, day) =>
      parseRanges(value).map(([a, b]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAY_SCHEMA[day],
        opens: t(a),
        closes: t(b),
      })),
    ),
    sameAs: [settings.instagram, settings.facebook].filter(Boolean),
  }

  return (
    <CatalogProvider shell={shell}>
      <OrderProvider>
        <QuickViewProvider>
        <a
          href="#contenido"
          className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Saltar al contenido
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter settings={settings} categories={shell.categories} categoryCounts={shell.categoryCounts} />
          <WhatsappFloat />
        </div>
        <OrderDrawer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {/* Google Analytics 4: el ID se valida al guardarlo en Ajustes (G-XXXX). */}
        {settings.gaId && process.env.NODE_ENV === 'production' && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${settings.gaId}');`}
            </Script>
          </>
        )}
        </QuickViewProvider>
      </OrderProvider>
    </CatalogProvider>
  )
}
