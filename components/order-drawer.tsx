'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import { ClipboardList, Minus, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog } from '@/components/catalog-provider'
import { itemKey, useOrder } from '@/components/order-provider'
import { submitOrder } from '@/app/actions'
import { complementsFor } from '@/lib/catalog'
import { displayPrice, formatPrice, orderWaMessage, paymentOptions, waLink } from '@/lib/site'
import type { Product } from '@/lib/types'
import { track } from '@/lib/track'
import { cn } from '@/lib/utils'

/** Botón del encabezado + panel lateral con el pedido. */
export function OrderButton({ className }: { className?: string }) {
  const { count, setOpen } = useOrder()
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count ? `Mi pedido: ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Mi pedido (vacío)'}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground shadow-xs transition-colors hover:border-ring/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
        className,
      )}
    >
      <ClipboardList className="size-4" />
      {count > 0 && (
        <span
          key={count}
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-promo px-1 text-[0.7rem] font-bold tabular-nums text-promo-foreground motion-safe:animate-in motion-safe:zoom-in-50"
        >
          {count}
        </span>
      )}
    </button>
  )
}

export function OrderDrawer() {
  const { settings, products } = useCatalog()
  const { items, open, setOpen, setQuantity, remove, clear, add } = useOrder()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const priced = items.filter((i) => i.price != null)
  // Complementos de lo que ya está en el pedido (sin repetir lo que ya se agregó).
  const suggestions = (() => {
    const inOrder = new Set(items.map((i) => i.productId))
    const out: Product[] = []
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue
      for (const c of complementsFor(product, products, 6)) {
        if (!inOrder.has(c.id) && !out.some((x) => x.id === c.id)) out.push(c)
      }
    }
    return out.slice(0, 3)
  })()
  const total = priced.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0)

  function send() {
    const message = orderWaMessage(items, name.trim(), note.trim())
    // Guardado en segundo plano: abrir WhatsApp debe ser inmediato para que el navegador no lo bloquee.
    void submitOrder(
      {
        name: name.trim(),
        note: note.trim(),
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      },
      message,
    ).catch(() => {})
    track({ type: 'wa_click', source: 'pedido' })
    window.open(waLink(settings.whatsappNumber, message), '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o && sent) {
          clear()
          setSent(false)
          setNote('')
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-blue/40 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-2xl outline-none transition-transform duration-300 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="flex items-center gap-2 font-heading text-lg font-semibold uppercase tracking-wide">
              <ClipboardList className="size-5 text-primary" />
              Mi pedido
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar pedido"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {sent ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp">
                <WhatsappIcon className="size-7" />
              </span>
              <div role="status">
                <p className="font-heading text-xl font-semibold uppercase">¡Pedido enviado!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Abrimos WhatsApp con tu lista. Te respondemos con el presupuesto y la disponibilidad.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  nativeButton={false}
                  className="h-11 bg-whatsapp px-5 text-whatsapp-foreground hover:bg-whatsapp/90"
                  render={
                    <a
                      href={waLink(settings.whatsappNumber, orderWaMessage(items, name.trim(), note.trim()))}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Abrir WhatsApp de nuevo
                </Button>
                <Dialog.Close render={<Button variant="outline" className="h-11 px-5" />}>Listo</Dialog.Close>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <ClipboardList className="size-10 text-muted-foreground" />
              <p className="font-medium">Tu pedido está vacío</p>
              <p className="text-sm text-muted-foreground">
                Sumá productos con el botón <strong>“Agregar al pedido”</strong> y mandanos la lista completa por
                WhatsApp para recibir un presupuesto.
              </p>
              <Dialog.Close render={<Button variant="outline" className="mt-2 h-10 px-4" />}>Ver productos</Dialog.Close>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-border px-5">
                {items.map((item) => {
                  const key = itemKey(item)
                  const product = products.find((p) => p.id === item.productId)
                  return (
                    <li key={key} className="flex gap-3 py-4">
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                        <Image src={product?.image || '/placeholder.svg'} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {product ? (
                              <Link
                                href={`/productos/${product.slug}`}
                                onClick={() => setOpen(false)}
                                className="line-clamp-2 text-sm font-medium hover:text-primary"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium">{item.name}</p>
                            )}
                            {(item.variantName || item.sku) && (
                              <p className="text-xs text-muted-foreground">
                                {item.variantName}
                                {item.variantName && item.sku && ' · '}
                                {item.sku && <span className="font-mono">{item.sku}</span>}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(key)}
                            aria-label={`Quitar ${item.name}`}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-lg border border-input" role="group" aria-label={`Cantidad de ${item.name}`}>
                            <button
                              type="button"
                              onClick={() => setQuantity(key, item.quantity - 1)}
                              aria-label="Restar uno"
                              className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={999}
                              value={item.quantity}
                              onChange={(e) => setQuantity(key, Math.max(1, Number(e.target.value) || 1))}
                              aria-label="Cantidad"
                              className="h-8 w-10 border-x border-input bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantity(key, item.quantity + 1)}
                              aria-label="Sumar uno"
                              className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          {settings.showPrices && (
                            <span className={cn('text-sm font-semibold tabular-nums', item.price == null && 'font-normal text-muted-foreground')}>
                              {item.price != null ? formatPrice(item.price * item.quantity) : 'A consultar'}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {suggestions.length > 0 && (
                <div className="border-t border-border bg-secondary/30 px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Te puede servir</p>
                  <ul className="flex flex-col gap-3">
                    {suggestions.map((p) => (
                      <li key={p.id} className="flex items-center gap-3">
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                          <Image src={p.image || '/placeholder.svg'} alt="" fill sizes="48px" className="object-cover" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <Link href={`/productos/${p.slug}`} onClick={() => setOpen(false)} className="line-clamp-1 text-sm font-medium hover:text-primary">
                            {p.name}
                          </Link>
                          {settings.showPrices && <p className="text-xs text-muted-foreground">{displayPrice(p)}</p>}
                        </div>
                        {p.variants.length ? (
                          <Link
                            href={`/productos/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                          >
                            Elegir
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => add(p)}
                            aria-label={`Agregar ${p.name} al pedido`}
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border hover:border-primary/40 hover:bg-muted"
                          >
                            <Plus className="size-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>

              <div className="flex flex-col gap-3 border-t border-border bg-secondary/40 p-5">
                {settings.showPrices ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Total estimado</span>
                      <span className="font-heading text-2xl font-bold tabular-nums text-primary">{formatPrice(total)}</span>
                    </div>
                    {settings.transferDiscount > 0 && total > 0 && (
                      <p className="-mt-2 flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Con transferencia ({settings.transferDiscount}% OFF)</span>
                        <span className="font-bold tabular-nums text-whatsapp">{formatPrice(paymentOptions(total, settings)?.transfer ?? total)}</span>
                      </p>
                    )}
                    {priced.length < items.length && (
                      <p className="-mt-2 text-xs text-muted-foreground">
                        Sin incluir {items.length - priced.length} producto(s) con precio a consultar.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {items.reduce((n, i) => n + i.quantity, 0)} unidades en tu pedido. Te respondemos por WhatsApp con el presupuesto y la
                    disponibilidad.
                  </p>
                )}
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre (opcional)"
                  aria-label="Tu nombre"
                  className="h-10 rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Comentario: medidas, envío, forma de pago… (opcional)"
                  aria-label="Comentario"
                  className="rounded-lg border border-input bg-card px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
                />
                <Button
                  onClick={send}
                  size="lg"
                  className="h-12 w-full bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
                >
                  <WhatsappIcon className="size-5" />
                  Pedir presupuesto por WhatsApp
                </Button>
                <button type="button" onClick={clear} className="text-center text-xs text-muted-foreground hover:text-destructive">
                  Vaciar pedido
                </button>
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
