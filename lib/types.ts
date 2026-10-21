export type StockStatus = 'disponible' | 'bajo' | 'sin_stock'

/** Filtro propio de una categoría (ej: Tipo, Medida, Material). `key` es el atributo del producto. */
export type CategoryFilter = {
  key: string
  label: string
}

/** Categorías en árbol: rubro (parentId = null) → subcategoría. */
export type Category = {
  id: string
  name: string
  slug: string
  description: string
  order: number
  parentId: string | null
  /** Filtros específicos que se muestran al navegar esta categoría. */
  filters: CategoryFilter[]
}

/**
 * Detalle de una promoción. La promo es un estado del producto (`product.promo`), no una categoría:
 * se activa o desactiva sin tocar dónde está el producto.
 */
export type Promotion = {
  /** Precio anterior, que se muestra tachado. El precio promocional es `product.price`. */
  originalPrice: number | null
  /** % OFF a mostrar cuando no hay precio anterior (ej: "20% OFF en toda la línea"). */
  discountPercent: number | null
  /** Fechas ISO (YYYY-MM-DD). Fuera de ese rango la promo no se muestra. */
  startsAt: string | null
  endsAt: string | null
  /** Muestra "Hasta agotar stock". */
  limitedStock: boolean
}

/** Eje de variación del producto (ej: Medida → 20 mm, 25 mm, 32 mm). */
export type ProductOption = {
  name: string
  values: string[]
}

/**
 * Variante: una combinación de opciones (ej: { Medida: '25 mm', Color: 'Blanco' })
 * con su propio código, precio, stock y foto.
 */
export type Variant = {
  id: string
  /** Etiqueta legible de la combinación ("25 mm / Blanco"). Se arma sola a partir de `options`. */
  name: string
  options: Record<string, string>
  sku: string
  price: number | null
  /** Precio anterior (tachado) si el producto está en promoción. */
  originalPrice: number | null
  stock: StockStatus
  /** Índice de la foto del producto que muestra esta variante (null = la principal). */
  imageIndex: number | null
}

/** Fila de la ficha técnica ("Detalles del producto"): Ancho → 39 cm. */
export type ProductSpec = {
  label: string
  value: string
}

export type Product = {
  id: string
  slug: string
  name: string
  categoryId: string
  description: string
  /** Precio en pesos. `null` = "Consultar precio". Con variantes, es el precio de referencia. En promo, es el precio promocional. */
  price: number | null
  /** Promoción activa (isPromotion). Los detalles van en `promotion`. */
  promo: boolean
  promotion: Promotion
  /** Marca (Tigre, FV, Rotoplas…). */
  brand: string
  /** Valores de los filtros de su categoría: { tipo: ['Codo'], medida: ['20 mm', '25 mm'] }. */
  attributes: Record<string, string[]>
  featured: boolean
  active: boolean
  stock: StockStatus
  /** Código interno / referencia. */
  sku: string
  /** Bajada corta debajo del título. */
  shortDescription: string
  /** Ficha técnica: medidas, garantía, origen… (además de marca y filtros). */
  specs: ProductSpec[]
  /** Ejes de variación; las variantes son sus combinaciones. */
  options: ProductOption[]
  /** Complementos elegidos a mano ("se compra junto con"): ids de otros productos. */
  related: string[]
  /** Foto principal (siempre igual a `images[0]`). */
  image: string
  /** Galería completa; la primera es la principal. */
  images: string[]
  variants: Variant[]
  /** Palabras clave y sinónimos que alimentan el buscador. */
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type LeadStatus = 'nuevo' | 'contactado' | 'cerrado'

export type Lead = {
  id: string
  name: string
  phone: string
  product: string
  message: string
  status: LeadStatus
  notes: string
  createdAt: string
}

/** Horarios por día de la semana, 0 = domingo. Formato: "08:00-12:00, 15:00-19:00". Vacío = cerrado. */
export type WeeklyHours = [string, string, string, string, string, string, string]

export type Settings = {
  businessName: string
  tagline: string
  phoneDisplay: string
  whatsappNumber: string
  email: string
  address: string
  mapsUrl: string
  mapsEmbedUrl: string
  instagram: string
  instagramHandle: string
  facebook: string
  hours: WeeklyHours
  heroTitle: string
  heroSubtitle: string
  announcementEnabled: boolean
  announcementText: string
  /** Aclaración debajo de los precios en la ficha de producto (formas de pago, IVA…). */
  priceNote: string
  /** % de descuento pagando por transferencia (0 = no se muestra). */
  transferDiscount: number
  /** Cantidad de cuotas a mostrar (0 = no se muestran). */
  installments: number
  installmentsInterestFree: boolean
  /** `false` oculta todos los montos del sitio público (tarjetas, fichas, pedido y WhatsApp). */
  showPrices: boolean
  /** Email que recibe el aviso de cada consulta nueva. */
  notifyEmail: string
  /** ID de Google Analytics 4 (G-XXXXXXX). */
  gaId: string
  /** Código de verificación de Google Search Console (meta google-site-verification). */
  googleVerification: string
  /** Enlace para dejar una reseña en Google. */
  googleReviewUrl: string
}

/** Un ítem del pedido que arma el cliente en el sitio. */
export type OrderItem = {
  productId: string
  variantId?: string
  name: string
  variantName?: string
  /** Código de la variante (o del producto). */
  sku?: string
  price: number | null
  quantity: number
}

export type TrackEvent =
  | { type: 'search'; ts: string; q: string; results: number }
  | { type: 'wa_click'; ts: string; productId?: string; source: string }
  | { type: 'view'; ts: string; productId: string }

export type Database = {
  version: number
  settings: Settings
  categories: Category[]
  products: Product[]
  leads: Lead[]
  events: TrackEvent[]
}

/** Lo que el sitio público necesita: sin consultas ni métricas. */
export type PublicCatalog = {
  settings: Settings
  categories: Category[]
  products: Product[]
  popularSearches: string[]
  /** Interés de los últimos 30 días por producto (vistas + consultas), para "Más vistos". */
  popularity: Record<string, number>
}
