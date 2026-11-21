'use client'

import { useEffect, useRef, useState } from 'react'
import { FadeIn } from '@/components/fade-in'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import type { SocialPost } from '@/lib/types'

const WIDTH = 320
const HEIGHT = 420

/** Dirección del "embed" oficial de cada red para mostrar la publicación dentro de la web. */
export function embedUrl(post: SocialPost) {
  // Sin el texto largo: queda una tarjeta casi cuadrada con la foto o el video bien visible.
  if (post.network === 'instagram') return `${post.url}embed/`
  const href = encodeURIComponent(post.url)
  // Videos y reels de Facebook usan otro "embed" que las publicaciones comunes.
  if (/\/(reel|videos|watch)\b|[?&]v=/.test(post.url)) {
    return `https://www.facebook.com/plugins/video.php?href=${href}&width=${WIDTH}&height=${HEIGHT}&show_text=false`
  }
  return `https://www.facebook.com/plugins/post.php?href=${href}&width=${WIDTH}&show_text=false`
}

/** La publicación se carga recién cuando el visitante llega a esta parte (Facebook e Instagram pesan). */
function Embed({ post }: { post: SocialPost }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), io.disconnect()), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className="shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ width: WIDTH, height: HEIGHT }}
    >
      {visible ? (
        <iframe
          src={embedUrl(post)}
          title={post.network === 'instagram' ? 'Publicación de Instagram' : 'Publicación de Facebook'}
          width={WIDTH}
          height={HEIGHT}
          loading="lazy"
          className="size-full border-0"
          allow="encrypted-media; clipboard-write; picture-in-picture"
        />
      ) : (
        <div className="size-full animate-pulse bg-muted" />
      )}
    </div>
  )
}

/** "Seguinos en redes": las publicaciones de Facebook o Instagram que el negocio eligió en el panel. */
export function SocialSection({ posts, instagram, facebook }: { posts: SocialPost[]; instagram?: string; facebook?: string }) {
  if (!posts.length) return null
  return (
    <section aria-labelledby="redes-title" className="bg-secondary/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id="redes-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Lo último en nuestras redes
            </h2>
            <p className="text-base text-muted-foreground">Novedades, ingresos y promociones que publicamos en Facebook e Instagram.</p>
          </div>
          <div className="flex gap-2">
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 text-sm font-semibold text-foreground shadow-sm hover:text-primary"
              >
                <InstagramIcon className="size-4" /> Instagram
              </a>
            )}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-background px-4 text-sm font-semibold text-foreground shadow-sm hover:text-primary"
              >
                <FacebookIcon className="size-4" /> Facebook
              </a>
            )}
          </div>
        </FadeIn>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:mx-0 sm:px-0">
          {posts.map((p) => (
            <Embed key={p.id} post={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
