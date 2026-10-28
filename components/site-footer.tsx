import Link from 'next/link'
import { ArrowRight, Clock, Mail, MapPin } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { Logo } from '@/components/logo'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { categoryUrl, rootCategories } from '@/lib/catalog'
import { DEFAULT_FOOTER_LOGO, footerIsLight } from '@/lib/logos'
import { groupHours } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category, Settings } from '@/lib/types'

const LINKS = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Productos', href: '/productos' },
  { label: 'El local', href: '/#local' },
  { label: 'Preguntas frecuentes', href: '/#preguntas' },
  { label: 'Contacto', href: '/#contacto' },
]

const titleClass = 'text-xs font-semibold uppercase tracking-[0.18em] text-ink-accent'
const linkClass = 'text-[15px] leading-relaxed text-ink/70 transition-colors duration-200 hover:text-ink'

/** Pie: marca y botón de WhatsApp, enlaces, contacto con horarios y el nombre del negocio como cierre. */
export function SiteFooter({
  settings,
  categories,
  categoryCounts,
}: {
  settings: Settings
  categories: Category[]
  /** Productos por categoría: las vacías no se listan. */
  categoryCounts: Record<string, number>
}) {
  const rubros = rootCategories(categories).filter((c) => (categoryCounts[c.id] ?? 0) > 0)
  const social = [
    settings.facebook && { label: 'Facebook', href: settings.facebook },
    settings.instagram && { label: 'Instagram', href: settings.instagram },
    settings.mapsUrl && { label: 'Cómo llegar', href: settings.mapsUrl },
    settings.googleReviewUrl && { label: 'Dejanos una reseña', href: settings.googleReviewUrl },
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div className="footer-wrap pt-8">
    <footer
      className={cn(
        'overflow-hidden rounded-t-[2rem] antialiased md:rounded-t-[3rem]',
        footerIsLight(settings.logoFooter) ? 'footer-light' : 'footer-dark',
        'bg-ink-bg text-ink',
      )}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 pb-12 pt-14 sm:px-10 md:pt-20 lg:grid-cols-12 lg:gap-10 lg:px-8">
        {/* Marca */}
        <FadeIn className="flex flex-col gap-6 lg:col-span-4">
          <p className="font-heading text-2xl font-bold uppercase tracking-tight text-ink">Todo para tu obra y tu casa</p>
          <p className="max-w-sm text-[15px] leading-relaxed text-ink/65 text-pretty">
            {settings.tagline}. Calidad, variedad de marcas y asesoramiento para tu casa o tu obra.
          </p>
          <WaLink
            source="footer"
            className="group inline-flex w-fit items-center gap-3 rounded-full bg-whatsapp py-1 pl-5 pr-1 transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(37,211,102,0.35)] active:scale-[0.97]"
          >
            <span className="text-sm font-semibold text-[#0b1220]">Escribinos por WhatsApp</span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#0b1220]">
              <ArrowRight aria-hidden="true" className="size-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </WaLink>
        </FadeIn>

        {/* Enlaces */}
        <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-16 gap-y-12 lg:col-span-8 lg:justify-end">
          <FadeIn delay={60} className="flex min-w-[170px] flex-col gap-5">
            <p className={titleClass}>Sitio</p>
            <ul className="flex flex-col gap-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {social.length > 0 && (
              <>
                <p className={`${titleClass} mt-4`}>Seguinos</p>
                <ul className="flex flex-col gap-3">
                  {social.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </FadeIn>

          {rubros.length > 0 && (
            <FadeIn delay={120} className="flex min-w-[170px] flex-col gap-5">
              <p className={titleClass}>Productos</p>
              <ul className="flex flex-col gap-3">
                {rubros.map((c) => (
                  <li key={c.id}>
                    <Link href={categoryUrl(categories, c.id)} className={linkClass}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeIn>
          )}

          <FadeIn delay={180} className="flex min-w-[260px] max-w-sm flex-col gap-5">
            <p className={titleClass}>Contacto</p>
            <ul className="flex flex-col gap-4">
              <li>
                <WaLink source="footer" className={`flex items-start gap-3 ${linkClass}`}>
                  <WhatsappIcon className="mt-1 size-4 shrink-0 text-ink/50" />
                  {settings.phoneDisplay}
                </WaLink>
              </li>
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className={`flex items-start gap-3 ${linkClass}`}>
                    <Mail aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink/50" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{settings.email}</span>
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/70">
                <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink/50" />
                {settings.address}
              </li>
              <li className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/70">
                <Clock aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink/50" />
                <dl className="flex flex-col gap-2">
                  {groupHours(settings.hours).map((h) => (
                    <div key={h.label}>
                      <dt className="text-ink/90">{h.label}</dt>
                      <dd className="tabular-nums">
                        {h.time.split(' / ').map((t) => (
                          <span key={t} className="block">
                            {t}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            </ul>
          </FadeIn>
        </nav>
      </div>

      {/* Cierre: el logo completo en grande, en su versión blanca para el fondo oscuro. */}
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
        <Logo choice={settings.logoFooter ?? DEFAULT_FOOTER_LOGO} priority={false} className="mx-auto h-auto w-full max-w-5xl" />
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-ink/10 px-6 py-6 text-xs text-ink/45 sm:flex-row sm:px-10 lg:px-8">
        <p className="text-center">
          © {new Date().getFullYear()} {settings.businessName}. Todos los derechos reservados.
        </p>
        <p>
          Desarrollado por <span className="font-semibold text-ink/70">ExTend</span>
        </p>
      </div>
    </footer>
    </div>
  )
}
