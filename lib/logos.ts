/**
 * Variantes del logo que se eligen en Ajustes (fondo transparente).
 * `light: true` = el texto es blanco: necesita fondo oscuro para verse.
 * El encabezado y el pie cambian de color solos según la variante elegida.
 */
export const LOGO_OPTIONS = [
  { id: 'logo-negro', label: 'Completo, texto negro', src: '/images/logo/logo-negro.webp', width: 1643, height: 415, light: false },
  { id: 'logo-celeste', label: 'Completo, celeste', src: '/images/logo/logo-celeste.webp', width: 1643, height: 415, light: false },
  { id: 'logo-blanco', label: 'Completo, texto blanco', src: '/images/logo/logo-blanco.webp', width: 1784, height: 448, light: true },
  { id: 'marca-negro', label: 'Solo el nombre, negro', src: '/images/logo/marca-negro.webp', width: 1296, height: 342, light: false },
  { id: 'marca-celeste', label: 'Solo el nombre, celeste', src: '/images/logo/marca-celeste.webp', width: 1296, height: 342, light: false },
  { id: 'marca-blanco', label: 'Solo el nombre, blanco', src: '/images/logo/marca-blanco.webp', width: 1296, height: 342, light: true },
] as const

export type LogoChoice = (typeof LOGO_OPTIONS)[number]['id']

export const DEFAULT_HEADER_LOGO: LogoChoice = 'logo-negro'
export const DEFAULT_FOOTER_LOGO: LogoChoice = 'logo-blanco'

export const isLogoChoice = (v: unknown): v is LogoChoice => LOGO_OPTIONS.some((o) => o.id === v)

export const logoOf = (id: LogoChoice | undefined, fallback: LogoChoice) =>
  LOGO_OPTIONS.find((o) => o.id === id) ?? LOGO_OPTIONS.find((o) => o.id === fallback)!

/**
 * Fondo de cada zona según el logo: el encabezado es claro salvo con un logo blanco;
 * el pie es oscuro salvo con un logo negro (el celeste se ve bien sobre oscuro).
 */
export const headerIsDark = (id: LogoChoice | undefined) => logoOf(id, DEFAULT_HEADER_LOGO).light
export const footerIsLight = (id: LogoChoice | undefined) => logoOf(id, DEFAULT_FOOTER_LOGO).id.endsWith('negro')
