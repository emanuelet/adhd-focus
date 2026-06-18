import { runMigrations as migrate } from './run-migrations'

;(async () => {
  await migrate()
})()