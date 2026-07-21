import type { Page, BrowserContext } from 'playwright'

export class StateManager {
  private context: BrowserContext
  
  constructor(context: BrowserContext) {
    this.context = context
  }
  
  async getCookies(): Promise<any[]> {
    return this.context.cookies()
  }
  
  async setCookie(name: string, value: string, domain?: string, path?: string): Promise<void> {
    await this.context.addCookies([{
      name,
      value,
      domain: domain || '',
      path: path || '/'
    }])
  }
  
  async clearCookies(): Promise<void> {
    await this.context.clearCookies()
  }
  
  async getLocalStorage(page: Page): Promise<Record<string, string>> {
    return page.evaluate(() => JSON.parse(JSON.stringify(localStorage)))
  }
  
  async setLocalStorage(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value])
  }
  
  async getSessionStorage(page: Page): Promise<Record<string, string>> {
    return page.evaluate(() => JSON.parse(JSON.stringify(sessionStorage)))
  }
  
  async setSessionStorage(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(([k, v]) => sessionStorage.setItem(k, v), [key, value])
  }
  
  async clearStorage(page: Page, type: 'local' | 'session' = 'local'): Promise<void> {
    await page.evaluate((t) => {
      if (t === 'local') localStorage.clear()
      else sessionStorage.clear()
    }, type)
  }
}
