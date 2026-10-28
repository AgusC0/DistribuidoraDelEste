'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { ChevronDown, ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { CATALOG_EVENT, SearchBox } from '@/components/search-box'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog, useFullCatalog } from '@/components/catalog-provider'
import {
  attributeValues,
  categoryPath,
  categoryUrl,
  childCategories,
  descendantIds,
  discountPercent,
  effectiveFilters,
  isOnPromotion,
  rootCategories,
  sortValues,
} from '@/lib/catalog'
import { correction, search } from '@/lib/search'
import { formatPrice, minPrice, slugify } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/lib/types'

type Sort = 'relevancia' | 'precio-asc' | 'precio-desc' | 'descuento' | 'nombre' | 'nuevos'

const SORTS: { value: Sort; label: string; needsPrices?: boolean }[] = [
  { value: 'relevancia', label: 'Destacados' },
  { value: 'precio-asc', label: 'Menor precio', needsPrices: true },
  { value: 'precio-desc', label: 'Mayor precio', needsPrices: true },
  { value: 'descuento', label: 'Mayor descuento' },
  { value: 'nombre', label: 'Nombre (A–Z)' },
  { value: 'nuevos', label: 'Más nuevos' },
]
const PER_PAGE = [12, 24, 48]

/** Parámetros de la URL que no son filtros de atributos. */
const RESERVED = new Set(['q', 'marca', 'min', 'max', 'stock', 'oferta', 'orden', 'pagina', 'por', 'categoria'])

type State = {
  q: string
  /** Filtros multi-valor: marca y atributos de la categoría (tipo, medida…). */
  facets: Record<string, string[]>
  min: number | null
  max: number | null
  stock: boolean
  oferta: boolean
  sort: Sort
  page: number
  perPage: number
}
const EMPTY: State = { q: '', facets: {}, min: null, max: null, stock: false, oferta: false, sort: 'relevancia', page: 1, perPage: 12 }

function readUrl(): State {
  const p = new URLSearchParams(window.location.search)
  const facets: Record<string, string[]> = {}
  for (const key of new Set(p.keys())) {
    if (key === 'marca' || !RESERVED.has(key)) facets[key] = p.getAll(key).filter(Boolean)
  }
  const sort = p.get('orden') as Sort
  const perPage = Number(p.get('por'))
  const num = (v: string | null) => (v && Number(v) >= 0 ? Number(v) : null)
  return {
    q: p.get('q') ?? '',
    facets,
    min: num(p.get('min')),
    max: num(p.get('max')),
    stock: p.get('stock') === '1',
    oferta: p.get('oferta') === '1',
    sort: SORTS.some((s) => s.value === sort) ? sort : 'relevancia',
    page: Math.max(1, Number(p.get('pagina')) || 1),
    perPage: PER_PAGE.includes(perPage) ? perPage : 12,
  }
}

function toQuery(s: State) {
  const p = new URLSearchParams()
  if (s.q.trim()) p.set('q', s.q.trim())
  for (const [key, values] of Object.entries(s.facets)) values.forEach((v) => p.append(key, v))
  if (s.min != null) p.set('min', String(s.min))
  if (s.max != null) p.set('max', String(s.max))
  if (s.stock) p.set('stock', '1')
  if (s.oferta) p.set('oferta', '1')
  if (s.sort !== 'relevancia') p.set('orden', s.sort)
  if (s.perPage !== 12) p.set('por', String(s.perPage))
  if (s.page > 1) p.set('pagina', String(s.page))
  const qs = p.toString()
  return qs ? `?${qs}` : ''
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group/acc border-b border-border py-4 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open/acc:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

function OptionList({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; count: number }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  const [all, setAll] = useState(false)
  const shown = all ? options : options.slice(0, 8)
  return (
    <ul className="flex flex-col gap-0.5">
      {shown.map((o) => {
        const checked = selected.includes(o.value)
        return (
          <li key={o.value}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                !o.count && !checked && 'opacity-40',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!o.count && !checked}
                onChange={() => onToggle(o.value)}
                className="size-4 shrink-0 accent-primary"
              />
              <span className={cn('flex-1', checked && 'font-semibold')}>{o.value}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{o.count}</span>
            </label>
          </li>
        )
      })}
      {options.length > 8 && (
        <li>
          <button type="button" onClick={() => setAll((v) => !v)} className="px-2 py-1 text-sm font-medium text-primary hover:underline">
            {all ? 'Ver menos' : `Ver ${options.length - 8} más`}
          </button>
        </li>
      )}
    </ul>
  )
}

