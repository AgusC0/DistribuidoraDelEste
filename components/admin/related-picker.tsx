'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, X } from 'lucide-react'
import { inputClass } from '@/components/admin/ui'
import { normalize } from '@/lib/search'
import { cn } from '@/lib/utils'

export type PickerProduct = { id: string; name: string; image: string; brand: string }

/** Complementos elegidos a mano ("se compra junto con"). Envía `related` como JSON. */
export function RelatedPicker({ products, initial, currentId }: { products: PickerProduct[]; initial: string[]; currentId?: string }) {
  const [selected, setSelected] = useState<string[]>(initial.filter((id) => products.some((p) => p.id === id)))
  const [query, setQuery] = useState('')
  const q = normalize(query.trim())
  const results = q
    ? products.filter((p) => p.id !== currentId && !selected.includes(p.id) && normalize(`${p.name} ${p.brand}`).includes(q)).slice(0, 6)
    : []

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="related" value={JSON.stringify(selected)} />
      {selected.length > 0 && (
        <ul className="flex flex-col gap-2">
          {selected.map((id) => {
            const p = products.find((x) => x.id === id)!
            return (
              <li key={id} className="flex items-center gap-3 rounded-lg border border-border px-2 py-1.5">
                <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-secondary">
                  <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="36px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <button
                  type="button"
                  onClick={() => setSelected((list) => list.filter((x) => x !== id))}
                  aria-label={`Quitar ${p.name}`}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {selected.length < 12 && (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar un producto para sumar…"
            aria-label="Buscar complemento"
            className={cn(inputClass, 'pl-9')}
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 rounded-lg border border-border bg-popover p-1 shadow-lg">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected((list) => [...list, p.id])
                      setQuery('')
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded bg-secondary">
                      <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="32px" className="object-cover" />
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Además se sugieren solos los productos de la misma marca y línea (ej: inodoro, bidet y mochila Bari).
      </p>
    </div>
  )
}
