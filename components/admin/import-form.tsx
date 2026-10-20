'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormMessage, Panel, submitKeepingValues } from '@/components/admin/ui'
import { importProducts, type ImportState } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

const steps = [
  'Descargá la planilla actual (o el modelo vacío) y abrila con Excel.',
  'Editá precios, nombres o agregá filas nuevas. No cambies la columna "id".',
  'En Excel: Archivo → Guardar como → "CSV (delimitado por comas)".',
  'Subila acá, revisá los cambios y aplicalos.',
]

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importProducts, {})
  const [fileName, setFileName] = useState('')
  const [mode, setMode] = useState<'todo' | 'precios'>('precios')
  // La vista previa vale sólo para el archivo y el modo con que se generó.
  const [reviewed, setReviewed] = useState('')
  const current = `${fileName}|${mode}`
  const r = state.result

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Panel className="flex flex-col gap-4">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Cómo funciona</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <Button nativeButton={false} className="h-10" render={<a href="/admin/productos/exportar" download />}>
            <Download className="size-4" />
            Descargar productos actuales
          </Button>
          <Button variant="outline" nativeButton={false} className="h-10" render={<a href="/admin/productos/exportar?modelo" download />}>
            <FileSpreadsheet className="size-4" />
            Descargar modelo vacío
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Opciones/variantes en una celda: <code>40x40=12000 | 50x60=15000</code>. Publicado, promo y destacado: “si” o “no”.
        </p>
      </Panel>

      <Panel className="lg:col-span-2">
        <form onSubmit={submitKeepingValues(action)} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold">¿Qué querés actualizar?</legend>
            {[
              { value: 'precios', label: 'Sólo precios', hint: 'Lo más seguro para actualizar la lista de precios. No crea ni borra productos.' },
              { value: 'todo', label: 'Todo', hint: 'Actualiza todos los datos y crea los productos nuevos de la planilla.' },
            ].map((o) => (
              <label
                key={o.value}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  mode === o.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  value={o.value}
                  checked={mode === o.value}
                  onChange={() => setMode(o.value as 'todo' | 'precios')}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/40 hover:border-primary/50">
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium">{fileName || 'Elegí la planilla .csv'}</span>
            <span className="text-xs text-muted-foreground">Hasta 2 MB</span>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
          </label>

          {r && (
            <div className={cn('flex flex-col gap-3 rounded-lg border p-4', state.applied ? 'border-whatsapp/40 bg-whatsapp/5' : 'border-border bg-muted/40')}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {state.applied && <CheckCircle2 className="size-4 text-whatsapp" />}
                {state.applied ? 'Cambios aplicados' : 'Vista previa: todavía no se cambió nada'}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {[
                  { label: 'Nuevos', value: r.created.length },
                  { label: 'Actualizados', value: r.updated.length },
                  { label: 'Sin cambios', value: r.unchanged },
                  { label: 'Con errores', value: r.errors.length },
                ].map((k) => (
                  <div key={k.label} className="rounded-md bg-card p-3">
                    <dt className="text-xs text-muted-foreground">{k.label}</dt>
                    <dd className="font-heading text-2xl font-bold tabular-nums">{k.value}</dd>
                  </div>
                ))}
              </dl>
              {r.newCategories.length > 0 && (
                <p className="text-sm">Categorías nuevas: {r.newCategories.join(', ')}</p>
              )}
              {[...r.created.map((n) => `Nuevo: ${n}`), ...r.updated.map((n) => `Actualizado: ${n}`)].length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-primary">Ver detalle</summary>
                  <ul className="mt-2 max-h-48 list-inside list-disc overflow-y-auto text-muted-foreground">
                    {r.created.map((n) => (
                      <li key={`c-${n}`}>Nuevo: {n}</li>
                    ))}
                    {r.updated.map((n) => (
                      <li key={`u-${n}`}>Actualizado: {n}</li>
                    ))}
                  </ul>
                </details>
              )}
              {r.errors.length > 0 && (
                <ul className="list-inside list-disc text-sm text-destructive">
                  {r.errors.slice(0, 10).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                  {r.errors.length > 10 && <li>…y {r.errors.length - 10} más</li>}
                </ul>
              )}
            </div>
          )}

          <FormMessage state={state} />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              name="apply"
              value="0"
              variant="outline"
              className="h-10 px-4"
              disabled={pending || !fileName}
              onClick={() => setReviewed(current)}
            >
              {pending ? 'Procesando…' : 'Revisar cambios'}
            </Button>
            <Button
              type="submit"
              name="apply"
              value="1"
              className="h-10 px-4"
              disabled={pending || !r || state.applied || reviewed !== current || r.created.length + r.updated.length === 0}
            >
              Aplicar cambios
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
