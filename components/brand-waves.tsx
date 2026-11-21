import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* =========================================================
   BRAND WAVES
   Firma visual de la marca: las tres ondas del logo, con curvas
   fluidas. Vectorial, escala sin deformarse y toma el color del texto.
========================================================= */

type BrandWavesProps = {
  className?: string
}

export function BrandWaves({ className }: BrandWavesProps) {
  return (
    <svg
      viewBox="0 0 64 30"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('inline-block h-auto shrink-0', className)}
    >
      <path d="M3 5.5C10.5 1 17.5 10 25 5.5S39.5 1 47 5.5 56.5 10 61 5.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 15C10.5 10.5 17.5 19.5 25 15S39.5 10.5 47 15 56.5 19.5 61 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M3 24.5C10.5 20 17.5 29 25 24.5S39.5 20 47 24.5 56.5 29 61 24.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* =========================================================
   EYEBROW
   Identificación editorial de la sección: ondas + texto en mayúsculas.
   Turquesa de marca sobre fondos claros; variante `light` para fondos oscuros.
========================================================= */

type EyebrowProps = {
  children: ReactNode
  className?: string
  /** Para fondos oscuros (azul de marca, hero). */
  light?: boolean
}

export function Eyebrow({ children, className, light = false }: EyebrowProps) {
  const tone = light ? 'text-aqua' : 'text-brand-teal'
  return (
    <p className={cn('inline-flex items-center gap-2.5 sm:gap-3', tone, className)}>
      <BrandWaves className="w-7 sm:w-8" />
      <span className="text-[11px] font-semibold uppercase leading-none tracking-[0.18em] sm:text-xs sm:tracking-[0.22em]">{children}</span>
    </p>
  )
}

/* =========================================================
   WAVES BACKDROP
   Ondas decorativas amplias para fondos de sección. Cubren el contenedor
   (que debe ser `relative` y `overflow-hidden`), no reciben clics y el trazo
   mantiene su grosor a cualquier tamaño. Color y opacidad por `className`
   (ej.: "text-white/[0.06]").
========================================================= */

type WavesBackdropProps = {
  className?: string
}

const BACKDROP_WAVES = [
  'M-100 115C120 15 270 205 500 115S870 15 1100 115 1430 205 1600 115',
  'M-100 205C120 105 270 295 500 205S870 105 1100 205 1430 295 1600 205',
  'M-100 295C120 195 270 385 500 295S870 195 1100 295 1430 385 1600 295',
  'M-100 385C120 285 270 475 500 385S870 285 1100 385 1430 475 1600 385',
]

export function WavesBackdrop({ className }: WavesBackdropProps) {
  return (
    <svg
      viewBox="0 0 1440 500"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none absolute inset-0 h-full w-full select-none overflow-hidden', className)}
    >
      {BACKDROP_WAVES.map((d, i) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          // La última onda más tenue: el fondo se desvanece hacia abajo.
          opacity={i === BACKDROP_WAVES.length - 1 ? 0.6 : 1}
        />
      ))}
    </svg>
  )
}
