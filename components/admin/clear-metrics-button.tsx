'use client'

import { RotateCcw } from 'lucide-react'
import { ConfirmButton } from '@/components/admin/ui'
import { clearEvents } from '@/app/admin/actions'

export function ClearMetricsButton() {
  return (
    <ConfirmButton
      variant="outline"
      className="h-10 px-4"
      title="¿Reiniciar métricas?"
      description="Se borran búsquedas, vistas y clics registrados. Productos y consultas no se tocan."
      confirmLabel="Reiniciar"
      onConfirm={() => clearEvents()}
    >
      <RotateCcw className="size-4" />
      Reiniciar métricas
    </ConfirmButton>
  )
}
