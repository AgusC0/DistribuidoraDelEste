'use client'

import { useEffect, useState } from 'react'
import { Check, ClipboardPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrder } from '@/components/order-provider'
import { cn } from '@/lib/utils'
import type { Product, Variant } from '@/lib/types'

/** Suma el producto (y la variante elegida) al pedido, con confirmación visual. */
export function AddToOrderButton({
  product,
  variant,
  quantity = 1,
  className,
  size = 'lg',
  label = 'Agregar al pedido',
}: {
  product: Product
  variant?: Variant
  quantity?: number
  className?: string
  size?: React.ComponentProps<typeof Button>['size']
  label?: string
}) {
  const { add } = useOrder()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  return (
    <Button
      size={size}
      onClick={() => {
        add(product, variant, quantity)
        setAdded(true)
      }}
      aria-live="polite"
      className={cn('transition-colors', added && 'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp', className)}
    >
      {added ? <Check className="size-4" /> : <ClipboardPlus className="size-4" />}
      {added ? 'Agregado' : label}
    </Button>
  )
}
