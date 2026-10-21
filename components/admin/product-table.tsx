'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Copy, ExternalLink, Pencil, Percent, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, inputClass, Panel, Switch } from '@/components/admin/ui'
import {
  adjustPrices,
  deleteProduct,
  duplicateProduct,
  setProductPrice,
  setProductStock,
  toggleProduct,
} from '@/app/admin/actions'
import { buildIndex, search } from '@/lib/search'
import { categoryPath, descendantIds, flattenCategories } from '@/lib/catalog'
import { categoryName, formatPrice, STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category, Product, StockStatus } from '@/lib/types'

type Status = 'todos' | 'publicados' | 'ocultos' | 'promo' | 'sin_stock'

function PriceCell({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(product.price?.toString() ?? '')
  const [pending, start] = useTransition()

  function save() {
    setEditing(false)
    const digits = value.replace(/\D/g, '')
    const next = digits ? Number(digits) : null
    if (next !== product.price) start(() => setProductPrice(product.id, next))
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') {
            setValue(product.price?.toString() ?? '')
            setEditing(false)
          }
        }}
        placeholder="Vacío = consultar"
        aria-label={`Precio de ${product.name}`}
        className={cn(inputClass, 'h-8 w-32')}
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Clic para editar el precio"
      className={cn(
        'rounded-md px-2 py-1 text-left text-sm tabular-nums transition-colors hover:bg-muted',
        product.price == null && 'text-muted-foreground',
        pending && 'opacity-50',
      )}
    >
      {formatPrice(product.price)}
    </button>
  )
}

export function ProductTable({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<Status>('todos')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [percent, setPercent] = useState('')
  const [pending, start] = useTransition()

  const index = useMemo(() => buildIndex(products, categories), [products, categories])

  const rows = useMemo(() => {
    let list = query.trim() ? search(index, query).map((h) => h.product) : products
    if (category) {
      const ids = descendantIds(categories, category)
      list = list.filter((p) => ids.has(p.categoryId))
    }
    if (status === 'publicados') list = list.filter((p) => p.active)
    if (status === 'ocultos') list = list.filter((p) => !p.active)
    if (status === 'promo') list = list.filter((p) => p.promo)
    if (status === 'sin_stock') list = list.filter((p) => p.stock === 'sin_stock')
    return list
  }, [products, categories, index, query, category, status])

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const STATUSES: { value: Status; label: string }[] = [
    { value: 'todos', label: `Todos (${products.length})` },
    { value: 'publicados', label: 'Publicados' },
    { value: 'ocultos', label: 'Ocultos' },
    { value: 'promo', label: 'En promo' },
    { value: 'sin_stock', label: 'Sin stock' },
  ]

  return (
    <Panel className="p-0">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, etiqueta o descripción…"
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
              {'   '.repeat(depth - 1)}
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

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-accent/10 px-4 py-3 text-sm">
          <span className="font-medium">{selected.size} seleccionado(s)</span>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const n = Number(percent.replace(',', '.'))
              if (!n) return
              start(async () => {
                await adjustPrices([...selected], n)
                setPercent('')
              })
            }}
          >
            <label htmlFor="bulk-percent" className="text-muted-foreground">
              Ajustar precios
            </label>
            <div className="relative">
              <input
                id="bulk-percent"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                inputMode="decimal"
                placeholder="+10 o -5"
                className={cn(inputClass, 'h-8 w-24 pr-7')}
              />
              <Percent aria-hidden="true" className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit" size="sm" className="h-8 px-3" disabled={pending || !percent}>
              Aplicar
            </Button>
          </form>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelected(new Set())}>
            Deseleccionar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Seleccionar todos" className="size-4 accent-primary" />
              </th>
              <th className="px-2 py-3 font-medium">Producto</th>
              <th className="px-2 py-3 font-medium">Precio</th>
              <th className="px-2 py-3 font-medium">Stock</th>
              <th className="px-2 py-3 text-center font-medium">Publicado</th>
              <th className="px-2 py-3 text-center font-medium">Promo</th>
              <th className="px-2 py-3 text-center font-medium">Destacado</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className={cn('border-b border-border last:border-0 hover:bg-muted/40', !p.active && 'opacity-60')}>
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
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                      <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/admin/productos/${p.id}`} className="block truncate font-medium text-foreground hover:text-primary">
                        {p.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {categoryPath(categories, p.categoryId)
                          .map((c) => c.name)
                          .join(' › ') || categoryName(categories, p.categoryId)}
                        {p.brand && ` · ${p.brand}`}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <PriceCell key={p.price ?? 'null'} product={p} />
                </td>
                <td className="px-2 py-3">
                  <select
                    value={p.stock}
                    onChange={(e) => start(() => setProductStock(p.id, e.target.value as StockStatus))}
                    aria-label={`Stock de ${p.name}`}
                    className={cn(
                      'h-8 rounded-md border border-input bg-transparent px-2 text-xs font-medium',
                      p.stock === 'sin_stock' && 'text-destructive',
                      p.stock === 'bajo' && 'text-promo',
                    )}
                  >
                    {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STOCK_LABEL[s]}
                      </option>
                    ))}
                  </select>
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
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" nativeButton={false} aria-label={`Editar ${p.name}`} render={<Link href={`/admin/productos/${p.id}`} />}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      aria-label={`Ver ${p.name} en el sitio`}
                      render={<a href={`/productos/${p.slug}`} target="_blank" rel="noopener noreferrer" />}
                    >
                      <ExternalLink />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={`Duplicar ${p.name}`} onClick={() => start(() => duplicateProduct(p.id))}>
                      <Copy />
                    </Button>
                    <ConfirmButton
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${p.name}`}
                      className="text-destructive hover:bg-destructive/10"
                      title="¿Eliminar producto?"
                      description={`"${p.name}" se va a borrar del catálogo. Si sólo querés ocultarlo, desactivá "Publicado".`}
                      onConfirm={() => deleteProduct(p.id)}
                    >
                      <Trash2 />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No hay productos con esos filtros.</p>}
      </div>
    </Panel>
  )
}
