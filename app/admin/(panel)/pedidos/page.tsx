import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { BarList } from '@/components/admin/charts'
import { OrderList } from '@/components/admin/order-list'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader, Panel } from '@/components/admin/ui'
import { readDb } from '@/lib/db'
import { orderedProducts, orderStats } from '@/lib/metrics'
import { formatPrice } from '@/lib/site'

export const metadata: Metadata = { title: 'Pedidos' }

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
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
        help="pedidos"
      />

      {db.orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Todavía no llegaron pedidos"
          steps={[
            'El cliente suma productos con "Agregar al pedido" mientras recorre el sitio.',
            'Abre "Mi pedido" y toca "Pedir presupuesto por WhatsApp".',
            'Te llega el mensaje por WhatsApp y el pedido queda guardado acá con cada producto, código y precio.',
            'Le pasás el presupuesto y marcás el estado: presupuestado, vendido o perdido.',
          ]}
        >
          Acá vas a ver cada pedido que arme un cliente en el sitio. Así funciona:
        </EmptyState>
      ) : (
        <>
          <Panel data-guide="pedidos-stats" className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <Stat label="Pedidos (30 días)" value={stats.count} hint={`${stats.open} sin cerrar`} />
            <Stat
              label="Vendidos"
              value={stats.sold}
              hint={stats.conversion != null ? `${stats.conversion}% de los cerrados` : 'Ninguno cerrado todavía'}
            />
            <Stat label="Vendido por la web" value={formatPrice(stats.revenue)} hint="Suma de los montos vendidos" />
            <Stat label="Ticket promedio" value={stats.averageTicket != null ? formatPrice(stats.averageTicket) : '—'} hint="Por pedido vendido" />
          </Panel>

          <div className={top.length ? 'mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3' : 'mt-6'}>
            <div className="lg:col-span-2">
              <OrderList orders={db.orders} />
            </div>
            {top.length > 0 && (
              <Panel data-guide="mas-pedido" className="self-start">
                <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">Lo más pedido</h2>
                <p className="mb-4 text-sm text-muted-foreground">Unidades en pedidos de los últimos 30 días. Sirve para decidir qué reponer.</p>
                <BarList
                  items={top.map((t) => ({
                    label: t.name,
                    value: t.units,
                    sub: `${t.orders} ${t.orders === 1 ? 'pedido' : 'pedidos'}`,
                    href: `/admin/productos/${t.productId}`,
                  }))}
                />
              </Panel>
            )}
          </div>
        </>
      )}
    </>
  )
}
