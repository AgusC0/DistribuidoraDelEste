'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { Search, X } from 'lucide-react'
import { SearchBox } from '@/components/search-box'
import { cn } from '@/lib/utils'

/** Buscador global del encabezado. Se abre con clic, Ctrl/⌘ + K o "/". */
export function SearchDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const pending = useRef<(() => void) | null>(null)

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen && pending.current) {
          pending.current()
          pending.current = null
        }
      }}
    >
      <Dialog.Trigger
        className={cn(
          'group flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-ring/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
          className,
        )}
        aria-label="Buscar productos"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden flex-1 truncate whitespace-nowrap text-left lg:inline">Buscar productos…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 font-sans text-[0.7rem] font-medium lg:inline">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-blue/40 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-3 top-3 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-background p-3 shadow-2xl outline-none transition-all duration-150 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 sm:top-[12vh] sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
              Buscar en el catálogo
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar buscador"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <SearchBox
            variant="panel"
            autoFocus
            navigate={(go) => {
              pending.current = go
              setOpen(false)
            }}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
