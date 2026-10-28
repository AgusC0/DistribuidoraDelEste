import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
})

// ~155 caracteres: lo que más vende primero (termotanques, claraboyas, puertas plegadizas, repuestos) y la ciudad.
const description =
  'Termotanques, claraboyas, puertas plegadizas, repuestos, sanitarios, griferías y materiales de construcción en Villa María, Córdoba. Pedí tu presupuesto.'

const OG_ALT = 'Local de Distribuidora del Este, casa de sanitarios en Villa María'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Distribuidora del Este | Sanitarista en Villa María',
    template: '%s | Distribuidora del Este',
  },
  description,
  keywords: [
    'sanitarios Villa María',
    'termotanques Villa María',
    'claraboyas',
    'puertas plegadizas',
    'repuestos sanitarios',
    'materiales de construcción Villa María',
    'sanitarista Villa María',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Distribuidora del Este',
    title: 'Distribuidora del Este | Sanitarista en Villa María',
    description,
    // 1200×630 para Facebook, WhatsApp, LinkedIn y X; la cuadrada la usa WhatsApp en vistas chicas.
    images: [
      { url: '/images/og-distribuidora-del-este.jpg', width: 1200, height: 630, alt: OG_ALT, type: 'image/jpeg' },
      { url: '/images/og-distribuidora-del-este-cuadrada.jpg', width: 600, height: 600, alt: OG_ALT, type: 'image/jpeg' },
    ],
  },
  twitter: { card: 'summary_large_image', images: [{ url: '/images/og-distribuidora-del-este.jpg', alt: OG_ALT }] },
  formatDetection: { telephone: false },
  // Permite que Google muestre las fotos grandes (Imágenes, Discover) y fragmentos completos.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={`light scroll-smooth bg-background ${inter.variable} ${oswald.variable}`}>
      {/* suppressHydrationWarning: extensiones del navegador (ColorZilla, Grammarly…) agregan atributos al body antes de que cargue React. */}
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
