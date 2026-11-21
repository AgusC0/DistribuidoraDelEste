import Link from 'next/link'

/**
 * Cinta de marcas que corre sola, con el sello del negocio encima (estilo "franja de confianza").
 * La lista se duplica para que la animación sea continua; cada marca lleva a sus productos.
 */
export function BrandMarquee({ brands }: { brands: string[] }) {
  if (brands.length < 2) return null
  const items = brands
  const row = (hidden: boolean) =>
    items.map((b, i) => {
      const isBrand = i < brands.length
      return (
        <li key={`${hidden ? 'b' : 'a'}-${b}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-8 pr-8">
          {isBrand ? (
            <Link
              href={`/productos?marca=${encodeURIComponent(b)}`}
              tabIndex={hidden ? -1 : undefined}
              className="font-heading text-xl font-semibold uppercase tracking-wide text-white transition-colors hover:text-aqua md:text-2xl"
            >
              {b}
            </Link>
          ) : (
            <span className="text-lg font-medium text-white/85 md:text-xl">{b}</span>
          )}
          <span aria-hidden="true" className="text-lg text-aqua">
            ✦
          </span>
        </li>
      )
    })

  return (
    <section aria-label="Marcas que trabajamos" className="relative my-6 md:my-10">
      <div className="group relative overflow-hidden bg-brand-blue py-5">
        <ul className="animate-marquee flex w-max">
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </section>
  )
}
