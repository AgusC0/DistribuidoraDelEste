import { cn } from '@/lib/utils'

/** Etiqueta única de promoción en todo el sitio: "PROMO | -20%". El naranja se usa sólo para promociones. */
export function PromoBadge({ percent, size = 'sm', className }: { percent?: number | null; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-promo font-bold uppercase tracking-wider text-promo-foreground shadow-sm',
        size === 'sm' ? 'px-2 py-1 text-[0.7rem]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      Promo
      {percent ? <span className="border-l border-promo-foreground/40 pl-1.5">-{percent}%</span> : null}
    </span>
  )
}
