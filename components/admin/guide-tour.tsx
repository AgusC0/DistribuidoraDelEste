'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GUIDES, type GuideKey, type GuideStep } from '@/lib/admin-guides'
import { cn } from '@/lib/utils'

type Tour = { key: GuideKey; index: number; dir: 1 | -1 }

const Ctx = createContext<{ start: (key: GuideKey) => void } | null>(null)

export function useGuide() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGuide debe usarse dentro de <GuideProvider>')
  return ctx
}

const PAD = 8
const CARD_W = 360

/** Primer elemento visible de la lista de destinos del paso (ej: el menú en escritorio, el título en el celular). */
function findTarget(step: GuideStep): HTMLElement | null {
  const targets = step.target === undefined ? [] : Array.isArray(step.target) ? step.target : [step.target]
  for (const t of targets) {
    const el = document.querySelector<HTMLElement>(`[data-guide="${t}"]`)
    if (!el) continue
    const r = el.getBoundingClientRect()
    // Fuera de pantalla hacia los costados = oculto (ej: el menú lateral cerrado en el celular).
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth) return el
  }
  return null
}

/**
 * Guía interactiva del panel: oscurece la pantalla, ilumina la parte de la que habla cada paso,
 * la lleva a la vista y, si el paso es de otra sección, navega hasta ahí.
 */
