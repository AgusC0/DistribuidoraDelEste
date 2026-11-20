'use client'

import Link from 'next/link'
import { useCatalog } from '@/components/catalog-provider'
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
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />
      <span className="relative px-3 text-center font-heading text-lg font-bold uppercase leading-tight tracking-wide text-white drop-shadow-md sm:text-2xl">
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

/** Tarjetas con foto y título (Repuestos, Accesorios…) debajo de los banners; se cargan desde el panel. */
export function TilesSection() {
  const { settings } = useCatalog()
  const tiles = (settings.tiles ?? []).filter((t) => t.active && t.image)
  if (!tiles.length) return null
  return (
    <section aria-label="Secciones destacadas" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 md:pt-10 lg:px-8">
      <div className={cn('grid grid-cols-2 gap-3 sm:gap-4', tiles.length >= 4 ? 'lg:grid-cols-4' : tiles.length === 3 ? 'lg:grid-cols-3' : '')}>
        {tiles.map((t) => (
          <Tile key={t.id} tile={t} />
        ))}
      </div>
    </section>
  )
}
