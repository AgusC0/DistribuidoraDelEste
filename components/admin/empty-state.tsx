import { cn } from '@/lib/utils'

/**
 * Estado vacío: en vez de cajas en blanco, una explicación de qué va a aparecer y cómo empezar.
 * Sin tarjeta ni borde: se apoya en el fondo.
 */
export function EmptyState({
  icon: Icon,
  title,
  children,
  steps,
  className,
}: {
  icon: React.ElementType
  title: string
  children?: React.ReactNode
  steps?: string[]
  className?: string
}) {
  return (
    <div className={cn('mx-auto flex max-w-xl flex-col items-center px-4 py-12 text-center', className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-xs">
        <Icon className="size-7" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold uppercase tracking-wide text-foreground">{title}</h2>
      {children && <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>}
      {steps && (
        <ol className="mt-6 flex w-full flex-col gap-3 text-left">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
