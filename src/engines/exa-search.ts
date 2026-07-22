import type Database from 'better-sqlite3'
import { SemanticIndexer } from './semantic-indexer.js'
import { IntentClassifier } from './intent-classifier.js'
import { WebCrawler } from './crawler.js'
import type { SearchResult, SearchFilters } from '../ir/search-types.js'

export interface ExaSearchOptions {
  crawlerOptions?: {
    maxDepth?: number
    maxPages?: number
    rateLimit?: number
  }
}

export class ExaSearch {
  private indexer: SemanticIndexer
  private intentClassifier: IntentClassifier
  private crawler: WebCrawler

  constructor(db: Database.Database, options: ExaSearchOptions = {}) {
    this.indexer = new SemanticIndexer(db)
    this.intentClassifier = new IntentClassifier()
    this.crawler = new WebCrawler({
      maxDepth: options.crawlerOptions?.maxDepth ?? 2,
      maxPages: options.crawlerOptions?.maxPages ?? 50,
      rateLimit: options.crawlerOptions?.rateLimit ?? 1000
    })
  }

  async search(query: string, filters: SearchFilters & { limit?: number } = {}): Promise<SearchResult[]> {
    const { limit, ...searchFilters } = filters
    const intent = this.intentClassifier.classify(query)

    const mergedFilters: SearchFilters = {
      ...searchFilters,
      intent: searchFilters.intent ?? (intent.confidence > 0.5 ? intent.category : undefined)
    }

    return this.indexer.search(query, { ...mergedFilters, limit })
  }

  async indexPage(page: {
    url: string
    title: string
    content: string
    ir: any
  }): Promise<string> {
    return this.indexer.indexPage(page)
  }

  async crawlAndIndex(url: string): Promise<SearchResult | null> {
    try {
      const crawlResult = await this.crawler.crawl(url)

      if (crawlResult.status === 'success') {
        await this.indexer.indexPage({
          url: crawlResult.url,
          title: crawlResult.title,
          content: crawlResult.content,
          ir: crawlResult.ir
        })

        return this.indexer.getPage(url)
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error)
    }

    return null
  }

  async crawlAndIndexBFS(startUrl: string): Promise<SearchResult[]> {
    try {
      const crawlResults = await this.crawler.crawlBFS(startUrl)
      const results: SearchResult[] = []

      for (const crawlResult of crawlResults) {
        if (crawlResult.status === 'success') {
          await this.indexer.indexPage({
            url: crawlResult.url,
            title: crawlResult.title,
            content: crawlResult.content,
            ir: crawlResult.ir
          })

          const page = await this.indexer.getPage(crawlResult.url)
          if (page) results.push(page)
        }
      }

      return results
    } catch (error) {
      console.error(`Failed to crawl ${startUrl} (BFS):`, error)
      return []
    }
  }

  async getStats(): Promise<{
    totalPages: number
    totalDomains: number
    lastIndexed: number
  }> {
    return this.indexer.getStats()
  }

  async getPage(url: string): Promise<SearchResult | null> {
    return this.indexer.getPage(url)
  }

  async deletePage(url: string): Promise<boolean> {
    return this.indexer.deletePage(url)
  }

  async stop(): Promise<void> {
    await this.crawler.stop()
  }
}
