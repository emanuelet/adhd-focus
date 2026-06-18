import postgres from 'postgres'
import 'dotenv/config'

declare global {
  var _db: ReturnType<typeof postgres> | undefined
}

export const db = globalThis._db ?? postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

if (process.env.NODE_ENV !== 'production') globalThis._db = db
