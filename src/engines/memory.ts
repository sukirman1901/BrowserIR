// bir/src/engines/memory.ts
import type Database from 'better-sqlite3'
import { createHash, randomUUID } from 'crypto'
import type { BrowserIR } from '../ir/types.js'
import type { WebsiteKnowledge, Issue } from '../ir/types.js'
import { BIRError, ErrorCode } from '../errors/index.js'

export interface MemoryEntry {
  id: string
  url: string
  domain: string
  irHash: string
  knowledge: WebsiteKnowledge
  confidence: number
  visitCount: number
  lastVisit: number
  firstVisit: number
}

export interface MemoryStats {
  totalEntries: number
  domains: number
  avgConfidence: number
  oldestEntry: number
  newestEntry: number
}

export class MemoryEngine {
  private stmts: {
    insert: Database.Statement
    getByHash: Database.Statement
    getById: Database.Statement
    getByDomain: Database.Statement
    updateVisit: Database.Statement
    updateKnowledge: Database.Statement
    addIssue: Database.Statement
    prune: Database.Statement
    count: Database.Statement
    domains: Database.Statement
    avgConfidence: Database.Statement
  }

  constructor(private db: Database.Database) {
    this.stmts = {
      insert: db.prepare(`
        INSERT INTO knowledge (id, domain, url_pattern, knowledge, confidence, visit_count, last_visit, first_visit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getByHash: db.prepare('SELECT * FROM knowledge WHERE url_pattern = ?'),
      getById: db.prepare('SELECT * FROM knowledge WHERE id = ?'),
      getByDomain: db.prepare('SELECT * FROM knowledge WHERE domain = ?'),
      updateVisit: db.prepare(`
        UPDATE knowledge SET visit_count = visit_count + 1, confidence = ?, last_visit = ? WHERE id = ?
      `),
      updateKnowledge: db.prepare('UPDATE knowledge SET knowledge = ? WHERE id = ?'),
      addIssue: db.prepare('SELECT knowledge FROM knowledge WHERE id = ?'),
      prune: db.prepare('DELETE FROM knowledge WHERE last_visit < ?'),
      count: db.prepare('SELECT COUNT(*) as count FROM knowledge'),
      domains: db.prepare('SELECT COUNT(DISTINCT domain) as count FROM knowledge'),
      avgConfidence: db.prepare('SELECT AVG(confidence) as avg FROM knowledge'),
    }
  }

  async remember(url: string, ir: BrowserIR): Promise<MemoryEntry> {
    let domain: string
    try {
      domain = new URL(url).hostname
    } catch {
      throw new BIRError(ErrorCode.INVALID_URL, `Invalid URL: ${url}`)
    }
    const irHash = this.hashIR(ir)
    const now = Date.now()

    const existing = this.stmts.getByHash.get(url) as any
    if (existing) {
      const newCount = existing.visit_count + 1
      const learningRate = 1 / newCount
      const newConfidence = existing.confidence + (1 - existing.confidence) * learningRate
      this.stmts.updateVisit.run(newConfidence, now, existing.id)
      return this.rowToEntry({ ...existing, visit_count: newCount, confidence: newConfidence, last_visit: now })
    }

    const id = `mem_${randomUUID()}`
    const knowledge: WebsiteKnowledge = {
      purpose: '',
      commonFlows: [],
      knownElements: [],
      preferences: {},
      issues: []
    }

    this.stmts.insert.run(id, domain, url, JSON.stringify(knowledge), 0.5, 1, now, now)
    return { id, url, domain, irHash, knowledge, confidence: 0.5, visitCount: 1, lastVisit: now, firstVisit: now }
  }

  async recall(url: string): Promise<MemoryEntry | null> {
    const row = this.stmts.getByHash.get(url) as any
    return row ? this.rowToEntry(row) : null
  }

  async recallByDomain(domain: string): Promise<MemoryEntry[]> {
    const rows = this.stmts.getByDomain.all(domain) as any[]
    return rows.map(r => this.rowToEntry(r))
  }

  async updateKnowledge(domain: string, knowledge: Partial<WebsiteKnowledge>): Promise<void> {
    const row = this.db.prepare('SELECT id, knowledge FROM knowledge WHERE domain = ? ORDER BY confidence DESC LIMIT 1').get(domain) as any
    if (!row) return
    const existing = JSON.parse(row.knowledge)
    const updated = { ...existing, ...knowledge }
    this.stmts.updateKnowledge.run(JSON.stringify(updated), row.id)
  }

  async addIssue(domain: string, issue: Issue): Promise<void> {
    const row = this.db.prepare('SELECT id, knowledge FROM knowledge WHERE domain = ? ORDER BY confidence DESC LIMIT 1').get(domain) as any
    if (!row) return
    const knowledge = JSON.parse(row.knowledge)
    knowledge.issues = knowledge.issues || []
    knowledge.issues.push(issue)
    this.stmts.updateKnowledge.run(JSON.stringify(knowledge), row.id)
  }

  async prune(maxAgeDays: number): Promise<number> {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    const result = this.stmts.prune.run(cutoff)
    return result.changes
  }

  async getStats(): Promise<MemoryStats> {
    const total = (this.stmts.count.get() as any).count
    const domains = (this.stmts.domains.get() as any).count
    const avg = (this.stmts.avgConfidence.get() as any).avg || 0
    const oldest = this.db.prepare('SELECT MIN(first_visit) as ts FROM knowledge').get() as any
    const newest = this.db.prepare('SELECT MAX(last_visit) as ts FROM knowledge').get() as any
    return {
      totalEntries: total,
      domains,
      avgConfidence: avg,
      oldestEntry: oldest?.ts || 0,
      newestEntry: newest?.ts || 0
    }
  }

  private hashIR(ir: BrowserIR): string {
    return createHash('sha256').update(JSON.stringify(ir)).digest('hex')
  }

  private rowToEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      url: row.url_pattern,
      domain: row.domain,
      irHash: '',
      knowledge: JSON.parse(row.knowledge),
      confidence: row.confidence,
      visitCount: row.visit_count,
      lastVisit: row.last_visit,
      firstVisit: row.first_visit
    }
  }
}
