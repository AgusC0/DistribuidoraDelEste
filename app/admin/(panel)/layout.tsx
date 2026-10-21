import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'
import { readDb } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel | Distribuidora del Este' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const db = await readDb()
  const newLeads = db.leads.filter((l) => l.status === 'nuevo').length
  const newOrders = db.orders.filter((o) => o.status === 'nuevo').length
  return (
    <AdminShell newLeads={newLeads} newOrders={newOrders}>
      {children}
    </AdminShell>
  )
}
