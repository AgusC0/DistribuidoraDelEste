import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/ui'
import { ImportForm } from '@/components/admin/import-form'

export const metadata: Metadata = { title: 'Importar desde Excel' }

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Excel: importar y exportar"
        description="Cargá o actualizá muchos productos de una vez con una planilla."
        actions={
          <Button variant="outline" nativeButton={false} className="h-10 px-4" render={<Link href="/admin/productos" />}>
            <ArrowLeft className="size-4" />
            Volver a productos
          </Button>
        }
      />
      <ImportForm />
    </>
  )
}
