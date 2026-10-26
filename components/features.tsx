import Link from 'next/link'
import { Bath, BrickWall, CookingPot, Droplets, Flame, Hammer, Wrench } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { categoryUrl, childCategories, rootCategories } from '@/lib/catalog'
import { categoryLabel } from '@/lib/category-seo'
import type { Category } from '@/lib/types'

const ICONS: Record<string, React.ElementType> = {
  'sistema-conduccion': Droplets,
  'repuestos-sanitarios': Wrench,
  'repuestos-griferias': Wrench,
  bano: Bath,
  cocina: CookingPot,
  calefaccion: Flame,
  construccion: BrickWall,
  herramientas: Hammer,
}

/** Lo que más vende el negocio: va primero y con su palabra clave (enlaces internos para Google). */
const TOP = ['termotanques', 'claraboyas', 'puertas-plegadizas', 'repuestos-sanitarios', 'repuestos-griferias', 'construccion']

/**
 * Rubros de la portada: cada uno con su descripción y accesos a sus subcategorías. Además de orientar al
 * cliente, conecta la portada con cada categoría usando las palabras que busca la gente.
 */
export function Features({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const has = (c: Category) => (counts[c.id] ?? 0) > 0
  const roots = rootCategories(categories).filter(has)
  const top = TOP.map((id) => categories.find((c) => c.id === id)).filter((c): c is Category => !!c && has(c))
  if (!roots.length) return null

  return (
    <section aria-labelledby="rubros-title" className="bg-secondary/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-10 flex flex-col gap-3">
          <h2 id="rubros-title" className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Todo para tu obra en Villa María
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Sanitarios, conducción de agua, calefacción y materiales de construcción en un solo lugar, con asesoramiento.
          </p>
          {top.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-foreground">Lo más buscado:</span>
              {top.map((c, i) => (
                <span key={c.id} className="flex items-center gap-3">
                  <Link href={categoryUrl(categories, c.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                    {categoryLabel(c, categories)}
                  </Link>
                  {i < top.length - 1 && <span aria-hidden="true" className="text-muted-foreground">·</span>}
                </span>
              ))}
            </p>
          )}
        </FadeIn>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((root, i) => {
            const Icon = ICONS[root.id] ?? Wrench
            const subs = childCategories(categories, root.id).filter(has).slice(0, 5)
            return (
              <FadeIn key={root.id} delay={Math.min(i, 5) * 60} as="article">
                <div className="flex h-full flex-col gap-3">
                  <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                    <Link href={categoryUrl(categories, root.id)} className="hover:text-primary">
                      {root.name}
                    </Link>
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{root.description}</p>
                  {subs.length > 0 && (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {subs.map((c) => (
                        <li key={c.id}>
                          <Link href={categoryUrl(categories, c.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                            {categoryLabel(c, categories)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
