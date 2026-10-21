import type { Metadata } from 'next'
import { BarList, ColumnChart } from '@/components/admin/charts'
import { ClearMetricsButton } from '@/components/admin/clear-metrics-button'
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { PageHeader, Panel } from '@/components/admin/ui'
import { readDb, topSearches } from '@/lib/db'
import { clicksBySource, dailySeries, SOURCE_LABEL } from '@/lib/metrics'

export const metadata: Metadata = { title: 'Búsquedas y métricas' }

export default async function SearchesPage() {
  const db = await readDb()
  const top = topSearches(db.events, 30, 100)
  const total = top.reduce((s, t) => s + t.count, 0)
  const zero = top.reduce((s, t) => s + t.zero, 0)
  const recent = db.events.filter((e) => e.type === 'search').slice(-15).reverse()
  const sources = clicksBySource(db.events, 30)
  const missing = top.filter((t) => t.zero > 0).slice(0, 10)
  const empty = total === 0 && sources.length === 0

  return (
    <>
      <PageHeader
        title="Búsquedas y métricas"
        description="Qué busca la gente en el sitio y desde dónde inicia consultas. Datos anónimos de los últimos 30 días."
        actions={!empty && <ClearMetricsButton />}
        help="busquedas"
      />

      {empty ? (
        <EmptyState icon={SearchX} title="Todavía no hay búsquedas">
          Cuando la gente use el buscador del sitio o toque los botones de WhatsApp, vas a ver acá qué busca, qué no encuentra y desde dónde te escribe. Los
          datos son anónimos y cubren los últimos 30 días.
        </EmptyState>
      ) : (
        <>

      <Panel className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { label: 'Búsquedas', value: total },
          { label: 'Términos distintos', value: top.length },
          { label: 'Sin resultados', value: total ? `${Math.round((zero / total) * 100)}%` : '—' },
        ].map((k) => (
          <div key={k.label}>
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-heading text-3xl font-bold tabular-nums">{k.value}</p>
          </div>
        ))}
      </Panel>

      {total > 0 && (
        <Panel className="mt-6">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Búsquedas por día</h2>
          <p className="mb-4 text-sm text-muted-foreground">Cuántas veces usaron el buscador del sitio cada día.</p>
          <ColumnChart data={dailySeries(db.events, 'search', 30)} unit={['búsqueda', 'búsquedas']} />
        </Panel>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {top.length > 0 && (
        <Panel data-guide="mas-buscado">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Lo más buscado</h2>
          <p className="mb-4 text-sm text-muted-foreground">Aparecen como sugerencias en el buscador del sitio.</p>
          <BarList items={top.slice(0, 10).map((t) => ({ label: t.term, value: t.count }))} />
        </Panel>
        )}
        {missing.length > 0 && (
        <Panel data-guide="sin-resultados">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Buscan y no encuentran</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Sumá estos productos o agregá la palabra como etiqueta a uno existente.
          </p>
          <BarList items={missing.map((t) => ({ label: t.term, value: t.zero }))} />
        </Panel>
        )}
        {sources.length > 0 && (
        <Panel data-guide="origen">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Clics a WhatsApp por origen</h2>
          <p className="mb-4 text-sm text-muted-foreground">Qué botones del sitio generan más consultas.</p>
          <BarList items={sources.map((s) => ({ label: SOURCE_LABEL[s.label] ?? s.label, value: s.value }))} />
        </Panel>
        )}
        {recent.length > 0 && (
        <Panel>
          <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Búsquedas recientes</h2>
          <p className="mb-4 text-sm text-muted-foreground">Las últimas 15, con cuántos resultados encontraron.</p>
          {(
            <ul className="divide-y divide-border text-sm">
              {recent.map((e, i) =>
                e.type === 'search' ? (
                  <li key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-foreground">{e.q}</span>
                    <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className={e.results === 0 ? 'font-semibold text-destructive' : ''}>
                        {e.results} {e.results === 1 ? 'resultado' : 'resultados'}
                      </span>
                      <time dateTime={e.ts}>
                        {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(e.ts))}
                      </time>
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </Panel>
        )}
      </div>
        </>
      )}
    </>
  )
}
