import { isOnPromotion } from '@/lib/catalog'
import type { Category, Product } from '@/lib/types'

/**
 * Buscador del catálogo: sin acentos, tolerante a errores de tipeo, por prefijo
 * ("purif" → purificador) y con sinónimos vía `product.tags`. Corre en el cliente.
 */

const STOPWORDS = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'para', 'con', 'y', 'a', 'en', 'un', 'una', 'por'])

/** Quita acentos carácter por carácter para que los índices coincidan con el texto original. */
export function normalize(text: string) {
  let out = ''
  for (const ch of text.toLowerCase()) {
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
    out += base.length === 1 ? base : ch
  }
  return out
}

function tokenize(query: string) {
  const tokens = normalize(query).split(/[^a-z0-9ñ]+/).filter(Boolean)
  const meaningful = tokens.filter((t) => !STOPWORDS.has(t))
  return meaningful.length ? meaningful : tokens
}

function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

const allowedTypos = (len: number) => (len >= 7 ? 2 : len >= 4 ? 1 : 0)

/** Unifica letras que suenan igual en castellano rioplatense: "clarabolla" ≈ "claraboya". */
function phonetic(word: string) {
  return word
    .replace(/h/g, '')
    .replace(/ll/g, 'y')
    .replace(/v/g, 'b')
    .replace(/z/g, 's')
    .replace(/c([ei])/g, 's$1')
    .replace(/qu/g, 'k')
    .replace(/c/g, 'k')
    .replace(/ñ/g, 'n')
}

function fuzzy(token: string, word: string, max: number) {
  const a = phonetic(token)
  const b = phonetic(word)
  return Math.min(
    distance(token, word.slice(0, token.length), max),
    distance(token, word, max),
    distance(a, b.slice(0, a.length), max),
    distance(a, b, max),
  )
}

type Field = { norm: string; words: string[]; weight: number }
export type IndexedProduct = { product: Product; categoryName: string; fields: Field[] }
export type SearchIndex = { items: IndexedProduct[]; vocabulary: string[] }

export function buildIndex(products: Product[], categories: Category[]): SearchIndex {
  const vocab = new Set<string>()
  const field = (text: string, weight: number): Field => {
    const norm = normalize(text)
    const words = norm.split(/[^a-z0-9ñ]+/).filter((w) => w.length > 1)
    words.forEach((w) => w.length > 2 && vocab.add(w))
    return { norm, words, weight }
  }
  const items = products.map((product) => {
    const categoryName = categories.find((c) => c.id === product.categoryId)?.name ?? ''
    return {
      product,
      categoryName,
      fields: [
        field(product.name, 4),
        field([...product.tags, ...product.variants.map((v) => v.name)].join(' '), 2.5),
        field(product.brand, 3),
        field([product.sku, ...product.variants.map((v) => v.sku)].filter(Boolean).join(' '), 4),
        field(Object.values(product.attributes).flat().join(' '), 2),
        field(categoryName, 2.5),
        field(product.description, 1),
      ],
    }
  })
  return { items, vocabulary: [...vocab] }
}

/**
 * `memo` guarda la distancia de cada palabra ya comparada: en un catálogo grande las mismas
 * palabras se repiten en miles de productos y comparar cada vez hacía lento el buscador.
 */
function tokenScore(token: string, fields: Field[], memo: Map<string, number>) {
  let best = 0
  for (const f of fields) {
    let s = 0
    const idx = f.norm.indexOf(token)
    if (idx !== -1) {
      const atWordStart = idx === 0 || !/[a-z0-9ñ]/.test(f.norm[idx - 1])
      s = f.weight * (atWordStart ? 3 : 1.2)
      if (f.words.includes(token)) s += f.weight
    } else {
      const max = allowedTypos(token.length)
      if (max > 0) {
        for (const w of f.words) {
          // Compara contra el prefijo para tolerar errores mientras se escribe.
          let d = memo.get(w)
          if (d === undefined) {
            d = fuzzy(token, w, max)
            memo.set(w, d)
          }
          if (d <= max) {
            s = Math.max(s, f.weight * (d === 1 ? 1.6 : 1))
          }
        }
      }
    }
    best = Math.max(best, s)
  }
  return best
}

export type Hit = { product: Product; categoryName: string; score: number }

export function search(index: SearchIndex, query: string): Hit[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const hits: Hit[] = []
  const memos = tokens.map(() => new Map<string, number>())
  const now = new Date()
  for (const item of index.items) {
    let total = 0
    let ok = true
    for (const [i, t] of tokens.entries()) {
      const s = tokenScore(t, item.fields, memos[i])
      if (s === 0) {
        ok = false
        break
      }
      total += s
    }
    if (!ok) continue
    if (item.product.featured) total += 0.5
    if (isOnPromotion(item.product, now)) total += 0.3
    if (item.product.stock === 'sin_stock') total -= 1
    hits.push({ product: item.product, categoryName: item.categoryName, score: total })
  }
  return hits.sort((a, b) => b.score - a.score)
}

/** "¿Quisiste decir…?" cuando no hay resultados. */
export function correction(index: SearchIndex, query: string): string | null {
  const tokens = tokenize(query)
  let changed = false
  const fixed = tokens.map((t) => {
    if (index.vocabulary.includes(t)) return t
    let best: string | null = null
    let bestD = allowedTypos(t.length) + 1
    for (const w of index.vocabulary) {
      const d = fuzzy(t, w, bestD - 1)
      if (d < bestD) {
        bestD = d
        best = w
      }
    }
    if (best) changed = true
    return best ?? t
  })
  if (!changed) return null
  const candidate = fixed.join(' ')
  return search(index, candidate).length ? candidate : null
}

export function matchCategories(categories: Category[], query: string) {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  return categories.filter((c) => {
    const words = normalize(`${c.name} ${c.description}`).split(/[^a-z0-9ñ]+/)
    return tokens.every((t) =>
      words.some((w) => w.startsWith(t) || (t.length >= 4 && fuzzy(t, w, 1) <= 1)),
    )
  })
}

/** Parte un texto en segmentos resaltados según la búsqueda (exactos y por prefijo). */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const tokens = tokenize(query).filter((t) => t.length > 1)
  if (!tokens.length) return [{ text, match: false }]
  const norm = normalize(text)
  const marks = new Array<boolean>(text.length).fill(false)
  for (const t of tokens) {
    let from = 0
    let idx: number
    while ((idx = norm.indexOf(t, from)) !== -1) {
      for (let i = idx; i < idx + t.length; i++) marks[i] = true
      from = idx + t.length
    }
  }
  const out: { text: string; match: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    const last = out.at(-1)
    if (last && last.match === marks[i]) last.text += text[i]
    else out.push({ text: text[i], match: marks[i] })
  }
  return out
}
