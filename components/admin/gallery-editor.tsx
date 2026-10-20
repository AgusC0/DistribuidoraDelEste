'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = { key: string; src: string; file?: File }

const MAX = 12
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']

/**
 * Galería de fotos del producto: subir varias, ordenar, elegir la principal y quitar.
 * Envía `imageOrder` (orden final) y los archivos nuevos en `newImages`.
 */
export function GalleryEditor({
  initial,
  error,
  onMainChange,
}: {
  initial: string[]
  error?: string
  onMainChange?: (src: string) => void
}) {
  const [items, setItems] = useState<Item[]>(() =>
    initial.filter((s) => s && !s.includes('placeholder')).map((src) => ({ key: src, src })),
  )
  const [dragging, setDragging] = useState(false)
  const [warning, setWarning] = useState('')
  const filesInput = useRef<HTMLInputElement>(null)

  const newFiles = items.filter((i) => i.file).map((i) => i.file!)

  // Mantiene el <input type="file"> oculto con todos los archivos nuevos, en el orden del token new:n.
  useEffect(() => {
    if (!filesInput.current) return
    const dt = new DataTransfer()
    newFiles.forEach((f) => dt.items.add(f))
    filesInput.current.files = dt.files
    onMainChange?.(items[0]?.src ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const order = items.map((i) => (i.file ? `new:${newFiles.indexOf(i.file)}` : i.src))

  function addFiles(list: FileList | null) {
    if (!list) return
    const valid = [...list].filter((f) => ACCEPT.includes(f.type) && f.size <= 4 * 1024 * 1024)
    setWarning(valid.length < list.length ? 'Algunas fotos se omitieron: deben ser JPG, PNG o WEBP de hasta 4 MB.' : '')
    setItems((current) =>
      [...current, ...valid.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, src: URL.createObjectURL(file), file }))].slice(0, MAX),
    )
  }

  function move(index: number, to: number) {
    setItems((list) => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="imageOrder" value={JSON.stringify(order)} />
      <input ref={filesInput} type="file" name="newImages" multiple className="hidden" tabIndex={-1} aria-hidden="true" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.key} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
            <Image src={item.src} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" unoptimized={item.src.startsWith('blob:')} />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-primary-foreground">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-foreground/70 to-transparent p-1.5 pt-6 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              {i > 0 && (
                <>
                  <button type="button" onClick={() => move(i, 0)} aria-label={`Hacer principal la foto ${i + 1}`} title="Hacer principal" className="flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground hover:bg-background">
                    <Star className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, i - 1)} aria-label={`Mover foto ${i + 1} a la izquierda`} className="flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground hover:bg-background">
                    <ArrowLeft className="size-3.5" />
                  </button>
                </>
              )}
              {i < items.length - 1 && (
                <button type="button" onClick={() => move(i, i + 1)} aria-label={`Mover foto ${i + 1} a la derecha`} className="flex size-7 items-center justify-center rounded-md bg-background/90 text-foreground hover:bg-background">
                  <ArrowRight className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setItems((list) => list.filter((x) => x.key !== item.key))}
                aria-label={`Quitar foto ${i + 1}`}
                className="flex size-7 items-center justify-center rounded-md bg-background/90 text-destructive hover:bg-background"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        {items.length < MAX && (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              addFiles(e.dataTransfer.files)
            }}
            className={cn(
              'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs text-muted-foreground transition-colors focus-within:ring-3 focus-within:ring-ring/40 hover:border-primary/50 hover:text-foreground',
              dragging ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <ImagePlus className="size-6" />
            <span className="px-2">{items.length ? 'Agregar fotos' : 'Subir fotos'}</span>
            <input
              type="file"
              accept={ACCEPT.join(',')}
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Hasta {MAX} fotos (JPG, PNG o WEBP, máx. 4 MB c/u). Arrastralas acá. La primera es la que se ve en el catálogo; ideal cuadradas
        y con fondo claro.
      </p>
      {(warning || error) && <p className="text-sm text-destructive">{error || warning}</p>}
    </div>
  )
}
