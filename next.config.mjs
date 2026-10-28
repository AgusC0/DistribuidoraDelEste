/** Categorías que cambiaron de lugar al reorganizar el catálogo (ver lib/category-migration.ts). */
const LEGACY_CATEGORY_REDIRECTS = [
  ['bano/sanitarios/inodoros', 'bano/sanitarios'],
  ['bano/sanitarios/bidets', 'bano/sanitarios'],
  ['bano/sanitarios/mochilas-y-depositos', 'bano/sanitarios'],
  ['bano/lavatorios-y-bachas', 'bano'],
  ['griferias/griferias-de-bano', 'bano/griferias-de-bano'],
  ['griferias/griferias-de-cocina', 'cocina/griferias-de-cocina'],
  ['griferias/canillas-de-servicio', 'sistema-conduccion'],
  ['griferias', 'bano/griferias-de-bano'],
  ['agua-y-canerias/canerias', 'sistema-conduccion'],
  ['agua-y-canerias/tanques-de-agua', 'sistema-conduccion/tanques-de-agua'],
  ['agua-y-canerias/termotanques', 'calefaccion/termotanques'],
  ['agua-y-canerias/purificadores', 'cocina/filtros-de-agua'],
  ['agua-y-canerias', 'sistema-conduccion'],
  ['aberturas-y-techos/puertas-pvc', 'bano/puertas-plegadizas'],
  ['aberturas-y-techos/claraboyas', 'bano/claraboyas'],
  ['aberturas-y-techos', 'bano/claraboyas'],
  // Ajustes posteriores a la reorganización
  ['bano/claraboya-y-puerta-plegable', 'bano/claraboyas'],
  ['cocina/bateas-de-acero', 'cocina/bachas-de-acero'],
  ['sistema-conduccion/agua-gas-y-cloaca', 'sistema-conduccion'],
  // Estructura definitiva del cliente (versión 2)
  ['calefaccion/bombas-de-agua', 'sistema-conduccion/bombas-de-agua'],
  ['repuestos-sanitarios/vastagos', 'repuestos-griferias'],
  ['cocina/cocinas', 'cocina/anafes'],
  ['cocina/bacha', 'cocina'],
  ['cocina/piletas-para-lavadero', 'cocina'],
  ['calefaccion/a-lena', 'calefaccion'],
  ['construccion/ladrillo-comun', 'construccion'],
  ['construccion/revestimientos', 'construccion'],
  ['construccion/ceramica', 'construccion'],
  ['construccion/membranas', 'construccion/membrana-asfaltica'],
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Planillas de miles de productos, fotos y videos de la galería (hasta 80 MB) desde el panel.
      bodySizeLimit: '90mb',
    },
    // El proxy del panel (/admin) también recibe esos envíos: sin esto corta el cuerpo en 10 MB.
    proxyClientMaxBodySize: '90mb',
  },
  // Atajos para entrar al panel: /login y /ingresar llevan al ingreso real (/admin/login).
  async redirects() {
    return [
      { source: '/login', destination: '/admin/login', permanent: false },
      { source: '/ingresar', destination: '/admin/login', permanent: false },
      { source: '/admin/ingresar', destination: '/admin/login', permanent: false },
      // URLs de la estructura de categorías anterior → su lugar actual (permanentes, para Google).
      ...LEGACY_CATEGORY_REDIRECTS.map(([from, to]) => ({ source: `/categoria/${from}`, destination: `/categoria/${to}`, permanent: true })),
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
