import { chromium, type Browser, type Page } from 'playwright'
import type { CrawlRequest, CrawlResult } from '../ir/search-types.js'

export interface CrawlerOptions {
  maxDepth?: number
  maxPages?: number
  rateLimit?: number
  respectRobots?: boolean
  userAgent?: string
}

interface RobotsRule {
  path: string
  allowed: boolean
}

export class WebCrawler {
  private options: Required<CrawlerOptions>
  private browser: Browser | null = null
  private robotsCache = new Map<string, RobotsRule[]>()
  private lastRequestTime = 0

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 3,
      maxPages: options.maxPages ?? 100,
      rateLimit: options.rateLimit ?? 1000,
      respectRobots: options.respectRobots ?? true,
      userAgent: options.userAgent ?? 'BrowserIR-Crawler/1.0'
    }
  }

  async start(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async crawl(url: string): Promise<CrawlResult> {
    if (!this.browser) await this.start()

    try {
      await this.rateLimit()
      
      const context = await this.browser!.newContext({
        userAgent: this.options.userAgent
      })
      const page = await context.newPage()
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      })

      const title = await page.title()
      const content = await page.evaluate(() => document.body.innerText)
      const links = await this.extractLinks(page, url)

      await context.close()

      return {
        url,
        title,
        content,
        links,
        ir: {},
        crawledAt: Date.now(),
        status: 'success'
      }
    } catch (error) {
      return {
        url,
        title: '',
        content: '',
        links: [],
        ir: {},
        crawledAt: Date.now(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async crawlBFS(startUrl: string): Promise<CrawlResult[]> {
    const results: CrawlResult[] = []
    const queue: CrawlRequest[] = [{ 
      url: startUrl, 
      depth: 0, 
      priority: 1, 
      discoveredAt: Date.now() 
    }]
    const visited = new Set<string>()

    while (queue.length > 0 && results.length < this.options.maxPages) {
      const request = queue.shift()!
      
      if (visited.has(request.url)) continue
      if (request.depth > this.options.maxDepth) continue
      
      visited.add(request.url)

      const result = await this.crawl(request.url)
      results.push(result)

      if (result.status === 'success') {
        for (const link of result.links) {
          if (!visited.has(link)) {
            queue.push({
              url: link,
              depth: request.depth + 1,
              priority: 1,
              discoveredAt: Date.now()
            })
          }
        }
      }
    }

    return results
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<string[]> {
    const base = new URL(baseUrl)
    
    return page.evaluate((hostname) => {
      const links: string[] = []
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href')
        if (href) {
          try {
            const url = new URL(href, window.location.origin)
            if (url.hostname === hostname) {
              links.push(url.href)
            }
          } catch {}
        }
      })
      return links
    }, base.hostname)
  }

  async canCrawl(url: string): Promise<boolean> {
    if (!this.options.respectRobots) return true

    const parsedUrl = new URL(url)
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`

    if (!this.robotsCache.has(robotsUrl)) {
      await this.fetchRobots(robotsUrl)
    }

    const rules = this.robotsCache.get(robotsUrl) || []
    const path = parsedUrl.pathname

    for (const rule of rules) {
      if (path.startsWith(rule.path)) {
        return rule.allowed
      }
    }

    return true
  }

  private async fetchRobots(robotsUrl: string): Promise<void> {
    try {
      const response = await fetch(robotsUrl)
      const text = await response.text()
      
      const rules: RobotsRule[] = []
      const lines = text.split('\n')
      
      let userAgentMatch = false
      for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('User-agent:')) {
          const agent = trimmed.split(':')[1]?.trim()
          userAgentMatch = agent === '*' || agent === this.options.userAgent
        }
        
        if (userAgentMatch) {
          if (trimmed.startsWith('Disallow:')) {
            const path = trimmed.split(':')[1]?.trim() || '/'
            rules.push({ path, allowed: false })
          }
          if (trimmed.startsWith('Allow:')) {
            const path = trimmed.split(':')[1]?.trim() || '/'
            rules.push({ path, allowed: true })
          }
        }
      }

      this.robotsCache.set(robotsUrl, rules)
    } catch {
      this.robotsCache.set(robotsUrl, [])
    }
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    
    if (elapsed < this.options.rateLimit) {
      await new Promise(resolve => 
        setTimeout(resolve, this.options.rateLimit - elapsed)
      )
    }
    
    this.lastRequestTime = Date.now()
  }
}
