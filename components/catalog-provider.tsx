'use client'

import { createContext, useContext, useMemo } from 'react'
import { buildIndex, type SearchIndex } from '@/lib/search'
import type { PublicCatalog } from '@/lib/types'

type CatalogContext = PublicCatalog & { index: SearchIndex }

const Ctx = createContext<CatalogContext | null>(null)

export function CatalogProvider({ catalog, children }: { catalog: PublicCatalog; children: React.ReactNode }) {
  const value = useMemo(
    () => ({ ...catalog, index: buildIndex(catalog.products, catalog.categories) }),
    [catalog],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCatalog() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCatalog debe usarse dentro de <CatalogProvider>')
  return ctx
}
