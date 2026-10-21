'use client'

import { useActionState, useState, useTransition } from 'react'
import { Download, Sparkles, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, FieldError, FormMessage, inputClass, Panel, SubmitButton, submitKeepingValues } from '@/components/admin/ui'
import { loadDemoCatalog, restoreBackup, saveSettings, testNotification, type FormState } from '@/app/admin/actions'
import { DAY_NAMES, formatPrice, groupHours } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Settings, WeeklyHours } from '@/lib/types'

function Text({
  name,
  label,
  defaultValue,
  hint,
  error,
  type = 'text',
  className,
}: {
  name: string
  label: string
  defaultValue: string
  hint?: string
  error?: string
  type?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} aria-invalid={!!error} className={inputClass} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

const sectionTitle = 'mb-4 font-heading text-base font-semibold uppercase tracking-wide'

export function SettingsForm({ settings, emailReady }: { settings: Settings; emailReady: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettings, {})
  const [hours, setHours] = useState<WeeklyHours>(settings.hours)
  const [announcementOn, setAnnouncementOn] = useState(settings.announcementEnabled)
  const [announcement, setAnnouncement] = useState(settings.announcementText)
  const e = state.errors ?? {}
  const [testState, setTestState] = useState<FormState>({})
  const [transfer, setTransfer] = useState(String(settings.transferDiscount || ''))
  const [installments, setInstallments] = useState(String(settings.installments || ''))
  const [interestFree, setInterestFree] = useState(settings.installmentsInterestFree)
  const [testing, startTest] = useTransition()
  const order = [1, 2, 3, 4, 5, 6, 0]

  return (
    <form onSubmit={submitKeepingValues(action)} className="flex flex-col gap-6">
      <Panel data-guide="ajustes-negocio">
        <h2 className={sectionTitle}>Negocio y contacto</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text name="businessName" label="Razón social / nombre" defaultValue={settings.businessName} />
          <Text name="tagline" label="Frase corta" defaultValue={settings.tagline} hint="Se usa en el pie y en Google." />
          <Text name="phoneDisplay" label="Teléfono (como se muestra)" defaultValue={settings.phoneDisplay} />
          <Text
            name="whatsappNumber"
            label="Número de WhatsApp"
            defaultValue={settings.whatsappNumber}
            hint="Con código de país, sin + ni espacios. Ej: 5493534181819"
            error={e.whatsappNumber}
          />
          <Text name="email" label="Email" type="email" defaultValue={settings.email} error={e.email} />
          <Text name="address" label="Dirección" defaultValue={settings.address} />
          <Text name="mapsUrl" label="Enlace a Google Maps" defaultValue={settings.mapsUrl} className="sm:col-span-2" />
          <Text
            name="mapsEmbedUrl"
            label="Mapa embebido (URL del iframe)"
            defaultValue={settings.mapsEmbedUrl}
            hint='En Google Maps: Compartir → Insertar un mapa → copiá sólo lo que está dentro de src="…"'
            className="sm:col-span-2"
          />
        </div>
      </Panel>

      <Panel>
        <h2 className={sectionTitle}>Redes sociales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Text name="instagram" label="Instagram (URL)" defaultValue={settings.instagram} />
          <Text name="instagramHandle" label="Usuario de Instagram" defaultValue={settings.instagramHandle} />
          <Text name="facebook" label="Facebook (URL)" defaultValue={settings.facebook} />
        </div>
      </Panel>

      <Panel data-guide="ajustes-horarios">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Horarios</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Formato <code>08:00-12:00, 15:00-19:00</code>. Vacío = cerrado. Se usa para mostrar “Abierto ahora” en el sitio.
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-2">
            {order.map((d) => (
              <div key={d} className="grid grid-cols-[6rem_1fr] items-center gap-3">
                <label htmlFor={`hours-${d}`} className="text-sm font-medium">
                  {DAY_NAMES[d]}
                </label>
                <div>
                  <input
                    id={`hours-${d}`}
                    name={`hours-${d}`}
                    value={hours[d]}
                    onChange={(ev) =>
                      setHours((h) => {
                        const next = [...h] as WeeklyHours
                        next[d] = ev.target.value
                        return next
                      })
                    }
                    placeholder="Cerrado"
                    aria-invalid={!!e[`hours-${d}`]}
                    className={inputClass}
                  />
                  <FieldError message={e[`hours-${d}`]} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Así se ve en el sitio</p>
            <dl className="flex flex-col gap-1.5 text-sm">
              {groupHours(hours).map((g) => (
                <div key={g.label} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{g.label}</dt>
                  <dd className="font-medium tabular-nums">{g.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Panel>

      <Panel data-guide="ajustes-pagos">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Precios y formas de pago</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Se muestran en las tarjetas, la ficha de producto y el pedido. Dejá en 0 lo que no quieras mostrar.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="transferDiscount" className="text-sm font-medium">
              Descuento por transferencia (%)
            </label>
            <input
              id="transferDiscount"
              name="transferDiscount"
              inputMode="numeric"
              value={transfer}
              onChange={(ev) => setTransfer(ev.target.value.replace(/\D/g, '').slice(0, 2))}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="installments" className="text-sm font-medium">
              Cuotas
            </label>
            <input
              id="installments"
              name="installments"
              inputMode="numeric"
              value={installments}
              onChange={(ev) => setInstallments(ev.target.value.replace(/\D/g, '').slice(0, 2))}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 pt-6">
            <input type="checkbox" name="installmentsInterestFree" checked={interestFree} onChange={(ev) => setInterestFree(ev.target.checked)} className="size-4 accent-primary" />
            <span className="text-sm font-medium">Sin interés</span>
          </label>
        </div>
        {(Number(transfer) > 0 || Number(installments) > 1) && (
          <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejemplo con un producto de $ 100.000</p>
            {Number(transfer) > 0 && (
              <p className="font-semibold text-whatsapp">
                {formatPrice(Math.round(100000 * (1 - Number(transfer) / 100)))} con transferencia · ahorrás{' '}
                {formatPrice(Math.round(100000 * (Number(transfer) / 100)))}
              </p>
            )}
            {Number(installments) > 1 && (
              <p>
                {installments} cuotas{interestFree ? ' sin interés' : ''} de {formatPrice(Math.round(100000 / Number(installments)))}
              </p>
            )}
          </div>
        )}
        <div className="mt-4">
          <Text
            name="priceNote"
            label="Aclaración debajo del precio"
            defaultValue={settings.priceNote}
            hint="Ej: Precios de contado, débito o transferencia. Consultá otras formas de pago."
          />
        </div>
      </Panel>

      <Panel data-guide="ajustes-portada">
        <h2 className={sectionTitle}>Portada</h2>
        <div className="flex flex-col gap-4">
          <Text name="heroTitle" label="Título principal" defaultValue={settings.heroTitle} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="heroSubtitle" className="text-sm font-medium">
              Bajada
            </label>
            <textarea id="heroSubtitle" name="heroSubtitle" rows={2} defaultValue={settings.heroSubtitle} className={cn(inputClass, 'h-auto py-2')} />
          </div>
        </div>
      </Panel>

      <Panel data-guide="ajustes-email">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Avisos por email</h2>
        <p className="mb-4 text-sm text-muted-foreground">Te llega un email cada vez que alguien manda una consulta o un pedido desde la web.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Text
            name="notifyEmail"
            label="Email que recibe los avisos"
            type="email"
            defaultValue={settings.notifyEmail}
            error={e.notifyEmail}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4"
            disabled={testing || !emailReady}
            onClick={() => startTest(async () => setTestState(await testNotification()))}
          >
            {testing ? 'Enviando…' : 'Enviar email de prueba'}
          </Button>
        </div>
        {!emailReady && (
          <p className="mt-3 rounded-lg bg-promo/10 px-3 py-2 text-sm text-foreground">
            Para activar los avisos falta cargar la clave <code>RESEND_API_KEY</code> en el servidor (ver README).
          </p>
        )}
        <div className="mt-3">
          <FormMessage state={testState} />
        </div>
      </Panel>

      <Panel>
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Google</h2>
        <p className="mb-4 text-sm text-muted-foreground">Medí las visitas y aparecé mejor en las búsquedas y en Google Maps.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Text
            name="gaId"
            label="Google Analytics (ID de medición)"
            defaultValue={settings.gaId}
            hint="analytics.google.com → Administrar → Flujos de datos. Empieza con G-"
            error={e.gaId}
          />
          <Text
            name="googleVerification"
            label="Verificación de Search Console"
            defaultValue={settings.googleVerification}
            hint='search.google.com/search-console → Etiqueta HTML. Podés pegar la etiqueta entera.'
          />
          <Text
            name="googleReviewUrl"
            label="Enlace para dejar reseña en Google"
            defaultValue={settings.googleReviewUrl}
            hint="Perfil de Empresa de Google → Pedir reseñas → copiar enlace. Se muestra en el sitio."
            className="sm:col-span-2"
          />
        </div>
      </Panel>

      <Panel data-guide="ajustes-anuncio">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Barra de anuncio</h2>
        <p className="mb-4 text-sm text-muted-foreground">Un mensaje arriba de todo el sitio: promos, feriados, horarios especiales.</p>
        <label className="mb-3 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="announcementEnabled"
            checked={announcementOn}
            onChange={(ev) => setAnnouncementOn(ev.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-sm font-medium">Mostrar anuncio</span>
        </label>
        <input
          name="announcementText"
          value={announcement}
          onChange={(ev) => setAnnouncement(ev.target.value)}
          maxLength={160}
          aria-label="Texto del anuncio"
          placeholder="Ej: Este lunes feriado abrimos de 9 a 13 hs"
          className={inputClass}
        />
        {announcementOn && announcement && (
          <div className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-center text-sm font-medium text-brand-blue-foreground">{announcement}</div>
        )}
      </Panel>

      <div data-guide="ajustes-guardar" className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <FormMessage state={state} />
        <SubmitButton pending={pending} className="sm:ml-auto">Guardar ajustes</SubmitButton>
      </div>
    </form>
  )
}

export function BackupPanel({ stats }: { stats: { products: number; leads: number } }) {
  const [state, action] = useActionState<FormState, FormData>(restoreBackup, {})
  return (
    <Panel data-guide="ajustes-respaldo" className="mt-6">
      <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Respaldo</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Descargá una copia de todo ({stats.products} {stats.products === 1 ? 'producto' : 'productos'}, {stats.leads}{' '}
        {stats.leads === 1 ? 'consulta' : 'consultas'}, ajustes y métricas). Guardala cada tanto.
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Button variant="outline" nativeButton={false} className="h-10 px-4" render={<a href="/admin/ajustes/respaldo" download />}>
          <Download className="size-4" />
          Descargar respaldo
        </Button>
        <form
          action={action}
          className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(ev) => {
            if (!confirm('Restaurar reemplaza TODOS los datos actuales por los del archivo. ¿Continuar?')) ev.preventDefault()
          }}
        >
          <input
            type="file"
            name="backup"
            accept="application/json,.json"
            aria-label="Archivo de respaldo"
            className="text-sm file:mr-3 file:h-10 file:rounded-lg file:border file:border-border file:bg-transparent file:px-3 file:text-sm file:font-medium"
          />
          <SubmitButton variant="outline">
            <Upload className="size-4" />
            Restaurar
          </SubmitButton>
        </form>
      </div>
      <div className="mt-3">
        <FormMessage state={state} />
      </div>
    </Panel>
  )
}

/** Carga un catálogo de ejemplo para presentar el sitio (filtros, marcas y ofertas). */
export function DemoCatalogPanel() {
  const [state, setState] = useState<FormState>({})
  return (
    <Panel data-guide="ajustes-demo" className="mt-6">
      <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Catálogo de demostración</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Carga unos 25 productos de ejemplo con marcas, medidas y ofertas para mostrar cómo funcionan los filtros y las promociones.
        Reemplaza las categorías y los productos actuales (no toca consultas ni ajustes). Descargá un respaldo antes si tenés datos
        reales.
      </p>
      <ConfirmButton
        variant="outline"
        className="h-10 px-4"
        title="¿Cargar el catálogo de demostración?"
        description="Se reemplazan todas las categorías y productos por datos de ejemplo. Las consultas y los ajustes se mantienen."
        confirmLabel="Cargar demostración"
        onConfirm={async () => setState(await loadDemoCatalog())}
      >
        <Sparkles className="size-4" />
        Cargar catálogo de demostración
      </ConfirmButton>
      <div className="mt-3">
        <FormMessage state={state} />
      </div>
    </Panel>
  )
}
