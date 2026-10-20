'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/components/admin/ui'
import { STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { StockStatus, Variant } from '@/lib/types'

type Row = { id: string; name: string; price: string; stock: StockStatus }

/** Variantes del producto (medidas, colores, capacidades) con precio y stock propio. Envía `variants` como JSON. */
export function VariantsEditor({ initial }: { initial: Variant[] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((v) => ({ id: v.id, name: v.name, price: v.price?.toString() ?? '', stock: v.stock })),
  )
  const [bulk, setBulk] = useState('')

  const value = rows
    .filter((r) => r.name.trim())
    .map((r) => ({ id: r.id.startsWith('tmp_') ? '' : r.id, name: r.name.trim(), price: r.price ? Number(r.price) : null, stock: r.stock }))

  const update = (id: string, patch: Partial<Row>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const blank = (name = ''): Row => ({ id: `tmp_${Math.random().toString(36).slice(2)}`, name, price: '', stock: 'disponible' })

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="variants" value={JSON.stringify(value)} />
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Opción</th>
                <th className="pb-2 pl-2 font-medium">Precio (vacío = consultar)</th>
                <th className="pb-2 pl-2 font-medium">Stock</th>
                <th className="pb-2">
                  <span className="sr-only">Quitar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="py-1">
                    <input
                      value={r.name}
                      onChange={(e) => update(r.id, { name: e.target.value })}
                      placeholder="Ej: 50x60 cm, Blanco, 80 litros"
                      aria-label={`Nombre de la opción ${i + 1}`}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-1 pl-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <input
                        value={r.price}
                        inputMode="numeric"
                        onChange={(e) => update(r.id, { price: e.target.value.replace(/\D/g, '') })}
                        aria-label={`Precio de la opción ${i + 1}`}
                        className={cn(inputClass, 'pl-7 tabular-nums')}
                      />
                    </div>
                  </td>
                  <td className="py-1 pl-2">
                    <select
                      value={r.stock}
                      onChange={(e) => update(r.id, { stock: e.target.value as StockStatus })}
                      aria-label={`Stock de la opción ${i + 1}`}
                      className={inputClass}
                    >
                      {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STOCK_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pl-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar la opción ${i + 1}`}
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setRows((list) => list.filter((x) => x.id !== r.id))}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="h-10 px-4" onClick={() => setRows((list) => [...list, blank()])}>
          <Plus className="size-4" />
          Agregar opción
        </Button>
        <div className="flex flex-1 gap-2">
          <input
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.nextElementSibling?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
              }
            }}
            placeholder="Varias de una vez: 40x40, 50x60, 60x60"
            aria-label="Agregar varias opciones separadas por coma"
            className={inputClass}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-10 shrink-0 px-3"
            disabled={!bulk.trim()}
            onClick={() => {
              const names = bulk.split(',').map((s) => s.trim()).filter(Boolean)
              setRows((list) => [...list, ...names.map((n) => blank(n))])
              setBulk('')
            }}
          >
            Agregar
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Si el producto tiene opciones, el cliente elige una antes de agregarla al pedido, y el catálogo muestra “Desde $…”.
      </p>
    </div>
  )
}
