import type { MetadataRoute } from 'next'

/** Datos para cuando se agrega el sitio a la pantalla de inicio del celular. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Distribuidora del Este – Sanitarios y Corralón',
    short_name: 'Del Este',
    description: 'Corralón y sanitarios en Villa María, Córdoba. Catálogo de productos y pedidos por WhatsApp.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'es-AR',
    icons: [
      { src: '/icon.png', type: 'image/png', sizes: 'any' },
      { src: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  }
}
