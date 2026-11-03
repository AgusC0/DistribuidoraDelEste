'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Compartir el producto: en el celular abre el menú de compartir (WhatsApp, etc.); en la compu copia el link. */
export function ShareButton({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href.split('?')[0]
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} | Distribuidora del Este`, url })
      } catch {
        // El cliente cerró el menú: no hace falta avisar nada.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Navegadores que bloquean el portapapeles: copia "a la antigua" con un campo oculto.
      const field = Object.assign(document.createElement('textarea'), { value: url })
      field.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button type="button" onClick={share} aria-live="polite" className={className}>
      {copied ? <Check className="size-4 text-whatsapp" /> : <Share2 className="size-4" />}
      <span className={cn(copied && 'text-whatsapp')}>{copied ? 'Link copiado' : 'Compartir'}</span>
    </button>
  )
}
