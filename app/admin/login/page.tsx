import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { LoginForm } from '@/components/admin/login-form'
import { isAdmin } from '@/lib/session'

export const metadata: Metadata = { title: 'Ingresar al panel', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await isAdmin()) redirect('/admin')
  const { next } = await searchParams
  const devHint = process.env.NODE_ENV !== 'production' && !process.env.ADMIN_PASSWORD
  const misconfigured = process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/60 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Logo />
        <h1 className="mt-6 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">Panel de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ingresá tu usuario y contraseña para gestionar el sitio.</p>
        {misconfigured && (
          <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            Falta configurar la variable de entorno ADMIN_PASSWORD en el servidor.
          </p>
        )}
        <LoginForm next={next ?? ''} />
        {devHint && (
          <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Modo prueba: usuario <code className="font-semibold">admin</code> y contraseña{' '}
            <code className="font-semibold">admin</code>. Se cambian con ADMIN_USER y ADMIN_PASSWORD en <code>.env.local</code>.
          </p>
        )}
      </div>
    </main>
  )
}
