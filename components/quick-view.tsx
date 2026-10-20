'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowRight, ChevronDown, X } from 'lucide-react'
import { ProductPurchase } from '@/components/product-detail'
import { useCatalog } from '@/components/catalog-provider'
import { categoryName } from '@/lib/site'
import { track } from '@/lib/track'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

type QuickViewContext = { open: (product: Product, origin: DOMRect) => void }

const Ctx = createContext<QuickViewContext | null>(null)

export function useQuickView() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useQuickView debe usarse dentro de <QuickViewProvider>')
  return ctx
}

/** Una sola ventana de vista rápida para todo el sitio; cualquier tarjeta la abre con el ojo. */
export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ product: Product; origin: DOMRect } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback((product: Product, origin: DOMRect) => {
    setState({ product, origin })
    setIsOpen(true)
    track({ type: 'view', productId: product.id })
  }, [])

  const value = useMemo(() => ({ open }), [open])

  return (
    <Ctx.Provider value={value}>
      {children}
      {state && (
        <QuickViewDialog
          key={state.product.id}
          product={state.product}
          origin={state.origin}
          open={isOpen}
          onOpenChange={setIsOpen}
          onClosed={() => setState(null)}
        />
      )}
    </Ctx.Provider>
  )
}

const MODAL_WIDTH = 960

function QuickViewDialog({
  product,
  origin,
  open,
  onOpenChange,
  onClosed,
}: {
  product: Product
  origin: DOMRect
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed: () => void
}) {
  const { categories } = useCatalog()
  const images = product.images.length ? product.images : [product.image || '/placeholder.svg']
  const [shot, setShot] = useState(0)

  // La ventana nace donde estaba la tarjeta y se expande al centro (en celular sube como hoja).
  const originStyle = useMemo(() => {
    if (typeof window === 'undefined') return {}
    const width = Math.min(MODAL_WIDTH, window.innerWidth - 32)
    return {
      '--dx': `${origin.left + origin.width / 2 - window.innerWidth / 2}px`,
      '--dy': `${origin.top + origin.height / 2 - window.innerHeight / 2}px`,
      '--s': String(Math.min(origin.width / width, 1)),
    } as React.CSSProperties
  }, [origin])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(o) => !o && onClosed()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-blue/45 backdrop-blur-md transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <Dialog.Popup
            style={originStyle}
            className="quick-view relative flex max-h-[100dvh] w-full flex-col overflow-y-auto bg-background shadow-2xl outline-none sm:grid sm:h-[min(88vh,640px)] sm:max-w-[960px] sm:grid-cols-2 sm:overflow-hidden sm:rounded-2xl"
          >
            <Dialog.Close
              aria-label="Cerrar vista rápida"
              className="qv-fade absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-background/95 shadow-md transition-colors hover:bg-foreground hover:text-background"
            >
              <X className="size-5" />
            </Dialog.Close>

            {/* galería */}
            <div className="relative aspect-square shrink-0 bg-secondary sm:aspect-auto sm:h-full">
              {images.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={i === 0 ? product.name : `${product.name} – foto ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 480px"
                  className={cn('object-cover transition-opacity duration-300', i === shot ? 'opacity-100' : 'opacity-0')}
                />
              ))}
              {product.promo && (
                <span className="absolute left-4 top-4 rounded-full bg-promo px-3 py-1 text-xs font-bold uppercase text-promo-foreground">
                  Promo
                </span>
              )}
              {images.length > 1 && (
                <div className="qv-fade absolute bottom-4 left-4 flex gap-2" role="group" aria-label="Fotos del producto">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setShot(i)}
                      aria-label={`Ver foto ${i + 1}`}
                      aria-current={i === shot}
                      className={cn(
                        'relative size-14 overflow-hidden rounded-lg border-2 bg-secondary shadow transition-colors',
                        i === shot ? 'border-background' : 'border-transparent opacity-75 hover:opacity-100',
                      )}
                    >
                      <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* detalles */}
            <div className="qv-fade flex flex-col gap-4 p-5 sm:overflow-y-auto sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {categoryName(categories, product.categoryId)}
              </p>
              <Dialog.Title className="-mt-2 font-heading text-2xl font-bold uppercase leading-tight tracking-tight sm:text-3xl">
                {product.name}
              </Dialog.Title>

              <ProductPurchase product={product} compact />

              <div className="divide-y divide-border border-y border-border">
                <details open className="group/acc py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    Descripción
                    <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/acc:rotate-180" />
                  </summary>
                  <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {product.description || 'Consultanos por medidas, marcas y disponibilidad.'}
                  </Dialog.Description>
                </details>
                {product.variants.length > 0 && (
                  <details className="group/acc py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      Opciones disponibles ({product.variants.length})
                      <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/acc:rotate-180" />
                    </summary>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {product.variants.map((v) => (
                        <li key={v.id} className="rounded-md bg-muted px-2 py-1 text-xs">
                          {v.name}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <details className="group/acc py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    Cómo comprar
                    <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/acc:rotate-180" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Sumá este y otros productos a tu pedido y envianos la lista por WhatsApp. Te respondemos con el presupuesto,
                    la disponibilidad y las formas de pago.
                  </p>
                </details>
              </div>

              <Link
                href={`/productos/${product.slug}`}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline"
              >
                Ver producto completo <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
