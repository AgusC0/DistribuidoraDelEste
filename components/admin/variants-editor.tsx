'use client'

import { useMemo, useState } from 'react'
import { Plus, Sparkles, Trash2, Wand2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/components/admin/ui'
import { combinations, variantLabel } from '@/lib/catalog'
import { STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { ProductOption, StockStatus, Variant } from '@/lib/types'

type Row = {
  id: string
  options: Record<string, string>
  sku: string
  price: string
  originalPrice: string
  stock: StockStatus
  imageIndex: string
}

const SUGGESTED_OPTIONS = ['Medida', 'Color', 'Capacidad', 'Largo', 'Diámetro', 'Terminación']

const toRow = (v: Variant): Row => ({
  id: v.id,
  options: { ...v.options },
  sku: v.sku,
  price: v.price?.toString() ?? '',
  originalPrice: v.originalPrice?.toString() ?? '',
  stock: v.stock,
  imageIndex: v.imageIndex != null ? String(v.imageIndex) : '',
})

const comboKey = (options: Record<string, string>, axes: ProductOption[]) => axes.map((a) => options[a.name] ?? '').join('¦')

function ValuesInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('')
  const add = (raw: string) => {
    const parts = raw.split(',').map((x) => x.trim()).filter((x) => x && !values.includes(x))
    if (parts.length) onChange([...values, ...parts])
    setInput('')
  }
  return (
    <div className="flex min-h-10 flex-1 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
      {values.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Quitar ${v}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setInput(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(input)
          } else if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1))
        }}
        onBlur={() => input && add(input)}
        placeholder={values.length ? '' : placeholder}
        aria-label="Agregar valores"
        className="h-7 min-w-28 flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  )
}

/**
 * Opciones (Medida, Color…) y sus combinaciones. Cada variante tiene código, precio, precio anterior,
 * stock y foto propios. Envía `options` y `variants` como JSON.
 */
