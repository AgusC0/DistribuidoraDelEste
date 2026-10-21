'use client'

import { useState, useTransition } from 'react'
import { BadgePercent, Eye, EyeOff, Percent, Star, StarOff, Tag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmButton, inputClass } from '@/components/admin/ui'
import { adjustPrices, bulkUpdateProducts, type BulkOperation } from '@/app/admin/actions'
import { flattenCategories } from '@/lib/catalog'
import { STOCK_LABEL } from '@/lib/site'
import { cn } from '@/lib/utils'
import type { Category, StockStatus } from '@/lib/types'

const plural = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

/** Barra que aparece al seleccionar productos: todo lo que se puede hacer de a muchos. */
export function BulkBar({ ids, categories, onClear }: { ids: string[]; categories: Category[]; onClear: () => void }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState('')
  const [panel, setPanel] = useState<'promo' | 'precios' | null>(null)
  const [promoPercent, setPromoPercent] = useState('')
  const [promoEnds, setPromoEnds] = useState('')
  const [promoLimited, setPromoLimited] = useState(false)
  const [percent, setPercent] = useState('')

  function run(op: BulkOperation, done: string) {
    start(async () => {
      const n = await bulkUpdateProducts(ids, op)
      setMessage(`${plural(n)}: ${done}.`)
      if (op.type === 'delete') onClear()
      setPanel(null)
    })
  }

  const chip = 'h-8 px-3'
  const selectClass = cn(inputClass, 'h-8 w-auto py-0 text-sm')

  return (
    <div className={cn('flex flex-col gap-3 border-b border-border bg-accent/10 px-4 py-3 text-sm', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-semibold">{ids.length} seleccionado(s)</span>
        <Button variant="outline" size="sm" className={chip} disabled={pending} onClick={() => run({ type: 'active', value: true }, 'publicados')}>
          <Eye className="size-4" />
          Publicar
        </Button>
        <Button variant="outline" size="sm" className={chip} disabled={pending} onClick={() => run({ type: 'active', value: false }, 'ocultos')}>
          <EyeOff className="size-4" />
          Ocultar
        </Button>
        <Button variant="outline" size="sm" className={chip} disabled={pending} onClick={() => run({ type: 'featured', value: true }, 'destacados')}>
          <Star className="size-4" />
          Destacar
        </Button>
        <Button variant="outline" size="sm" className={chip} disabled={pending} onClick={() => run({ type: 'featured', value: false }, 'sin destacar')}>
          <StarOff className="size-4" />
          Quitar destacado
        </Button>
        <select
          value=""
          disabled={pending}
          onChange={(e) => e.target.value && run({ type: 'stock', value: e.target.value as StockStatus }, `stock "${STOCK_LABEL[e.target.value as StockStatus]}"`)}
          aria-label="Cambiar stock de los seleccionados"
          className={selectClass}
        >
          <option value="">Stock…</option>
          {(Object.keys(STOCK_LABEL) as StockStatus[]).map((s) => (
            <option key={s} value={s}>
              {STOCK_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value=""
          disabled={pending}
          onChange={(e) => {
            const c = categories.find((x) => x.id === e.target.value)
            if (c) run({ type: 'category', categoryId: c.id }, `movidos a ${c.name}`)
          }}
          aria-label="Mover los seleccionados a otra categoría"
          className={cn(selectClass, 'max-w-48')}
        >
          <option value="">Mover a…</option>
          {flattenCategories(categories).map(({ category: c, depth }) => (
            <option key={c.id} value={c.id}>
              {'   '.repeat(depth - 1)}
              {depth > 1 ? '└ ' : ''}
              {c.name}
            </option>
          ))}
        </select>
        <Button
          variant={panel === 'promo' ? 'default' : 'outline'}
          size="sm"
          className={chip}
          aria-expanded={panel === 'promo'}
          onClick={() => setPanel(panel === 'promo' ? null : 'promo')}
        >
          <BadgePercent className="size-4" />
          Promoción
        </Button>
        <Button
          variant={panel === 'precios' ? 'default' : 'outline'}
          size="sm"
          className={chip}
          aria-expanded={panel === 'precios'}
          onClick={() => setPanel(panel === 'precios' ? null : 'precios')}
        >
          <Percent className="size-4" />
          Ajustar precios
        </Button>
        <ConfirmButton
          variant="ghost"
          size="sm"
          className={cn(chip, 'text-destructive hover:bg-destructive/10')}
          title={`¿Eliminar ${plural(ids.length)}?`}
          description="Se borran del catálogo y no se puede deshacer. Si sólo querés sacarlos del sitio, usá Ocultar."
          onConfirm={() => run({ type: 'delete' }, 'eliminados')}
        >
          <Trash2 className="size-4" />
          Eliminar
        </ConfirmButton>
        <Button variant="ghost" size="sm" className={cn(chip, 'ml-auto')} onClick={onClear}>
          <X className="size-4" />
          Deseleccionar
        </Button>
      </div>

      {panel === 'promo' && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault()
            const pct = Number(promoPercent.replace(',', '.')) || 0
            run(
              { type: 'promo_on', percent: pct, endsAt: promoEnds || null, limitedStock: promoLimited },
              pct ? `en promo con ${pct}% OFF` : 'en promo',
            )
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Descuento</span>
            <span className="relative">
              <input
                value={promoPercent}
                onChange={(e) => setPromoPercent(e.target.value)}
                inputMode="numeric"
                placeholder="15"
                className={cn(inputClass, 'h-9 w-24 pr-7')}
              />
              <Percent aria-hidden="true" className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Termina (opcional)</span>
            <input type="date" value={promoEnds} onChange={(e) => setPromoEnds(e.target.value)} className={cn(inputClass, 'h-9 w-40')} />
          </label>
          <label className="flex h-9 items-center gap-2">
            <input type="checkbox" checked={promoLimited} onChange={(e) => setPromoLimited(e.target.checked)} className="size-4 accent-primary" />
            Hasta agotar stock
          </label>
          <Button type="submit" size="sm" className="h-9 px-4" disabled={pending}>
            <Tag className="size-4" />
            Poner en promo
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 px-4" disabled={pending} onClick={() => run({ type: 'promo_off' }, 'sin promo, con su precio de lista')}>
            Quitar promo
          </Button>
          <p className="basis-full text-xs text-muted-foreground">
            El descuento se aplica sobre el precio de lista (también a las variantes) y el precio anterior se muestra tachado. Sin % sólo se marcan como promo. Al
            quitar la promo vuelven a su precio de lista.
          </p>
        </form>
      )}

      {panel === 'precios' && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Number(percent.replace(',', '.'))
            if (!n) return
            start(async () => {
              await adjustPrices(ids, n)
              setMessage(`${plural(ids.length)}: precios ${n > 0 ? 'aumentados' : 'bajados'} ${Math.abs(n)}%.`)
              setPercent('')
              setPanel(null)
            })
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Porcentaje</span>
            <span className="relative">
              <input
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                inputMode="decimal"
                placeholder="+10 o -5"
                className={cn(inputClass, 'h-9 w-28 pr-7')}
              />
              <Percent aria-hidden="true" className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </span>
          </label>
          <Button type="submit" size="sm" className="h-9 px-4" disabled={pending || !percent}>
            Aplicar
          </Button>
          <p className="basis-full text-xs text-muted-foreground">Incluye las variantes y los precios anteriores de las promos. Se redondea a la decena.</p>
        </form>
      )}

      {message && (
        <p role="status" className="text-sm font-medium text-whatsapp">
          {message}
        </p>
      )}
    </div>
  )
}
