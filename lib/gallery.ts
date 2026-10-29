import type { GalleryItem, GallerySection, Settings } from '@/lib/types'

export const GALLERY_SECTIONS: { id: GallerySection; label: string; hint: string }[] = [
  { id: 'videos', label: 'Videos', hint: 'Recorridos y presentaciones del local. Se muestran debajo de las tarjetas de la sección del local.' },
  { id: 'local', label: 'El local', hint: 'Fachada, salón de ventas, depósito y exhibidores.' },
  { id: 'equipo', label: 'El equipo', hint: 'Fotos de quienes atienden, para que el cliente sepa con quién habla.' },
]

/** Material inicial (en /public): la foto de la fachada. Videos y más fotos se suben desde el panel. */
export const DEFAULT_GALLERY: GalleryItem[] = [
  {
    id: 'fachada',
    kind: 'image',
    section: 'local',
    src: '/images/local/local-distribuidora-del-este-villa-maria.jpg',
    title: 'Nuestro local',
    alt: 'Fachada de Distribuidora del Este, casa de sanitarios en Villa María',
    active: true,
  },
]

/** La galería guardada, o la inicial si todavía no se tocó desde el panel. */
export function galleryOf(settings: Settings): GalleryItem[] {
  return settings.gallery ?? DEFAULT_GALLERY
}

export function publicGallery(settings: Settings) {
  const items = galleryOf(settings).filter((i) => i.active)
  return {
    video: items.find((i) => i.kind === 'video') ?? null,
    videos: items.filter((i) => i.kind === 'video'),
    local: items.filter((i) => i.section === 'local' && i.kind === 'image'),
    equipo: items.filter((i) => i.section === 'equipo' && i.kind === 'image'),
  }
}
