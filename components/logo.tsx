import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'light'
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/images/logo-distribuidora.png"
        alt="Distribuidora del Este"
        width={44}
        height={44}
        priority
        className="size-11 shrink-0 object-contain"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading text-sm font-bold uppercase tracking-wide',
            variant === 'light' ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          Distribuidora
        </span>
        <span
          className={cn(
            'font-heading text-xs font-semibold uppercase tracking-[0.2em]',
            variant === 'light' ? 'text-aqua' : 'text-primary',
          )}
        >
          del Este
        </span>
      </span>
    </span>
  )
}
