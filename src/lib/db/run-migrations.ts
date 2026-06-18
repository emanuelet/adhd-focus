import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from '../db'

let ran = false

const dir = fileURLToPath(new URL('migrations', import.meta.url))

export async function runMigrations() {
  if (ran) {
    console.log('○ Migrations already ran this process, skipping')
    return
  }
  ran = true

  console.log('⟳ Checking database migrations...')

  await db`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ Migration tracking table ready')

  const applied = await db`SELECT name FROM _migrations ORDER BY name`
  const appliedSet = new Set(applied.map((r: any) => r.name))
  console.log(`○ ${appliedSet.size} migration(s) already applied`)

  const migrations = ['001_initial.sql']

  let count = 0
  for (const file of migrations) {
    const name = file.replace('.sql', '')
    if (appliedSet.has(name)) {
      console.log(`○ Skipping ${file} (already applied)`)
      continue
    }
    console.log(`→ Applying ${file}...`)
    const sql = readFileSync(join(dir, file), 'utf-8')
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
      console.log(`  · ${preview}...`)
      await db.unsafe(stmt)
    }
    await db`INSERT INTO _migrations (name) VALUES (${name})`
    console.log(`✓ ${file} applied (${statements.length} statement(s))`)
    count++
  }

  if (count === 0) {
    console.log('✓ All migrations up to date')
  } else {
    console.log(`✓ ${count} migration(s) applied`)
  }
}
