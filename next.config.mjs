/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Planillas de miles de productos (hasta 20 MB) y fotos desde el panel.
      bodySizeLimit: '25mb',
    },
    // El proxy del panel (/admin) también recibe esos envíos: sin esto corta el cuerpo en 10 MB.
    proxyClientMaxBodySize: '25mb',
  },
  // Atajos para entrar al panel: /login y /ingresar llevan al ingreso real (/admin/login).
  async redirects() {
    return [
      { source: '/login', destination: '/admin/login', permanent: false },
      { source: '/ingresar', destination: '/admin/login', permanent: false },
      { source: '/admin/ingresar', destination: '/admin/login', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
