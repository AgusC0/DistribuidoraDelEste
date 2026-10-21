import { Check, X } from 'lucide-react'
import { qualityTone, type QualityCheck } from '@/lib/quality'
import { cn } from '@/lib/utils'

const BAR = { good: 'bg-whatsapp', mid: 'bg-warning', low: 'bg-destructive' }

/** Puntaje de la ficha guardada y lo que falta para completarla. */
export function QualityPanel({ score, checks }: { score: number; checks: QualityCheck[] }) {
  const missing = checks.filter((c) => !c.ok)
  const tone = qualityTone(score)
  return (
    <section aria-labelledby="calidad-title" className="mb-6 rounded-2xl bg-card p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="calidad-title" className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">
          Calidad de la ficha
        </h2>
        <div className="flex min-w-40 flex-1 items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-label="Calidad de la ficha"
          >
            <div className={cn('h-full rounded-full', BAR[tone])} style={{ width: `${score}%` }} />
          </div>
          <span className="font-heading text-xl font-bold tabular-nums">{score}%</span>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {missing.length
          ? 'Las fichas completas aparecen mejor en Google y venden más. Se actualiza al guardar.'
          : 'Ficha completa: tiene todo lo que ayuda a vender y a aparecer en Google.'}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {checks.map((c) => (
          <li
            key={c.label}
            title={c.ok ? undefined : c.hint}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              c.ok ? 'bg-whatsapp/10 text-whatsapp' : 'bg-muted text-muted-foreground',
            )}
          >
            {c.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {c.label}
            {!c.ok && <span className="tabular-nums">+{c.points}</span>}
          </li>
        ))}
      </ul>
      {missing.length > 0 && (
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-foreground">
          {missing.slice(0, 4).map((c) => (
            <li key={c.label}>{c.hint}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
