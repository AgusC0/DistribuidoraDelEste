// Aplica las migraciones pendientes de db/migrations (lo mismo que hace la app al arrancar).
// Uso en el servidor: `pnpm db:migrate` (lee DATABASE_URL del entorno o de .env.local).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/)
    if (m) process.env.DATABASE_URL = m[1].replace(/^['"]|['"]$/g, '')
  }
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL, { onnotice: () => {} })
const dir = path.join(process.cwd(), 'db', 'migrations')
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`
const done = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name))
let applied = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
  await sql.begin(async (tx) => {
    await tx.unsafe(readFileSync(path.join(dir, file), 'utf8'))
    await tx`INSERT INTO schema_migrations (name) VALUES (${file})`
  })
  console.log(`aplicada: ${file}`)
  applied++
}
console.log(applied ? `${applied} migración(es) aplicada(s).` : 'La base ya estaba al día.')
await sql.end()
