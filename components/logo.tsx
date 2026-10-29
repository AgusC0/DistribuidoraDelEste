import Image from 'next/image'
import { DEFAULT_HEADER_LOGO, logoOf, type LogoChoice } from '@/lib/logos'
import { cn } from '@/lib/utils'

/**
 * Logo de la marca en la variante pedida (ver lib/logos.ts; se elige en Ajustes).
 * El alto se ajusta con `className` (h-12 por defecto); el ancho sale solo.
 */
export function Logo({
  className,
  priority = true,
  choice,
  sizes = '240px',
}: {
  className?: string
  priority?: boolean
  choice?: LogoChoice
  /** Ancho con que se muestra: así el celular baja una versión chica y no la de 3840 px. */
  sizes?: string
}) {
  const img = logoOf(choice, DEFAULT_HEADER_LOGO)
  return (
    <Image
      src={img.src}
      alt="Distribuidora del Este – Sanitarios"
      width={img.width}
      height={img.height}
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? 'high' : undefined}
      className={cn('h-12 w-auto shrink-0', className)}
    />
  )
}
