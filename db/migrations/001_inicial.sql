-- Esquema inicial de Distribuidora del Este.
-- Las migraciones se aplican solas al arrancar (lib/db/client.ts) o con `pnpm db:migrate`, en orden y una sola vez.

-- Datos del negocio (una sola fila) y contadores internos.
CREATE TABLE settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE meta (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Árbol de categorías (hasta 3 niveles). El id es también el slug de la URL.
CREATE TABLE categories (
  id text PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  parent_id text REFERENCES categories (id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  filters jsonb NOT NULL DEFAULT '[]',
  brands text[] NOT NULL DEFAULT '{}',
  seo_title text NOT NULL DEFAULT '',
  seo_text text NOT NULL DEFAULT ''
);
CREATE INDEX categories_parent_idx ON categories (parent_id, sort_order);

CREATE TABLE products (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id text NOT NULL REFERENCES categories (id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  brand text NOT NULL DEFAULT '',
  sku text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  price integer CHECK (price >= 0),
  -- Promoción: estado del producto, no una categoría.
  promo boolean NOT NULL DEFAULT false,
  promo_original_price integer CHECK (promo_original_price >= 0),
  promo_discount_percent integer CHECK (promo_discount_percent BETWEEN 0 AND 100),
  promo_starts_at date,
  promo_ends_at date,
  promo_limited_stock boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  stock text NOT NULL DEFAULT 'disponible' CHECK (stock IN ('disponible', 'bajo', 'sin_stock')),
  attributes jsonb NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '[]',
  options jsonb NOT NULL DEFAULT '[]',
  related text[] NOT NULL DEFAULT '{}',
  images text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_active_idx ON products (active, featured DESC, created_at DESC);
CREATE INDEX products_brand_idx ON products (lower(brand));
CREATE INDEX products_sku_idx ON products (sku) WHERE sku <> '';
CREATE INDEX products_promo_idx ON products (promo) WHERE promo;

-- Combinaciones de opciones (medida, color…) con su propio código, precio y stock.
CREATE TABLE variants (
  product_id text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  id text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '{}',
  sku text NOT NULL DEFAULT '',
  price integer CHECK (price >= 0),
  original_price integer CHECK (original_price >= 0),
  stock text NOT NULL DEFAULT 'disponible' CHECK (stock IN ('disponible', 'bajo', 'sin_stock')),
  image_index integer,
  PRIMARY KEY (product_id, id)
);
CREATE INDEX variants_sku_idx ON variants (sku) WHERE sku <> '';

-- Consultas del formulario de contacto.
CREATE TABLE leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  product text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'cerrado')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_created_idx ON leads (created_at DESC);
CREATE INDEX leads_status_idx ON leads (status);

-- Pedidos armados en la web y enviados por WhatsApp. Los ítems guardan nombre y precio del momento.
CREATE TABLE orders (
  id text PRIMARY KEY,
  number integer NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  estimated_total bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'presupuestado', 'vendido', 'perdido')),
  sale_amount bigint,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON orders (created_at DESC);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TABLE order_items (
  order_id text NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  position integer NOT NULL,
  product_id text NOT NULL,
  variant_id text,
  name text NOT NULL,
  variant_name text,
  sku text,
  price integer,
  quantity integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, position)
);
CREATE INDEX order_items_product_idx ON order_items (product_id);

-- Métricas anónimas (búsquedas, clics a WhatsApp, vistas). Se purgan solas a los 13 meses.
CREATE TABLE events (
  id bigserial PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('search', 'wa_click', 'view')),
  ts timestamptz NOT NULL DEFAULT now(),
  product_id text,
  source text,
  q text,
  results integer
);
CREATE INDEX events_ts_idx ON events (ts);
CREATE INDEX events_type_ts_idx ON events (type, ts);
CREATE INDEX events_product_idx ON events (product_id, ts) WHERE product_id IS NOT NULL;
