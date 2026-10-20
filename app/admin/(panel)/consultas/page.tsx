import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/ui'
import { LeadList } from '@/components/admin/lead-list'
import { readDb } from '@/lib/db'

export const metadata: Metadata = { title: 'Consultas' }

export default async function LeadsPage() {
  const db = await readDb()
  return (
    <>
      <PageHeader
        title="Consultas"
        description="Lo que la gente envía desde el formulario de contacto. Respondé por WhatsApp y marcá el seguimiento."
        actions={
          <Button variant="outline" nativeButton={false} className="h-10 px-4" render={<a href="/admin/consultas/exportar" download />}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        }
      />
      <LeadList leads={db.leads} />
    </>
  )
}
