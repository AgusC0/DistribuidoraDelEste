'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

function niceMax(value: number) {
  if (value <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(value))
  const n = value / pow
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

/** Columnas de una sola serie por día, con tooltip al pasar el mouse y tabla accesible. */
export function ColumnChart({
  data,
  unit,
  className,
}: {
  data: { date: string; label: string; value: number }[]
  unit: [singular: string, plural: string]
  className?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = niceMax(Math.max(...data.map((d) => d.value), 0))
  const ticks = [max, max / 2, 0]
  const fmt = (v: number) => `${v} ${v === 1 ? unit[0] : unit[1]}`
  const labelEvery = Math.ceil(data.length / 6)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      <div className="flex h-44 gap-2" aria-hidden="true">
        <div className="flex w-7 flex-col justify-between pb-5 text-right text-[0.7rem] tabular-nums text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {Number.isInteger(t) ? t : t.toFixed(1)}
            </span>
          ))}
        </div>
        <div className="relative flex flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
            {ticks.map((t) => (
              <span key={t} className={cn('block h-px', t === 0 ? 'bg-border' : 'bg-border/50')} />
            ))}
          </div>
          <div className="relative flex flex-1 items-end gap-[2px] pb-px" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.date}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
              >
                <div
                  className={cn(
                    'w-full rounded-t-[4px] bg-primary transition-opacity',
                    hover !== null && hover !== i && 'opacity-40',
                    d.value === 0 && 'bg-transparent',
                  )}
                  style={{ height: `${(d.value / max) * 100}%` }}
                />
                {hover === i && (
                  <div
                    className={cn(
                      'pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md',
                      i < data.length / 2 ? 'left-0' : 'right-0',
                    )}
                  >
                    <span className="block text-muted-foreground">{d.label}</span>
                    <span className="block font-semibold text-foreground">{fmt(d.value)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex h-5 gap-[2px] pt-1 text-[0.7rem] text-muted-foreground">
            {data.map((d, i) => (
              <span key={d.date} className="flex-1 overflow-visible whitespace-nowrap">
                {i % labelEvery === 0 ? d.label : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        <table>
          <caption>Total: {fmt(total)}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <th scope="row">{d.label}</th>
                <td>{fmt(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}

/** Ranking horizontal: etiqueta, valor y una barra fina proporcional. */
export function BarList({
  items,
  empty = 'Todavía no hay datos.',
}: {
  items: { label: string; value: number; sub?: string; href?: string }[]
  empty?: string
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-foreground">
              {item.href ? (
                <a href={item.href} className="hover:underline">
                  {item.label}
                </a>
              ) : (
                item.label
              )}
              {item.sub && <span className="ml-2 text-xs text-muted-foreground">{item.sub}</span>}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">{item.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
