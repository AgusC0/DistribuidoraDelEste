'use client'

import { startTransition, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ className, ...props }: React.ComponentProps<'section'>) {
  return <section className={cn('rounded-2xl bg-card p-6', className)} {...props} />
}

export function SubmitButton({
  children,
  className,
  pending: pendingProp,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  const status = useFormStatus()
  const pending = pendingProp ?? status.pending
  return (
    <Button type="submit" disabled={pending} className={cn('h-10 px-4', className)} {...props}>
      {pending ? 'Guardando…' : children}
    </Button>
  )
}

/**
 * Envía el formulario a una server action sin que React lo resetee al terminar
 * (así, si hay un error de validación, no se pierde lo que escribió el usuario).
 */
export function submitKeepingValues(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Incluye el botón que envió el formulario (name/value), p. ej. "Revisar" vs. "Aplicar".
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const fd = new FormData(e.currentTarget, submitter)
    startTransition(() => action(fd))
  }
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) return null
  return (
    <p
      role={state.ok ? 'status' : 'alert'}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
        state.ok ? 'bg-whatsapp/10 text-whatsapp' : 'bg-destructive/10 text-destructive',
      )}
    >
      {state.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
      {state.message}
    </p>
  )
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  )
}

/** Botón con diálogo de confirmación para acciones destructivas. */
export function ConfirmButton({
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  children,
  className,
  variant = 'destructive',
  size,
  'aria-label': ariaLabel,
}: {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
  className?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger render={<Button variant={variant} size={size} className={className} aria-label={ariaLabel} />}>
        {children}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="font-heading text-lg font-semibold uppercase text-foreground">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">{description}</AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="outline" className="h-10 px-4" />}>Cancelar</AlertDialog.Close>
            <Button
              variant="destructive"
              className="h-10 px-4"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onConfirm()
                } finally {
                  setBusy(false)
                  setOpen(false)
                }
              }}
            >
              {busy ? 'Procesando…' : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-input',
      )}
    >
      <span
        className={cn(
          'inline-block size-4.5 rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-[0.1875rem]',
        )}
      />
    </button>
  )
}

export const inputClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive'
