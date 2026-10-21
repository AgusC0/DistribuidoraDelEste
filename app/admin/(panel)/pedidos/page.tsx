import type { Metadata } from 'next'
import { BarList } from '@/components/admin/charts'
import { OrderList } from '@/components/admin/order-list'
import { PageHeader, Panel } from '@/components/admin/ui'
import { readDb } from '@/lib/db'
import { orderedProducts, orderStats } from '@/lib/metrics'
import { formatPrice } from '@/lib/site'

export const metadata: Metadata = { title: 'Pedidos' }

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default async function OrdersPage() {
  const db = await readDb()
  const stats = orderStats(db.orders, 30)
  const top = orderedProducts(db.orders, 30).slice(0, 6)

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Cada pedido que arman en el sitio y mandan por WhatsApp. Marcá el seguimiento y cargá lo vendido para ver cuánto vende la web."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Pedidos (30 días)" value={stats.count} hint={`${stats.open} sin cerrar`} />
        <Stat label="Vendidos" value={stats.sold} hint={stats.conversion != null ? `${stats.conversion}% de los cerrados` : 'Todavía no hay pedidos cerrados'} />
        <Stat label="Vendido por la web" value={formatPrice(stats.revenue)} hint="Suma de los montos vendidos" />
        <Stat label="Ticket promedio" value={stats.averageTicket != null ? formatPrice(stats.averageTicket) : '—'} hint="Por pedido vendido" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OrderList orders={db.orders} />
        </div>
        <Panel className="self-start">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">Lo más pedido</h2>
          <p className="mb-4 text-sm text-muted-foreground">Unidades en pedidos de los últimos 30 días.</p>
          <BarList
            items={top.map((t) => ({
              label: t.name,
              value: t.units,
              sub: `${t.orders} ${t.orders === 1 ? 'pedido' : 'pedidos'}`,
              href: `/admin/productos/${t.productId}`,
            }))}
            empty="Cuando lleguen pedidos vas a ver qué productos se piden más."
          />
        </Panel>
      </div>
    </>
  )
}
