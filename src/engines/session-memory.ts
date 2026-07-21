import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type { BrowserIR } from '../ir/types.js'

export interface SemanticPattern {
  id: string
  domain: string
  urlPattern: string
  intent: string
  components: Array<{ type: string; label: string; selector: string }>
  flows: Array<{ name: string; steps: string[] }>
  confidence: number
  visitCount: number
  lastVisit: number
  firstVisit: number
}

export interface SessionSnapshot {
  id: string
  domain: string
  url: string
  ir: BrowserIR
  timestamp: number
}

export class SessionMemory {
  private stmts: {
    insertPattern: Database.Statement
    getPatternByDomain: Database.Statement
    updatePattern: Database.Statement
    insertSnapshot: Database.Statement
    getSnapshots: Database.Statement
    getLatestSnapshot: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insertPattern: db.prepare(`
        INSERT INTO session_memory (id, domain, url_pattern, intent, components, flows, confidence, visit_count, last_visit, first_visit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getPatternByDomain: db.prepare('SELECT * FROM session_memory WHERE domain = ? ORDER BY confidence DESC LIMIT 1'),
      updatePattern: db.prepare(`
        UPDATE session_memory SET visit_count = visit_count + 1, confidence = ?, last_visit = ? WHERE id = ?
      `),
      insertSnapshot: db.prepare(`
        INSERT INTO session_snapshots (id, domain, url, ir, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `),
      getSnapshots: db.prepare('SELECT * FROM session_snapshots WHERE domain = ? ORDER BY timestamp DESC LIMIT ?'),
      getLatestSnapshot: db.prepare('SELECT * FROM session_snapshots WHERE domain = ? ORDER BY timestamp DESC LIMIT 1')
    }
  }

  async rememberPattern(domain: string, ir: BrowserIR): Promise<SemanticPattern> {
    const existing = this.stmts.getPatternByDomain.get(domain) as any

    if (existing) {
      const newCount = existing.visit_count + 1
      const learningRate = 1 / newCount
      const newConfidence = existing.confidence + (1 - existing.confidence) * learningRate
      this.stmts.updatePattern.run(newConfidence, Date.now(), existing.id)
      return this.rowToPattern({ ...existing, visit_count: newCount, confidence: newConfidence })
    }

    const id = `pat_${randomUUID()}`
    const components = ir.page.sections.flatMap(s => s.components).map(c => ({
      type: c.type,
      label: c.label,
      selector: c.evidence[0]?.selector || c.id
    }))
    const flows = ir.page.intent.flow.map(f => ({
      name: f.action,
      steps: [f.action]
    }))

    this.stmts.insertPattern.run(
      id, domain, ir.page.url, ir.page.intent.category,
      JSON.stringify(components), JSON.stringify(flows),
      0.5, 1, Date.now(), Date.now()
    )

    return {
      id, domain, urlPattern: ir.page.url,
      intent: ir.page.intent.category, components, flows,
      confidence: 0.5, visitCount: 1,
      lastVisit: Date.now(), firstVisit: Date.now()
    }
  }

  async recallPattern(domain: string): Promise<SemanticPattern | null> {
    const row = this.stmts.getPatternByDomain.get(domain) as any
    return row ? this.rowToPattern(row) : null
  }

  async saveSnapshot(domain: string, url: string, ir: BrowserIR): Promise<void> {
    const id = `snap_${randomUUID()}`
    this.stmts.insertSnapshot.run(id, domain, url, JSON.stringify(ir), Date.now())
  }

  async getSnapshots(domain: string, limit: number = 10): Promise<SessionSnapshot[]> {
    const rows = this.stmts.getSnapshots.all(domain, limit) as any[]
    return rows.map(r => ({
      id: r.id, domain: r.domain, url: r.url,
      ir: JSON.parse(r.ir), timestamp: r.timestamp
    }))
  }

  async getLatestSnapshot(domain: string): Promise<SessionSnapshot | null> {
    const row = this.stmts.getLatestSnapshot.get(domain) as any
    if (!row) return null
    return {
      id: row.id, domain: row.domain, url: row.url,
      ir: JSON.parse(row.ir), timestamp: row.timestamp
    }
  }

  private rowToPattern(row: any): SemanticPattern {
    return {
      id: row.id, domain: row.domain, urlPattern: row.url_pattern,
      intent: row.intent, components: JSON.parse(row.components),
      flows: JSON.parse(row.flows), confidence: row.confidence,
      visitCount: row.visit_count, lastVisit: row.last_visit,
      firstVisit: row.first_visit
    }
  }
}
