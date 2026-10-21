import Link from 'next/link'
import { Clock, Map, Mail, MapPin } from 'lucide-react'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import { categoryUrl, rootCategories } from '@/lib/catalog'
import { groupHours } from '@/lib/site'
import type { Category, Settings } from '@/lib/types'

const LINKS = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Productos', href: '/productos' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Contacto', href: '/#contacto' },
]

const iconClass =
  'flex size-10 items-center justify-center rounded-lg bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20'
const linkClass = 'text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground'
const titleClass = 'font-heading text-sm font-semibold uppercase tracking-widest text-aqua'

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
  return (
    <footer className="bg-brand-blue text-primary-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="flex flex-col gap-4">
          <p className="flex flex-col leading-none">
            <span className="font-heading text-xl font-bold uppercase tracking-wide">{settings.businessName}</span>
            <span className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-aqua">Sanitarios · Corralón</span>
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/75">{settings.tagline}. Calidad y asesoramiento para tu hogar o proyecto.</p>
          <div className="flex gap-2">
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={iconClass}>
                <FacebookIcon className="size-4" />
              </a>
            )}
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconClass}>
                <InstagramIcon className="size-4" />
              </a>
            )}
            <WaLink source="footer" aria-label="WhatsApp" className={iconClass}>
              <WhatsappIcon className="size-4" />
            </WaLink>
            <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Google Maps" className={iconClass}>
              <Map className="size-4" />
            </a>
          </div>
        </div>

        <nav aria-label="Enlaces del pie" className="flex flex-col gap-3">
          <p className={titleClass}>Enlaces</p>
          <ul className="flex flex-col gap-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Categorías" className="flex flex-col gap-3">
          <p className={titleClass}>Categorías</p>
          <ul className="flex flex-col gap-2">
            {rootCategories(categories)
              .filter((c) => (categoryCounts[c.id] ?? 0) > 0)
              .map((c) => (
                <li key={c.id}>
                  <Link href={categoryUrl(categories, c.id)} className={linkClass}>
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3">
          <p className={titleClass}>Contacto</p>
          <WaLink source="footer" className={`flex items-center gap-2 ${linkClass}`}>
            <WhatsappIcon className="size-4 shrink-0" />
            {settings.phoneDisplay}
          </WaLink>
          <a href={`mailto:${settings.email}`} className={`flex items-center gap-2 break-all ${linkClass}`}>
            <Mail aria-hidden="true" className="size-4 shrink-0" />
            {settings.email}
          </a>
          <p className="flex items-start gap-2 text-sm text-primary-foreground/75">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {settings.address}
          </p>
          <div className="flex items-start gap-2 text-sm text-primary-foreground/75">
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <ul>
              {groupHours(settings.hours).map((h) => (
                <li key={h.label}>
                  {h.short}: {h.time}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/65 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center">
            © {new Date().getFullYear()} {settings.businessName}. Todos los derechos reservados.
          </p>
          <p>
            Desarrollado por <span className="font-semibold text-primary-foreground/85">ExTend</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
