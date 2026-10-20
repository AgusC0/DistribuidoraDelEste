'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import { ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { CATALOG_EVENT, SearchBox } from '@/components/search-box'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog } from '@/components/catalog-provider'
import { correction, search } from '@/lib/search'
import { minPrice } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

type Sort = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre' | 'nuevos'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'relevancia', label: 'Destacados' },
  { value: 'precio-asc', label: 'Menor precio' },
  { value: 'precio-desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'Nombre (A–Z)' },
  { value: 'nuevos', label: 'Más nuevos' },
]
const PER_PAGE = [12, 24, 48]

type Filters = { q: string; cat: string; sort: Sort; page: number; perPage: number; stock: boolean; promo: boolean }
const DEFAULTS: Filters = { q: '', cat: '', sort: 'relevancia', page: 1, perPage: 12, stock: false, promo: false }

function readUrl(): Filters {
  const p = new URLSearchParams(window.location.search)
  const sort = p.get('orden') as Sort
  const perPage = Number(p.get('por'))
  return {
    q: p.get('q') ?? '',
    cat: p.get('categoria') ?? '',
    sort: SORTS.some((s) => s.value === sort) ? sort : 'relevancia',
    page: Math.max(1, Number(p.get('pagina')) || 1),
    perPage: PER_PAGE.includes(perPage) ? perPage : 12,
    stock: p.get('stock') === '1',
    promo: p.get('promo') === '1',
  }
}

function toUrl(f: Filters) {
  const p = new URLSearchParams()
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.cat) p.set('categoria', f.cat)
  if (f.sort !== 'relevancia') p.set('orden', f.sort)
  if (f.stock) p.set('stock', '1')
  if (f.promo) p.set('promo', '1')
  if (f.perPage !== 12) p.set('por', String(f.perPage))
  if (f.page > 1) p.set('pagina', String(f.page))
  const qs = p.toString()
  return `/productos${qs ? `?${qs}` : ''}`
}

