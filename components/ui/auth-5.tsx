import Image from 'next/image'

export interface AuthFeature {
  icon: React.ReactNode
  title: string
  description: string
}

/**
 * Pantalla de ingreso a pantalla completa (basada en Auth5): formulario a la izquierda y una foto
 * grande a la derecha, con los beneficios del panel encima. En pantallas chicas queda sólo el formulario.
 * El formulario va en `children` (así se usa el ingreso real del panel, con su acción de servidor).
 */
export function Auth5({
  logo,
  heading,
  subtext,
  image,
  panelHeading,
  features = [],
  footer,
  children,
}: {
  logo: React.ReactNode
  heading: string
  subtext: React.ReactNode
  image: { src: string; alt: string }
  panelHeading?: string
  features?: AuthFeature[]
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-background p-1 lg:flex-row">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-14 sm:px-10 lg:max-w-xl lg:px-16">
        <div className="w-full max-w-sm space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          {logo}
          <div className="space-y-1.5">
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground">{heading}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{subtext}</p>
          </div>
          {children}
          {footer}
        </div>
      </section>

      <section className="relative hidden flex-1 overflow-hidden rounded-[2rem] lg:flex">
        <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 1024px) 0px, 60vw" className="object-cover" />
        {/* Degradado para que el texto se lea sobre cualquier foto */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-blue/90 via-brand-blue/30 to-transparent" />
        {(panelHeading || features.length > 0) && (
          <div className="relative mt-auto w-full p-10 xl:p-14">
            {panelHeading && (
              <h2 className="max-w-lg font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-white xl:text-4xl">{panelHeading}</h2>
            )}
            {features.length > 0 && (
              <ul className="mt-6 grid max-w-2xl gap-3 xl:grid-cols-3">
                {features.map((f, i) => (
                  <li
                    key={f.title}
                    className="rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700"
                    style={{ animationDelay: `${200 + i * 120}ms`, animationFillMode: 'both' }}
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">{f.icon}</span>
                    <p className="mt-3 text-sm font-semibold">{f.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/75">{f.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
