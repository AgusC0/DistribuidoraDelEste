'use client'

import { useEffect, useRef, useState } from 'react'
import { FadeIn } from '@/components/fade-in'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import type { SocialPost } from '@/lib/types'

const WIDTH = 300
const HEIGHT = 400

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
  const isIg = post.network === 'instagram'
  // Los videos de Facebook ya vienen del alto justo; al resto se le recorta lo de abajo (likes, comentarios).
  const frameH = !isIg && /\/(reel|videos|watch)\b|[?&]v=/.test(post.url) ? HEIGHT : HEIGHT + 220
  const Icon = isIg ? InstagramIcon : FacebookIcon
  return (
    <article ref={ref} className="flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm" style={{ width: WIDTH }}>
      {/* Ventana fija: el contenido de Facebook/Instagram se recorta abajo para que todas las tarjetas midan igual. */}
      <div className="relative overflow-hidden bg-muted" style={{ height: HEIGHT }}>
        {visible ? (
          <iframe
            src={embedUrl(post)}
            title={isIg ? 'Publicación de Instagram' : 'Publicación de Facebook'}
            width={WIDTH}
            height={frameH}
            loading="lazy"
            scrolling="no"
            className="block border-0"
            style={{ width: WIDTH, height: frameH }}
            allow="encrypted-media; clipboard-write; picture-in-picture"
          />
        ) : (
          <div className="size-full animate-pulse" />
        )}
      </div>
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary hover:text-primary"
      >
        <span className="flex items-center gap-2">
          <Icon className="size-4" />
          Ver en {isIg ? 'Instagram' : 'Facebook'}
        </span>
        <span aria-hidden="true">→</span>
      </a>
    </article>
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
