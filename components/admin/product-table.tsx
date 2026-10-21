'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronDown, Copy, ExternalLink, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BulkBar } from '@/components/admin/bulk-bar'
import { ConfirmButton, inputClass, Panel, Switch } from '@/components/admin/ui'
import { deleteProduct, duplicateProduct, setProductPrice, setProductStock, setVariantQuick, toggleProduct } from '@/app/admin/actions'
import { buildIndex, search } from '@/lib/search'
import { categoryPath, descendantIds, flattenCategories } from '@/lib/catalog'
import { productQuality, QUALITY_GOOD, qualityTone, type QualityCheck } from '@/lib/quality'
import { categoryName, displayPrice, formatPrice, STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category, Product, StockStatus } from '@/lib/types'

export type ProductStatusFilter = 'todos' | 'publicados' | 'ocultos' | 'promo' | 'sin_stock' | 'incompletos'

/** Precio editable con un clic: Enter guarda, Escape cancela, vacío = "Consultar". */
function PriceCell({ value, label, onSave }: { value: number | null; label: string; onSave: (price: number | null) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value?.toString() ?? '')
  const [pending, start] = useTransition()

  function save() {
    setEditing(false)
    const digits = text.replace(/[^0-9]/g, '')
    const next = digits ? Number(digits) : null
    if (next !== value) start(() => onSave(next))
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setText(value?.toString() ?? '')
            setEditing(false)
          }
        }}
        placeholder="Vacío = consultar"
        aria-label={`Precio de ${label}`}
        className={cn(inputClass, 'h-8 w-32')}
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Clic para editar el precio"
      aria-label={`Precio de ${label}: ${formatPrice(value)}. Editar`}
      className={cn(
        'rounded-md border border-dashed border-transparent px-2 py-1 text-left text-sm tabular-nums transition-colors hover:border-input hover:bg-muted',
        value == null && 'text-muted-foreground',
        pending && 'opacity-50',
      )}
    >
      {formatPrice(value)}
    </button>
  )
}

function StockSelect({ value, label, onChange }: { value: StockStatus; label: string; onChange: (stock: StockStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StockStatus)}
      aria-label={`Stock de ${label}`}
      className={cn(
        'h-8 rounded-md border border-input bg-transparent px-2 text-xs font-medium',
        value === 'sin_stock' && 'text-destructive',
        value === 'bajo' && 'text-promo',
      )}
    >
      {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
        <option key={s} value={s}>
          {STOCK_LABEL[s]}
        </option>
      ))}
    </select>
  )
}

const TONE_CLASS = {
  good: 'bg-whatsapp/15 text-whatsapp',
  mid: 'bg-promo/15 text-promo',
  low: 'bg-destructive/10 text-destructive',
}

function QualityBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Calidad de la ficha: clic para ver qué falta"
      aria-label={`Calidad de la ficha: ${score}%. Ver qué falta`}
      className={cn('rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums', TONE_CLASS[qualityTone(score)])}
    >
      {score}%
    </button>
  )
}

