/**
 * Sesión de administrador firmada con HMAC (Web Crypto: funciona en el proxy y en el servidor).
 * Configuración por variables de entorno:
 *   ADMIN_USER      usuario del panel (por defecto "admin")
 *   ADMIN_PASSWORD  contraseña del panel (obligatoria en producción; en desarrollo es "admin")
 *   SESSION_SECRET  clave para firmar la cookie (recomendada, 32+ caracteres)
 */
export const SESSION_COOKIE = 'dde_admin'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

const isProd = process.env.NODE_ENV === 'production'

export function adminUser(): string {
  return process.env.ADMIN_USER || 'admin'
}

export function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || (isProd ? null : 'admin')
}

function secret(): string | null {
  return process.env.SESSION_SECRET || adminPassword()
}

const encoder = new TextEncoder()

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret() ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(value))
  return Buffer.from(sig).toString('base64url')
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionToken() {
  const exp = Date.now() + SESSION_MAX_AGE * 1000
  return `${exp}.${await hmac(`admin.${exp}`)}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !secret()) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  return safeEqual(sig, await hmac(`admin.${exp}`))
}

export async function checkCredentials(user: string, password: string): Promise<boolean> {
  const expected = adminPassword()
  if (!expected) return false
  // Compara los HMAC para que el tiempo no dependa del largo de lo ingresado.
  const userOk = safeEqual(await hmac(`u.${user.trim().toLowerCase()}`), await hmac(`u.${adminUser().toLowerCase()}`))
  const passOk = safeEqual(await hmac(`pw.${password}`), await hmac(`pw.${expected}`))
  return userOk && passOk
}
