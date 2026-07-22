import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { EmbeddingEngine } from './embedding-engine.js'
import { IntentClassifier } from './intent-classifier.js'
import type { SearchResult, SearchFilters, IntentCategory } from '../ir/search-types.js'

interface IndexedPage {
  id: string
  url: string
  domain: string
  title: string
  content: string
  embedding: string
  intent: string
  intent_confidence: number
  ir: string
  indexed_at: number
  last_accessed: number
  access_count: number
}

export class SemanticIndexer {
  private db: Database.Database
  private embeddingEngine: EmbeddingEngine
  private intentClassifier: IntentClassifier

  constructor(db: Database.Database) {
    this.db = db
    this.embeddingEngine = new EmbeddingEngine()
    this.intentClassifier = new IntentClassifier()
    this.ensureTables()
  }

  private ensureTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS semantic_pages (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding TEXT NOT NULL,
        intent TEXT NOT NULL,
        intent_confidence REAL NOT NULL,
        ir TEXT NOT NULL,
        indexed_at INTEGER NOT NULL,
        last_accessed INTEGER NOT NULL,
        access_count INTEGER DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_semantic_domain ON semantic_pages(domain);
      CREATE INDEX IF NOT EXISTS idx_semantic_url ON semantic_pages(url);
      CREATE INDEX IF NOT EXISTS idx_semantic_intent ON semantic_pages(intent);
    `)
  }

  async indexPage(page: {
    url: string
    title: string
    content: string
    ir: any
  }): Promise<string> {
    const id = randomUUID()
    let domain: string
    try {
      domain = new URL(page.url).hostname
    } catch {
      throw new Error(`Invalid URL: ${page.url}`)
    }
    const now = Date.now()

    const textToEmbed = `${page.title} ${page.content}`
    const embedding = await this.embeddingEngine.embed(textToEmbed)

    const intent = this.intentClassifier.classify(page.title + ' ' + page.content)
    const urlIntent = this.intentClassifier.classifyUrl(page.url)

    const finalIntent = intent.confidence > urlIntent.confidence ? intent : urlIntent

    const existing = this.db.prepare('SELECT id FROM semantic_pages WHERE url = ?').get(page.url) as any

    if (existing) {
      this.db.prepare(`
        UPDATE semantic_pages
        SET title = ?, content = ?, embedding = ?, intent = ?, intent_confidence = ?, ir = ?, last_accessed = ?
        WHERE url = ?
      `).run(
        page.title,
        page.content,
        JSON.stringify(embedding),
        finalIntent.category,
        finalIntent.confidence,
        JSON.stringify(page.ir),
        now,
        page.url
      )
      return existing.id
    }

    this.db.prepare(`
      INSERT INTO semantic_pages (id, url, domain, title, content, embedding, intent, intent_confidence, ir, indexed_at, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      page.url,
      domain,
      page.title,
      page.content,
      JSON.stringify(embedding),
      finalIntent.category,
      finalIntent.confidence,
      JSON.stringify(page.ir),
      now,
      now
    )

    return id
  }

  async search(query: string, options: SearchFilters & { limit?: number } = {}): Promise<SearchResult[]> {
    const { limit = 10, domain, intent, minScore = 0.1, maxAge } = options

    const queryEmbedding = await this.embeddingEngine.embed(query)

    let sql = 'SELECT * FROM semantic_pages'
    const params: any[] = []
    const conditions: string[] = []

    if (domain) {
      conditions.push('domain = ?')
      params.push(domain)
    }

    if (intent) {
      conditions.push('intent = ?')
      params.push(intent)
    }

    if (maxAge) {
      const cutoff = Date.now() - maxAge * 24 * 60 * 60 * 1000
      conditions.push('indexed_at >= ?')
      params.push(cutoff)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    const rows = this.db.prepare(sql).all(...params) as IndexedPage[]

    const results: SearchResult[] = []

    for (const row of rows) {
      const pageEmbedding = JSON.parse(row.embedding) as number[]
      const score = this.embeddingEngine.cosineSimilarity(queryEmbedding, pageEmbedding)

      if (score >= minScore) {
        this.db.prepare(`
          UPDATE semantic_pages SET last_accessed = ?, access_count = access_count + 1
          WHERE id = ?
        `).run(Date.now(), row.id)

        const intentResult = this.intentClassifier.classify(row.title + ' ' + row.content)

        results.push({
          id: row.id,
          url: row.url,
          title: row.title,
          snippet: row.content.substring(0, 200),
          score,
          intent: {
            category: row.intent as IntentCategory,
            keywords: intentResult.keywords,
            confidence: row.intent_confidence
          },
          ir: JSON.parse(row.ir),
          metadata: {
            crawledAt: row.indexed_at,
            lastIndexed: row.last_accessed,
            domain: row.domain,
            components: 0,
            links: 0
          }
        })
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async getStats(): Promise<{ totalPages: number; totalDomains: number; lastIndexed: number }> {
    const total = (this.db.prepare('SELECT COUNT(*) as count FROM semantic_pages').get() as any).count
    const domains = (this.db.prepare('SELECT COUNT(DISTINCT domain) as count FROM semantic_pages').get() as any).count
    const lastIndexed = (this.db.prepare('SELECT MAX(indexed_at) as ts FROM semantic_pages').get() as any).ts || 0

    return {
      totalPages: total,
      totalDomains: domains,
      lastIndexed
    }
  }

  async deletePage(url: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM semantic_pages WHERE url = ?').run(url)
    return result.changes > 0
  }

  async getPage(url: string): Promise<SearchResult | null> {
    const row = this.db.prepare('SELECT * FROM semantic_pages WHERE url = ?').get(url) as IndexedPage | undefined

    if (!row) return null

    const intentResult = this.intentClassifier.classify(row.title + ' ' + row.content)

    return {
      id: row.id,
      url: row.url,
      title: row.title,
      snippet: row.content.substring(0, 200),
      score: 1.0,
      intent: {
        category: row.intent as IntentCategory,
        keywords: intentResult.keywords,
        confidence: row.intent_confidence
      },
      ir: JSON.parse(row.ir),
      metadata: {
        crawledAt: row.indexed_at,
        lastIndexed: row.last_accessed,
        domain: row.domain,
        components: 0,
        links: 0
      }
    }
  }
}