/** Detalle desplegable: qué le falta a la ficha y edición rápida de cada variante. */
function ProductDetails({ product, checks }: { product: Product; checks: QualityCheck[] }) {
  const [pending, start] = useTransition()
  const missing = checks.filter((c) => !c.ok)

  return (
    <div className={cn('grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]', pending && 'opacity-70')}>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Calidad de la ficha</p>
        {missing.length ? (
          <ul className="flex flex-col gap-1.5 text-sm">
            {missing.map((c) => (
              <li key={c.label} className="flex gap-2">
                <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 text-xs font-semibold tabular-nums text-muted-foreground">+{c.points}</span>
                <span>{c.hint}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-whatsapp">
            <Check className="size-4" />
            Ficha completa.
          </p>
        )}
        <Link href={`/admin/productos/${product.id}`} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Completar la ficha
        </Link>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {product.variants.length ? `Variantes (${product.variants.length})` : 'Variantes'}
        </p>
        {product.variants.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {product.variants.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block truncate text-sm font-medium">{v.name}</span>
                  {v.sku && <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>}
                </span>
                <PriceCell
                  key={v.price ?? 'null'}
                  value={v.price}
                  label={`${product.name} ${v.name}`}
                  onSave={(price) => setVariantQuick(product.id, v.id, { price })}
                />
                <StockSelect
                  value={v.stock}
                  label={`${product.name} ${v.name}`}
                  onChange={(stock) => start(() => setVariantQuick(product.id, v.id, { stock }))}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Este producto no tiene variantes: el precio y el stock se editan en la fila.</p>
        )}
      </div>
    </div>
  )
}

function RowActions({ product, start }: { product: Product; start: (fn: () => Promise<void>) => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" nativeButton={false} aria-label={`Editar ${product.name}`} render={<Link href={`/admin/productos/${product.id}`} />}>
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        aria-label={`Ver ${product.name} en el sitio`}
        render={<a href={`/productos/${product.slug}`} target="_blank" rel="noopener noreferrer" />}
      >
        <ExternalLink />
      </Button>
      <Button variant="ghost" size="icon" aria-label={`Duplicar ${product.name}`} onClick={() => start(() => duplicateProduct(product.id))}>
        <Copy />
      </Button>
      <ConfirmButton
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${product.name}`}
        className="text-destructive hover:bg-destructive/10"
        title="¿Eliminar producto?"
        description={`"${product.name}" se va a borrar del catálogo. Si sólo querés ocultarlo, desactivá "Publicado".`}
        onConfirm={() => deleteProduct(product.id)}
      >
        <Trash2 />
      </ConfirmButton>
    </div>
  )
}

export function ProductTable({
  products,
  categories,
  initialStatus = 'todos',
}: {
  products: Product[]
  categories: Category[]
  initialStatus?: ProductStatusFilter
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<ProductStatusFilter>(initialStatus)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [, start] = useTransition()

  const index = useMemo(() => buildIndex(products, categories), [products, categories])
  const quality = useMemo(() => new Map(products.map((p) => [p.id, productQuality(p, categories)])), [products, categories])
  const incomplete = products.filter((p) => quality.get(p.id)!.score < QUALITY_GOOD).length

  const rows = useMemo(() => {
    let list = query.trim() ? search(index, query).map((h) => h.product) : products
    if (category) {
      const ids = descendantIds(categories, category)
      list = list.filter((p) => ids.has(p.categoryId))
    }
    if (status === 'publicados') list = list.filter((p) => p.active)
    if (status === 'ocultos') list = list.filter((p) => !p.active)
    if (status === 'promo') list = list.filter((p) => p.promo)
    if (status === 'sin_stock') list = list.filter((p) => p.stock === 'sin_stock' || p.variants.some((v) => v.stock === 'sin_stock'))
    // Las más incompletas primero: así se completa lo que más falta.
    if (status === 'incompletos')
      list = list.filter((p) => quality.get(p.id)!.score < QUALITY_GOOD).sort((a, b) => quality.get(a.id)!.score - quality.get(b.id)!.score)
    return list
  }, [products, categories, index, query, category, status, quality])

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleExpanded = (id: string) => setExpanded((e) => (e === id ? null : id))
  const selectedIds = [...selected].filter((id) => products.some((p) => p.id === id))

  const STATUSES: { value: ProductStatusFilter; label: string }[] = [
    { value: 'todos', label: `Todos (${products.length})` },
    { value: 'publicados', label: 'Publicados' },
    { value: 'ocultos', label: 'Ocultos' },
    { value: 'promo', label: 'En promo' },
    { value: 'sin_stock', label: 'Sin stock' },
    { value: 'incompletos', label: `Fichas incompletas (${incomplete})` },
  ]

  const subtitle = (p: Product) =>
    `${
      categoryPath(categories, p.categoryId)
        .map((c) => c.name)
        .join(' › ') || categoryName(categories, p.categoryId)
    }${p.brand ? ` · ${p.brand}` : ''}`

  const priceCell = (p: Product) =>
    p.variants.length ? (
      <button
        type="button"
        onClick={() => toggleExpanded(p.id)}
        className="rounded-md px-2 py-1 text-left text-sm tabular-nums hover:bg-muted"
        title="Editar precios por variante"
      >
        {displayPrice(p)}
        <span className="block text-xs text-muted-foreground">{p.variants.length} variantes</span>
      </button>
    ) : (
      <PriceCell key={p.price ?? 'null'} value={p.price} label={p.name} onSave={(price) => setProductPrice(p.id, price)} />
    )

  return (
    <Panel className="p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, código, marca o etiqueta…"
            aria-label="Buscar productos"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoría"
          className={cn(inputClass, 'lg:w-48')}
        >
          <option value="">Todas las categorías</option>
          {flattenCategories(categories).map(({ category: c, depth }) => (
            <option key={c.id} value={c.id}>
              {'   '.repeat(depth - 1)}
              {depth > 1 ? '└ ' : ''}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2" role="group" aria-label="Filtrar por estado">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={status === s.value}
            onClick={() => setStatus(s.value)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              status === s.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selectedIds.length > 0 && <BulkBar ids={selectedIds} categories={categories} onClear={() => setSelected(new Set())} />}

      {/* Celular: tarjetas con lo que se toca en el mostrador (precio, stock, publicado). */}
      <ul className="divide-y divide-border md:hidden">
        {rows.length > 0 && (
          <li className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" className="size-4 accent-primary" />
            Seleccionar todos
          </li>
        )}
        {rows.map((p) => {
          const q = quality.get(p.id)!
          return (
            <li key={p.id} className={cn(!p.active && 'bg-muted/30')}>
              <div className="flex gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleOne(p.id)}
                  aria-label={`Seleccionar ${p.name}`}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <span className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                  <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/productos/${p.id}`} className="line-clamp-2 font-medium text-foreground">
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{subtitle(p)}</p>
                    </div>
                    <QualityBadge score={q.score} onClick={() => toggleExpanded(p.id)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {priceCell(p)}
                    {!p.variants.length && <StockSelect value={p.stock} label={p.name} onChange={(s) => start(() => setProductStock(p.id, s))} />}
                    <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      Publicado
                      <Switch checked={p.active} onChange={() => start(() => toggleProduct(p.id, 'active'))} label={`Publicado: ${p.name}`} />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(p.id)}
                    aria-expanded={expanded === p.id}
                    className="flex items-center gap-1 self-start text-xs font-medium text-primary"
                  >
                    {expanded === p.id ? 'Ocultar detalle' : p.variants.length ? 'Variantes y calidad' : 'Ver qué falta'}
                    <ChevronDown className={cn('size-3.5 transition-transform', expanded === p.id && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {expanded === p.id && (
                <div className="border-t border-border bg-muted/30">
                  <ProductDetails product={p} checks={q.checks} />
                  <div className="px-4 pb-3">
                    <RowActions product={p} start={start} />
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" className="size-4 accent-primary" />
              </th>
              <th className="px-2 py-3 font-medium">Producto</th>
              <th className="px-2 py-3 font-medium">Precio</th>
              <th className="px-2 py-3 font-medium">Stock</th>
              <th className="px-2 py-3 text-center font-medium">Ficha</th>
              <th className="px-2 py-3 text-center font-medium">Publicado</th>
              <th className="px-2 py-3 text-center font-medium">Promo</th>
              <th className="px-2 py-3 text-center font-medium">Destacado</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const q = quality.get(p.id)!
              const open = expanded === p.id
              const variantsOut = p.variants.filter((v) => v.stock === 'sin_stock').length
              return (
                <Fragment key={p.id}>
                  <tr className={cn('border-b border-border hover:bg-muted/40', !p.active && 'opacity-60', open && 'border-b-0 bg-muted/30')}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        aria-label={`Seleccionar ${p.name}`}
                        className="size-4 accent-primary"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(p.id)}
                          aria-expanded={open}
                          aria-label={`${open ? 'Ocultar' : 'Ver'} detalle de ${p.name}`}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                        </button>
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                          <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="44px" className="object-cover" />
                        </span>
                        <div className="min-w-0">
                          <Link href={`/admin/productos/${p.id}`} className="block truncate font-medium text-foreground hover:text-primary">
                            {p.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {subtitle(p)}
                            {p.sku && <span className="font-mono"> · {p.sku}</span>}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">{priceCell(p)}</td>
                    <td className="px-2 py-3">
                      {p.variants.length ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(p.id)}
                          className={cn('rounded-md px-2 py-1 text-left text-xs hover:bg-muted', variantsOut ? 'text-destructive' : 'text-muted-foreground')}
                        >
                          {variantsOut ? `${variantsOut} sin stock` : 'Por variante'}
                        </button>
                      ) : (
                        <StockSelect value={p.stock} label={p.name} onChange={(s) => start(() => setProductStock(p.id, s))} />
                      )}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <QualityBadge score={q.score} onClick={() => toggleExpanded(p.id)} />
                    </td>
                    {(['active', 'promo', 'featured'] as const).map((field) => (
                      <td key={field} className="px-2 py-3 text-center">
                        <Switch
                          checked={p[field]}
                          onChange={() => start(() => toggleProduct(p.id, field))}
                          label={`${field === 'active' ? 'Publicado' : field === 'promo' ? 'Promo' : 'Destacado'}: ${p.name}`}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <RowActions product={p} start={start} />
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-border bg-muted/30">
                      <td colSpan={9} className="px-4 pb-3">
                        <ProductDetails product={p} checks={q.checks} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {status === 'incompletos' ? 'Todas las fichas están completas.' : 'No hay productos con esos filtros.'}
        </p>
      )}
    </Panel>
  )
}
