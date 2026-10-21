'use client'

import { useEffect, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { useGuide } from '@/components/admin/guide-tour'
import { GUIDES, type GuideKey } from '@/lib/admin-guides'

const seenKey = (key: GuideKey) => `dde_guide_${key}`

/** Botón "Ayuda" del encabezado: arranca la guía interactiva de la sección. */
export function HelpGuide({ guide }: { guide: GuideKey }) {
  const { start } = useGuide()
  const [seen, setSeen] = useState(true)

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(seenKey(guide)) === '1')
    } catch {}
  }, [guide])

  return (
    <button
      type="button"
      onClick={() => {
        start(guide)
        setSeen(true)
        try {
          localStorage.setItem(seenKey(guide), '1')
        } catch {}
      }}
      aria-label={`Guía de ${GUIDES[guide].title}`}
      title="Recorré esta sección paso a paso"
      className="relative inline-flex h-10 items-center gap-2 rounded-lg bg-card px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-brand-blue hover:text-brand-blue-foreground"
    >
      <CircleHelp className="size-5" />
      <span className="hidden sm:inline">Guía</span>
      {!seen && (
        <span className="absolute -right-1 -top-1 flex size-3" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-blue opacity-60" />
          <span className="relative inline-flex size-3 rounded-full border-2 border-background bg-brand-blue" />
        </span>
      )}
    </button>
  )
}
