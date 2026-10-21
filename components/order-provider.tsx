'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useProducts } from '@/components/catalog-provider'
import type { OrderItem, Product, Variant } from '@/lib/types'

const STORAGE_KEY = 'dde_order'

type OrderContext = {
  items: OrderItem[]
  count: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (product: Product, variant?: Variant, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const Ctx = createContext<OrderContext | null>(null)

export const itemKey = (i: { productId: string; variantId?: string }) => `${i.productId}:${i.variantId ?? ''}`

/** Lista de pedido/presupuesto que arma el cliente. Se guarda en su navegador. */
export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const current = useProducts(savedIds)

  // Muestra lo guardado al instante…
  useEffect(() => {
    let saved: OrderItem[] = []
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    } catch {}
    setItems(saved)
    setSavedIds([...new Set(saved.map((i) => i.productId))])
    setLoaded(true)
  }, [])

  // …y después actualiza nombres y precios con el catálogo vigente (y saca lo que ya no existe).
  useEffect(() => {
    if (!savedIds.length || !current.ready) return
    const byId = new Map(current.items.map((p) => [p.id, p]))
    setItems((list) =>
      list.flatMap((i) => {
        const p = byId.get(i.productId)
        if (!p) return savedIds.includes(i.productId) ? [] : [i]
        const v = i.variantId ? p.variants.find((x) => x.id === i.variantId) : undefined
        if (i.variantId && !v) return []
        return [{ ...i, name: p.name, variantName: v?.name, sku: v?.sku || p.sku || undefined, price: v ? v.price : p.price }]
      }),
    )
    setSavedIds([])
  }, [current, savedIds])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, loaded])

  const add = useCallback((product: Product, variant?: Variant, quantity = 1) => {
    setItems((list) => {
      const key = itemKey({ productId: product.id, variantId: variant?.id })
      const existing = list.find((i) => itemKey(i) === key)
      if (existing) {
        return list.map((i) => (itemKey(i) === key ? { ...i, quantity: Math.min(i.quantity + quantity, 999) } : i))
      }
      return [
        ...list,
        {
          productId: product.id,
          variantId: variant?.id,
          name: product.name,
          variantName: variant?.name,
          sku: variant?.sku || product.sku || undefined,
          price: variant ? variant.price : product.price,
          quantity,
        },
      ]
    })
  }, [])

  const value = useMemo<OrderContext>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      open,
      setOpen,
      add,
      setQuantity: (key, quantity) =>
        setItems((list) =>
          quantity <= 0
            ? list.filter((i) => itemKey(i) !== key)
            : list.map((i) => (itemKey(i) === key ? { ...i, quantity: Math.min(quantity, 999) } : i)),
        ),
      remove: (key) => setItems((list) => list.filter((i) => itemKey(i) !== key)),
      clear: () => setItems([]),
    }),
    [items, open, add],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOrder() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOrder debe usarse dentro de <OrderProvider>')
  return ctx
}
