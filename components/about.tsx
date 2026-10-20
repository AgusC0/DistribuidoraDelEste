import { Check, Clock, Map, MapPin, Star } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { OpenStatus } from '@/components/open-status'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import { groupHours } from '@/lib/site'
import type { Settings } from '@/lib/types'

const REASONS = [
  'Calidad garantizada en cada producto',
  'Variedad de marcas nacionales e importadas',
  'Acompañamiento en todo tu proyecto',
]

const socialClass =
  'flex size-11 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 hover:bg-muted'

export function About({ settings }: { settings: Settings }) {
  return (
    <section id="nosotros" aria-labelledby="nosotros-title" className="scroll-mt-16 bg-background py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <FadeIn className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Nosotros</p>
          <h2
            id="nosotros-title"
            className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl"
          >
            Tu corralón de confianza en Villa María
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            En <strong className="text-foreground">{settings.businessName}</strong> somos especialistas en
            sanitarios y materiales de corralón. Trabajamos con las mejores marcas del mercado para ofrecerte
            productos de calidad, y te acompañamos con asesoramiento técnico desde el primer momento hasta que
            tu proyecto esté terminado.
          </p>

          <ul className="flex flex-col gap-3">
            {REASONS.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium text-foreground">{r}</span>
              </li>
            ))}
          </ul>

          <div className="mt-2 rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
                <Clock aria-hidden="true" className="size-4 text-primary" />
                Horarios de atención
              </h3>
              <OpenStatus hours={settings.hours} className="text-xs text-muted-foreground" />
            </div>
            <dl className="flex flex-col gap-2">
              {groupHours(settings.hours).map((h) => (
                <div key={h.label} className="flex flex-wrap justify-between gap-x-4 text-sm">
                  <dt className="text-muted-foreground">{h.label}</dt>
                  <dd className="font-medium tabular-nums text-foreground">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialClass}>
                <FacebookIcon className="size-5" />
              </a>
            )}
            {settings.instagram && (
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${settings.instagramHandle}`}
                className={socialClass}
              >
                <InstagramIcon className="size-5" />
              </a>
            )}
            <WaLink source="nosotros" aria-label="WhatsApp" className={socialClass}>
              <WhatsappIcon className="size-5" />
            </WaLink>
            <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar (Google Maps)" className={socialClass}>
              <Map className="size-5" />
            </a>
          </div>

          {settings.googleReviewUrl && (
            <a
              href={settings.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
            >
              <Star aria-hidden="true" className="size-4 fill-promo text-promo" />
              ¿Te atendimos bien? Dejanos tu reseña en Google
            </a>
          )}
        </FadeIn>

        <FadeIn delay={120} className="flex flex-col gap-4">
          <a
            href={settings.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
                Dónde estamos
              </span>
              <span className="block text-sm text-muted-foreground">{settings.address}</span>
              <span className="mt-1 block text-sm font-medium text-primary">Cómo llegar →</span>
            </span>
          </a>

          {settings.mapsEmbedUrl && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted md:aspect-auto md:min-h-80 md:flex-1">
              <iframe
                title={`Mapa de ubicación de ${settings.businessName}`}
                src={settings.mapsEmbedUrl}
                className="absolute inset-0 size-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}
        </FadeIn>
      </div>
    </section>
  )
}
