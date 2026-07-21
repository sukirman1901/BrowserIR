import type { Page, BrowserContext } from 'playwright'

export interface SecurityConfig {
  offlineMode: boolean
  allowedDomains: string[]
  maxOutput: number
  contentBoundaries: boolean
}

export class SecurityManager {
  private config: SecurityConfig
  
  constructor(context: BrowserContext, config: Partial<SecurityConfig> = {}) {
    this.config = {
      offlineMode: false,
      allowedDomains: [],
      maxOutput: 50000,
      contentBoundaries: false,
      ...config
    }
  }
  
  async setOffline(page: Page, offline: boolean): Promise<void> {
    await page.route('**/*', route => {
      if (offline) route.abort()
      else route.continue()
    })
  }
  
  async setHeaders(page: Page, headers: Record<string, string>): Promise<void> {
    await page.setExtraHTTPHeaders(headers)
  }
  
  async setCredentials(context: BrowserContext, username: string, password: string): Promise<void> {
    await context.setHTTPCredentials({ username, password })
  }
  
  isDomainAllowed(url: string): boolean {
    if (this.config.allowedDomains.length === 0) return true
    try {
      const hostname = new URL(url).hostname
      return this.config.allowedDomains.some(d => {
        if (d.startsWith('*.')) return hostname.endsWith(d.slice(1))
        return hostname === d
      })
    } catch {
      return false
    }
  }
  
  truncateOutput(text: string): string {
    if (text.length <= this.config.maxOutput) return text
    return text.slice(0, this.config.maxOutput) + '...[truncated]'
  }
  
  wrapContentBoundaries(text: string): string {
    if (!this.config.contentBoundaries) return text
    return `<content-boundary>\n${text}\n</content-boundary>`
  }
}
