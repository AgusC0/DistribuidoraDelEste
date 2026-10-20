'use client'

import { useOptimistic, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/admin/ui'
import { setShowPrices } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

/** Switch para mostrar u ocultar todos los precios del sitio público. El cambio se aplica al instante. */
export function PriceVisibilityToggle({ showPrices, className }: { showPrices: boolean; className?: string }) {
  const [pending, start] = useTransition()
  const [visible, setVisible] = useOptimistic(showPrices)

  function toggle() {
    start(async () => {
      setVisible(!visible)
      await setShowPrices(!visible)
    })
  }

  return (
    <section
      aria-label="Precios en el sitio"
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 shadow-xs transition-colors sm:p-5',
        visible ? 'border-border bg-card' : 'border-promo/40 bg-promo/5',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg',
          visible ? 'bg-primary/10 text-primary' : 'bg-promo/15 text-promo',
        )}
      >
        {visible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{visible ? 'Precios visibles en el sitio' : 'Precios ocultos en el sitio'}</p>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {visible
            ? 'Los clientes ven los montos en el catálogo, en cada producto, en su pedido y en el mensaje de WhatsApp.'
            : 'Se muestran sólo los productos. Los clientes arman el pedido y piden el presupuesto por WhatsApp, sin montos.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1">
        <Switch checked={visible} onChange={toggle} disabled={pending} label="Mostrar precios en el sitio" />
        <span className="text-[0.7rem] font-medium text-muted-foreground">{pending ? 'Guardando…' : visible ? 'Mostrar' : 'Ocultos'}</span>
      </div>
    </section>
  )
}
