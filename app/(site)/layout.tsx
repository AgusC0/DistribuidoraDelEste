import type { Metadata } from 'next'
import Script from 'next/script'
import { CatalogProvider } from '@/components/catalog-provider'
import { OrderDrawer } from '@/components/order-drawer'
import { OrderProvider } from '@/components/order-provider'
import { QuickViewProvider } from '@/components/quick-view'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { WhatsappFloat } from '@/components/whatsapp-float'
import { getPublicCatalog } from '@/lib/db'
import { parseRanges, SITE_URL } from '@/lib/site'

// Se regenera al guardar cambios desde el panel (revalidatePath) y, como mínimo, cada hora.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicCatalog()
  return settings.googleVerification ? { verification: { google: settings.googleVerification } } : {}
}

const DAY_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getPublicCatalog()
  const { settings } = catalog

  const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HardwareStore',
    name: settings.businessName,
    description: settings.tagline,
    url: SITE_URL,
    image: `${SITE_URL}/images/logo-distribuidora.png`,
    telephone: `+${settings.whatsappNumber}`,
    email: settings.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address.split(',')[0],
      addressLocality: 'Villa María',
      addressRegion: 'Córdoba',
      addressCountry: 'AR',
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
    <CatalogProvider catalog={catalog}>
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
          <SiteFooter settings={settings} categories={catalog.categories} />
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
