import type Database from 'better-sqlite3'
import type { BrowserIR } from '../ir/types.js'
import { randomUUID } from 'crypto'

export interface IndexedPage {
  id: string
  url: string
  domain: string
  title: string
  ir: BrowserIR
  indexedAt: number
  lastAccessed: number
  accessCount: number
}

export interface IndexStats {
  totalPages: number
  totalDomains: number
  lastIndexed: number
}

export class AutoIndexer {
  private db: Database.Database
  private autoIndexEnabled: boolean = true

  constructor(db: Database.Database) {
    this.db = db
    this.ensureTables()
  }

  private ensureTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS indexed_pages (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        ir TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        access_count INTEGER DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_indexed_domain ON indexed_pages(domain);
      CREATE INDEX IF NOT EXISTS idx_indexed_url ON indexed_pages(url);
    `)
  }

  async indexPage(url: string, title: string, ir: BrowserIR): Promise<string> {
    const domain = new URL(url).hostname
    const now = Date.now()
    
    // Check if already indexed
    const existing = this.db.prepare('SELECT * FROM indexed_pages WHERE url = ?').get(url) as any
    
    if (existing) {
      // Update existing
      this.db.prepare(`
        UPDATE indexed_pages SET title = ?, ir = ?, last_accessed = ?, access_count = access_count + 1
        WHERE url = ?
      `).run(title, JSON.stringify(ir), now, url)
      return existing.id
    }
    
    // Insert new
    const id = randomUUID()
    this.db.prepare(`
      INSERT INTO indexed_pages (id, url, domain, title, ir, indexed_at, last_accessed, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, url, domain, title, JSON.stringify(ir), now, now)
    
    return id
  }

  async getPage(url: string): Promise<IndexedPage | null> {
    const row = this.db.prepare('SELECT * FROM indexed_pages WHERE url = ?').get(url) as any
    if (!row) return null
    
    return {
      id: row.id,
      url: row.url,
      domain: row.domain,
      title: row.title,
      ir: JSON.parse(row.ir),
      indexedAt: row.indexed_at,
      lastAccessed: row.last_accessed,
      accessCount: row.access_count
    }
  }

  async getPagesByDomain(domain: string): Promise<IndexedPage[]> {
    const rows = this.db.prepare('SELECT * FROM indexed_pages WHERE domain = ? ORDER BY last_accessed DESC').all(domain) as any[]
    return rows.map(r => ({
      id: r.id,
      url: r.url,
      domain: r.domain,
      title: r.title,
      ir: JSON.parse(r.ir),
      indexedAt: r.indexed_at,
      lastAccessed: r.last_accessed,
      accessCount: r.access_count
    }))
  }

  async searchPages(query: string): Promise<IndexedPage[]> {
    const rows = this.db.prepare(`
      SELECT * FROM indexed_pages 
      WHERE title LIKE ? OR url LIKE ? 
      ORDER BY last_accessed DESC
    `).all(`%${query}%`, `%${query}%`) as any[]
    
    return rows.map(r => ({
      id: r.id,
      url: r.url,
      domain: r.domain,
      title: r.title,
      ir: JSON.parse(r.ir),
      indexedAt: r.indexed_at,
      lastAccessed: r.last_accessed,
      accessCount: r.access_count
    }))
  }

  async getRecentPages(limit: number = 10): Promise<IndexedPage[]> {
    const rows = this.db.prepare('SELECT * FROM indexed_pages ORDER BY last_accessed DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => ({
      id: r.id,
      url: r.url,
      domain: r.domain,
      title: r.title,
      ir: JSON.parse(r.ir),
      indexedAt: r.indexed_at,
      lastAccessed: r.last_accessed,
      accessCount: r.access_count
    }))
  }

  async getStats(): Promise<IndexStats> {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM indexed_pages').get() as any).count
    const domains = (this.db.prepare('SELECT COUNT(DISTINCT domain) as count FROM indexed_pages').get() as any).count
    const lastIndexed = (this.db.prepare('SELECT MAX(indexed_at) as ts FROM indexed_pages').get() as any).ts || 0
    
    return {
      totalPages: total,
      totalDomains: domains,
      lastIndexed
    }
  }

  setAutoIndex(enabled: boolean): void {
    this.autoIndexEnabled = enabled
  }

  isAutoIndexEnabled(): boolean {
    return this.autoIndexEnabled
  }

  async shouldIndex(url: string): Promise<boolean> {
    if (!this.autoIndexEnabled) return false
    
    // Don't index error pages or chrome pages
    if (url.startsWith('chrome://') || url.startsWith('about:')) return false
    
    // Check if recently indexed (within 5 minutes)
    const recent = this.db.prepare(`
      SELECT indexed_at FROM indexed_pages WHERE url = ? AND indexed_at > ?
    `).get(url, Date.now() - 5 * 60 * 1000) as any
    
    return !recent // Should index if not recently indexed
  }

  async cleanupOldPages(maxAgeDays: number = 30): Promise<number> {
    const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000)
    const result = this.db.prepare('DELETE FROM indexed_pages WHERE last_accessed < ?').run(cutoff)
    return result.changes
  }
}
