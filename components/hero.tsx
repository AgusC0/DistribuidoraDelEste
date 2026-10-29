import Image from 'next/image'
import { ArrowRight, Clock, MapPin } from 'lucide-react'
import { OpenStatus } from '@/components/open-status'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import type { Settings } from '@/lib/types'

const d = (s: number) => ({ '--d': `${s}s` }) as React.CSSProperties

/** Portada a pantalla completa: la foto del local de fondo y el mensaje principal entrando escalonado. */
export function Hero({ settings }: { settings: Settings }) {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[calc(100svh-4rem)] scroll-mt-16 flex-col overflow-hidden bg-[#0b1220] md:min-h-[calc(100svh-5rem)] md:scroll-mt-20"
    >
      <div className="hero-bg pointer-events-none absolute inset-0 -z-10 select-none">
        <Image
          src="/images/local/local-distribuidora-del-este-villa-maria.jpg"
          alt="Fachada del local de Distribuidora del Este en Av. Presidente Perón 1001, Villa María"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[65%_center]"
        />
      </div>
      {/* Oscurece a la izquierda (donde va el texto) y abajo (datos), dejando ver el local a la derecha. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/80 to-[#0b1220]/10" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b1220] via-transparent to-[#0b1220]/40" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between gap-12 px-4 pb-10 pt-16 sm:px-6 md:pt-24 lg:px-8">
        <div className="flex max-w-3xl flex-col items-start">
          <p className="hero-rise text-sm font-semibold uppercase tracking-[0.2em] text-aqua" style={d(0.2)}>
            Sanitarista en Villa María
          </p>
          <h1 className="mt-5 text-[2.6rem] font-normal leading-[1.05] tracking-[-0.025em] text-white text-balance sm:text-6xl lg:text-7xl">
            <span className="hero-rise block" style={d(0.35)}>
              {settings.heroTitle}
            </span>
            <span className="hero-rise block text-white/55" style={d(0.5)}>
              en Villa María.
            </span>
          </h1>
          <p className="hero-rise mt-6 max-w-md text-base leading-relaxed text-white/70 text-pretty sm:text-lg" style={d(0.95)}>
            {settings.heroSubtitle}
          </p>
          <div className="hero-rise mt-8 flex flex-col gap-3 sm:flex-row" style={d(1.15)}>
            <WaLink
              source="hero"
              className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md bg-white px-5 text-[15px] font-medium text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.25),0_4px_16px_rgba(0,0,0,0.18)] transition-[transform,background-color] duration-150 hover:bg-neutral-100 active:scale-[0.97]"
            >
              <WhatsappIcon className="size-5 text-whatsapp" />
              Cotizar por WhatsApp
            </WaLink>
            <a
              href="/productos"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Ver catálogo
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-end sm:justify-between">
          <dl className="flex flex-wrap gap-x-10 gap-y-5">
            <div className="hero-rise flex flex-col gap-1" style={d(1.4)}>
              <dt className="flex items-center gap-2 text-[13px] text-white/50">
                <Clock aria-hidden="true" className="size-3.5" />
                Atención
              </dt>
              <dd className="text-[15px] font-semibold text-white">
                <OpenStatus hours={settings.hours} />
              </dd>
            </div>
            <div className="hero-rise flex flex-col gap-1" style={d(1.52)}>
              <dt className="flex items-center gap-2 text-[13px] text-white/50">
                <WhatsappIcon className="size-3.5" />
                WhatsApp
              </dt>
              <dd className="text-[15px] font-semibold tabular-nums text-white">{settings.phoneDisplay}</dd>
            </div>
            <div className="hero-rise flex flex-col gap-1" style={d(1.64)}>
              <dt className="flex items-center gap-2 text-[13px] text-white/50">
                <MapPin aria-hidden="true" className="size-3.5" />
                Dirección
              </dt>
              <dd className="text-[15px] font-semibold text-white">{settings.address}</dd>
            </div>
          </dl>
          <p className="hero-rise max-w-xs text-base leading-relaxed text-white/85 text-pretty sm:text-right" style={d(1.75)}>
            Termotanques, claraboyas, puertas plegadizas y repuestos, con asesoramiento en el local.
          </p>
        </div>
      </div>
    </section>
  )
}
