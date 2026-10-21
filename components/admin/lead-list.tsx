'use client'

import { useMemo, useState, useTransition } from 'react'
import { Inbox, Phone, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, inputClass, Panel } from '@/components/admin/ui'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { deleteLead, saveLeadNotes, setLeadStatus } from '@/app/admin/actions'
import { normalize } from '@/lib/search'
import { cn } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/lib/types'

const STATUS: Record<LeadStatus, { label: string; className: string }> = {
  nuevo: { label: 'Nueva', className: 'bg-brand-blue/10 text-brand-blue' },
  contactado: { label: 'Contactada', className: 'bg-accent/20 text-accent-foreground' },
  cerrado: { label: 'Cerrada', className: 'bg-muted text-muted-foreground' },
}

/** Arma un número de WhatsApp argentino a partir de lo que escribió el cliente. */
function waNumber(phone: string) {
  let d = phone.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('54')) return d
  d = d.replace(/^0/, '').replace(/^(\d{2,4})15/, '$1')
  return d.length >= 10 ? `549${d}` : null
}

function LeadCard({ lead, isFirst }: { lead: Lead; isFirst?: boolean }) {
  const [notes, setNotes] = useState(lead.notes)
  const [pending, start] = useTransition()
  const number = waNumber(lead.phone)
  const first = lead.name.split(' ')[0]
  const reply = `Hola ${first}, te escribimos de Distribuidora del Este por tu consulta sobre ${lead.product}.`

  return (
    <li data-guide={isFirst ? 'consulta' : undefined} className={cn('flex flex-col gap-3 p-5', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{lead.name}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(lead.createdAt))}
          </p>
        </div>
        <select
          value={lead.status}
          onChange={(e) => start(() => setLeadStatus(lead.id, e.target.value as LeadStatus))}
          aria-label={`Estado de la consulta de ${lead.name}`}
          className={cn('h-8 rounded-full border-0 px-3 text-xs font-semibold', STATUS[lead.status].className)}
        >
          {(Object.keys(STATUS) as LeadStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS[s].label}
            </option>
          ))}
        </select>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Producto</dt>
        <dd className="font-medium text-foreground">{lead.product}</dd>
        {lead.phone && (
          <>
            <dt className="text-muted-foreground">Teléfono</dt>
            <dd className="text-foreground">{lead.phone}</dd>
          </>
        )}
        {lead.message && (
          <>
            <dt className="text-muted-foreground">Mensaje</dt>
            <dd className="whitespace-pre-line text-foreground">{lead.message}</dd>
          </>
        )}
      </dl>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== lead.notes && start(() => saveLeadNotes(lead.id, notes))}
        rows={2}
        placeholder="Notas internas (se guardan solas)…"
        aria-label={`Notas sobre ${lead.name}`}
        className={cn(inputClass, 'h-auto py-2')}
      />

      <div className="flex flex-wrap gap-2">
        {number && (
          <Button
            nativeButton={false}
            size="sm"
            className="h-9 bg-whatsapp px-3 text-whatsapp-foreground hover:bg-whatsapp/90"
            render={
              <a
                href={`https://wa.me/${number}?text=${encodeURIComponent(reply)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => lead.status === 'nuevo' && start(() => setLeadStatus(lead.id, 'contactado'))}
              />
            }
          >
            <WhatsappIcon className="size-4" />
            Responder
          </Button>
        )}
        {lead.phone && (
          <Button variant="outline" size="sm" nativeButton={false} className="h-9 px-3" render={<a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} />}>
            <Phone className="size-4" />
            Llamar
          </Button>
        )}
        <ConfirmButton
          variant="ghost"
          size="sm"
          className="ml-auto h-9 text-destructive hover:bg-destructive/10"
          title="¿Eliminar consulta?"
          description={`Se borra la consulta de ${lead.name}. Esta acción no se puede deshacer.`}
          onConfirm={() => deleteLead(lead.id)}
        >
          <Trash2 className="size-4" />
          Eliminar
        </ConfirmButton>
      </div>
    </li>
  )
}

export function LeadList({ leads }: { leads: Lead[] }) {
  const [tab, setTab] = useState<LeadStatus | 'todas'>('todas')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return leads.filter(
      (l) =>
        (tab === 'todas' || l.status === tab) &&
        (!q || normalize(`${l.name} ${l.phone} ${l.product} ${l.message} ${l.notes}`).includes(q)),
    )
  }, [leads, tab, query])

  const tabs: { value: LeadStatus | 'todas'; label: string; count: number }[] = [
    { value: 'todas', label: 'Todas', count: leads.length },
    ...(Object.keys(STATUS) as LeadStatus[]).map((s) => ({
      value: s,
      label: STATUS[s].label + 's',
      count: leads.filter((l) => l.status === s).length,
    })),
  ]

  return (
    <Panel className="p-0">
      <div data-guide="consultas-filtros" className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por estado">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label} <span className="tabular-nums text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, producto…"
            aria-label="Buscar consultas"
            className={cn(inputClass, 'pl-9')}
          />
        </div>
      </div>
      {filtered.length ? (
        <ul className="divide-y divide-border">
          {filtered.map((l, i) => (
            <LeadCard key={l.id} lead={l} isFirst={i === 0} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Inbox aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {leads.length ? 'No hay consultas con esos filtros.' : 'Todavía no llegaron consultas desde el formulario del sitio.'}
          </p>
        </div>
      )}
    </Panel>
  )
}
