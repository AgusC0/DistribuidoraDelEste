import { promises as fs } from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

/**
 * Conexión a PostgreSQL (DATABASE_URL). Un solo pool por proceso: en desarrollo Next recarga módulos,
 * así que se guarda en globalThis para no abrir conexiones de más.
 */
const shared = globalThis as typeof globalThis & { __ddeSql?: postgres.Sql; __ddeReady?: Promise<void> }

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Falta DATABASE_URL (ej: postgres://usuario:clave@localhost:5432/distribuidora). Ver .env.example.')
  return postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX) || 10,
    idle_timeout: 30,
    // Fechas como texto ISO y números grandes como number: así los tipos del dominio no cambian.
    types: {
      bigint: { to: 20, from: [20], parse: (v: string) => Number(v), serialize: (v: number) => String(v) },
      date: { to: 1082, from: [1082], parse: (v: string) => v, serialize: (v: string) => v },
    },
    transform: { undefined: null },
    onnotice: () => {},
  })
}

/** Pool de conexiones (se crea al primer uso, no al importar: así el build no exige DATABASE_URL). */
export function getSql(): postgres.Sql {
  return (shared.__ddeSql ??= createClient())
}

const MIGRATIONS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), 'db', 'migrations')

/** Aplica, en orden y una sola vez, los archivos .sql de db/migrations que todavía no corrieron. */
export async function runMigrations() {
  const sql = getSql()
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  const done = new Set((await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name))
  for (const file of files) {
    if (done.has(file)) continue
    const body = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    await sql.begin(async (tx) => {
      await tx.unsafe(body)
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`
    })
    console.log(`[db] migración aplicada: ${file}`)
  }
}

/**
 * Deja la base lista antes del primer uso: migraciones y datos iniciales (ajustes y categorías; sin productos).
 * Se ejecuta una vez por proceso.
 */
export function ensureReady(seed: () => Promise<void>) {
  return (shared.__ddeReady ??= (async () => {
    await runMigrations()
    await seed()
  })().catch((err) => {
    shared.__ddeReady = undefined
    throw err
  }))
}
