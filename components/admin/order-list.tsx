'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, ClipboardList, Copy, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, inputClass, Panel } from '@/components/admin/ui'
import { deleteOrder, saveOrderNotes, saveOrderSale, setOrderStatus } from '@/app/admin/actions'
import { normalize } from '@/lib/search'
import { formatPrice } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

export const ORDER_STATUS: Record<OrderStatus, { label: string; plural: string; className: string }> = {
  nuevo: { label: 'Nuevo', plural: 'Nuevos', className: 'bg-brand-blue/10 text-brand-blue' },
  presupuestado: { label: 'Presupuestado', plural: 'Presupuestados', className: 'bg-accent/20 text-accent-foreground' },
  vendido: { label: 'Vendido', plural: 'Vendidos', className: 'bg-whatsapp/15 text-whatsapp' },
  perdido: { label: 'Perdido', plural: 'Perdidos', className: 'bg-muted text-muted-foreground' },
}

const dateFormat = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' })

/** Texto del pedido para pegar en WhatsApp o en el sistema de facturación. */
function orderText(order: Order) {
  const lines = order.items.map((i) => {
    const label = i.variantName ? `${i.name} – ${i.variantName}` : i.name
    const price = i.price != null ? ` – ${formatPrice(i.price * i.quantity)}` : ''
    return `${i.quantity} x ${label}${i.sku ? ` (cód. ${i.sku})` : ''}${price}`
  })
  return [`Pedido #${order.number}${order.name ? ` – ${order.name}` : ''}`, ...lines, `Total estimado: ${formatPrice(order.estimatedTotal)}`].join('\n')
}

function SaleInput({ order }: { order: Order }) {
  const [value, setValue] = useState(order.saleAmount?.toString() ?? '')
  const [pending, start] = useTransition()
  function save() {
    const digits = value.replace(/[^0-9]/g, '')
    const next = digits ? Number(digits) : null
    if (next !== order.saleAmount) start(() => saveOrderSale(order.id, next))
  }
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-whatsapp">Monto vendido</span>
      <span className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          inputMode="numeric"
          placeholder="0"
          className={cn(inputClass, 'h-9 w-36 pl-6 tabular-nums', pending && 'opacity-60')}
        />
      </span>
    </label>
  )
}

function OrderCard({ order }: { order: Order }) {
  const [notes, setNotes] = useState(order.notes)
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()
  const units = order.items.reduce((n, i) => n + i.quantity, 0)
  const unpriced = order.items.filter((i) => i.price == null).length

  return (
    <li className={cn('flex flex-col gap-4 p-5', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">
            Pedido #{order.number}
            <span className="font-normal text-muted-foreground"> · {order.name || 'Sin nombre'}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {dateFormat.format(new Date(order.createdAt))} · {units} {units === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
        <select
          value={order.status}
          onChange={(e) => start(() => setOrderStatus(order.id, e.target.value as OrderStatus))}
          aria-label={`Estado del pedido #${order.number}`}
          className={cn('h-8 rounded-full border-0 px-3 text-xs font-semibold', ORDER_STATUS[order.status].className)}
        >
          {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-14 px-3 py-2 text-center font-medium">Cant.</th>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i, idx) => (
              <tr key={`${i.productId}-${i.variantId ?? ''}-${idx}`} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-center font-semibold tabular-nums">{i.quantity}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/productos/${i.productId}`} className="font-medium hover:text-primary">
                    {i.name}
                  </Link>
                  {i.variantName && <span className="block text-xs text-muted-foreground">{i.variantName}</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i.sku || '—'}</td>
                <td className={cn('px-3 py-2 text-right tabular-nums', i.price == null && 'text-muted-foreground')}>
                  {i.price != null ? formatPrice(i.price * i.quantity) : 'A consultar'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/20">
              <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">
                Total estimado{unpriced > 0 && ` (sin ${unpriced} a consultar)`}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatPrice(order.estimatedTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {order.note && (
        <p className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
          <span className="font-medium">Comentario del cliente: </span>
          {order.note}
        </p>
      )}

      {order.status === 'vendido' && <SaleInput key={order.saleAmount ?? 'null'} order={order} />}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== order.notes && start(() => saveOrderNotes(order.id, notes))}
        rows={2}
        placeholder="Notas internas: a quién se le pasó presupuesto, forma de pago… (se guardan solas)"
        aria-label={`Notas del pedido #${order.number}`}
        className={cn(inputClass, 'h-auto py-2')}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(orderText(order))
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch {}
          }}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copiado' : 'Copiar pedido'}
        </Button>
        <ConfirmButton
          variant="ghost"
          size="sm"
          className="ml-auto h-9 text-destructive hover:bg-destructive/10"
          title="¿Eliminar pedido?"
          description={`Se borra el pedido #${order.number}. Esta acción no se puede deshacer.`}
          onConfirm={() => deleteOrder(order.id)}
        >
          <Trash2 className="size-4" />
          Eliminar
        </ConfirmButton>
      </div>
    </li>
  )
}

export function OrderList({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<OrderStatus | 'todos'>('todos')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query.trim().replace(/^#/, ''))
    return orders.filter(
      (o) =>
        (tab === 'todos' || o.status === tab) &&
        (!q ||
          normalize(`${o.number} ${o.name} ${o.note} ${o.notes} ${o.items.map((i) => `${i.name} ${i.variantName ?? ''} ${i.sku ?? ''}`).join(' ')}`).includes(q)),
    )
  }, [orders, tab, query])

  const tabs = [
    { value: 'todos' as const, label: 'Todos', count: orders.length },
    ...(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({
      value: s,
      label: ORDER_STATUS[s].plural,
      count: orders.filter((o) => o.status === s).length,
    })),
  ]

  return (
    <Panel className="p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Filtrar por estado">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label} <span className="tabular-nums text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, nombre, producto…"
            aria-label="Buscar pedidos"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
      </div>
      {filtered.length ? (
        <ul className="divide-y divide-border">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardList aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {orders.length
              ? 'No hay pedidos con esos filtros.'
              : 'Cuando alguien arme un pedido en el sitio y lo mande por WhatsApp, queda registrado acá con todos los productos.'}
          </p>
        </div>
      )}
    </Panel>
  )
}
