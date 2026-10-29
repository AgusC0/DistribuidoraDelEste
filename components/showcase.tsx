'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog } from '@base-ui/react/dialog'
import { ArrowRight, Check, MapPin, Store, Users, X } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { cn } from '@/lib/utils'
import type { GalleryItem } from '@/lib/types'

const card = cn(
  'group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-muted antialiased',
  'shadow-[inset_0_0_2px_2px_rgba(255,255,255,1),inset_0_0_0_1px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06),0_2px_4px_0_rgba(0,0,0,0.05)]',
)

/** Ejemplo de pedido armado en el sitio (lo que llega por WhatsApp). */
const ORDER = [
  { qty: 1, name: 'Termotanque a gas 80 L' },
  { qty: 2, name: 'Claraboya 60 × 60' },
  { qty: 1, name: 'Monocomando de lavatorio' },
  { qty: 6, name: 'Caño termofusión 20 mm' },
]

/**
 * "Conocé el local": tarjetas con la foto del local, el asesoramiento y el equipo.
 * Fotos y videos se cargan en Panel → Fotos y videos.
 */
export function Showcase({
  local,
  equipo,
  videos,
  address,
}: {
  local: GalleryItem[]
  equipo: GalleryItem[]
  /** Videos subidos desde el panel (si hay): se muestran debajo de las tarjetas. */
  videos: GalleryItem[]
  address: string
}) {
  const [open, setOpen] = useState<GalleryItem | null>(null)
  const [cover, ...morePhotos] = local
  const photos = [...morePhotos, ...equipo]

  return (
    <section id="local" aria-labelledby="local-title" className="scroll-mt-16 bg-background py-16 md:scroll-mt-20 md:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Conocé el local</p>
          <h2 id="local-title" className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Todo lo que buscás, en un solo lugar
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Salón: la foto del local ocupa toda la tarjeta, oscurecida para que se lean los textos */}
          <FadeIn className={cn(card, 'min-h-[400px] justify-end md:col-span-2')}>
            {cover ? (
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-brand-blue" />
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
            <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
              <MapPin aria-hidden="true" className="size-3.5 text-primary" />
              {address}
            </span>
            <div className="relative z-10 flex flex-col gap-2 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-white drop-shadow-sm md:text-3xl">
                Te damos la bienvenida
                <Store aria-hidden="true" className="size-6 text-aqua" />
              </h3>
              <p className="max-w-xl text-base text-white/85 text-pretty">
                Para que conozcas nuestros productos y marcas. Sanitarios, corralón, griferías, conducción de agua, cloaca,
                gas y aire, termotanques y calefactores. ¡Todo en repuestos sanitarios, griferías y todo lo que necesites para
                arreglar tu vivienda!
              </p>
            </div>
          </FadeIn>

          {/* Asesoramiento por WhatsApp */}
          <FadeIn delay={80} className={cn(card, 'min-h-[380px]')}>
            <div className="relative z-10 flex flex-col gap-2 p-6">
              <h3 className="text-2xl font-semibold text-foreground">Te asesoramos</h3>
              <p className="text-sm font-medium text-muted-foreground">
                Contanos qué necesitás para tu obra o tu casa y te ayudamos a elegir la medida, el modelo y la marca justa.
              </p>
            </div>
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_center,white_30%,transparent_100%)]" />
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 overflow-hidden bg-primary/20 [mask-image:linear-gradient(to_right,transparent,white_50%,transparent)]">
                <div className="beam-x absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-whatsapp to-transparent" />
              </div>
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 overflow-hidden bg-primary/20 [mask-image:linear-gradient(to_bottom,transparent,white_50%,transparent)]">
                <div className="beam-y absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-whatsapp to-transparent" />
              </div>
              <WaLink
                source="local"
                aria-label="Escribinos por WhatsApp"
                className="relative z-10 flex size-24 items-center justify-center rounded-3xl bg-whatsapp text-whatsapp-foreground shadow-[0_12px_32px_rgba(37,211,102,0.35)] transition-transform duration-500 group-hover:scale-105"
              >
                <WhatsappIcon className="size-12" />
              </WaLink>
            </div>
          </FadeIn>

          {/* Pedido por WhatsApp + equipo */}
          <FadeIn delay={120} className={cn(card, 'min-h-[300px] gap-6 md:col-span-3 md:flex-row')}>
            <div className="relative z-10 flex flex-1 flex-col items-start justify-center gap-3 p-6 md:p-8">
              <h3 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                Armá tu pedido y mandalo en un mensaje
                <Users aria-hidden="true" className="size-6 text-primary" />
              </h3>
              <p className="max-w-lg text-base text-muted-foreground text-balance">
                Sumá productos desde el catálogo con sus cantidades. Nuestro equipo te responde con el presupuesto y la
                disponibilidad.
              </p>
              <a
                href="/productos"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:opacity-90 active:scale-[0.97]"
              >
                Empezar mi pedido
                <ArrowRight aria-hidden="true" className="size-4" />
              </a>
            </div>

            <div className="relative flex min-h-[240px] flex-1 items-end justify-end pt-6 md:pt-8">
              <div className="relative flex w-[95%] flex-col">
                {equipo.length > 0 && (
                  <div className="relative z-20 mb-4 flex -space-x-3">
                    {equipo.slice(0, 5).map((p) => (
                      <span key={p.id} className="relative size-11 overflow-hidden rounded-full border-2 border-background shadow-sm">
                        <Image src={p.src} alt={p.title || p.alt} fill sizes="44px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative flex min-h-[210px] flex-col gap-2.5 rounded-tl-2xl border-l border-t border-border bg-background p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <WhatsappIcon className="size-4 text-whatsapp" />
                    Mi pedido
                  </p>
                  {ORDER.map((o, i) => (
                    <div key={o.name} className="order-line flex items-center gap-3 text-sm" style={{ '--i': i } as React.CSSProperties}>
                      <span className="flex size-5 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp">
                        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                      </span>
                      <span className="w-8 font-semibold tabular-nums text-foreground">{o.qty} ×</span>
                      <span className="text-foreground">{o.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {videos.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <li key={v.id} className="overflow-hidden rounded-2xl bg-black">
                <video src={v.src} poster={v.poster} controls playsInline preload="metadata" aria-label={v.alt || v.title} className="aspect-video w-full object-contain" />
              </li>
            ))}
          </ul>
        )}

        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setOpen(p)} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                  <Image src={p.src} alt={p.alt} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  {p.title && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-sm font-medium text-white">
                      {p.title}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/85" />
          <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {open && (
              <figure className="flex max-h-full w-full max-w-5xl flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={open.src} alt={open.alt} className="max-h-[80vh] w-auto rounded-xl object-contain" />
                {open.title && <figcaption className="text-sm text-white/90">{open.title}</figcaption>}
              </figure>
            )}
            <Dialog.Close aria-label="Cerrar" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <X className="size-5" />
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