export function VariantsEditor({
  initialOptions,
  initialVariants,
  baseSku,
  imageCount,
}: {
  initialOptions: ProductOption[]
  initialVariants: Variant[]
  baseSku: string
  imageCount: number
}) {
  const [axes, setAxes] = useState<ProductOption[]>(initialOptions)
  const [rows, setRows] = useState<Row[]>(initialVariants.map(toRow))
  const [bulkPrice, setBulkPrice] = useState('')

  const validAxes = axes.filter((a) => a.name.trim() && a.values.length)
  const combos = useMemo(() => combinations(validAxes), [validAxes])
  const existing = new Set(rows.map((r) => comboKey(r.options, validAxes)))
  const missing = combos.filter((c) => !existing.has(comboKey(c, validAxes)))

  // Sólo se guardan las filas que coinciden con las opciones actuales.
  const validRows = rows.filter((r) => validAxes.every((a) => a.values.includes(r.options[a.name] ?? '')))
  const value = JSON.stringify(
    validRows.map((r) => ({
      id: r.id.startsWith('tmp_') ? '' : r.id,
      options: r.options,
      sku: r.sku,
      price: r.price ? Number(r.price) : null,
      originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
      stock: r.stock,
      imageIndex: r.imageIndex ? Number(r.imageIndex) : null,
    })),
  )

  const slugPart = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^A-Za-z0-9]+/g, '').toUpperCase()

  function generate() {
    setRows((list) => [
      ...list,
      ...missing.map((options) => ({
        id: `tmp_${Math.random().toString(36).slice(2)}`,
        options,
        sku: baseSku ? `${baseSku}-${validAxes.map((a) => slugPart(options[a.name])).join('-')}` : '',
        price: '',
        originalPrice: '',
        stock: 'disponible' as StockStatus,
        imageIndex: '',
      })),
    ])
  }

  const update = (id: string, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const setAxis = (i: number, patch: Partial<ProductOption>) =>
    setAxes((list) => {
      const next = list.map((a, j) => (j === i ? { ...a, ...patch } : a))
      // Renombrar una opción mantiene los valores ya cargados en las variantes.
      if (patch.name !== undefined && list[i].name !== patch.name) {
        const from = list[i].name
        setRows((rs) =>
          rs.map((r) => {
            const { [from]: val, ...rest } = r.options
            return val !== undefined ? { ...r, options: { ...rest, [patch.name!]: val } } : r
          }),
        )
      }
      return next
    })

  return (
    <div className="flex flex-col gap-5">
      <input type="hidden" name="options" value={JSON.stringify(validAxes)} />
      <input type="hidden" name="variants" value={value} />

      {/* 1. Opciones */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">1. Opciones del producto</p>
        {axes.map((axis, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <input
              value={axis.name}
              onChange={(e) => setAxis(i, { name: e.target.value })}
              list="option-names"
              placeholder="Ej: Medida"
              aria-label={`Nombre de la opción ${i + 1}`}
              className={cn(inputClass, 'sm:w-40')}
            />
            <ValuesInput
              values={axis.values}
              onChange={(values) => setAxis(i, { values })}
              placeholder="Valores: 20 mm, 25 mm, 32 mm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Quitar la opción ${axis.name || i + 1}`}
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setAxes((list) => list.filter((_, j) => j !== i))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <datalist id="option-names">
          {SUGGESTED_OPTIONS.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        {axes.length < 3 && (
          <Button type="button" variant="outline" className="h-9 w-fit px-3" onClick={() => setAxes((list) => [...list, { name: '', values: [] }])}>
            <Plus className="size-4" />
            {axes.length ? 'Agregar otra opción (ej: Color)' : 'Agregar opción (ej: Medida)'}
          </Button>
        )}
      </div>

      {/* 2. Variantes */}
      {validAxes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              2. Variantes <span className="font-normal text-muted-foreground">({validRows.length} de {combos.length} combinaciones)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {missing.length > 0 && (
                <Button type="button" size="sm" className="h-8 px-3" onClick={generate}>
                  <Wand2 className="size-4" />
                  Generar {missing.length} {missing.length === 1 ? 'combinación' : 'combinaciones'}
                </Button>
              )}
              {validRows.length > 1 && (
                <div className="flex items-center gap-1">
                  <input
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="Mismo precio"
                    aria-label="Precio para todas las variantes"
                    className={cn(inputClass, 'h-8 w-32')}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    disabled={!bulkPrice}
                    onClick={() => {
                      setRows((list) => list.map((r) => ({ ...r, price: bulkPrice })))
                      setBulkPrice('')
                    }}
                  >
                    <Sparkles className="size-3.5" />
                    A todas
                  </Button>
                </div>
              )}
            </div>
          </div>

          {validRows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">{validAxes.map((a) => a.name).join(' / ')}</th>
                    <th className="px-2 py-2 font-medium">Código</th>
                    <th className="px-2 py-2 font-medium">Precio</th>
                    <th className="px-2 py-2 font-medium">Precio anterior</th>
                    <th className="px-2 py-2 font-medium">Stock</th>
                    <th className="px-2 py-2 font-medium">Foto</th>
                    <th className="px-2 py-2">
                      <span className="sr-only">Quitar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.map((r) => {
                    const label = variantLabel(r.options, validAxes)
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-2 py-1.5 font-medium">{label}</td>
                        <td className="px-2 py-1.5">
                          <input
                            value={r.sku}
                            onChange={(e) => update(r.id, { sku: e.target.value })}
                            aria-label={`Código de ${label}`}
                            className={cn(inputClass, 'h-9 w-36 font-mono text-xs')}
                          />
                        </td>
                        {(['price', 'originalPrice'] as const).map((field) => (
                          <td key={field} className="px-2 py-1.5">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <input
                                value={r[field]}
                                inputMode="numeric"
                                onChange={(e) => update(r.id, { [field]: e.target.value.replace(/\D/g, '') })}
                                aria-label={`${field === 'price' ? 'Precio' : 'Precio anterior'} de ${label}`}
                                placeholder={field === 'price' ? 'Consultar' : '—'}
                                className={cn(inputClass, 'h-9 w-28 pl-5 tabular-nums')}
                              />
                            </div>
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <select
                            value={r.stock}
                            onChange={(e) => update(r.id, { stock: e.target.value as StockStatus })}
                            aria-label={`Stock de ${label}`}
                            className={cn(inputClass, 'h-9 w-36')}
                          >
                            {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
                              <option key={s} value={s}>
                                {STOCK_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={r.imageIndex}
                            onChange={(e) => update(r.id, { imageIndex: e.target.value })}
                            aria-label={`Foto de ${label}`}
                            className={cn(inputClass, 'h-9 w-24')}
                          >
                            <option value="">Principal</option>
                            {Array.from({ length: imageCount }, (_, i) => (
                              <option key={i} value={i}>
                                Foto {i + 1}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1 py-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Quitar ${label}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setRows((list) => list.filter((x) => x.id !== r.id))}
                          >
                            <Trash2 />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              Tocá “Generar combinaciones” para crear una variante por cada combinación de opciones.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Una combinación que no existe (ej: 32 mm en Negro) se borra de la tabla y el sitio la muestra como no disponible. La foto
            de cada variante se elige entre las fotos ya guardadas del producto.
          </p>
        </div>
      )}
    </div>
  )
}
