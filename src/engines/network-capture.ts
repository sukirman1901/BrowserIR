import type { Page, Route, Request } from 'playwright'

export interface NetworkEntry {
  method: string
  url: string
  status: number
  headers: Record<string, string>
  responseHeaders?: Record<string, string>
  bodySize?: number
  resourceType: string
  timestamp: number
  error?: string
}

export class NetworkCapture {
  private logs: NetworkEntry[] = []
  private capturing = false
  private patterns: string[] = []
  private page: Page
  
  constructor(page: Page) {
    this.page = page
  }
  
  async start(patterns: string[] = ['**/*']): Promise<void> {
    this.logs = []
    this.capturing = true
    this.patterns = patterns
    
    await this.page.route('**/*', async (route) => {
      const req = route.request()
      
      if (!this.matchesPatterns(req.url())) {
        await route.continue()
        return
      }
      
      const entry: NetworkEntry = {
        method: req.method(),
        url: req.url(),
        status: 0,
        headers: req.headers(),
        resourceType: req.resourceType(),
        timestamp: Date.now()
      }
      
      try {
        const resp = await route.fetch()
        entry.status = resp.status()
        entry.responseHeaders = resp.headers()
        entry.bodySize = (await resp.body()).length
        await route.fulfill({ status: resp.status(), headers: resp.headers(), body: await resp.body() })
      } catch (e: any) {
        entry.status = 0
        entry.error = e.message
        await route.continue()
      }
      
      this.logs.push(entry)
    })
  }
  
  async stop(): Promise<void> {
    this.capturing = false
    await this.page.unroute('**/*')
  }
  
  getLogs(): NetworkEntry[] {
    return [...this.logs]
  }
  
  getErrors(): NetworkEntry[] {
    return this.logs.filter(l => l.status >= 400 || l.error)
  }
  
  getRequestsByType(type: string): NetworkEntry[] {
    return this.logs.filter(l => l.resourceType === type)
  }
  
  private matchesPatterns(url: string): boolean {
    if (this.patterns.includes('**/*')) return true
    return this.patterns.some(p => {
      const regex = new RegExp('^' + p.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
      return regex.test(url)
    })
  }
}
