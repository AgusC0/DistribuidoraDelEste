'use client'

import { useState } from 'react'
import { Accordion } from '@base-ui/react/accordion'
import { ArrowRight, Plus } from 'lucide-react'
import { FadeIn } from '@/components/fade-in'
import { WaLink } from '@/components/wa-link'
import type { FaqGroup } from '@/lib/faq'

/** Preguntas frecuentes: título fijo a la izquierda y respuestas desplegables a la derecha. */
const VISIBLE = 4

export function Faq({ groups: all }: { groups: FaqGroup[] }) {
  // Primero solo 4 preguntas: el resto se abre con "Ver más" para que la portada no quede larga.
  const [showAll, setShowAll] = useState(false)
  // Controlado: tocar de nuevo una pregunta abierta la cierra.
  const [open, setOpen] = useState<string[]>([])
  const total = all.reduce((n, g) => n + g.items.length, 0)
  const groups = showAll || !all.length ? all : [{ ...all[0], items: all[0].items.slice(0, VISIBLE) }]
  return (
    <section id="preguntas" aria-label="Preguntas frecuentes" className="scroll-mt-16 bg-secondary/40 py-14 md:scroll-mt-20 md:py-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 sm:px-6 md:gap-24 lg:px-8">
        {groups.map((group, gi) => (
          <div key={group.title} className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-12 lg:gap-16">
            <FadeIn className="flex flex-col gap-4 lg:sticky lg:top-28 lg:col-span-4">
              {gi === 0 && <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Preguntas frecuentes</p>}
              <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">{group.title}</h2>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {group.description}{' '}
                {gi === 0 && (
                  <WaLink source="faq" className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary">
                    ¿Otra duda? Escribinos.
                  </WaLink>
                )}
              </p>
            </FadeIn>

            <Accordion.Root className="w-full lg:col-span-8" multiple value={open} onValueChange={(v) => setOpen(v as string[])}>
              {group.items.map((item) => (
                <Accordion.Item key={item.question} value={item.question} className="border-b border-border/80">
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-lg font-medium text-foreground transition-colors hover:text-primary md:text-xl">
                      {item.question}
                      <Plus aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[panel-open]:rotate-45" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-300 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                    <div className="pb-6 text-base leading-relaxed text-muted-foreground md:text-lg lg:pr-12">
                      <p>{item.answer}</p>
                      {item.link && (
                        <a
                          href={item.link.href}
                          {...(item.link.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                          className="mt-3 inline-flex items-center gap-1.5 text-base font-medium text-primary hover:underline"
                        >
                          {item.link.label}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </a>
                      )}
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
              {!showAll && total > VISIBLE && gi === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Ver más preguntas ({total - VISIBLE})
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              )}
            </Accordion.Root>
          </div>
        ))}
      </div>
    </section>
  )
}
