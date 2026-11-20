import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { BannerManager } from '@/components/admin/banner-manager'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Banners' }

export default async function BannersPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader
        title="Banners"
        description="Las imágenes de promociones que se ven en la portada, debajo del título principal. Podés subir las que armes en Canva, elegir a dónde llevan y ordenarlas."
      />
      <BannerManager items={db.settings.banners ?? []} />
    </>
  )
}
