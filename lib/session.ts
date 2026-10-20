import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export async function isAdmin() {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Usar al inicio de cada página y server action del panel. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login')
}
