'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { categoryUrl, childCategories, discountPercent, rootCategories } from '@/lib/catalog'
import { formatPrice, minPrice } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

/** Cantidad de productos publicados en la categoría y sus subcategorías (para ocultar las vacías). */
function useCounts() {
  const { categoryCounts } = useCatalog()
  return (id: string) => categoryCounts[id] ?? 0
}

/** Menú "Productos" del encabezado (escritorio): categorías a la izquierda y productos en promoción a la derecha. */
export function CategoryMegaMenu({ active }: { active: boolean }) {
  const { categories, promos, promoCount, totalProducts, settings } = useCatalog()
  const count = useCounts()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapper = useRef<HTMLDivElement>(null)
  const roots = rootCategories(categories).filter((r) => count(r.id) > 0)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => !wrapper.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const show = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), 120)
  }
  const hide = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <div ref={wrapper} onMouseEnter={show} onMouseLeave={hide}>
      {/* "Productos" lleva al catálogo; al pasar el cursor (o con la flecha, en pantallas táctiles y con teclado) se abre el menú. */}
      <div
        className={cn(
          'relative flex items-center rounded-md transition-colors hover:bg-muted',
          active || open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Link href="/productos" className="py-2 pl-3 pr-1 text-sm font-medium" aria-current={pathname === '/productos' ? 'page' : undefined}>
          Productos
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={open ? 'Cerrar menú de categorías' : 'Ver categorías y promociones'}
          className="flex h-9 items-center pl-0.5 pr-2.5"
        >
          <ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        </button>
        <span
          aria-hidden="true"
          className={cn('absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-opacity', active ? 'opacity-100' : 'opacity-0')}
        />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-background shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
          <div className={cn('mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:px-8', promos.length > 0 && 'grid-cols-[1fr_20rem]')}>
            <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
              {roots.map((root) => (
                <div key={root.id}>
                  <Link
                    href={categoryUrl(categories, root.id)}
                    className="font-heading text-sm font-bold uppercase tracking-wide text-foreground hover:text-primary"
                  >
                    {root.name}
                  </Link>
                  <ul className="mt-3 flex flex-col gap-2">
                    {childCategories(categories, root.id)
                      .filter((c) => count(c.id) > 0)
                      .map((child) => (
                        <li key={child.id}>
                          <Link href={categoryUrl(categories, child.id)} className="text-sm font-medium text-foreground/85 hover:text-primary">
                            {child.name}
                          </Link>
                          <SubList parent={child} />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
              <Link href="/productos" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Ver todos los productos ({totalProducts})
                <ArrowRight className="size-4" />
              </Link>
            </div>
            {promos.length > 0 && (
              <div className="-my-8 flex flex-col gap-3 bg-promo/[0.07] px-6 py-8">
                <p className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                  <span className="rounded bg-promo px-1.5 py-0.5 text-[0.65rem] tracking-wider text-promo-foreground">Promo</span>
                  Productos en promoción
                </p>
                <ul className="flex flex-col gap-1">
                  {promos.slice(0, 4).map((p) => {
                    const pct = discountPercent(p)
                    return (
                      <li key={p.id}>
                        <Link href={`/productos/${p.slug}`} className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-background">
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                            <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-promo">{p.name}</span>
                            <span className="flex items-baseline gap-2 whitespace-nowrap text-xs">
                              {settings.showPrices && minPrice(p) != null && (
                                <>
                                  <span className="font-bold tabular-nums text-promo">{formatPrice(minPrice(p))}</span>
                                  {!p.variants.length && p.promotion.originalPrice && (
                                    <s className="tabular-nums text-muted-foreground">{formatPrice(p.promotion.originalPrice)}</s>
                                  )}
                                </>
                              )}
                              {pct ? <span className="font-semibold text-promo">-{pct}%</span> : null}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                <Link href="/productos?oferta=1" className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-promo hover:underline">
                  Ver todas las promociones ({promoCount})
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SubList({ parent }: { parent: Category }) {
  const { categories } = useCatalog()
  const count = useCounts()
  const children = childCategories(categories, parent.id).filter((c) => count(c.id) > 0)
  if (!children.length) return null
  return (
    <ul className="mt-1.5 flex flex-col gap-1 border-l border-border pl-3">
      {children.map((c) => (
        <li key={c.id}>
          <Link href={categoryUrl(categories, c.id)} className="text-[0.8rem] text-muted-foreground hover:text-primary">
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Categorías en el menú del celular: acordeón por rubro. */
export function MobileCategoryList({ onNavigate }: { onNavigate: () => void }) {
  const { categories } = useCatalog()
  const count = useCounts()
  const [openId, setOpenId] = useState<string | null>(null)

  const item = (c: Category, depth: number): React.ReactNode => {
    const children = childCategories(categories, c.id).filter((x) => count(x.id) > 0)
    const expanded = openId === c.id || (depth > 1 && children.length > 0)
    return (
      <li key={c.id}>
        <div className="flex items-center">
          <Link
            href={categoryUrl(categories, c.id)}
            onClick={onNavigate}
            className={cn(
              'flex-1 rounded-md px-3 py-2.5 transition-colors hover:bg-muted',
              depth === 1 ? 'text-base font-medium text-foreground' : 'text-sm text-muted-foreground',
            )}
          >
            {c.name}
          </Link>
          {depth === 1 && children.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenId(openId === c.id ? null : c.id)}
              aria-expanded={openId === c.id}
              aria-label={`${openId === c.id ? 'Ocultar' : 'Ver'} subcategorías de ${c.name}`}
              className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <ChevronDown className={cn('size-4 transition-transform', openId === c.id && 'rotate-180')} />
            </button>
          )}
        </div>
        {expanded && children.length > 0 && (
          <ul className="ml-3 border-l border-border pl-2">{children.map((child) => item(child, depth + 1))}</ul>
        )}
      </li>
    )
  }

  return <ul className="flex flex-col">{rootCategories(categories).filter((r) => count(r.id) > 0).map((r) => item(r, 1))}</ul>
}
