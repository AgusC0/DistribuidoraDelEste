'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCatalog } from '@/components/catalog-provider'
import { cn } from '@/lib/utils'
import type { Banner } from '@/lib/types'

const ROTATE_MS = 6000

function Slide({ banner, priority }: { banner: Banner; priority: boolean }) {
  const picture = (
    <picture>
      {banner.mobileImage && <source media="(max-width: 639px)" srcSet={banner.mobileImage} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image}
        alt={banner.alt}
        loading={priority ? 'eager' : 'lazy'}
        className="block h-auto w-full"
      />
    </picture>
  )
  if (!banner.link) return picture
  const external = /^https?:\/\//i.test(banner.link)
  return external ? (
    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block">
      {picture}
    </a>
  ) : (
    <Link href={banner.link} className="block">
      {picture}
    </Link>
  )
}

/** Banners de promociones bajo el hero: se cargan desde el panel; con varios, rotan solos. */
export function BannersSection() {
  const { settings } = useCatalog()
  const banners = (settings.banners ?? []).filter((b) => b.active && b.image)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = banners.length

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => clearInterval(t)
  }, [count, paused])

  if (!count) return null
  const current = Math.min(index, count - 1)
  const go = (d: number) => setIndex((current + d + count) % count)

  return (
    <section
      aria-label="Promociones"
      className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 md:pt-10 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl bg-muted shadow-sm">
        <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${current * 100}%)` }}>
          {banners.map((b, i) => (
            <div key={b.id} className="w-full shrink-0" aria-hidden={i !== current}>
              <Slide banner={b} priority={i === 0} />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Banner anterior" className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65 sm:flex">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Banner siguiente" className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65 sm:flex">
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                  aria-current={i === current}
                  className={cn('h-2 rounded-full transition-all', i === current ? 'w-6 bg-white' : 'w-2 bg-white/55')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
