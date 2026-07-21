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

  async getSuccessRate(selector: string): Promise<number> {
    const row = this.db.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful FROM selector_history WHERE original_selector = ?'
    ).get(selector) as any
    if (!row || row.total === 0) return 0
    return row.successful / row.total
  }

  async getTopSelectors(domain: string, limit: number = 10): Promise<Array<{selector: string; successRate: number; usageCount: number}>> {
    const rows = this.db.prepare(
      'SELECT original_selector as selector, COUNT(*) as usageCount, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as successRate FROM selector_history WHERE domain = ? GROUP BY original_selector ORDER BY successRate DESC, usageCount DESC LIMIT ?'
    ).all(domain, limit) as any[]
    return rows.map(r => ({
      selector: r.selector,
      successRate: r.successRate,
      usageCount: r.usageCount
    }))
  }

  async getPatterns(domain: string): Promise<Array<{pattern: string; frequency: number; successRate: number}>> {
    const rows = this.db.prepare(
      'SELECT original_selector as pattern, COUNT(*) as frequency, SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as successRate FROM selector_history WHERE domain = ? GROUP BY original_selector HAVING COUNT(*) > 1 ORDER BY frequency DESC'
    ).all(domain) as any[]
    return rows
  }
}
