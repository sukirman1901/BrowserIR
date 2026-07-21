import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface SearchResult {
  id: string
  type: string
  title: string
  content: string
  score: number
  metadata: Record<string, any>
}

export interface SearchOptions {
  limit?: number
  type?: string
  minScore?: number
}

export class SemanticSearch {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
    this.ensureTables()
  }

  private ensureTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS search_embeddings (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB,
        metadata TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_search_type ON search_embeddings(type);
      CREATE INDEX IF NOT EXISTS idx_search_title ON search_embeddings(title);
    `)
  }

  async indexDocument(type: string, title: string, content: string, metadata: Record<string, any> = {}): Promise<string> {
    const id = randomUUID()
    const embedding = this.generateSimpleEmbedding(content)
    
    this.db.prepare(`
      INSERT INTO search_embeddings (id, type, title, content, embedding, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, title, content, embedding, JSON.stringify(metadata), Date.now())
    
    return id
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 10, type, minScore = 0.1 } = options
    
    // BM25-style text search
    const queryLower = query.toLowerCase()
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2)
    
    let sql = 'SELECT * FROM search_embeddings'
    const params: any[] = []
    
    if (type) {
      sql += ' WHERE type = ?'
      params.push(type)
    }
    
    const rows = this.db.prepare(sql).all(...params) as any[]
    
    // Score each result
    const scored = rows.map(row => {
      const titleLower = row.title.toLowerCase()
      const contentLower = row.content.toLowerCase()
      
      let score = 0
      
      // Title match (high weight)
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 0.4
      }
      
      // Content match (medium weight)
      for (const term of queryTerms) {
        if (contentLower.includes(term)) score += 0.2
      }
      
      // Exact match bonus
      if (titleLower === queryLower) score += 0.3
      if (contentLower.includes(queryLower)) score += 0.2
      
      // Length penalty (prefer shorter, more relevant docs)
      const lengthPenalty = Math.min(row.content.length / 10000, 0.3)
      score -= lengthPenalty
      
      return {
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content.substring(0, 500),
        score: Math.max(0, Math.min(1, score)),
        metadata: JSON.parse(row.metadata || '{}')
      }
    })
    
    // Filter and sort
    return scored
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async getDocument(id: string): Promise<SearchResult | null> {
    const row = this.db.prepare('SELECT * FROM search_embeddings WHERE id = ?').get(id) as any
    if (!row) return null
    
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      score: 1.0,
      metadata: JSON.parse(row.metadata || '{}')
    }
  }

  async deleteDocument(id: string): Promise<void> {
    this.db.prepare('DELETE FROM search_embeddings WHERE id = ?').run(id)
  }

  async getStats(): Promise<{ total: number; byType: Record<string, number> }> {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM search_embeddings').get() as any).count
    const byType = this.db.prepare('SELECT type, COUNT(*) as count FROM search_embeddings GROUP BY type').all() as any[]
    
    return {
      total,
      byType: Object.fromEntries(byType.map(r => [r.type, r.count]))
    }
  }

  private generateSimpleEmbedding(content: string): Buffer {
    // Simple TF-based embedding (placeholder for real embeddings)
    const terms = content.toLowerCase().split(/\s+/)
    const embedding = new Float32Array(128)
    
    for (const term of terms) {
      const hash = this.hashString(term)
      const index = Math.abs(hash) % 128
      embedding[index] += 1
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }
    
    return Buffer.from(embedding.buffer)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return hash
  }
}
