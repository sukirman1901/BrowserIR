import type { Page, BrowserContext } from 'playwright'

export class ScriptInjection {
  private context: BrowserContext
  
  constructor(context: BrowserContext) {
    this.context = context
  }
  
  async injectBeforeLoad(script: string): Promise<void> {
    await this.context.addInitScript(script)
  }
  
  async executeScript(page: Page, code: string): Promise<any> {
    return page.evaluate(code)
  }
  
  async blockResources(page: Page, patterns: string[]): Promise<void> {
    await page.route('**/*', async (route) => {
      const url = route.request().url()
      if (patterns.some(p => url.includes(p))) {
        await route.abort()
      } else {
        await route.continue()
      }
    })
  }
  
  async unblockResources(page: Page): Promise<void> {
    await page.unroute('**/*')
  }
}
