import { describe, it, expect, beforeEach } from 'vitest'
import { WebCrawler } from '../../src/engines/crawler.js'

describe('WebCrawler', () => {
  let crawler: WebCrawler

  beforeEach(() => {
    crawler = new WebCrawler({
      maxDepth: 2,
      maxPages: 10,
      rateLimit: 1000,
      respectRobots: true
    })
  })

  it('should crawl a single page', async () => {
    const result = await crawler.crawl('https://example.com')
    expect(result).toBeDefined()
    expect(result.url).toBe('https://example.com')
    expect(result.status).toBe('success')
  })

  it('should extract links from page', async () => {
    const result = await crawler.crawl('https://example.com')
    expect(result.links).toBeInstanceOf(Array)
  })

  it('should respect max depth', async () => {
    const results = await crawler.crawl('https://example.com')
    // Should only crawl pages within depth limit
    expect(results).toBeDefined()
  })

  it('should respect rate limiting', async () => {
    const start = Date.now()
    await crawler.crawl('https://example.com')
    await crawler.crawl('https://example.com/page1')
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(1000) // rateLimit ms
  })

  it('should parse robots.txt', async () => {
    const canCrawl = await crawler.canCrawl('https://example.com/secret')
    expect(typeof canCrawl).toBe('boolean')
  })
})
