'use client'

import { useEffect, useState } from 'react'
import { openStatus, type OpenStatus as Status } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { WeeklyHours } from '@/lib/types'

/** "Abierto ahora · cierra 19:00", calculado en la hora de Córdoba. Se renderiza tras montar para evitar desfasajes. */
export function OpenStatus({ hours, className }: { hours: WeeklyHours; className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    const update = () => setStatus(openStatus(hours))
    update()
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [hours])

  if (!status) return <span className={cn('inline-block h-5 w-40', className)} aria-hidden="true" />

  return (
    <span className={cn('inline-flex items-center gap-2 text-sm font-semibold', className)}>
      <span className="relative flex size-2.5">
        {status.open && (
          <span className="absolute inline-flex size-full rounded-full bg-whatsapp opacity-60 motion-safe:animate-ping" />
        )}
        <span className={cn('relative inline-flex size-2.5 rounded-full', status.open ? 'bg-whatsapp' : 'bg-promo')} />
      </span>
      {status.label}
    </span>
  )
}
