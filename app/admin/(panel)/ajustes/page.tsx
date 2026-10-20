import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/ui'
import { BackupPanel, SettingsForm } from '@/components/admin/settings-form'
import { readDb } from '@/lib/db'
import { emailConfigured } from '@/lib/notify'

export const metadata: Metadata = { title: 'Ajustes' }

export default async function SettingsPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader title="Ajustes" description="Datos del negocio, horarios, textos de la portada y anuncios." />
      <SettingsForm settings={db.settings} emailReady={emailConfigured()} />
      <BackupPanel stats={{ products: db.products.length, leads: db.leads.length }} />
    </>
  )
}
