'use client'

import { useActionState, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, FieldError, FormMessage, inputClass, Panel, SubmitButton } from '@/components/admin/ui'
import { deleteCategory, moveCategory, saveCategory, type FormState } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

function CategoryForm({ category, onDone }: { category?: Category; onDone?: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await saveCategory(prev, fd)
    if (result.ok) onDone?.()
    return result
  }, {})
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-1">
          <label htmlFor={`name-${category?.id ?? 'new'}`} className="text-xs font-medium text-muted-foreground">
            Nombre
          </label>
          <input
            id={`name-${category?.id ?? 'new'}`}
            name="name"
            defaultValue={category?.name}
            required
            aria-invalid={!!state.errors?.name}
            className={inputClass}
            placeholder="Ej: Tanques de agua"
          />
          <FieldError message={state.errors?.name} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`desc-${category?.id ?? 'new'}`} className="text-xs font-medium text-muted-foreground">
            Descripción breve (también ayuda al buscador)
          </label>
          <input
            id={`desc-${category?.id ?? 'new'}`}
            name="description"
            defaultValue={category?.description}
            className={inputClass}
            placeholder="Ej: Tanques tricapa y bicapa de 500 a 2750 litros"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>
          {category ? <Check className="size-4" /> : <Plus className="size-4" />}
          {category ? 'Guardar' : 'Agregar categoría'}
        </SubmitButton>
        {onDone && category && (
          <Button type="button" variant="ghost" className="h-10" onClick={onDone}>
            <X className="size-4" />
            Cancelar
          </Button>
        )}
        {!category && <FormMessage state={state} />}
      </div>
    </form>
  )
}

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <h2 className="mb-4 font-heading text-base font-semibold uppercase tracking-wide">Nueva categoría</h2>
        <CategoryForm />
      </Panel>

      <Panel className="p-0">
        {error && (
          <p role="alert" className="m-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <ul className="divide-y divide-border">
          {categories.map((c, i) => (
            <li key={c.id} className={cn('p-4', pending && 'opacity-70')}>
              {editing === c.id ? (
                <CategoryForm category={c} onDone={() => setEditing(null)} />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={i === 0}
                      aria-label={`Subir ${c.name}`}
                      onClick={() => start(() => moveCategory(c.id, -1))}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={i === categories.length - 1}
                      aria-label={`Bajar ${c.name}`}
                      onClick={() => start(() => moveCategory(c.id, 1))}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{c.description || 'Sin descripción'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums">
                    {counts[c.id] ?? 0} {counts[c.id] === 1 ? 'producto' : 'productos'}
                  </span>
                  <Button variant="ghost" size="icon" aria-label={`Editar ${c.name}`} onClick={() => setEditing(c.id)}>
                    <Pencil />
                  </Button>
                  <ConfirmButton
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${c.name}`}
                    className="text-destructive hover:bg-destructive/10"
                    title="¿Eliminar categoría?"
                    description={
                      counts[c.id]
                        ? `"${c.name}" tiene ${counts[c.id]} producto(s). Movelos a otra categoría antes de eliminarla.`
                        : `"${c.name}" se va a quitar de los filtros del sitio.`
                    }
                    onConfirm={async () => {
                      const r = await deleteCategory(c.id)
                      setError(r.ok ? '' : (r.message ?? ''))
                    }}
                  >
                    <Trash2 />
                  </ConfirmButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