export function GuideProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [tour, setTour] = useState<Tour | null>(null)
  // `blocked`: el paso necesita datos que todavía no hay (ej: pedidos); se explica qué falta.
  const [shown, setShown] = useState<{ step: GuideStep; el: HTMLElement | null; blocked?: boolean } | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  // Después de cambiar de sección la página tarda un momento en dibujarse: recién ahí vale la pena esperar.
  const navigated = useRef(false)
  const [cardH, setCardH] = useState(200)

  const start = useCallback((key: GuideKey) => setTour({ key, index: 0, dir: 1 }), [])
  const close = useCallback(() => {
    setTour(null)
    setShown(null)
    setRect(null)
  }, [])

  const steps = tour ? GUIDES[tour.key].steps : []
  const go = useCallback(
    (dir: 1 | -1) =>
      setTour((t) => {
        if (!t) return t
        const index = t.index + dir
        return index < 0 || index >= GUIDES[t.key].steps.length ? null : { ...t, index, dir }
      }),
    [],
  )

  // Resuelve el paso actual: navega si es de otra sección y espera a que aparezca su parte de la pantalla.
  useEffect(() => {
    if (!tour) return
    const step = GUIDES[tour.key].steps[tour.index]
    if (step.page && step.page !== pathname) {
      setShown(null)
      navigated.current = true
      router.push(step.page)
      return
    }
    const patience = navigated.current ? 25 : 2
    navigated.current = false
    let cancelled = false
    let tries = 0
    const resolve = () => {
      if (cancelled) return
      if (!step.target) return setShown({ step, el: null })
      const el = findTarget(step)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return setShown({ step, el })
      }
      if (++tries < patience) return void setTimeout(resolve, 120)
      // Si el paso necesita datos, se explica qué falta (señalando el estado vacío si lo hay).
      if (step.missing) {
        const empty = findTarget({ ...step, target: 'vacio' })
        empty?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return setShown({ step, el: empty, blocked: true })
      }
      // Si no, es una parte opcional: se saltea en la dirección en que venía.
      go(tour.dir)
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [tour, pathname, router, go])

  // Sigue la posición del elemento al cambiar de paso, al desplazarse la página o cambiar el tamaño.
  // (No sólo con requestAnimationFrame: en una pestaña en segundo plano no corre y el foco quedaba quieto.)
  useEffect(() => {
    if (!shown) return
    const measure = () => {
      setSize((s) => (s.w === window.innerWidth && s.h === window.innerHeight ? s : { w: window.innerWidth, h: window.innerHeight }))
      if (!shown.el) return setRect(null)
      const r = shown.el.getBoundingClientRect()
      setRect((prev) => (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height ? prev : r))
    }
    measure()
    let frame = 0
    const loop = () => {
      measure()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    // El desplazamiento suave tarda: se vuelve a medir cuando termina.
    const timers = [150, 400].map((ms) => setTimeout(measure, ms))
    // Si el desplazamiento suave no llegó (pestaña en segundo plano, movimiento reducido), se lleva de una.
    timers.push(
      setTimeout(() => {
        const r = shown.el?.getBoundingClientRect()
        if (r && (r.bottom < 0 || r.top > window.innerHeight)) shown.el!.scrollIntoView({ block: 'center', behavior: 'instant' })
        measure()
      }, 700),
    )
    window.addEventListener('scroll', measure, { passive: true, capture: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      timers.forEach(clearTimeout)
      window.removeEventListener('scroll', measure, { capture: true })
      window.removeEventListener('resize', measure)
    }
  }, [shown])

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [shown])

  useEffect(() => {
    if (!tour) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tour, close, go])

  // Recorte iluminado, sin salirse de la pantalla (una tabla larga puede ocupar más que la ventana).
  const hole = rect && {
    top: Math.max(rect.top - PAD, 8),
    left: Math.max(rect.left - PAD, 8),
    bottom: Math.min(rect.bottom + PAD, size.h - 8),
    right: Math.min(rect.right + PAD, size.w - 8),
  }

  // La tarjeta va debajo del recorte si entra; si no, arriba; si tampoco, abajo de la pantalla.
  const mobile = size.w < 640
  let cardStyle: React.CSSProperties | undefined
  if (hole && !mobile) {
    const left = Math.min(Math.max(hole.left, 16), size.w - CARD_W - 16)
    if (hole.bottom + 16 + cardH < size.h) cardStyle = { top: hole.bottom + 16, left }
    else if (hole.top - 16 - cardH > 0) cardStyle = { top: hole.top - 16 - cardH, left }
    else cardStyle = { bottom: 24, left }
  }

  const index = tour?.index ?? 0

  return (
    <Ctx.Provider value={{ start }}>
      {children}
      {tour && shown && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
          {/* Bloquea clics al resto mientras dura la guía */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
          {hole ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-xl ring-2 ring-white/90 transition-all duration-300 ease-out"
              style={{
                top: hole.top,
                left: hole.left,
                width: Math.max(hole.right - hole.left, 0),
                height: Math.max(hole.bottom - hole.top, 0),
                boxShadow: '0 0 0 9999px rgb(15 23 42 / 0.62)',
              }}
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-slate-900/60 transition-opacity" />
          )}

          <div
            ref={cardRef}
            style={cardStyle}
            className={cn(
              'absolute rounded-2xl bg-card p-5 text-card-foreground shadow-2xl transition-[top,left] duration-300 ease-out motion-safe:animate-in motion-safe:fade-in-0',
              cardStyle ? 'w-[360px]' : hole ? 'inset-x-4 bottom-4' : 'left-1/2 top-1/2 w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className={cn('text-xs font-semibold uppercase tracking-[0.16em]', shown.blocked ? 'text-warning' : 'text-brand-blue')}>
                {shown.blocked && !shown.step.canSkip && 'No se puede seguir · '}
                {GUIDES[tour.key].title} · Paso {index + 1} de {steps.length}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar guía"
                className="-m-1.5 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 id="tour-title" className="mt-2 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
              {shown.step.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
              {shown.blocked ? shown.step.missing : shown.step.text}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {steps.map((s, i) => (
                  <span key={s.title + i} className={cn('h-1.5 rounded-full bg-brand-blue transition-all', i === index ? 'w-5' : 'w-1.5 opacity-25')} />
                ))}
              </div>
              <div className="flex gap-2">
                {index > 0 && (
                  <Button variant="ghost" size="sm" className="h-9" onClick={() => go(-1)}>
                    Anterior
                  </Button>
                )}
                {shown.blocked && !shown.step.canSkip ? (
                  <Button size="sm" className="h-9 bg-brand-blue px-4 text-brand-blue-foreground hover:bg-brand-blue/90" onClick={close}>
                    Entendido
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-9 bg-brand-blue px-4 text-brand-blue-foreground hover:bg-brand-blue/90"
                    onClick={() => (index < steps.length - 1 ? go(1) : close())}
                  >
                    {index < steps.length - 1 ? 'Siguiente' : 'Terminar'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
