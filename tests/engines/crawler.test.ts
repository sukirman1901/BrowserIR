import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
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

  afterEach(async () => {
    await crawler.stop()
    vi.restoreAllMocks()
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
    result.links.forEach((link) => {
      expect(typeof link).toBe('string')
      expect(link).toMatch(/^https?:\/\//)
    })
  })

  it('should respect max depth', async () => {
    const shallowCrawler = new WebCrawler({
      maxDepth: 0,
      maxPages: 100,
      rateLimit: 0,
      respectRobots: false
    })
    const results = await shallowCrawler.crawlBFS('https://example.com')
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(1)
    expect(results[0].url).toBe('https://example.com')
  })

  it('should respect rate limiting', async () => {
    const start = Date.now()
    await crawler.crawl('https://example.com')
    await crawler.crawl('https://example.com/page1')
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(1000)
  })

  it('should parse robots.txt', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('User-agent: *\nDisallow: /secret\nAllow: /public')
    })
    vi.stubGlobal('fetch', mockFetch)

    const robotsCrawler = new WebCrawler({
      respectRobots: true,
      userAgent: 'BrowserIR-Crawler/1.0'
    })

    const canCrawlSecret = await robotsCrawler.canCrawl('https://example.com/secret')
    expect(canCrawlSecret).toBe(false)

    const canCrawlPublic = await robotsCrawler.canCrawl('https://example.com/public')
    expect(canCrawlPublic).toBe(true)
  })
})
