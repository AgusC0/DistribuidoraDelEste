'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ClipboardPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalog } from '@/components/catalog-provider'
import { useOrder } from '@/components/order-provider'
import { complementsFor } from '@/lib/catalog'
import { displayPrice, formatPrice } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Product, Variant } from '@/lib/types'

/**
 * "Completá tu compra": el producto actual más sus complementos (misma línea o elegidos a mano),
 * para sumarlos juntos al pedido con un clic. Sube el ticket sin interrumpir.
 */
export function CompletePurchase({ product, variant }: { product: Product; variant?: Variant }) {
  const { products, settings } = useCatalog()
  const { add, setOpen } = useOrder()
  const complements = useMemo(() => complementsFor(product, products), [product, products])
  const selectable = complements.filter((c) => !c.variants.length)
  const [checked, setChecked] = useState<Set<string>>(() => new Set(selectable.map((c) => c.id)))
  const [done, setDone] = useState(false)

  if (!complements.length) return null

  const mainReady = !product.variants.length || !!variant
  const mainPrice = variant ? variant.price : product.price
  const chosen = selectable.filter((c) => checked.has(c.id))
  const prices = [mainReady ? mainPrice : null, ...chosen.map((c) => c.price)]
  const allPriced = prices.every((p) => p != null)
  const total = prices.reduce<number>((s, p) => s + (p ?? 0), 0)
  const count = (mainReady ? 1 : 0) + chosen.length

  function addAll() {
    if (mainReady) add(product, variant)
    chosen.forEach((c) => add(c))
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setOpen(true)
    }, 600)
  }

  const Tile = ({ p, isMain }: { p: Product; isMain?: boolean }) => {
    const needsOption = !isMain && p.variants.length > 0
    const isChecked = isMain ? mainReady : checked.has(p.id)
    return (
      <div className={cn('relative flex w-36 shrink-0 flex-col gap-2 sm:w-40', !isChecked && 'opacity-60')}>
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
          <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="160px" className="object-cover" />
          {!isMain && !needsOption && (
            <label className="absolute left-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-md bg-background/95 shadow">
              <input
                type="checkbox"
                checked={checked.has(p.id)}
                onChange={() =>
                  setChecked((set) => {
                    const next = new Set(set)
                    if (next.has(p.id)) next.delete(p.id)
                    else next.add(p.id)
                    return next
                  })
                }
                aria-label={`Incluir ${p.name}`}
                className="size-4 accent-primary"
              />
            </label>
          )}
          {isMain && (
            <span className="absolute left-2 top-2 rounded-md bg-foreground/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-background">
              Este producto
            </span>
          )}
        </div>
        {isMain ? (
          <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
        ) : (
          <Link href={`/productos/${p.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
            {p.name}
          </Link>
        )}
        {settings.showPrices && (
          <p className="text-sm font-semibold tabular-nums">
            {isMain ? (variant ? formatPrice(variant.price) : displayPrice(p)) : displayPrice(p)}
          </p>
        )}
        {needsOption && (
          <Link href={`/productos/${p.slug}`} className="text-xs font-semibold text-primary hover:underline">
            Elegir opción →
          </Link>
        )}
      </div>
    )
  }

  return (
    <section aria-labelledby="completa-title" className="mt-12 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 id="completa-title" className="font-heading text-xl font-bold uppercase tracking-tight">
        Completá tu compra
      </h2>
      <p className="text-sm text-muted-foreground">Lo que normalmente se lleva junto con este producto.</p>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex items-start gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          <Tile p={product} isMain />
          {complements.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Plus aria-hidden="true" className="mt-16 size-5 shrink-0 text-muted-foreground" />
              <Tile p={c} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-col gap-2 lg:w-60">
          {settings.showPrices && allPriced && count > 1 && (
            <p className="text-sm text-muted-foreground">
              Total de {count} productos: <strong className="block text-2xl text-foreground tabular-nums">{formatPrice(total)}</strong>
            </p>
          )}
          <Button
            size="lg"
            onClick={addAll}
            disabled={count === 0}
            className={cn('h-12 text-base', done && 'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp')}
          >
            {done ? <Check className="size-4" /> : <ClipboardPlus className="size-4" />}
            {done ? 'Agregados' : count > 1 ? `Agregar los ${count} al pedido` : 'Agregar al pedido'}
          </Button>
          {!mainReady && <p className="text-xs text-muted-foreground">Elegí una opción arriba para incluir este producto.</p>}
        </div>
      </div>
    </section>
  )
}
