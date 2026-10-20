'use client'

import { useEffect, useState } from 'react'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { cn } from '@/lib/utils'

/** Botón flotante: aparece después del hero y se oculta en la sección de contacto (ya hay CTAs ahí). */
export function WhatsappFloat() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const contact = document.getElementById('contacto')?.getBoundingClientRect()
      const inContact = contact ? contact.top < window.innerHeight * 0.6 && contact.bottom > 0 : false
      setVisible(window.scrollY > 400 && !inContact)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <WaLink
      source="flotante"
      aria-label="Consultar por WhatsApp"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        'fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg ring-4 ring-whatsapp/25 transition-[transform,opacity] duration-300 hover:scale-105 active:scale-95',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <WhatsappIcon className="size-7" />
    </WaLink>
  )
}
