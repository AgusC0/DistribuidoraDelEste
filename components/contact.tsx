'use client'

import { useState } from 'react'
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { FadeIn } from '@/components/fade-in'
import { WaLink } from '@/components/wa-link'
import { WhatsappIcon } from '@/components/whatsapp-icon'
import { useCatalog } from '@/components/catalog-provider'
import { submitLead } from '@/app/actions'
import { waLink } from '@/lib/site'
import { track } from '@/lib/track'

const GENERAL = 'Consulta general'

export function Contact() {
  const { settings } = useCatalog()
  const [form, setForm] = useState({ name: '', phone: '', product: GENERAL, message: '', website: '' })
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [sentUrl, setSentUrl] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const next: typeof errors = {}
    if (form.name.trim().length < 2) next.name = 'Ingresá tu nombre.'
    if (form.phone && form.phone.replace(/\D/g, '').length < 7) next.phone = 'Revisá el número (mínimo 7 dígitos).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) {
      e.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    const lines = [
      `Hola Distribuidora del Este, mi nombre es ${form.name.trim()}.`,
      `Producto de interés: ${form.product.trim() || GENERAL}.`,
      form.phone && `Teléfono: ${form.phone}.`,
      form.message.trim() && `Mensaje: ${form.message.trim()}`,
    ].filter(Boolean)
    const url = waLink(settings.whatsappNumber, lines.join('\n'))
    // Se guarda en segundo plano: abrir WhatsApp tiene que ser inmediato o el navegador bloquea la ventana.
    void submitLead(form).catch(() => {})
    track({ type: 'wa_click', source: 'formulario' })
    window.open(url, '_blank', 'noopener,noreferrer')
    setSentUrl(url)
  }

  return (
    <section id="contacto" aria-labelledby="contacto-title" className="scroll-mt-16 bg-brand-blue py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-10 flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-aqua">Contacto</p>
          <h2
            id="contacto-title"
            className="font-heading text-3xl font-bold uppercase tracking-tight text-primary-foreground text-balance sm:text-4xl"
          >
            Hacé tu consulta
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-primary-foreground/80">
            Completá el formulario y te abrimos WhatsApp con tu consulta ya armada, o escribinos directamente
            por cualquiera de nuestros canales.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <FadeIn className="lg:col-span-3">
            {sentUrl ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
                <CheckCircle2 aria-hidden="true" className="size-12 text-whatsapp" />
                <div role="status">
                  <p className="font-heading text-xl font-semibold uppercase text-foreground">¡Gracias, {form.name.split(' ')[0]}!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Abrimos WhatsApp con tu consulta. Si no se abrió, tocá el botón de abajo.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    nativeButton={false}
                    className="h-11 bg-whatsapp px-5 text-whatsapp-foreground hover:bg-whatsapp/90"
                    render={<a href={sentUrl} target="_blank" rel="noopener noreferrer" />}
                  >
                    <WhatsappIcon className="size-4" />
                    Abrir WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 px-5"
                    onClick={() => {
                      setSentUrl(null)
                      setForm({ name: '', phone: '', product: GENERAL, message: '', website: '' })
                    }}
                  >
                    Hacer otra consulta
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field data-invalid={!!errors.name || undefined}>
                      <FieldLabel htmlFor="name">
                        Nombre <span className="text-destructive" aria-hidden="true">*</span>
                      </FieldLabel>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Tu nombre"
                        required
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className="h-11"
                      />
                      {errors.name && (
                        <p id="name-error" className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </Field>
                    <Field data-invalid={!!errors.phone || undefined}>
                      <FieldLabel htmlFor="phone">
                        Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
                      </FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="Ej: 353 000-0000"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className="h-11"
                      />
                      {errors.phone && (
                        <p id="phone-error" className="text-sm text-destructive">
                          {errors.phone}
                        </p>
                      )}
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="product">Producto de interés</FieldLabel>
                    <input
                      id="product"
                      name="product"
                      value={form.product === GENERAL ? '' : form.product}
                      onChange={set('product')}
                      maxLength={120}
                      placeholder="Ej: inodoro largo, termotanque 80 litros (opcional)"
                      className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="message">Mensaje</FieldLabel>
                    <Textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Contanos qué necesitás: medidas, cantidades, modelo…"
                      rows={4}
                      maxLength={1000}
                    />
                  </Field>

                  {/* campo trampa anti-spam, invisible para personas */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={set('website')}
                    className="hidden"
                    aria-hidden="true"
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full bg-whatsapp text-base text-whatsapp-foreground hover:bg-whatsapp/90"
                  >
                    <Send className="size-4" />
                    Enviar por WhatsApp
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Respondemos en horario comercial. Tus datos sólo se usan para contestar tu consulta.
                  </p>
                </FieldGroup>
              </form>
            )}
          </FadeIn>

          <FadeIn delay={120} className="lg:col-span-2">
            <div className="flex h-full flex-col gap-4">
              <WaLink
                source="contacto"
                className="flex items-start gap-4 rounded-xl bg-whatsapp p-5 text-whatsapp-foreground transition-opacity hover:opacity-90"
              >
                <WhatsappIcon className="mt-0.5 size-6 shrink-0" />
                <span>
                  <span className="block font-heading text-sm font-semibold uppercase tracking-wide">WhatsApp</span>
                  <span className="block text-sm opacity-90">{settings.phoneDisplay}</span>
                </span>
              </WaLink>

              <a
                href={`mailto:${settings.email}`}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <Mail aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block font-heading text-sm font-semibold uppercase tracking-wide text-foreground">Email</span>
                  <span className="block break-all text-sm text-muted-foreground">{settings.email}</span>
                </span>
              </a>

              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <MapPin aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                <span>
                  <span className="block font-heading text-sm font-semibold uppercase tracking-wide text-foreground">Dirección</span>
                  <span className="block text-sm text-muted-foreground">{settings.address}</span>
                </span>
              </a>

              <a
                href={`tel:+${settings.whatsappNumber}`}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <Phone aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-primary" />
                <span>
                  <span className="block font-heading text-sm font-semibold uppercase tracking-wide text-foreground">Llamar</span>
                  <span className="block text-sm text-muted-foreground">{settings.phoneDisplay}</span>
                </span>
              </a>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
