'use client'

import { useActionState, useRef, useTransition } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmButton, FormMessage, Panel, SubmitButton, Switch } from '@/components/admin/ui'
import { FacebookIcon, InstagramIcon } from '@/components/social-icons'
import { addSocialPost, deleteSocialPost, moveSocialPost, updateSocialPost, type FormState } from '@/app/admin/actions'
import type { SocialPost } from '@/lib/types'

export function SocialManager({ items }: { items: SocialPost[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await addSocialPost(prev, fd)
    if (r.ok) formRef.current?.reset()
    return r
  }, {})
  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">Agregar publicación</h2>
        <ol className="mb-4 mt-2 list-decimal pl-5 text-sm text-muted-foreground">
          <li>En Facebook o Instagram, abrí la publicación y tocá los tres puntitos (⋯).</li>
          <li>Elegí “Copiar enlace”.</li>
          <li>Pegalo acá abajo. La publicación tiene que ser pública, de la página del negocio.</li>
        </ol>
        <form ref={formRef} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Input name="url" required placeholder="https://www.instagram.com/p/…  o  https://www.facebook.com/…" className="h-10 flex-1" />
          <SubmitButton>
            <Link2 />
            Agregar
          </SubmitButton>
        </form>
        <div className="mt-2">
          <FormMessage state={state} />
        </div>
      </Panel>

      <Panel>
        <h2 className="font-heading text-lg font-semibold uppercase tracking-wide">Publicaciones en la web</h2>
        {items.length === 0 ? (
          <p className="mt-3 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
            Todavía no hay publicaciones. Mientras no haya ninguna, esta parte no aparece en el sitio.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">Se ven en este orden, en una fila que se desliza. Recomendado: entre 3 y 6.</p>
            <ul className="flex flex-col gap-3">
              {items.map((p, i) => (
                <Row key={p.id} post={p} first={i === 0} last={i === items.length - 1} />
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  )
}

function Row({ post, first, last }: { post: SocialPost; first: boolean; last: boolean }) {
  const [pending, start] = useTransition()
  const Icon = post.network === 'instagram' ? InstagramIcon : FacebookIcon
  return (
    <li className={`flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 ${post.active ? '' : 'opacity-60'}`}>
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm hover:text-primary">
        <span className="truncate">{post.url}</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </a>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={post.active} disabled={pending} onChange={() => start(() => void updateSocialPost(post.id, { active: !post.active }))} label="Visible en el sitio" />
        Visible
      </label>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon-sm" variant="ghost" disabled={first || pending} aria-label="Subir" onClick={() => start(() => moveSocialPost(post.id, -1))}>
          <ArrowUp />
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" disabled={last || pending} aria-label="Bajar" onClick={() => start(() => moveSocialPost(post.id, 1))}>
          <ArrowDown />
        </Button>
        <ConfirmButton
          title="¿Quitar esta publicación de la web?"
          description="Deja de verse en la portada. En Facebook o Instagram no se toca nada."
          onConfirm={() => deleteSocialPost(post.id)}
          variant="ghost"
          size="icon-sm"
          aria-label="Quitar"
        >
          <Trash2 />
        </ConfirmButton>
      </div>
    </li>
  )
}
