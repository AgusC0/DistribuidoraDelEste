'use client'

import { useActionState, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Check, CornerDownRight, Pencil, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, FieldError, FormMessage, inputClass, Panel, SubmitButton } from '@/components/admin/ui'
import { deleteCategory, moveCategory, saveCategory, type FormState } from '@/app/admin/actions'
import {
  categoryPath,
  childCategories,
  descendantIds,
  effectiveFilters,
  flattenCategories,
  MAX_CATEGORY_DEPTH,
  rootCategories,
} from '@/lib/catalog'
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
  categories,
  defaultParent,
  onDone,
}: {
  category?: Category
  categories: Category[]
  defaultParent?: string
  onDone?: () => void
}) {
  const blocked = category ? descendantIds(categories, category.id) : new Set<string>()
  const parents = flattenCategories(categories).filter(({ category: c, depth }) => depth < MAX_CATEGORY_DEPTH && !blocked.has(c.id))
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
            <option value="">Rubro principal (nivel 1)</option>
            {parents.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>
                {'\u00a0\u00a0'.repeat(depth - 1)}Dentro de {categoryPath(categories, c.id).map((x) => x.name).join(' › ')}
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
      <div className="flex flex-col gap-1">
        <label htmlFor={`brands-${uid}`} className="text-xs font-medium text-muted-foreground">
          Marcas que trabajan (separadas por coma). Se muestran como accesos rápidos en la categoría.
        </label>
        <input
          id={`brands-${uid}`}
          name="brands"
          defaultValue={category?.brands?.join(', ')}
          className={inputClass}
          placeholder="Ej: FV, Mozart, Bayco"
        />
      </div>
      <details className="rounded-lg bg-muted/40 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Google (opcional): título y texto para aparecer en las búsquedas</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`seo-title-${uid}`} className="text-xs font-medium text-muted-foreground">
              Título para Google (hasta 60 caracteres, con la palabra clave primero). Vacío = automático.
            </label>
            <input
              id={`seo-title-${uid}`}
              name="seoTitle"
              maxLength={70}
              defaultValue={category?.seoTitle}
              className={inputClass}
              placeholder="Ej: Termotanques en Villa María"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`seo-text-${uid}`} className="text-xs font-medium text-muted-foreground">
              Texto para Google (se muestra debajo de los productos; un párrafo por línea). Vacío = automático.
            </label>
            <textarea
              id={`seo-text-${uid}`}
              name="seoText"
              rows={3}
              maxLength={1500}
              defaultValue={category?.seoText}
              className={cn(inputClass, 'h-auto py-2')}
              placeholder="Ej: Termotanques a gas, eléctricos y solares en Villa María…"
            />
          </div>
        </div>
      </details>
      {parentId ? (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Filtros (además de Marca, Precio y Disponibilidad). Si se deja vacío, usa los de la categoría de arriba.
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
  // La guía señala la primera fila (un rubro) y su primera subcategoría.
  const firstChild = roots[0] ? childCategories(categories, roots[0].id)[0] : undefined
  const indent = (depth: number) => (depth === 2 ? 'ml-8' : depth === 3 ? 'ml-16' : '')

  const row = (c: Category, siblings: Category[], i: number, depth: number) => {
    const isChild = depth > 1
    const children = childCategories(categories, c.id)
    const total = [...descendantIds(categories, c.id)].reduce((sum, id) => sum + (counts[id] ?? 0), 0)
    const inherited = isChild && !c.filters.length ? effectiveFilters(categories, c.id) : []
    const guideRow = c.id === roots[0]?.id
    const guideChild = c.id === firstChild?.id
    if (editing === c.id) {
      return (
        <div className={cn('rounded-lg bg-muted/40 p-4', indent(depth))}>
          <CategoryForm category={c} categories={categories} onDone={() => setEditing(null)} />
        </div>
      )
    }
    return (
      <div
        data-guide={guideRow ? 'cat-fila' : guideChild ? 'cat-subfila' : undefined}
        className={cn('flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40', indent(depth))}
      >
        <div className="flex flex-col" data-guide={guideRow ? 'cat-orden' : undefined}>
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
            <p className="truncate text-xs text-muted-foreground" data-guide={guideChild ? 'cat-filtros' : undefined}>
              Filtros:{' '}
              {c.filters.length
                ? c.filters.map((f) => f.label).join(', ')
                : inherited.length
                  ? `los de arriba (${inherited.map((f) => f.label).join(', ')})`
                  : 'sólo los generales'}
            </p>
          ) : (
            <p className="truncate text-sm text-muted-foreground">{c.description || 'Sin descripción'}</p>
          )}
        </div>
        <span
          data-guide={guideRow ? 'cat-cantidad' : undefined}
          className="hidden shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums sm:inline"
        >
          {total} {total === 1 ? 'producto' : 'productos'}
        </span>
        {depth < MAX_CATEGORY_DEPTH && (
          <Button
            variant="ghost"
            size="sm"
            data-guide={guideRow ? 'cat-sub' : undefined}
            className="h-8 text-primary"
            onClick={() => setAddingTo(addingTo === c.id ? null : c.id)}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Subcategoría</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" data-guide={guideRow ? 'cat-editar' : undefined} aria-label={`Editar ${c.name}`} onClick={() => setEditing(c.id)}>
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

  const renderBranch = (c: Category, siblings: Category[], i: number, depth: number): React.ReactNode => {
    const children = childCategories(categories, c.id)
    return (
      <>
        {row(c, siblings, i, depth)}
        {children.map((child, j) => (
          <div key={child.id} className="flex flex-col gap-1">
            {renderBranch(child, children, j, depth + 1)}
          </div>
        ))}
        {addingTo === c.id && (
          <div className={cn('rounded-lg bg-muted/40 p-4', indent(depth + 1))}>
            <CategoryForm categories={categories} defaultParent={c.id} onDone={() => setAddingTo(null)} />
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel data-guide="cat-nueva">
        <h2 className="font-heading text-base font-semibold uppercase tracking-wide">Nueva categoría</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Hasta 3 niveles: rubro → subcategoría → sub-subcategoría (Baño → Sanitarios → Inodoros). Cada una puede tener sus
          filtros o usar los de la categoría de arriba.
        </p>
        <CategoryForm categories={categories} />
      </Panel>

      <Panel data-guide="cat-arbol" className={cn('p-3', pending && 'opacity-70')}>
        {error && (
          <p role="alert" className="m-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <ul className="flex flex-col divide-y divide-border">
          {roots.map((root, i) => (
            <li key={root.id} className="flex flex-col gap-1 py-3">
              {renderBranch(root, roots, i, 1)}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
