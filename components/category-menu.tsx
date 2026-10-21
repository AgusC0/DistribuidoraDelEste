'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronDown, Flame } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { categoryUrl, childCategories, descendantIds, isOnPromotion, rootCategories } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

/** Cantidad de productos publicados en la categoría y sus subcategorías (para ocultar las vacías). */
function useCounts() {
  const { products, categories } = useCatalog()
  return (id: string) => {
    const ids = descendantIds(categories, id)
    return products.filter((p) => ids.has(p.categoryId)).length
  }
}

/** Menú "Productos" del encabezado (escritorio): rubros en columnas con sus subcategorías. */
export function CategoryMegaMenu({ active }: { active: boolean }) {
  const { categories, products } = useCatalog()
  const count = useCounts()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapper = useRef<HTMLDivElement>(null)
  const roots = rootCategories(categories).filter((r) => count(r.id) > 0)
  const promos = products.filter((p) => isOnPromotion(p)).length

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          'relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
          active || open ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        Productos
        <ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
        <span
          aria-hidden="true"
          className={cn('absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary transition-opacity', active ? 'opacity-100' : 'opacity-0')}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-background shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1">
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_15rem] gap-8 px-4 py-8 sm:px-6 lg:px-8">
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
            <div className="flex flex-col gap-3 border-l border-border pl-8">
              {promos > 0 && (
                <Link
                  href="/productos?oferta=1"
                  className="group flex items-center gap-3 rounded-2xl bg-promo/10 p-4 ring-1 ring-promo/25 transition-colors hover:bg-promo/15"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-promo text-promo-foreground">
                    <Flame className="size-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-sm font-bold uppercase text-foreground">Ofertas</span>
                    <span className="block text-xs text-muted-foreground">{promos} productos en promoción</span>
                  </span>
                </Link>
              )}
              <Link href="/productos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Ver todo el catálogo ({products.length})
                <ArrowRight className="size-4" />
              </Link>
            </div>
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
