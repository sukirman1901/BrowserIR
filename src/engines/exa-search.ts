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

  async search(query: string, filters: SearchFilters & { limit?: number; autoCrawl?: boolean } = {}): Promise<SearchResult[]> {
    const { limit, autoCrawl = true, ...searchFilters } = filters
    const intent = this.intentClassifier.classify(query)

    const mergedFilters: SearchFilters = {
      ...searchFilters,
      intent: searchFilters.intent ?? (intent.confidence > 0.5 ? intent.category : undefined)
    }

    let results = await this.indexer.search(query, { ...mergedFilters, limit })

    // Auto-crawl if no results or index is empty
    if (autoCrawl && results.length === 0) {
      const stats = await this.indexer.getStats()
      
      if (stats.totalPages === 0) {
        // Index is empty - try to find and crawl relevant pages
        console.error('[BrowserIR] Index empty, attempting auto-crawl...')
        results = await this.autoCrawlAndSearch(query, limit)
      }
    }

    return results
  }

  private async autoCrawlAndSearch(query: string, limit?: number): Promise<SearchResult[]> {
    // Extract potential URLs from query
    const urlMatch = query.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      // User provided a URL directly
      const result = await this.crawlAndIndex(urlMatch[0])
      if (result) {
        return [result]
      }
    }

    // Try common documentation sites based on query keywords
    const searchDomains = this.getSearchDomains(query)
    const results: SearchResult[] = []

    for (const domain of searchDomains.slice(0, 2)) {
      try {
        const crawled = await this.crawlAndIndex(domain)
        if (crawled) {
          results.push(crawled)
        }
      } catch (error) {
        console.error(`Failed to crawl ${domain}:`, error)
      }
    }

    return results
  }

  private getSearchDomains(query: string): string[] {
    const lower = query.toLowerCase()
    const domains: string[] = []

    // Common documentation sites
    if (lower.includes('nextjs') || lower.includes('next.js')) {
      domains.push('https://nextjs.org/docs')
    }
    if (lower.includes('react')) {
      domains.push('https://react.dev/learn')
    }
    if (lower.includes('vue')) {
      domains.push('https://vuejs.org/guide')
    }
    if (lower.includes('angular')) {
      domains.push('https://angular.dev/overview')
    }
    if (lower.includes('svelte')) {
      domains.push('https://svelte.dev/docs')
    }
    if (lower.includes('typescript')) {
      domains.push('https://www.typescriptlang.org/docs')
    }
    if (lower.includes('node') || lower.includes('nodejs')) {
      domains.push('https://nodejs.org/docs')
    }
    if (lower.includes('python')) {
      domains.push('https://docs.python.org/3')
    }
    if (lower.includes('stripe') || lower.includes('payment')) {
      domains.push('https://docs.stripe.com')
    }
    if (lower.includes('vercel')) {
      domains.push('https://vercel.com/docs')
    }
    if (lower.includes('github')) {
      domains.push('https://docs.github.com')
    }

    // If no specific domain found, try a generic search
    if (domains.length === 0) {
      domains.push(`https://${query.replace(/\s+/g, '')}.com`)
    }

    return domains
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
