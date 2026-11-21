'use client'

import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import type { SocialPost } from '@/lib/types'
import { Eyebrow } from '@/components/brand-waves'

/** Dirección del "embed" oficial, solo para publicaciones cargadas sin foto (antes de traer la vista previa). */
function embedUrl(post: SocialPost) {
  if (post.network === 'instagram') return `${post.url}embed/`
  const href = encodeURIComponent(post.url)
  if (/\/(reel|videos|watch)\b|[?&]v=/.test(post.url)) return `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false`
  return `https://www.facebook.com/plugins/post.php?href=${href}&show_text=false`
}

/** Tarjeta propia: foto cuadrada + 2 líneas de texto, con el diseño de la web. Al tocarla abre la publicación. */
function PostCard({ post }: { post: SocialPost }) {
  const isIg = post.network === 'instagram'
  const Icon = isIg ? InstagramIcon : FacebookIcon
  const label = `${isIg ? 'Instagram' : 'Facebook'}${post.video ? ' · Video' : ''}`
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <span className="relative block aspect-square overflow-hidden bg-muted">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt={post.text || label} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <LazyEmbed post={post} />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
          <Icon className="size-3.5" />
          {label}
        </span>
        {post.video && post.image && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col justify-between gap-2 p-4">
        {post.text && <span className="line-clamp-2 text-sm leading-snug text-foreground/80">{post.text}</span>}
        <span className="text-sm font-semibold text-primary group-hover:underline">Ver en {isIg ? 'Instagram' : 'Facebook'} →</span>
      </span>
    </a>
  )
}

function LazyEmbed({ post }: { post: SocialPost }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setVisible(true), io.disconnect()), { rootMargin: '300px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <span ref={ref} className="pointer-events-none absolute inset-0">
      {visible && <iframe src={embedUrl(post)} title="Publicación" scrolling="no" className="size-full border-0" />}
    </span>
  )
}

/** "Lo último en nuestras redes": publicaciones de Facebook o Instagram elegidas en el panel, como tarjetas propias. */
export function SocialSection({ posts, instagram, facebook }: { posts: SocialPost[]; instagram?: string; facebook?: string }) {
  if (!posts.length) return null
  const shown = posts.slice(0, 8)
  return (
    <section aria-labelledby="redes-title" className="py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60 md:p-10">
          <FadeIn className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <Eyebrow>Seguinos</Eyebrow>
              <h2 id="redes-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
                Lo último en nuestras redes
              </h2>
            </div>
            <div className="flex gap-2">
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                  <InstagramIcon className="size-4" /> Instagram
                </a>
              )}
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">
                  <FacebookIcon className="size-4" /> Facebook
                </a>
              )}
            </div>
          </FadeIn>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {shown.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
