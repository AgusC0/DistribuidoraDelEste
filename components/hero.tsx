import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OpenStatus } from '@/components/open-status'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import type { Settings } from '@/lib/types'

export function Hero({ settings }: { settings: Settings }) {
  return (
    <section id="inicio" className="relative isolate scroll-mt-16 md:scroll-mt-20 overflow-hidden bg-brand-blue">
      <Image
        src="/images/hero-bathroom.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-25"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-blue via-brand-blue/90 to-brand-blue/50" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 sm:px-6 md:py-28 lg:px-8 lg:py-32">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aqua">
          Sanitarios y corralón · Villa María
        </p>
        <h1 className="max-w-3xl font-heading text-4xl font-bold uppercase leading-[1.05] tracking-tight text-primary-foreground text-balance sm:text-5xl lg:text-6xl">
          {settings.heroTitle}
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/85 text-pretty">
          {settings.heroSubtitle}
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            className="h-12 bg-whatsapp px-6 text-base text-whatsapp-foreground hover:bg-whatsapp/90"
            render={<WaLink source="hero" />}
          >
            <WhatsappIcon className="size-5" />
            Cotizar por WhatsApp
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            className="h-12 border-primary-foreground/30 bg-transparent px-6 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            render={<a href="/productos" />}
          >
            Ver catálogo
            <ArrowRight />
          </Button>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-primary-foreground/15 pt-6">
          <div>
            <dt className="text-xs uppercase tracking-wider text-aqua">Atención</dt>
            <dd className="mt-0.5 text-primary-foreground">
              <OpenStatus hours={settings.hours} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-aqua">WhatsApp</dt>
            <dd className="mt-0.5 text-sm font-semibold text-primary-foreground">{settings.phoneDisplay}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-aqua">Dirección</dt>
            <dd className="mt-0.5 text-sm font-semibold text-primary-foreground">{settings.address}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
