import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface SelectorAttempt {
  id: string
  domain: string
  originalSelector: string
  healedSelector: string
  method: string
  success: boolean
  timestamp: number
}

export class SelectorHistory {
  private stmts: {
    insert: Database.Statement
    getSuccessful: Database.Statement
  }
  
  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(`
        INSERT INTO selector_history (id, domain, original_selector, healed_selector, method, success, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      getSuccessful: db.prepare(`
        SELECT healed_selector, COUNT(*) as count FROM selector_history 
        WHERE original_selector = ? AND success = 1 
        GROUP BY healed_selector ORDER BY count DESC LIMIT 5
      `)
    }
  }
  
  async record(domain: string, original: string, healed: string, method: string, success: boolean): Promise<void> {
    const id = randomUUID()
    this.stmts.insert.run(id, domain, original, healed, method, success ? 1 : 0, Date.now())
  }
  
  async findSuccessfulHeal(original: string): Promise<string | null> {
    const rows = this.stmts.getSuccessful.all(original) as any[]
    return rows.length > 0 ? rows[0].healed_selector : null
  }
}
