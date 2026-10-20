'use client'

import { useEffect } from 'react'
import { track } from '@/lib/track'

/** Registra una vista del producto (una vez por carga de página). */
export function ProductView({ productId }: { productId: string }) {
  useEffect(() => {
    track({ type: 'view', productId })
  }, [productId])
  return null
}
