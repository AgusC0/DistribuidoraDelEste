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
        description="Lo que se ve en la portada debajo del título principal: el carrusel de promociones y las tarjetas con foto. Subí las imágenes que armes en Canva, elegí a dónde llevan y ordenalas."
      />
      <h2 className="mt-2 font-heading text-xl font-semibold uppercase tracking-wide">Banners (carrusel)</h2>
      <BannerManager kind="banners" items={db.settings.banners ?? []} />
      <h2 className="mt-10 font-heading text-xl font-semibold uppercase tracking-wide">Tarjetas con foto</h2>
      <p className="-mt-1 mb-2 text-sm text-muted-foreground">
        Forman la sección "Todo para tu obra en Villa María" de la portada: una foto con un título encima que lleva a una sección (Repuestos, Accesorios, Griferías…). Mientras no haya tarjetas, se muestra la versión en texto.
      </p>
      <BannerManager kind="tiles" items={db.settings.tiles ?? []} />
    </>
  )
}
