import Link from 'next/link'
import { FadeIn } from '@/components/fade-in'
import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/types'

function Tile({ tile }: { tile: Banner }) {
  const body = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile.image}
        alt={tile.alt || tile.title || ''}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />
      <span className="relative px-3 text-center text-base font-extrabold uppercase leading-tight tracking-wide text-[#fbe9c9] drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)] sm:text-xl">
        {tile.title}
      </span>
    </>
  )
  const cls = 'group relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted shadow-sm'
  if (!tile.link) return <div className={cls}>{body}</div>
  return /^https?:\/\//i.test(tile.link) ? (
    <a href={tile.link} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={tile.link} className={cls}>
      {body}
    </Link>
  )
}

/**
 * "Todo para tu obra": tarjetas grandes con foto y título (Repuestos, Accesorios…), estilo cuadrícula.
 * Se cargan en Panel → Banners → Tarjetas con foto. Si no hay ninguna, la portada muestra los rubros en texto.
 */
export function TilesSection({ tiles }: { tiles: Banner[] }) {
  if (!tiles.length) return null
  const cols = tiles.length >= 5 ? 'lg:grid-cols-5' : tiles.length === 4 ? 'lg:grid-cols-4' : tiles.length === 3 ? 'lg:grid-cols-3' : ''
  return (
    <section aria-labelledby="rubros-title" className="bg-secondary/60 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-8 flex flex-col gap-3">
          <h2 id="rubros-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Todo para tu obra en Villa María
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Conducción de agua, gas y cloacas, calefacción y repuestos sanitarios en un solo lugar, con asesoramiento.
          </p>
        </FadeIn>
        <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4', cols)}>
          {tiles.map((t) => (
            <Tile key={t.id} tile={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