/** Catálogo completo: búsqueda, filtros, orden y paginación, todo reflejado en la URL. */
export function ProductsBrowser() {
  const { products, categories, index } = useCatalog()
  const [f, setF] = useState<Filters>(DEFAULTS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const ready = useRef(false)
  const gridTop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setF(readUrl())
    sync()
    ready.current = true
    window.addEventListener(CATALOG_EVENT, sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener(CATALOG_EVENT, sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // Filtros: reemplazan la URL. Cambio de página: entrada nueva en el historial (el botón Atrás vuelve).
  const update = (patch: Partial<Filters>, { push = false } = {}) => {
    const next = { ...f, ...patch, page: patch.page ?? 1 }
    setF(next)
    const url = toUrl(next)
    if (ready.current && url !== window.location.pathname + window.location.search) {
      window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url)
    }
  }

  const matching = useMemo<Product[]>(() => {
    const base = f.q.trim()
      ? search(index, f.q).map((h) => h.product)
      : [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.promo) - Number(a.promo))
    return base.filter((p) => (!f.stock || p.stock !== 'sin_stock') && (!f.promo || p.promo))
  }, [f.q, f.stock, f.promo, products, index])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of matching) map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1)
    return map
  }, [matching])

  const activeCategory = categories.find((c) => c.slug === f.cat)

  const results = useMemo(() => {
    const list = activeCategory ? matching.filter((p) => p.categoryId === activeCategory.id) : matching
    if (f.sort === 'relevancia') return list
    const priced = (p: Product, dir: 1 | -1) => {
      const price = minPrice(p)
      return price == null ? Infinity : price * dir
    }
    return [...list].sort((a, b) => {
      if (f.sort === 'precio-asc') return priced(a, 1) - priced(b, 1)
      if (f.sort === 'precio-desc') return priced(a, -1) - priced(b, -1)
      if (f.sort === 'nuevos') return b.createdAt.localeCompare(a.createdAt)
      return a.name.localeCompare(b.name, 'es')
    })
  }, [matching, activeCategory, f.sort])

  const totalPages = Math.max(1, Math.ceil(results.length / f.perPage))
  const page = Math.min(f.page, totalPages)
  const pageItems = results.slice((page - 1) * f.perPage, page * f.perPage)
  const from = results.length ? (page - 1) * f.perPage + 1 : 0
  const to = Math.min(page * f.perPage, results.length)

  const fix = useMemo(
    () => (results.length === 0 && f.q.trim().length >= 3 ? correction(index, f.q) : null),
    [results.length, f.q, index],
  )

  function goToPage(p: number) {
    update({ page: p }, { push: true })
    gridTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chips = [
    f.q.trim() && { label: `“${f.q.trim()}”`, clear: () => update({ q: '' }) },
    activeCategory && { label: activeCategory.name, clear: () => update({ cat: '' }) },
    f.stock && { label: 'En stock', clear: () => update({ stock: false }) },
    f.promo && { label: 'En promo', clear: () => update({ promo: false }) },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  const filterPanel = (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Categorías</legend>
        <ul className="flex flex-col gap-0.5">
          {[{ id: '', slug: '', name: 'Todas' }, ...categories].map((c) => {
            const count = c.id ? (counts.get(c.id) ?? 0) : matching.length
            const active = f.cat === c.slug
            return (
              <li key={c.slug || 'todas'}>
                <button
                  type="button"
                  onClick={() => {
                    update({ cat: c.slug })
                    setFiltersOpen(false)
                  }}
                  aria-pressed={active}
                  disabled={!count && !active}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:opacity-40',
                    active ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted',
                  )}
                >
                  {c.name}
                  <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mostrar</legend>
        {[
          { key: 'stock' as const, label: 'Sólo en stock' },
          { key: 'promo' as const, label: 'Sólo promociones' },
        ].map((o) => (
          <label key={o.key} className="flex cursor-pointer items-center gap-3 px-3 text-sm">
            <input
              type="checkbox"
              checked={f[o.key]}
              onChange={(e) => update({ [o.key]: e.target.checked })}
              className="size-4 accent-primary"
            />
            {o.label}
          </label>
        ))}
      </fieldset>
      <div className="rounded-xl bg-secondary/70 p-4 text-sm">
        <p className="font-semibold">¿No encontrás algo?</p>
        <p className="mt-1 text-muted-foreground">Tenemos mucho más en el local.</p>
        <WaLink source="catalogo-filtros" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-whatsapp hover:underline">
          <WhatsappIcon className="size-4" />
          Preguntanos por WhatsApp
        </WaLink>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-4 text-sm text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-4" />
          <li aria-current="page" className="font-medium text-foreground">
            Productos
          </li>
        </ol>
      </nav>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {activeCategory ? activeCategory.name : 'Catálogo completo'}
        </h1>
        <p className="text-muted-foreground">
          {activeCategory?.description || 'Sanitarios, conducción de agua y corralón. Armá tu pedido y pedí presupuesto por WhatsApp.'}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBox
              value={f.q}
              onValueChange={(q) => update({ q })}
              onSubmit={(q) => update({ q })}
              placeholder="Buscar en el catálogo…"
              className="w-full sm:flex-1"
            />
            <div className="flex gap-2">
              <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
                <Dialog.Trigger
                  render={<Button variant="outline" className="h-12 flex-1 px-4 lg:hidden" />}
                >
                  <SlidersHorizontal className="size-4" />
                  Filtros
                  {chips.length > 0 && (
                    <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{chips.length}</span>
                  )}
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-blue/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
                  <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] overflow-y-auto bg-background p-5 shadow-2xl transition-transform duration-300 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full">
                    <div className="mb-6 flex items-center justify-between">
                      <Dialog.Title className="font-heading text-lg font-semibold uppercase">Filtros</Dialog.Title>
                      <Dialog.Close aria-label="Cerrar filtros" className="flex size-9 items-center justify-center rounded-lg hover:bg-muted">
                        <X className="size-5" />
                      </Dialog.Close>
                    </div>
                    {filterPanel}
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
              <select
                value={f.sort}
                onChange={(e) => update({ sort: e.target.value as Sort })}
                aria-label="Ordenar por"
                className="h-12 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:flex-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div ref={gridTop} className="flex min-h-10 scroll-mt-24 flex-wrap items-center justify-between gap-3 pt-5" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {results.length ? (
                  <>
                    Mostrando <strong className="text-foreground">{from}–{to}</strong> de {results.length}{' '}
                    {results.length === 1 ? 'producto' : 'productos'}
                  </>
                ) : (
                  'Sin resultados'
                )}
              </p>
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-muted/70"
                  aria-label={`Quitar filtro ${c.label}`}
                >
                  {c.label}
                  <X className="size-3" />
                </button>
              ))}
              {chips.length > 1 && (
                <button type="button" onClick={() => update({ ...DEFAULTS, perPage: f.perPage })} className="text-xs font-medium text-primary hover:underline">
                  Limpiar todo
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Ver
              <select
                value={f.perPage}
                onChange={(e) => update({ perPage: Number(e.target.value) })}
                className="h-9 rounded-lg border border-input bg-card px-2 text-sm text-foreground"
              >
                {PER_PAGE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              por página
            </label>
          </div>

          {pageItems.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((p, i) => (
                <ProductCard key={p.id} product={p} query={f.q} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <SearchX aria-hidden="true" className="size-6" />
              </span>
              <div>
                <p className="font-semibold">No encontramos productos con esos filtros.</p>
                {fix && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    ¿Quisiste decir{' '}
                    <button type="button" onClick={() => update({ q: fix })} className="font-semibold text-primary underline underline-offset-4">
                      {fix}
                    </button>
                    ?
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {f.q.trim() && (
                  <Button
                    nativeButton={false}
                    className="h-10 bg-whatsapp px-4 text-whatsapp-foreground hover:bg-whatsapp/90"
                    render={<WaLink source="catalogo-sin-resultados" message={`Hola Distribuidora del Este, ¿tienen ${f.q.trim()}?`} />}
                  >
                    <WhatsappIcon className="size-4" />
                    Preguntar por “{f.q.trim()}”
                  </Button>
                )}
                <Button variant="outline" className="h-10 px-4" onClick={() => update({ ...DEFAULTS, perPage: f.perPage })}>
                  Ver todo el catálogo
                </Button>
              </div>
            </div>
          )}

          <div className="mt-12">
            <Pagination page={page} total={totalPages} onChange={goToPage} />
          </div>
        </div>
      </div>
    </div>
  )
}
