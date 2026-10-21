'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { buildIndex, type SearchIndex } from '@/lib/search'
import type { Category, Product, PublicShell } from '@/lib/types'

const Ctx = createContext<PublicShell | null>(null)

/** Datos livianos del sitio (ajustes, categorías, conteos y promociones). Están en todas las páginas. */
export function CatalogProvider({ shell, children }: { shell: PublicShell; children: React.ReactNode }) {
  return <Ctx.Provider value={shell}>{children}</Ctx.Provider>
}

export function useCatalog() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCatalog debe usarse dentro de <CatalogProvider>')
  return ctx
}

/* ---------- Catálogo completo, bajo demanda ---------- */

type FullCatalog = { products: Product[]; index: SearchIndex; popularity: Record<string, number> }

const EMPTY: FullCatalog = { products: [], index: { items: [], vocabulary: [] }, popularity: {} }

// Una sola descarga por versión, compartida por todos los componentes que la piden.
const full: { version: string; data: FullCatalog | null; promise: Promise<FullCatalog> | null } = {
  version: '',
  data: null,
  promise: null,
}

function loadFull(version: string, categories: Category[]) {
  if (full.version !== version) {
    full.version = version
    full.data = null
    full.promise = fetch(`/api/catalogo?v=${encodeURIComponent(version)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`catálogo: ${r.status}`)
        return r.json() as Promise<{ products: Product[]; popularity: Record<string, number> }>
      })
      .then(({ products, popularity }) => {
        const data = { products, popularity, index: buildIndex(products, categories) }
        if (full.version === version) full.data = data
        return data
      })
      .catch((err) => {
        // Permite reintentar en el próximo uso.
        if (full.version === version) full.version = ''
        throw err
      })
  }
  return full.promise!
}

/**
 * Catálogo completo (liviano) para filtrar y buscar en el navegador. Se descarga la primera vez
 * que `enabled` es true y queda en la caché del navegador hasta que cambie el catálogo.
 */
export function useFullCatalog(enabled = true): FullCatalog & { ready: boolean } {
  const { catalogVersion, categories } = useCatalog()
  const cached = full.version === catalogVersion ? full.data : null
  const [data, setData] = useState<FullCatalog | null>(cached)

  useEffect(() => {
    if (!enabled || data) return
    let alive = true
    loadFull(catalogVersion, categories)
      .then((d) => alive && setData(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [enabled, data, catalogVersion, categories])

  return data ? { ...data, ready: true } : { ...EMPTY, ready: false }
}

/* ---------- Productos puntuales ---------- */

type Picked = { items: Product[]; complements: Product[] }
const picked = new Map<string, Promise<Picked>>()

/** Productos por id (pedido, vistos recientemente) y, si se pide, sus complementos. */
export function useProducts(ids: string[], { complements = false } = {}): Picked & { ready: boolean } {
  const key = ids.length ? `${ids.join(',')}|${complements ? 1 : 0}` : ''
  const [state, setState] = useState<{ key: string; data: Picked } | null>(null)

  useEffect(() => {
    if (!key) return
    let alive = true
    if (!picked.has(key)) {
      const url = `/api/productos?ids=${encodeURIComponent(ids.join(','))}${complements ? '&complementos=1' : ''}`
      picked.set(
        key,
        fetch(url).then((r) => {
          if (!r.ok) throw new Error(`productos: ${r.status}`)
          return r.json() as Promise<Picked>
        }),
      )
    }
    // Si falla queda "no listo": quien lo usa conserva lo que tenía (por ejemplo, el pedido guardado).
    picked
      .get(key)!
      .then((data) => alive && setState({ key, data }))
      .catch(() => picked.delete(key))
    return () => {
      alive = false
    }
    // `key` resume ids y complements.
  }, [key])

  if (!key) return { items: [], complements: [], ready: true }
  return state?.key === key ? { ...state.data, ready: true } : { items: [], complements: [], ready: false }
}
