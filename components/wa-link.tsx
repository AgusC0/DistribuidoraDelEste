'use client'

import { useCatalog } from '@/components/catalog-provider'
import { track } from '@/lib/track'
import { GENERAL_WA_MESSAGE, waLink } from '@/lib/site'

/** Enlace a WhatsApp que registra el clic (para saber qué productos generan consultas). */
export function WaLink({
  message = GENERAL_WA_MESSAGE,
  source,
  productId,
  ...props
}: Omit<React.ComponentProps<'a'>, 'href'> & { message?: string; source: string; productId?: string }) {
  const { settings } = useCatalog()
  return (
    <a
      {...props}
      href={waLink(settings.whatsappNumber, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        track({ type: 'wa_click', source, productId })
        props.onClick?.(e)
      }}
    />
  )
}
