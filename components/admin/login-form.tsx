'use client'

import { useActionState, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, type FormState } from '@/app/admin/actions'

const fieldClass =
  'h-11 border-0 bg-muted pl-10 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_4px_0px_rgba(0,0,0,0.06)] focus-visible:ring-primary/25'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {})
  const [show, setShow] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="user">Usuario</Label>
        <div className="relative">
          <User aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user"
            name="user"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoFocus
            placeholder="Tu usuario"
            aria-invalid={!!state.message}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            aria-invalid={!!state.message}
            aria-describedby={state.message ? 'login-error' : undefined}
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state.message && (
          <p id="login-error" role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full gap-2 bg-gradient-to-b from-primary to-primary/80 font-semibold text-primary-foreground shadow-sm hover:from-primary hover:to-primary"
      >
        {pending ? 'Ingresando…' : 'Ingresar'}
        {!pending && <ArrowRight className="size-4" />}
      </Button>
    </form>
  )
}
