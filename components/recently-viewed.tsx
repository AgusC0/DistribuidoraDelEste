'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/product-card'
import { useProducts } from '@/components/catalog-provider'

const KEY = 'dde_recent_products'
const MAX = 10

/** Guarda el producto en la lista de vistos (en el navegador del visitante). */
export function rememberProduct(id: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    localStorage.setItem(KEY, JSON.stringify([id, ...list.filter((x) => x !== id)].slice(0, MAX)))
  } catch {}
}

/** "Vistos recientemente": retomar lo que la persona ya estuvo mirando. */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      setIds(list.filter((id) => id !== excludeId).slice(0, 6))
    } catch {}
  }, [excludeId])

  // Pide de más por si alguno ya no está publicado.
  const items = useProducts(ids).items.slice(0, 4)

  if (!items.length) return null
  return (
    <section aria-labelledby="vistos-title" className="mt-16 border-t border-border pt-12">
      <h2 id="vistos-title" className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
        Vistos recientemente
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
