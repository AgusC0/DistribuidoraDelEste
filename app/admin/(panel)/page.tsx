import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, BadgePercent, CheckCircle2, ChevronRight, ClipboardList, FileWarning, Inbox, PackageX, Plus, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, Panel } from '@/components/admin/ui'
import { readDb, topSearches } from '@/lib/db'
import { isOnPromotion, promotionEndsLabel } from '@/lib/catalog'
import { orderStats, periodCompare } from '@/lib/metrics'
import { productQuality, QUALITY_GOOD } from '@/lib/quality'
import { formatPrice } from '@/lib/site'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Resumen' }

/** Tono de cada tarea, con el mismo significado de color que el resto del panel. */
const TONE = {
  info: 'bg-brand-blue/10 text-brand-blue',
  danger: 'bg-destructive/10 text-destructive',
  promo: 'bg-promo/10 text-promo',
  warning: 'bg-warning/15 text-warning',
}

type Task = { label: string; detail: string; href: string; icon: React.ElementType; tone: keyof typeof TONE }

function Stat({ label, value, delta }: { label: string; value: string | number; delta?: number | null }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-bold tabular-nums text-foreground">{value}</span>
        {delta != null && (
          <span className={cn('inline-flex items-center text-xs font-semibold', delta >= 0 ? 'text-success' : 'text-destructive')}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
      </p>
    </div>
  )
}

const ORDER_DOT: Record<string, string> = {
  nuevo: 'bg-brand-blue',
  presupuestado: 'bg-accent',
  vendido: 'bg-success',
  perdido: 'bg-muted-foreground/40',
}
const ORDER_LABEL: Record<string, string> = { nuevo: 'Nuevo', presupuestado: 'Presupuestado', vendido: 'Vendido', perdido: 'Perdido' }

export default async function AdminHome() {
  const db = await readDb()
  const active = db.products.filter((p) => p.active)
  const newOrders = db.orders.filter((o) => o.status === 'nuevo').length
  const newLeads = db.leads.filter((l) => l.status === 'nuevo').length
  const outOfStock = active.filter((p) => p.stock === 'sin_stock' || (p.variants.length > 0 && p.variants.every((v) => v.stock === 'sin_stock'))).length
  const expiring = active.filter((p) => isOnPromotion(p) && promotionEndsLabel(p)).length
  const incomplete = active.filter((p) => productQuality(p, db.categories).score < QUALITY_GOOD).length
  const missing = topSearches(db.events, 30, 50).filter((s) => s.zero > 0)

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  // Sólo lo que pide una acción, en orden de urgencia.
  const tasks: Task[] = [
    newOrders > 0 && { label: plural(newOrders, 'pedido nuevo', 'pedidos nuevos'), detail: 'Pasales el presupuesto por WhatsApp.', href: '/admin/pedidos', icon: ClipboardList, tone: 'info' },
    newLeads > 0 && { label: plural(newLeads, 'consulta nueva', 'consultas nuevas'), detail: 'Respondé desde la lista de consultas.', href: '/admin/consultas', icon: Inbox, tone: 'info' },
    outOfStock > 0 && { label: plural(outOfStock, 'producto sin stock', 'productos sin stock'), detail: 'Siguen visibles en el sitio: reponé u ocultalos.', href: '/admin/productos?estado=sin_stock', icon: PackageX, tone: 'danger' },
    expiring > 0 && { label: plural(expiring, 'promoción vence', 'promociones vencen') + ' esta semana', detail: 'Extendé la fecha o preparate para quitarlas.', href: '/admin/promociones', icon: BadgePercent, tone: 'promo' },
    incomplete > 0 && { label: plural(incomplete, 'ficha para completar', 'fichas para completar'), detail: 'Foto, precio, descripción… ayudan a vender y a aparecer en Google.', href: '/admin/productos?estado=incompletos', icon: FileWarning, tone: 'warning' },
    missing.length > 0 && { label: `Buscan “${missing[0].term}” y no lo encuentran`, detail: missing.length > 1 ? `Y ${plural(missing.length - 1, 'búsqueda más', 'búsquedas más')} sin resultados.` : 'Sumalo al catálogo o agregalo como sinónimo.', href: '/admin/busquedas', icon: SearchX, tone: 'warning' },
  ].filter(Boolean) as Task[]

  const orders = orderStats(db.orders, 30)
  const clicks = periodCompare(db.events, 'wa_click', 30)
  const views = periodCompare(db.events, 'view', 30)
  const recent = db.orders.slice(0, 5)

  return (
    <>
      <PageHeader
        title="Resumen"
        description={new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        help="resumen"
        actions={
          <Button nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos/nuevo" />}>
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        }
      />

      <section data-guide="tareas" aria-labelledby="tareas-title">
        <h2 id="tareas-title" className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
          Para atender
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Lo que necesita una acción, de lo más urgente a lo menos. Tocá una fila para resolverlo.</p>
        {tasks.length ? (
          <ul className="flex flex-col gap-2">
            {tasks.map((t) => (
              <li key={t.href + t.label}>
                <Link href={t.href} className="group flex items-center gap-4 rounded-2xl bg-card px-4 py-3.5 transition-shadow hover:shadow-md">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', TONE[t.tone])}>
                    <t.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{t.label}</span>
                    <span className="block text-sm text-muted-foreground">{t.detail}</span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-3 rounded-2xl bg-card px-4 py-4 font-medium text-foreground">
            <CheckCircle2 className="size-5 text-success" />
            Todo al día. No hay nada pendiente.
          </p>
        )}
      </section>

      <section data-guide="mes" aria-labelledby="mes-title" className="mt-10">
        <h2 id="mes-title" className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
          Últimos 30 días
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Cómo viene el sitio. La flecha compara con los 30 días anteriores.</p>
        <Panel className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <Stat label="Pedidos" value={orders.count} />
          <Stat label="Vendido por la web" value={formatPrice(orders.revenue)} />
          <Stat label="Clics a WhatsApp" value={clicks.current} delta={clicks.delta} />
          <Stat label="Vistas de productos" value={views.current} delta={views.delta} />
        </Panel>
      </section>

      {recent.length > 0 && (
      <section data-guide="ultimos-pedidos" aria-labelledby="pedidos-title" className="mt-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="pedidos-title" className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
            Últimos pedidos
          </h2>
          <Link href="/admin/pedidos" className="text-sm font-medium text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        <Panel className="p-2">
            <ul>
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href="/admin/pedidos" className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60">
                    <span className={cn('size-2 shrink-0 rounded-full', ORDER_DOT[o.status])} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        Pedido #{o.number} · {o.name || 'Sin nombre'}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {ORDER_LABEL[o.status]} · {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(o.saleAmount ?? o.estimatedTotal)}</span>
                  </Link>
                </li>
              ))}
            </ul>
        </Panel>
      </section>
      )}
    </>
  )
}
