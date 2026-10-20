'use client'

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Clock, CornerDownLeft, Search, Sparkles, TrendingUp, X } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { categoryUrl, descendantIds } from '@/lib/catalog'
import { correction, highlight, matchCategories, normalize, search } from '@/lib/search'
import { displayPrice, hasPrice, waLink } from '@/lib/site'
import { track } from '@/lib/track'
import { cn } from '@/lib/utils'
import type { Category, Product } from '@/lib/types'

export const CATALOG_EVENT = 'dde:catalog'
const RECENT_KEY = 'dde_recent_searches'
const MAX_PRODUCTS = 6

type Option =
  | { kind: 'recent' | 'popular' | 'correction'; key: string; term: string }
  | { kind: 'category'; key: string; category: Category; count: number }
  | { kind: 'product'; key: string; product: Product; categoryName: string }
  | { kind: 'all'; key: string; count: number }
  | { kind: 'whatsapp'; key: string }

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(term: string) {
  const t = term.trim()
  if (t.length < 2) return
  try {
    const next = [t, ...readRecent().filter((r) => normalize(r) !== normalize(t))].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlight(text, query).map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded-sm bg-accent/35 px-0 text-inherit">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  )
}

export function SearchBox({
  value,
  onValueChange,
  onSubmit,
  variant = 'popover',
  autoFocus,
  placeholder = 'Buscá griferías, purificadores, termotanques…',
  className,
  navigate = (go) => go(),
}: {
  value?: string
  onValueChange?: (value: string) => void
  /** Enter sin opción activa o "Ver todos los resultados". Por defecto va al catálogo filtrado. */
  onSubmit?: (query: string) => void
  /** `popover`: lista flotante. `panel`: lista fija debajo (dentro de un diálogo). */
  variant?: 'popover' | 'panel'
  autoFocus?: boolean
  placeholder?: string
  className?: string
  /**
   * Envuelve cada navegación. Un diálogo lo usa para cerrarse primero y navegar al terminar,
   * así el bloqueo de scroll del diálogo no pisa la posición de la página nueva.
   */
  navigate?: (go: () => void) => void
}) {
  const { index, categories, products, popularSearches, settings } = useCatalog()
  const router = useRouter()
  const pathname = usePathname()
  const id = useId()
  const listId = `${id}-list`
  const inputRef = useRef<HTMLInputElement>(null)

  const [inner, setInner] = useState('')
  const query = value ?? inner
  const setQuery = (v: string) => {
    if (value === undefined) setInner(v)
    onValueChange?.(v)
  }
  const deferred = useDeferredValue(query)
  const [open, setOpen] = useState(variant === 'panel')
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => setRecent(readRecent()), [])

  const trimmed = deferred.trim()
  const hits = useMemo(() => (trimmed ? search(index, trimmed) : []), [index, trimmed])
  const fix = useMemo(
    () => (trimmed.length >= 3 && hits.length === 0 ? correction(index, trimmed) : null),
    [index, trimmed, hits.length],
  )

  const options = useMemo<Option[]>(() => {
    if (!trimmed) {
      const popular = (popularSearches.length ? popularSearches : ['purificador', 'termotanque', 'grifería'])
        .filter((p) => !recent.some((r) => normalize(r) === normalize(p)))
        .slice(0, 4)
      return [
        ...recent.map((term) => ({ kind: 'recent' as const, key: `r-${term}`, term })),
        ...popular.map((term) => ({ kind: 'popular' as const, key: `p-${term}`, term })),
      ]
    }
    const cats = matchCategories(categories, trimmed).map((category) => ({
      kind: 'category' as const,
      key: `c-${category.id}`,
      category,
      count: products.filter((p) => descendantIds(categories, category.id).has(p.categoryId)).length,
    }))
    const prods = hits.slice(0, MAX_PRODUCTS).map((h) => ({
      kind: 'product' as const,
      key: `p-${h.product.id}`,
      product: h.product,
      categoryName: h.categoryName,
    }))
    const out: Option[] = [...cats, ...prods]
    if (hits.length > 0) out.push({ kind: 'all', key: 'all', count: hits.length })
    else {
      if (fix) out.push({ kind: 'correction', key: 'fix', term: fix })
      out.push({ kind: 'whatsapp', key: 'wa' })
    }
    return out
  }, [trimmed, hits, fix, categories, products, popularSearches, recent])

  // Autocompletado "fantasma": completa el nombre del mejor resultado mientras escribís.
  const ghost = useMemo(() => {
    if (!query || query !== deferred || query.endsWith(' ')) return ''
    const q = normalize(query)
    const candidates = [...hits.map((h) => h.product.name), ...categories.map((c) => c.name)]
    const match = candidates.find((name) => normalize(name).startsWith(q) && name.length > query.length)
    return match ? match.slice(query.length) : ''
  }, [query, deferred, hits, categories])

  useEffect(() => setActive(-1), [trimmed])

  // Registra la búsqueda cuando el usuario deja de escribir (para el panel de admin).
  const lastLogged = useRef('')
  useEffect(() => {
    if (trimmed.length < 3) return
    const t = setTimeout(() => {
      if (normalize(trimmed) === lastLogged.current) return
      lastLogged.current = normalize(trimmed)
      track({ type: 'search', q: trimmed, results: hits.length })
    }, 1200)
    return () => clearTimeout(t)
  }, [trimmed, hits.length])

  const expanded = open && options.length > 0

  function close() {
    if (variant === 'popover') setOpen(false)
    setActive(-1)
  }

  /** Lleva al catálogo filtrado. Si ya estás en /productos lo hace sin recargar; el catálogo escucha CATALOG_EVENT. */
  function goToCatalog(params: Record<string, string>) {
    const url = `/productos?${new URLSearchParams(params)}`
    navigate(() => {
      if (pathname === '/productos') {
        window.history.pushState(window.history.state, '', url)
        window.dispatchEvent(new Event(CATALOG_EVENT))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push(url)
      }
    })
  }

  function submit(q: string) {
    const term = q.trim()
    if (!term) return
    saveRecent(term)
    setRecent(readRecent())
    close()
    if (onSubmit) onSubmit(term)
    else goToCatalog({ q: term })
  }

  function choose(opt: Option) {
    switch (opt.kind) {
      case 'recent':
      case 'popular':
      case 'correction':
        setQuery(opt.term)
        if (opt.kind === 'correction') saveRecent(opt.term)
        inputRef.current?.focus()
        return
      case 'category':
        saveRecent(opt.category.name)
        close()
        setQuery('')
        navigate(() => router.push(categoryUrl(categories, opt.category.id)))
        return
      case 'product':
        saveRecent(query)
        close()
        navigate(() => router.push(`/productos/${opt.product.slug}`))
        return
      case 'all':
        submit(query)
        return
      case 'whatsapp':
        track({ type: 'wa_click', source: 'buscador' })
        window.open(
          waLink(settings.whatsappNumber, `Hola Distribuidora del Este, ¿tienen ${query.trim()}?`),
          '_blank',
          'noopener,noreferrer',
        )
        return
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const atEnd = e.currentTarget.selectionStart === query.length
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost && atEnd && !e.shiftKey) {
      e.preventDefault()
      setQuery(query + ghost)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % Math.max(options.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (expanded && active >= 0 && options[active]) choose(options[active])
      else submit(query)
    } else if (e.key === 'Escape') {
      if (expanded && variant === 'popover') {
        e.preventDefault()
        close()
      } else if (query) {
        e.preventDefault()
        setQuery('')
      }
    } else if (e.key === 'Tab') {
      close()
    }
  }

  // Desplaza la opción activa a la vista al navegar con el teclado.
  useEffect(() => {
    if (active < 0) return
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, id])

  const sections = groupOptions(options)
  let flat = -1

  return (
    <div
      className={cn('relative', className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) close()
      }}
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        {/* texto fantasma del autocompletado, alineado con el input */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-10 right-10 flex items-center overflow-hidden whitespace-pre text-base md:text-sm"
        >
          <span className="invisible">{query}</span>
          <span className="text-muted-foreground/60">{ghost}</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-label="Buscar productos"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-10 text-base shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {trimmed ? `${hits.length} ${hits.length === 1 ? 'resultado' : 'resultados'}` : ''}
      </p>

      <div
        id={listId}
        role="listbox"
        aria-label="Sugerencias"
        hidden={!expanded}
        className={cn(
          'overflow-y-auto overscroll-contain',
          variant === 'popover'
            ? 'absolute inset-x-0 top-full z-50 mt-2 max-h-[min(70vh,28rem)] rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in-0 slide-in-from-top-1'
            : 'mt-3 max-h-[60vh]',
        )}
      >
        {sections.map((section) => (
          <div key={section.title} role="group" aria-label={section.title} className="py-1">
            <p className="px-2.5 pb-1 pt-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.options.map((opt) => {
              flat++
              const i = flat
              return (
                <div
                  key={opt.key}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={active === i}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => active !== i && setActive(i)}
                  onClick={() => choose(opt)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground',
                    active === i && 'bg-muted',
                  )}
                >
                  <OptionContent opt={opt} query={trimmed} />
                </div>
              )
            })}
          </div>
        ))}
        {variant === 'popover' && trimmed && (
          <p className="hidden items-center gap-3 border-t border-border px-2.5 pb-1 pt-2 text-xs text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border px-1">↑</kbd>
              <kbd className="rounded border border-border px-1">↓</kbd> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border px-1">↵</kbd> elegir
            </span>
            {ghost && (
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border border-border px-1">Tab</kbd> completar
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function groupOptions(options: Option[]) {
  const titles: Record<Option['kind'], string> = {
    recent: 'Búsquedas recientes',
    popular: 'Lo más buscado',
    category: 'Categorías',
    product: 'Productos',
    all: 'Productos',
    correction: 'Sin resultados',
    whatsapp: 'Sin resultados',
  }
  const sections: { title: string; options: Option[] }[] = []
  for (const opt of options) {
    const title = titles[opt.kind]
    const last = sections.at(-1)
    if (last && last.title === title) last.options.push(opt)
    else sections.push({ title, options: [opt] })
  }
  return sections
}

function OptionContent({ opt, query }: { opt: Option; query: string }) {
  const { settings } = useCatalog()
  switch (opt.kind) {
    case 'recent':
    case 'popular': {
      const Icon = opt.kind === 'recent' ? Clock : TrendingUp
      return (
        <>
          <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{opt.term}</span>
          <CornerDownLeft aria-hidden="true" className="size-3.5 text-muted-foreground/60" />
        </>
      )
    }
    case 'category':
      return (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          <span className="flex-1 truncate font-medium">
            <Highlighted text={opt.category.name} query={query} />
          </span>
          <span className="text-xs text-muted-foreground">
            {opt.count} {opt.count === 1 ? 'producto' : 'productos'}
          </span>
        </>
      )
    case 'product':
      return (
        <>
          <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
            <Image src={opt.product.image || '/placeholder.svg'} alt="" fill sizes="44px" className="object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">
              <Highlighted text={opt.product.name} query={query} />
            </span>
            <span className="block truncate text-xs text-muted-foreground">{opt.categoryName}</span>
          </span>
          {settings.showPrices && (
            <span
              className={cn(
                'shrink-0 text-xs font-semibold',
                hasPrice(opt.product) ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {displayPrice(opt.product)}
            </span>
          )}
        </>
      )
    case 'all':
      return (
        <>
          <Search aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span className="flex-1 truncate">
            Ver {opt.count === 1 ? 'el resultado' : `los ${opt.count} resultados`} para{' '}
            <strong className="font-semibold">“{query}”</strong>
          </span>
          <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
        </>
      )
    case 'correction':
      return (
        <>
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span className="flex-1 truncate">
            ¿Quisiste decir <strong className="font-semibold text-primary">{opt.term}</strong>?
          </span>
        </>
      )
    case 'whatsapp':
      return (
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-whatsapp/15 text-whatsapp">
            <WhatsappIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate">
              Preguntanos por <strong className="font-semibold">“{query}”</strong>
            </span>
            <span className="block text-xs text-muted-foreground">
              No está en el catálogo online, pero puede que lo tengamos.
            </span>
          </span>
        </>
      )
  }
}
