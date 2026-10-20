# Distribuidora del Este

Sitio de Distribuidora del Este SRL (Next.js 16 + Tailwind 4) con catálogo, buscador inteligente y panel de administración.

## Desarrollo

```bash
pnpm install
pnpm dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/admin — en desarrollo, usuario **admin** y contraseña **admin**

## Llevarlo a otra computadora

Requisitos: [Node.js 22 o superior](https://nodejs.org) y pnpm (`npm install -g pnpm`).

```bash
git clone <url-del-repo>
cd distribuidora-del-este
pnpm install
pnpm dev
```

Abrí http://localhost:3000. La base de datos (`data/`) no viaja por git: en la otra compu arranca con el catálogo inicial. Para llevar productos, fotos y consultas cargados, usá **Panel → Ajustes → Descargar respaldo** en esta compu y **Restaurar** en la otra (las fotos subidas están en `data/uploads/` y hay que copiarlas a mano).

## Configuración

Copiá `.env.example` a `.env.local` y completá:

| Variable | Para qué |
|---|---|
| `ADMIN_USER` | Usuario del panel (por defecto `admin`). |
| `ADMIN_PASSWORD` | Contraseña del panel. **Obligatoria en producción.** |
| `SESSION_SECRET` | Firma de la sesión (32+ caracteres al azar). |
| `NEXT_PUBLIC_SITE_URL` | Dominio real, para el sitemap, Open Graph y Google. |
| `DATA_DIR` | Dónde se guardan datos y fotos (por defecto `./data`). |
| `RESEND_API_KEY` | Activa el aviso por email de cada consulta ([resend.com](https://resend.com), plan gratis). |
| `EMAIL_FROM` | Remitente de los avisos, con dominio verificado en Resend. |

## Datos

Todo (productos, categorías, consultas, ajustes y métricas) vive en `data/db.json`, y las fotos subidas en `data/uploads/`. El archivo se crea solo con el catálogo inicial (`lib/seed.ts`) la primera vez.

- Hacé un respaldo desde **Panel → Ajustes → Descargar respaldo**.
- Necesita un servidor con disco persistente (VPS, Railway, Render, Fly.io…). En Vercel el disco se borra: para ahí hay que reemplazar `readDb`/`mutateDb` en `lib/db.ts` por una base de datos (Postgres, Supabase, etc.).

## Panel de administración

- **Mostrar / ocultar precios**: switch en Resumen y Productos. Con los precios ocultos el sitio muestra sólo los productos (sin montos en tarjetas, fichas, pedido ni mensajes de WhatsApp) y los precios no se envían al navegador.
- **Resumen**: consultas nuevas, clics a WhatsApp, vistas, ranking de productos más consultados, búsquedas sin resultados y alertas (productos sin foto, sin stock, etc.).
- **Productos**: alta, edición, galería de fotos, opciones/variantes con precio y stock propio, importar/exportar con Excel (CSV), palabras clave para el buscador, stock, promo, destacado, publicar/ocultar, duplicar, editar precio en la tabla y ajuste masivo de precios por porcentaje.
- **Categorías**: crear, renombrar, ordenar y eliminar.
- **Consultas**: lo que llega del formulario de contacto, con estados, notas internas, responder por WhatsApp y exportar a CSV (Excel).
- **Búsquedas**: lo más buscado, lo que no se encuentra y qué botones generan más consultas.
- **Ajustes**: datos de contacto, WhatsApp, email de avisos (con prueba), Google Analytics, Search Console, enlace de reseñas, horarios (alimentan el "Abierto ahora"), textos de portada, barra de anuncio y respaldo/restauración.

## Para el cliente en el sitio

- **Mi pedido**: el cliente suma productos (y la opción elegida) con cantidades y manda la lista completa por WhatsApp para pedir presupuesto. El pedido queda guardado también en **Consultas**.
