'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { headerIsDark } from '@/lib/logos'
import { SearchDialog } from '@/components/search-dialog'
import { CategoryMegaMenu, MobileCategoryList } from '@/components/category-menu'
import { OrderButton } from '@/components/order-drawer'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog } from '@/components/catalog-provider'
import { cn } from '@/lib/utils'

/** Secciones de la portada (con resaltado al hacer scroll) y la página de productos. */
const NAV = [
  { label: 'Inicio', id: 'inicio', href: '/#inicio' },
  { label: 'Productos', id: 'productos', href: '/productos' },
  { label: 'Nosotros', id: 'nosotros', href: '/#nosotros' },
  { label: 'Contacto', id: 'contacto', href: '/#contacto' },
]

export function SiteHeader() {
  const { settings, promoCount } = useCatalog()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState('inicio')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Resalta la sección visible en el menú.
  useEffect(() => {
    if (pathname !== '/') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const isHome = pathname === '/'

  return (
    <>
      {settings.announcementEnabled && settings.announcementText && (
        <div className="bg-brand-blue px-4 py-2 text-center text-sm font-medium text-brand-blue-foreground">
          {settings.announcementText}
        </div>
      )}
      <header
        className={cn(
          headerIsDark(settings.logoHeader) && 'surface-dark',
          'sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur transition-shadow supports-[backdrop-filter]:bg-background/80',
          scrolled ? 'border-border shadow-sm' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center rounded-lg" aria-label="Distribuidora del Este – Inicio">
            <Logo choice={settings.logoHeader} className="h-10 md:h-12" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {NAV.map((item) => {
              if (item.id === 'productos') {
                return (
                  <CategoryMegaMenu
                    key={item.id}
                    active={pathname.startsWith('/productos') || pathname.startsWith('/categoria')}
                  />
                )
              }
              const isCurrent = isHome && current === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isCurrent ? 'location' : undefined}
                  className={cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-opacity',
                      isCurrent ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <SearchDialog className="size-10 justify-center px-0 lg:w-56 lg:justify-start lg:px-3" />
            <OrderButton />
            <Button
              size="lg"
              nativeButton={false}
              className="hidden h-10 bg-whatsapp px-4 text-whatsapp-foreground hover:bg-whatsapp/90 sm:inline-flex"
              render={<WaLink source="header" />}
            >
              <WhatsappIcon className="size-4" />
              <span className="hidden xl:inline">Cotizar por WhatsApp</span>
              <span className="xl:hidden">Cotizar</span>
            </Button>

            <Button
              variant="outline"
              size="icon-lg"
              className="size-10 md:hidden"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        <div
          id="mobile-menu"
          inert={!open}
          className={cn(
            'grid border-t bg-background transition-[grid-template-rows,border-color] duration-300 md:hidden',
            open ? 'grid-rows-[1fr] border-border' : 'grid-rows-[0fr] border-transparent',
          )}
        >
          <nav className="overflow-hidden" aria-label="Navegación móvil">
            <div className="mx-auto flex max-h-[calc(100dvh-4rem)] max-w-7xl flex-col gap-1 overflow-y-auto px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {item.id === 'productos' ? 'Todos los productos' : item.label}
                </Link>
              ))}
              {promoCount > 0 && (
                <Link
                  href="/productos?oferta=1"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md bg-promo/[0.08] px-3 py-3 text-base font-medium text-foreground"
                >
                  Promociones
                  <span className="rounded bg-promo px-1.5 py-0.5 text-xs font-bold text-promo-foreground">{promoCount}</span>
                </Link>
              )}
              <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Categorías</p>
              <MobileCategoryList onNavigate={() => setOpen(false)} />
              <Button
                size="lg"
                nativeButton={false}
                className="mt-2 h-12 w-full bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
                render={<WaLink source="menu-movil" />}
              >
                <WhatsappIcon className="size-4" />
                Cotizar por WhatsApp
              </Button>
            </div>
          </nav>
        </div>
      </header>
    </>
  )
}
