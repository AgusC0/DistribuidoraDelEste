'use client'

import { useActionState, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, CornerDownRight, Pencil, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, FieldError, FormMessage, inputClass, Panel, SubmitButton } from '@/components/admin/ui'
import { deleteCategory, moveCategory, saveCategory, type FormState } from '@/app/admin/actions'
import { childCategories, rootCategories } from '@/lib/catalog'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

const SUGGESTED = ['Tipo', 'Medida', 'Material', 'Color', 'Línea', 'Sistema', 'Instalación', 'Capacidad']

/** Editor de filtros de una categoría como chips (Tipo, Medida, Material…). */
function FiltersInput({ initial }: { initial: string[] }) {
  const [filters, setFilters] = useState(initial)
  const [input, setInput] = useState('')
  const add = (raw: string) => {
    const label = raw.trim()
    if (label && !filters.some((f) => f.toLowerCase() === label.toLowerCase())) setFilters((list) => [...list, label])
    setInput('')
  }
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="filters" value={JSON.stringify(filters)} />
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40">
        {filters.map((f) => (
          <span key={f} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {f}
            <button type="button" onClick={() => setFilters((list) => list.filter((x) => x !== f))} aria-label={`Quitar filtro ${f}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value.slice(0, -1)) : setInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(input)
            } else if (e.key === 'Backspace' && !input && filters.length) setFilters((list) => list.slice(0, -1))
          }}
          onBlur={() => input && add(input)}
          placeholder={filters.length ? '' : 'Ej: Tipo, Medida, Material'}
          aria-label="Agregar filtro"
          className="h-7 min-w-28 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {SUGGESTED.filter((sug) => !filters.includes(sug)).map((sug) => (
          <button
            key={sug}
            type="button"
            onClick={() => add(sug)}
            className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            + {sug}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryForm({
  category,
  roots,
  defaultParent,
  onDone,
}: {
  category?: Category
  roots: Category[]
  defaultParent?: string
  onDone?: () => void
}) {
  const [parentId, setParentId] = useState(category ? (category.parentId ?? '') : (defaultParent ?? ''))
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const result = await saveCategory(prev, fd)
    if (result.ok) onDone?.()
    return result
  }, {})
  const uid = category?.id ?? 'new'
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`name-${uid}`} className="text-xs font-medium text-muted-foreground">
            Nombre
          </label>
          <input
            id={`name-${uid}`}
            name="name"
            defaultValue={category?.name}
            required
            aria-invalid={!!state.errors?.name}
            className={inputClass}
            placeholder="Ej: Cañerías"
          />
          <FieldError message={state.errors?.name} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`parent-${uid}`} className="text-xs font-medium text-muted-foreground">
            Ubicación
          </label>
          <select
            id={`parent-${uid}`}
            name="parentId"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">Rubro principal</option>
            {roots
              .filter((r) => r.id !== category?.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  Subcategoría de {r.name}
                </option>
              ))}
          </select>
          <FieldError message={state.errors?.parentId} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`desc-${uid}`} className="text-xs font-medium text-muted-foreground">
          Descripción breve (se muestra arriba del listado y ayuda al buscador)
        </label>
        <input
          id={`desc-${uid}`}
          name="description"
          defaultValue={category?.description}
          className={inputClass}
          placeholder="Ej: Caños, conexiones y accesorios para agua y desagüe."
        />
      </div>
      {parentId ? (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Filtros de esta subcategoría (además de Marca, Precio y Disponibilidad, que están siempre)
          </span>
          <FiltersInput initial={category?.filters.map((f) => f.label) ?? []} />
        </div>
      ) : (
        <input type="hidden" name="filters" value="[]" />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton>
          {category ? <Check className="size-4" /> : <Plus className="size-4" />}
          {category ? 'Guardar' : 'Agregar'}
        </SubmitButton>
        {onDone && (
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
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const roots = rootCategories(categories)

  const row = (c: Category, siblings: Category[], i: number, isChild: boolean) => {
    const children = childCategories(categories, c.id)
    const total = (counts[c.id] ?? 0) + children.reduce((s, ch) => s + (counts[ch.id] ?? 0), 0)
    if (editing === c.id) {
      return (
        <div className={cn('rounded-lg bg-muted/40 p-4', isChild && 'ml-8')}>
          <CategoryForm category={c} roots={roots} onDone={() => setEditing(null)} />
        </div>
      )
    }
    return (
      <div className={cn('flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40', isChild && 'ml-8')}>
        <div className="flex flex-col">
          <Button variant="ghost" size="icon-xs" disabled={i === 0} aria-label={`Subir ${c.name}`} onClick={() => start(() => moveCategory(c.id, -1))}>
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={i === siblings.length - 1}
            aria-label={`Bajar ${c.name}`}
            onClick={() => start(() => moveCategory(c.id, 1))}
          >
            <ArrowDown />
          </Button>
        </div>
        {isChild && <CornerDownRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <p className={cn('text-foreground', isChild ? 'font-medium' : 'font-heading text-base font-semibold uppercase tracking-wide')}>
            {c.name}
          </p>
          {isChild ? (
            <p className="truncate text-xs text-muted-foreground">
              Filtros: {c.filters.length ? c.filters.map((f) => f.label).join(', ') : 'sólo los generales'}
            </p>
          ) : (
            <p className="truncate text-sm text-muted-foreground">{c.description || 'Sin descripción'}</p>
          )}
        </div>
        <span className="hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums sm:inline">
          {total} {total === 1 ? 'producto' : 'productos'}
        </span>
        {!isChild && (
          <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => setAddingTo(addingTo === c.id ? null : c.id)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Subcategoría</span>
          </Button>
        )}
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
            children.length
              ? `"${c.name}" tiene ${children.length} subcategoría(s). Movelas o eliminalas antes.`
              : counts[c.id]
                ? `"${c.name}" tiene ${counts[c.id]} producto(s). Movelos a otra categoría antes de eliminarla.`
                : `"${c.name}" se va a quitar del sitio.`
          }
          onConfirm={async () => {
            const r = await deleteCategory(c.id)
            setError(r.ok ? '' : (r.message ?? ''))
          }}
        >
          <Trash2 />
        </ConfirmButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Nueva categoría</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Los rubros agrupan subcategorías (Baño → Griferías). Cada subcategoría define sus propios filtros.
        </p>
        <CategoryForm roots={roots} />
      </Panel>

      <Panel className={cn('p-3', pending && 'opacity-70')}>
        {error && (
          <p role="alert" className="m-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <ul className="flex flex-col divide-y divide-border">
          {roots.map((root, i) => {
            const children = childCategories(categories, root.id)
            return (
              <li key={root.id} className="flex flex-col gap-1 py-3">
                {row(root, roots, i, false)}
                {children.map((child, j) => (
                  <div key={child.id}>{row(child, children, j, true)}</div>
                ))}
                {addingTo === root.id && (
                  <div className="ml-8 rounded-lg bg-muted/40 p-4">
                    <CategoryForm roots={roots} defaultParent={root.id} onDone={() => setAddingTo(null)} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
