'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardList,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  Tags,
  X,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { logout } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Tags },
  { href: '/admin/consultas', label: 'Consultas', icon: Inbox },
  { href: '/admin/busquedas', label: 'Búsquedas', icon: Search },
  { href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
]

export function AdminShell({
  children,
  newLeads,
  newOrders,
}: {
  children: React.ReactNode
  newLeads: number
  newOrders: number
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const nav = (
    <nav aria-label="Panel" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const badge = href === '/admin/consultas' ? newLeads : href === '/admin/pedidos' ? newOrders : 0
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  active ? 'bg-primary-foreground/20' : 'bg-promo text-promo-foreground',
                )}
                aria-label={`${badge} ${href === '/admin/pedidos' ? 'nuevos' : 'nuevas'}`}
              >
                {badge}
              </span>
            )}
          </Link>
        )
      })}
      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          Ver sitio
        </a>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  )

  return (
    <div className="min-h-dvh bg-secondary/40">
      {/* barra superior móvil */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="flex size-10 items-center justify-center rounded-lg border border-border"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <aside
        id="admin-nav"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Link href="/admin" className="px-2 pt-1">
          <Logo />
        </Link>
        {nav}
      </aside>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
