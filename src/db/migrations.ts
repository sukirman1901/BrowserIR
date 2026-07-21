// bir/src/db/migrations.ts
import type Database from 'better-sqlite3'

export function migrateDatabase(db: Database.Database): void {
  db.exec('PRAGMA journal_mode=WAL')
  db.exec('PRAGMA foreign_keys=ON')
}
