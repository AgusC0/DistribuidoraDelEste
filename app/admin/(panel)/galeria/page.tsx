import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { MediaManager } from '@/components/admin/media-manager'
import { readDb } from '@/lib/db'
import { galleryOf } from '@/lib/gallery'

export const metadata: Metadata = { title: 'Fotos y videos' }

export default async function GalleryPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader
        title="Fotos y videos"
        description="Lo que se ve en la sección “Conocé el local” de la portada: videos, fotos del local y del equipo."
      />
      <MediaManager items={galleryOf(db.settings)} />
    </>
  )
}
