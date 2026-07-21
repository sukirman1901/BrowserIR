// bir/src/db/index.ts
import Database from 'better-sqlite3'
import { SCHEMA_SQL, INDEXES_SQL } from './schema.js'
import { migrateDatabase } from './migrations.js'

export async function createDatabase(path: string = 'bir/data/bir.db'): Promise<Database.Database> {
  const db = new Database(path)
  migrateDatabase(db)
  db.exec(SCHEMA_SQL)
  db.exec(INDEXES_SQL)
  return db
}

export { SCHEMA_SQL, INDEXES_SQL } from './schema.js'
export { migrateDatabase } from './migrations.js'
