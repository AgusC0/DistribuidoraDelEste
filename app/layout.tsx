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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Distribuidora del Este | Sanitarios y Corralón en Villa María',
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
    'corralón',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Distribuidora del Este',
    title: 'Distribuidora del Este | Sanitarios y Corralón en Villa María',
    description,
    images: [{ url: '/images/hero-bathroom.png', alt: 'Showroom de sanitarios de Distribuidora del Este' }],
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2F5F26',
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
