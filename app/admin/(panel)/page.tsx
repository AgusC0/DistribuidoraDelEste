import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Eye, Inbox, Package, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BarList, ColumnChart } from '@/components/admin/charts'
import { PageHeader, Panel } from '@/components/admin/ui'
import { PriceVisibilityToggle } from '@/components/admin/price-visibility'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { readDb, topSearches } from '@/lib/db'
import { dailySeries, periodCompare, productRanking } from '@/lib/metrics'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Resumen' }

function Kpi({
  label,
  value,
  icon: Icon,
  delta,
  hint,
  href,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  delta?: number | null
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        {delta != null && (
          <span className={cn('inline-flex items-center font-semibold', delta >= 0 ? 'text-whatsapp' : 'text-destructive')}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint}
      </p>
    </>
  )
  const cls = 'rounded-xl border border-border bg-card p-5 shadow-xs'
  return href ? (
    <Link href={href} className={cn(cls, 'transition-colors hover:border-primary/40')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default async function AdminHome() {
  const db = await readDb()
  const clicks = periodCompare(db.events, 'wa_click', 30)
  const views = periodCompare(db.events, 'view', 30)
  const searches = periodCompare(db.events, 'search', 30)
  const newLeads = db.leads.filter((l) => l.status === 'nuevo')
  const active = db.products.filter((p) => p.active)
  const series = dailySeries(db.events, 'wa_click', 30)
  const ranking = productRanking(db, 30).slice(0, 6)
  const missing = topSearches(db.events, 30, 50).filter((s) => s.zero > 0).slice(0, 5)

  const alerts = [
    ...db.products
      .filter((p) => p.active && p.stock === 'sin_stock')
      .map((p) => ({ text: `${p.name} está sin stock pero visible en el sitio.`, href: `/admin/productos/${p.id}` })),
    ...db.products
      .filter((p) => p.active && (!p.image || p.image.includes('placeholder')))
      .map((p) => ({ text: `${p.name} no tiene foto.`, href: `/admin/productos/${p.id}` })),
    ...db.products
      .filter((p) => p.active && p.description.length < 30)
      .map((p) => ({ text: `${p.name} tiene una descripción muy corta.`, href: `/admin/productos/${p.id}` })),
  ]

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Cómo viene el sitio en los últimos 30 días."
        actions={
          <Button nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos/nuevo" />}>
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        }
      />

      <PriceVisibilityToggle showPrices={db.settings.showPrices} className="mb-6" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Consultas nuevas"
          value={newLeads.length}
          icon={Inbox}
          hint={`${db.leads.length} en total`}
          href="/admin/consultas"
        />
        <Kpi label="Clics a WhatsApp" value={clicks.current} icon={WhatsappIcon} delta={clicks.delta} hint="vs. 30 días anteriores" />
        <Kpi label="Vistas de productos" value={views.current} icon={Eye} delta={views.delta} hint="vs. 30 días anteriores" />
        <Kpi
          label="Productos publicados"
          value={`${active.length}/${db.products.length}`}
          icon={Package}
          hint={`${searches.current} búsquedas en el sitio`}
          href="/admin/productos"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">Clics a WhatsApp por día</h2>
          <p className="mb-4 text-sm text-muted-foreground">Cada clic es una persona iniciando una consulta.</p>
          <ColumnChart data={series} unit={['clic', 'clics']} />
        </Panel>

        <Panel>
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">Productos más consultados</h2>
          <p className="mb-4 text-sm text-muted-foreground">Clics a WhatsApp desde cada producto.</p>
          <BarList
            items={ranking.map((r) => ({
              label: r.product.name,
              value: r.clicks,
              sub: `${r.views} vistas`,
              href: `/admin/productos/${r.product.id}`,
            }))}
            empty="Cuando la gente consulte productos, vas a ver el ranking acá."
          />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">Últimas consultas</h2>
            <Link href="/admin/consultas" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {db.leads.length ? (
            <ul className="divide-y divide-border">
              {db.leads.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      l.status === 'nuevo' ? 'bg-promo' : l.status === 'contactado' ? 'bg-accent' : 'bg-muted-foreground/40',
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.product} {l.message && `· ${l.message}`}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={l.createdAt}>
                    {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(l.createdAt))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no llegaron consultas desde el formulario.</p>
          )}
        </Panel>

        <Panel>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold uppercase tracking-wide text-foreground">
            <Search aria-hidden="true" className="size-4 text-primary" />
            Buscan y no encuentran
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">Ideas de productos para sumar al catálogo.</p>
          <BarList
            items={missing.map((s) => ({ label: s.term, value: s.zero }))}
            empty="Por ahora todas las búsquedas encuentran algo."
          />
        </Panel>
      </div>

      {alerts.length > 0 && (
        <Panel className="mt-6">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold uppercase tracking-wide text-foreground">
            <AlertTriangle aria-hidden="true" className="size-4 text-promo" />
            Para revisar
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {alerts.slice(0, 8).map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="text-sm text-foreground hover:text-primary hover:underline">
                  {a.text}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
