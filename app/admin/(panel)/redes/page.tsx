import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { SocialManager } from '@/components/admin/social-manager'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Redes en la web' }

export default async function SocialPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader
        title="Redes en la web"
        description="Elegí qué publicaciones de Facebook o Instagram se ven en la portada. Copiá el link de la publicación, pegalo acá y listo. Podés cambiarlas cuando quieras."
      />
      <SocialManager items={db.settings.socialPosts ?? []} />
    </>
  )
}
