import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { PriceVisibilityToggle } from '@/components/admin/price-visibility'
import { BackupPanel, DemoCatalogPanel, SettingsForm } from '@/components/admin/settings-form'
import { readDb } from '@/lib/db'
import { emailConfigured } from '@/lib/notify'

export const metadata: Metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader title="Ajustes" description="Datos del negocio, horarios, formas de pago, avisos y respaldo." help="ajustes" />
      <PriceVisibilityToggle showPrices={db.settings.showPrices} className="mb-6" />
      <SettingsForm settings={db.settings} emailReady={emailConfigured()} />
      <BackupPanel stats={{ products: db.products.length, leads: db.leads.length }} />
      <DemoCatalogPanel />
    </>
  )
}
