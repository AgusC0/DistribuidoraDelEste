import { createReadStream, promises as fs } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { UPLOADS_DIR } from '@/lib/db'

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

const CACHE = 'public, max-age=31536000, immutable'

/**
 * Sirve las fotos y videos subidos desde el panel (no pueden ir a /public después del build).
 * Los videos se mandan por partes (Range): así arrancan enseguida y se pueden adelantar, y Safari los reproduce.
 */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const name = path.basename(file)
  const type = TYPES[path.extname(name).toLowerCase()]
  if (!type || name !== file) return new Response('Not found', { status: 404 })
  const full = path.join(/*turbopackIgnore: true*/ UPLOADS_DIR, name)
  let size: number
  try {
    size = (await fs.stat(full)).size
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') ?? '')
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    }
    const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream
    return new Response(stream, {
      status: 206,
      headers: {
        'Content-Type': type,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': CACHE,
      },
    })
  }

  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream
  return new Response(stream, {
    headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes', 'Cache-Control': CACHE },
  })
}
