import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Logo de la marca (personaje + "Distribuidora del Este · Sanitarios · Corralón"), con fondo
 * transparente. El alto se ajusta con `className` (h-12 por defecto); el ancho sale solo.
 */
export function Logo({ className, priority = true }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo-del-este.webp"
      alt="Distribuidora del Este – Sanitarios y Corralón"
      width={547}
      height={240}
      priority={priority}
      className={cn('h-12 w-auto shrink-0', className)}
    />
  )
}
