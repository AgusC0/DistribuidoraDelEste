'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { inputClass } from '@/components/admin/ui'
import { cn } from '@/lib/utils'
import type { ProductSpec } from '@/lib/types'

const SUGGESTED = ['Ancho', 'Alto', 'Profundidad', 'Largo', 'Peso', 'Material', 'Terminación', 'Garantía', 'Origen', 'Presión de trabajo', 'Incluye']

type Row = ProductSpec & { key: string }

/** Ficha técnica: filas Etiqueta → Valor, en el orden en que se ven en "Detalles del producto". Envía `specs`. */
export function SpecsEditor({ initial }: { initial: ProductSpec[] }) {
  const [rows, setRows] = useState<Row[]>(() => initial.map((r, i) => ({ ...r, key: `s${i}` })))
  const add = (label = '') => setRows((list) => [...list, { label, value: '', key: `s${Math.random().toString(36).slice(2)}` }])
  const update = (key: string, patch: Partial<ProductSpec>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const move = (i: number, dir: -1 | 1) =>
    setRows((list) => {
      const next = [...list]
      ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
      return next
    })
  const used = new Set(rows.map((r) => r.label.toLowerCase()))

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="specs" value={JSON.stringify(rows.map(({ label, value }) => ({ label, value })))} />
      {rows.map((r, i) => (
        <div key={r.key} className="flex items-center gap-2">
          <div className="flex flex-col">
            <Button type="button" variant="ghost" size="icon-xs" disabled={i === 0} aria-label="Subir fila" onClick={() => move(i, -1)}>
              <ArrowUp />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" disabled={i === rows.length - 1} aria-label="Bajar fila" onClick={() => move(i, 1)}>
              <ArrowDown />
            </Button>
          </div>
          <input
            value={r.label}
            onChange={(e) => update(r.key, { label: e.target.value })}
            list="spec-labels"
            placeholder="Ej: Ancho"
            aria-label={`Etiqueta ${i + 1}`}
            className={cn(inputClass, 'w-40 shrink-0')}
          />
          <input
            value={r.value}
            onChange={(e) => update(r.key, { value: e.target.value })}
            placeholder="Ej: 39 cm"
            aria-label={`Valor de ${r.label || `la fila ${i + 1}`}`}
            className={inputClass}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar ${r.label || 'fila'}`}
            className="shrink-0 text-destructive hover:bg-destructive/10"
            onClick={() => setRows((list) => list.filter((x) => x.key !== r.key))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <datalist id="spec-labels">
        {SUGGESTED.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button type="button" variant="outline" className="h-9 px-3" onClick={() => add()}>
          <Plus className="size-4" />
          Agregar fila
        </Button>
        {SUGGESTED.filter((s) => !used.has(s.toLowerCase()))
          .slice(0, 6)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              + {s}
            </button>
          ))}
      </div>
      <p className="text-xs text-muted-foreground">
        La marca, el código, la categoría, las opciones y los filtros se agregan solos a “Detalles del producto”: acá va lo demás
        (medidas, garantía, origen…).
      </p>
    </div>
  )
}
