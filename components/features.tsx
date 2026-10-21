import { Droplets, Wrench, Flame, Headphones } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'

const ITEMS = [
  {
    icon: Droplets,
    title: 'Sanitarios y corralón',
    description: 'Materiales para construcción y sanitarios para tu obra o reforma.',
  },
  {
    icon: Wrench,
    title: 'Conducción de agua',
    description: 'Cañerías, canaletas, tanques de agua y todos sus accesorios.',
  },
  {
    icon: Flame,
    title: 'Termotanques y griferías',
    description: 'Amplia variedad de marcas nacionales e importadas.',
  },
  {
    icon: Headphones,
    title: 'Asesoramiento técnico',
    description: 'Atención personalizada que te acompaña en cada proyecto.',
  },
]

export function Features() {
  return (
    <section className="bg-secondary/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-10 flex flex-col gap-3">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground text-balance sm:text-4xl">
            Soluciones completas
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <FadeIn key={item.title} delay={i * 80} as="article">
              <div className="flex h-full flex-col gap-3">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-6" />
                </span>
                <h3 className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
