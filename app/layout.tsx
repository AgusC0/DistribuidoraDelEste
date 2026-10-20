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

const description =
  'Todo en sanitarios y conducción de agua. Griferías, purificadores, claraboyas, puertas de PVC, cañerías y termotanques. Distribuidora del Este SRL, Villa María, Córdoba.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Distribuidora del Este | Sanitarios y Corralón en Villa María',
    template: '%s | Distribuidora del Este',
  },
  description,
  keywords: ['sanitarios', 'corralón', 'griferías', 'purificadores de agua', 'termotanques', 'Villa María', 'Córdoba'],
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
  themeColor: '#4A5D23',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={`light scroll-smooth bg-background ${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