/**
 * Catálogo jerárquico: Rubro → Subcategoría → filtros propios de esa categoría → productos.
 * Es el catálogo completo: las promociones se reconocen por su etiqueta, sin dominar la página.
 *
 * La primera página llega armada desde el servidor (`initial`), así se ve al instante y Google la lee.
 * Para filtrar, ordenar y buscar se descarga el catálogo liviano una sola vez (queda en caché).
 */
export function ProductsBrowser({ categoryId, initial }: { categoryId?: string; initial: { items: Product[]; total: number } }) {
  const { categories, categoryCounts, settings } = useCatalog()
  const full = useFullCatalog()
  const { index, ready: catalogReady } = full
  const products = catalogReady ? full.products : initial.items
  const router = useRouter()
  const [s, setS] = useState<State>(EMPTY)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const ready = useRef(false)
  const listTop = useRef<HTMLDivElement>(null)

  const category = categories.find((c) => c.id === categoryId)
  const path = category ? categoryPath(categories, category.id) : []
  const parent = path.length > 1 ? path[path.length - 2] : undefined
  const scope = useMemo(() => (category ? descendantIds(categories, category.id) : null), [categories, category])
  const sorts = SORTS.filter((o) => settings.showPrices || !o.needsPrices)

  // Filtros de esta categoría (en un rubro: los que comparten todas sus subcategorías).
  // Filtros propios o heredados (Inodoros usa los de Sanitarios); en un rubro, los que comparten sus subcategorías.
  const attrFilters = useMemo(
    () => (category ? effectiveFilters(categories, category.id).filter((f) => !RESERVED.has(f.key)) : []),
    [categories, category],
  )

  useEffect(() => {
    // Enlaces viejos: /productos?categoria=canerias → /categoria/agua-y-canerias/canerias
    const legacy = new URLSearchParams(window.location.search).get('categoria')
    if (legacy && !categoryId) {
      const c = categories.find((x) => x.slug === legacy)
      if (c) {
        router.replace(categoryUrl(categories, c.id))
        return
      }
    }
    const sync = () => setS(readUrl())
    sync()
    ready.current = true
    window.addEventListener(CATALOG_EVENT, sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener(CATALOG_EVENT, sync)
      window.removeEventListener('popstate', sync)
    }
  }, [categories, categoryId, router])

  function update(patch: Partial<State>, { push = false } = {}) {
    const next = { ...s, ...patch, page: patch.page ?? 1 }
    setS(next)
    const url = window.location.pathname + toQuery(next)
    if (ready.current && url !== window.location.pathname + window.location.search) {
      window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', url)
    }
  }

  const toggleFacet = (key: string, value: string) => {
    const current = s.facets[key] ?? []
    const values = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    const facets = { ...s.facets, [key]: values }
    if (!values.length) delete facets[key]
    update({ facets })
  }

  /* ---------- filtrado ---------- */

  const searched = useMemo<Product[]>(() => {
    if (s.q.trim()) return search(index, s.q).map((h) => h.product)
    return [...products].sort((a, b) => Number(b.featured) - Number(a.featured))
  }, [s.q, products, index])

  const inScope = useMemo(() => (scope ? searched.filter((p) => scope.has(p.categoryId)) : searched), [searched, scope])

  // En un rubro, sus subcategorías también son un filtro de casillas: se pueden marcar varias
  // (ej: Griferías + Sanitarios dentro de Baño). Cada producto vale por la subcategoría que lo contiene.
  const subOf = useMemo(() => {
    const map = new Map<string, string>()
    if (category) for (const child of childCategories(categories, category.id)) for (const id of descendantIds(categories, child.id)) map.set(id, child.name)
    return map
  }, [categories, category])

  const groups = useMemo(
    () => [...(subOf.size ? [{ key: 'sub', label: 'Subcategoría' }] : []), { key: 'marca', label: 'Marca' }, ...attrFilters],
    [attrFilters, subOf],
  )

  const valuesOf = (p: Product, key: string) => {
    if (key === 'sub') return subOf.has(p.categoryId) ? [subOf.get(p.categoryId)!] : []
    return key === 'marca' ? (p.brand ? [p.brand] : []) : attributeValues(p, key)
  }

  const priceOk = (p: Product) => {
    if (s.min == null && s.max == null) return true
    const price = minPrice(p)
    return price != null && (s.min == null || price >= s.min) && (s.max == null || price <= s.max)
  }

  // `except`: para contar las opciones de un grupo se ignora ese mismo grupo (así se pueden sumar marcas).
  const passes = (p: Product, except?: string) =>
    (!s.stock || p.stock !== 'sin_stock') &&
    (!s.oferta || isOnPromotion(p)) &&
    (!settings.showPrices || priceOk(p)) &&
    groups.every(({ key }) => {
      const selected = s.facets[key]
      return key === except || !selected?.length || valuesOf(p, key).some((v) => selected.includes(v))
    })

  const filtered = inScope.filter((p) => passes(p))

  const facetOptions = groups
    .map((g) => {
      const counts = new Map<string, number>()
      for (const p of inScope) {
        if (!passes(p, g.key)) continue
        for (const v of new Set(valuesOf(p, g.key))) counts.set(v, (counts.get(v) ?? 0) + 1)
      }
      for (const v of s.facets[g.key] ?? []) if (!counts.has(v)) counts.set(v, 0)
      return { ...g, options: sortValues([...counts.keys()]).map((value) => ({ value, count: counts.get(value)! })) }
    })
    .filter((g) => g.options.length > 0)

  const priceBounds = useMemo(() => {
    const prices = inScope.map(minPrice).filter((p): p is number => p != null)
    return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null
  }, [inScope])


  /** Si se filtró por una opción de variante (ej: Medida 25 mm), la ficha abre con esa variante elegida. */
  const preferredVariant = (p: Product) => {
    const matching = Object.entries(s.facets).filter(([key, sel]) => sel.length && p.options.some((o) => slugify(o.name) === key))
    if (!matching.length) return undefined
    return p.variants.find((v) =>
      matching.every(([key, sel]) => {
        const option = p.options.find((o) => slugify(o.name) === key)!
        return sel.includes(v.options[option.name])
      }),
    )?.id
  }

  // Ordenar unos miles de productos lleva menos de un milisegundo: se hace en cada render.
  const results = (() => {
    const list = filtered
    const priced = (p: Product, dir: 1 | -1) => {
      const price = minPrice(p)
      return price == null ? Infinity : price * dir
    }
    const sort = !settings.showPrices && SORTS.find((o) => o.value === s.sort)?.needsPrices ? 'relevancia' : s.sort
    if (sort === 'relevancia') return list
    return [...list].sort((a, b) => {
      if (sort === 'precio-asc') return priced(a, 1) - priced(b, 1)
      if (sort === 'precio-desc') return priced(a, -1) - priced(b, -1)
      if (sort === 'descuento') return (isOnPromotion(b) ? (discountPercent(b) ?? 1) : 0) - (isOnPromotion(a) ? (discountPercent(a) ?? 1) : 0)
      if (sort === 'nuevos') return b.createdAt.localeCompare(a.createdAt)
      return a.name.localeCompare(b.name, 'es')
    })
  })()

  // Con filtros en la URL (ej: llegó desde "Ver promociones") no se muestra la primera página sin filtrar mientras carga.
  const hasUrlState = !!(s.q.trim() || Object.keys(s.facets).length || s.min != null || s.max != null || s.stock || s.oferta || s.sort !== 'relevancia' || s.page > 1)
  const loading = !catalogReady && hasUrlState
  const totalPages = Math.max(1, Math.ceil((catalogReady ? results.length : initial.total) / s.perPage))
  const page = Math.min(s.page, totalPages)
  const pageItems = results.slice((page - 1) * s.perPage, page * s.perPage)
  const from = results.length ? (page - 1) * s.perPage + 1 : 0
  const to = Math.min(page * s.perPage, results.length)

  const fix = useMemo(
    () => (results.length === 0 && s.q.trim().length >= 3 ? correction(index, s.q) : null),
    [results.length, s.q, index],
  )

  // Conteo por categoría (respeta la búsqueda, no los filtros). Hasta que baja el catálogo, el del servidor.
  const categoryCount = (id: string) => {
    if (!catalogReady) return categoryCounts[id] ?? 0
    const ids = descendantIds(categories, id)
    return searched.filter((p) => ids.has(p.categoryId)).length
  }

  const qs = s.q.trim() ? `?q=${encodeURIComponent(s.q.trim())}` : ''
  const hrefFor = (c?: Category) => (c ? categoryUrl(categories, c.id) : '/productos') + qs

  const brands = s.facets.marca ?? []
  // Marcas de la categoría (o de sus subcategorías, en un rubro) que tienen productos acá, en el orden cargado.
  const brandShortcuts = (() => {
    if (!category || !catalogReady) return []
    const listed = category.brands?.length ? category.brands : childCategories(categories, category.id).flatMap((c) => c.brands ?? [])
    const present = new Map(inScope.map((p) => [p.brand.toLowerCase(), p.brand]))
    return [...new Set(listed.map((b) => present.get(b.toLowerCase())).filter((b): b is string => !!b))]
  })()
  const singleBrand = brands.length === 1 ? brands[0] : null
  const title = `${category?.name ?? (s.oferta ? 'Promociones' : 'Todos los productos')}${singleBrand ? ` ${singleBrand}` : ''}`

  const chips = [
    category && { label: category.name, clear: () => router.push(hrefFor(parent)) },
    s.q.trim() && { label: `“${s.q.trim()}”`, clear: () => update({ q: '' }) },
    ...Object.entries(s.facets).flatMap(([key, values]) => values.map((v) => ({ label: v, clear: () => toggleFacet(key, v) }))),
    (s.min != null || s.max != null) && {
      label: `${s.min != null ? formatPrice(s.min) : '$ 0'} – ${s.max != null ? formatPrice(s.max) : 'máx.'}`,
      clear: () => update({ min: null, max: null }),
    },
    s.stock && { label: 'En stock', clear: () => update({ stock: false }) },
    s.oferta && { label: 'En promoción', clear: () => update({ oferta: false }) },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  const hasFilters = chips.length > (category ? 1 : 0)
  const clearFilters = () => update({ ...EMPTY, sort: s.sort, perPage: s.perPage })

  const subcategories = category ? childCategories(categories, category.id).filter((c) => categoryCount(c.id) > 0) : []

  /* ---------- barra lateral ---------- */

  const CategoryNode = ({ node, level }: { node: Category; level: number }) => {
    const count = categoryCount(node.id)
    const active = category?.id === node.id
    const inPath = path.some((c) => c.id === node.id)
    if (!count && !inPath) return null
    const children = childCategories(categories, node.id).filter((c) => categoryCount(c.id) > 0 || path.some((x) => x.id === c.id))
    return (
      <li>
        <Link
          href={hrefFor(node)}
          onClick={() => setFiltersOpen(false)}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted',
            level === 0 ? 'font-medium' : 'text-muted-foreground',
            active && 'bg-primary/10 font-semibold text-primary',
          )}
        >
          <span className="flex items-center gap-1">
            {children.length > 0 && (
              <ChevronRight aria-hidden="true" className={cn('size-3.5 text-muted-foreground transition-transform', inPath && 'rotate-90')} />
            )}
            {node.name}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
        </Link>
        {inPath && children.length > 0 && !(active && subOf.size > 0) && (
          <ul className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
            {children.map((child) => (
              <CategoryNode key={child.id} node={child} level={level + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  const sidebar = (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">Podés marcar varias opciones y combinar filtros.</p>
      <FilterGroup title="Categorías">
        <ul className="flex flex-col gap-0.5 text-sm">
          <li>
            <Link
              href={hrefFor()}
              onClick={() => setFiltersOpen(false)}
              className={cn(
                'flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted',
                !category && 'bg-primary/10 font-semibold text-primary',
              )}
            >
              Todos los productos
              <span className="text-xs tabular-nums text-muted-foreground">{catalogReady ? searched.length : rootCategories(categories).reduce((n, c) => n + (categoryCounts[c.id] ?? 0), 0)}</span>
            </Link>
          </li>
          {rootCategories(categories).map((root) => (
            <CategoryNode key={root.id} node={root} level={0} />
          ))}
        </ul>
      </FilterGroup>

      {!catalogReady && (
        <div className="flex flex-col gap-3 py-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <span className="h-3 w-20 animate-pulse rounded bg-muted" />
              <span className="h-3 w-32 animate-pulse rounded bg-muted" />
              <span className="h-3 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {catalogReady && facetOptions.map((g) => (
        <FilterGroup key={g.key} title={g.label}>
          <OptionList options={g.options} selected={s.facets[g.key] ?? []} onToggle={(v) => toggleFacet(g.key, v)} />
        </FilterGroup>
      ))}

      {catalogReady && settings.showPrices && priceBounds && (
        <FilterGroup title="Precio">
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const val = (k: string) => {
                const digits = String(fd.get(k) ?? '').replace(/\D/g, '')
                return digits ? Number(digits) : null
              }
              update({ min: val('min'), max: val('max') })
            }}
          >
            <label className="flex-1 text-xs text-muted-foreground">
              Desde
              <input
                name="min"
                inputMode="numeric"
                defaultValue={s.min ?? ''}
                key={`min-${s.min}`}
                placeholder={formatPrice(priceBounds.min)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring"
              />
            </label>
            <label className="flex-1 text-xs text-muted-foreground">
              Hasta
              <input
                name="max"
                inputMode="numeric"
                defaultValue={s.max ?? ''}
                key={`max-${s.max}`}
                placeholder={formatPrice(priceBounds.max)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-ring"
              />
            </label>
            <Button type="submit" size="sm" variant="outline" className="h-9 px-3" aria-label="Aplicar rango de precio">
              <ChevronRight className="size-4" />
            </Button>
          </form>
        </FilterGroup>
      )}

      <FilterGroup title="Disponibilidad">
        <div className="flex flex-col gap-1">
          {[
            { key: 'stock' as const, label: 'Sólo en stock' },
            { key: 'oferta' as const, label: 'En promoción' },
          ].map((o) => (
            <label key={o.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={s[o.key]}
                onChange={(e) => update({ [o.key]: e.target.checked })}
                className="size-4 accent-primary"
              />
              {o.label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <div className="mt-5 rounded-xl bg-secondary/70 p-4 text-sm">
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block" aria-label="Categorías y filtros">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-1 [scrollbar-width:thin]">{sidebar}</div>
        </aside>

        <div className="min-w-0">
          {/* 1. Ruta */}
          <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <ChevronRight aria-hidden="true" className="size-4" />
              <li>
                {category ? (
                  <Link href="/productos" className="hover:text-foreground">
                    Productos
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">Productos</span>
                )}
              </li>
              {path.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1">
                  <ChevronRight aria-hidden="true" className="size-4" />
                  {i === path.length - 1 && !singleBrand ? (
                    <span aria-current="page" className="font-medium text-foreground">
                      {c.name}
                    </span>
                  ) : (
                    <Link href={hrefFor(c)} className="hover:text-foreground">
                      {c.name}
                    </Link>
                  )}
                </li>
              ))}
              {singleBrand && (
                <li className="flex items-center gap-1">
                  <ChevronRight aria-hidden="true" className="size-4" />
                  <span aria-current="page" className="font-medium text-foreground">
                    {singleBrand}
                  </span>
                </li>
              )}
            </ol>
          </nav>

          {/* 2. Título y descripción */}
          <div className="mt-3 flex flex-col gap-2">
            {parent && (
              <Link href={hrefFor(parent)} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline">
                <ChevronLeft className="size-4" />
                {parent.name}
              </Link>
            )}
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-muted-foreground">
              {category?.description || 'Sanitarios, conducción de agua y materiales para la construcción. Armá tu pedido y pedí presupuesto por WhatsApp.'}
            </p>
          </div>

          {/* Accesos a subcategorías (en un rubro) */}
          {subcategories.length > 0 && (
            <ul className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {subcategories.map((c) => (
                <li key={c.id} className="shrink-0">
                  <Link
                    href={hrefFor(c)}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    {c.name}
                    <span className="text-xs tabular-nums text-muted-foreground">{categoryCount(c.id)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Marcas que trabaja el negocio en esta categoría: un toque filtra (y se pueden combinar). */}
          {brandShortcuts.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Marcas</span>
              {brandShortcuts.map((b) => {
                const on = brands.includes(b)
                return (
                  <button
                    key={b}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFacet('marca', b)}
                    className={cn(
                      'inline-flex h-8 items-center rounded-full px-3 text-sm font-medium transition-colors',
                      on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted',
                    )}
                  >
                    {b}
                  </button>
                )
              })}
            </div>
          )}

          {/* 3. Listado: buscar, ordenar y productos */}
          <div ref={listTop} className="mt-8 scroll-mt-24">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {loading ? (
                    'Cargando…'
                  ) : !catalogReady ? (
                    <>
                      Mostrando <strong className="text-foreground">1–{initial.items.length}</strong> de {initial.total}
                    </>
                  ) : results.length ? (
                    <>
                      Mostrando <strong className="text-foreground">{from}–{to}</strong> de {results.length}
                    </>
                  ) : (
                    'Sin resultados'
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchBox
                  value={s.q}
                  onValueChange={(q) => update({ q })}
                  onSubmit={(q) => update({ q })}
                  placeholder={category ? `Buscar en ${category.name}…` : 'Buscar en el catálogo…'}
                  className="w-full sm:flex-1"
                />
                <div className="flex gap-2">
                  <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <Dialog.Trigger render={<Button variant="outline" className="h-12 flex-1 px-4 lg:hidden" />}>
                      <SlidersHorizontal className="size-4" />
                      Filtros
                      {hasFilters && (
                        <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                          {chips.length - (category ? 1 : 0)}
                        </span>
                      )}
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-blue/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
                      <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(21rem,90vw)] flex-col bg-background shadow-2xl transition-transform duration-300 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full">
                        <div className="flex items-center justify-between border-b border-border p-4">
                          <Dialog.Title className="font-heading text-lg font-semibold uppercase">Filtros</Dialog.Title>
                          <Dialog.Close aria-label="Cerrar filtros" className="flex size-9 items-center justify-center rounded-lg hover:bg-muted">
                            <X className="size-5" />
                          </Dialog.Close>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
                        <div className="flex gap-2 border-t border-border p-4">
                          {hasFilters && (
                            <Button variant="outline" className="h-11 flex-1" onClick={clearFilters}>
                              Limpiar
                            </Button>
                          )}
                          <Dialog.Close render={<Button className="h-11 flex-[2]" />}>Ver {results.length} productos</Dialog.Close>
                        </div>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </Dialog.Root>
                  <select
                    value={sorts.some((o) => o.value === s.sort) ? s.sort : 'relevancia'}
                    onChange={(e) => update({ sort: e.target.value as Sort })}
                    aria-label="Ordenar por"
                    className="h-12 flex-1 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:flex-none"
                  >
                    {sorts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={s.perPage}
                    onChange={(e) => update({ perPage: Number(e.target.value) })}
                    aria-label="Productos por página"
                    className="hidden h-12 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring sm:block"
                  >
                    {PER_PAGE.map((n) => (
                      <option key={n} value={n}>
                        {n} por página
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={c.clear}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                      aria-label={`Quitar filtro ${c.label}`}
                    >
                      {c.label}
                      <X className="size-3" />
                    </button>
                  ))}
                  {hasFilters && (
                    <button type="button" onClick={clearFilters} className="px-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline">
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <span className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
                    <span className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <span className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : pageItems.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((p, i) => (
                  <ProductCard key={p.id} product={p} query={s.q} priority={i < 4} variantId={preferredVariant(p)} />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SearchX aria-hidden="true" className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">
                    {category && !hasFilters && !s.q.trim() && categoryCount(category.id) === 0
                      ? 'Todavía no hay productos en esta categoría.'
                      : 'No encontramos productos con esos filtros.'}
                  </p>
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
                  {s.q.trim() && (
                    <Button
                      nativeButton={false}
                      className="h-10 bg-whatsapp px-4 text-whatsapp-foreground hover:bg-whatsapp/90"
                      render={<WaLink source="catalogo-sin-resultados" message={`Hola Distribuidora del Este, ¿tienen ${s.q.trim()}?`} />}
                    >
                      <WhatsappIcon className="size-4" />
                      Preguntar por “{s.q.trim()}”
                    </Button>
                  )}
                  {hasFilters && (
                    <Button variant="outline" className="h-10 px-4" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-12">
              <Pagination
                page={page}
                total={totalPages}
                onChange={(p) => {
                  update({ page: p }, { push: true })
                  listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
