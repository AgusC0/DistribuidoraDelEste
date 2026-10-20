import { promises as fs } from 'node:fs'
import path from 'node:path'
import { UPLOADS_DIR } from '@/lib/db'

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

/** Sirve las imágenes subidas desde el panel (no pueden ir a /public después del build). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const name = path.basename(file)
  const type = TYPES[path.extname(name).toLowerCase()]
  if (!type || name !== file) return new Response('Not found', { status: 404 })
  try {
    const data = await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name))
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
