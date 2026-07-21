import { chromium, Browser, BrowserContext, Page } from 'playwright'
import type { BrowserIR } from '../ir/types.js'
import { ExplainEngine } from '../engines/explain.js'

export interface SessionOptions {
  headless?: boolean
  viewport?: { width: number; height: number }
  channel?: string
}

export class BrowserSession {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private explainEngine = new ExplainEngine()
  private options: SessionOptions

  constructor(options: SessionOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      viewport: options.viewport ?? { width: 1280, height: 720 },
      channel: options.channel,
    }
  }

  async start(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        ...(this.options.channel ? { channel: this.options.channel } : {}),
      })
    } catch {
      this.browser = await chromium.launch({
        headless: this.options.headless,
      })
    }

    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
    })

    this.page = await this.context.newPage()
  }

  async stop(): Promise<void> {
    if (this.page) await this.page.close().catch(() => {})
    if (this.context) await this.context.close().catch(() => {})
    if (this.browser) await this.browser.close().catch(() => {})

    this.page = null
    this.context = null
    this.browser = null
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Session not started')
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  }

  async explain(): Promise<BrowserIR> {
    if (!this.page) throw new Error('Session not started')
    const result = await this.explainEngine.explain(this.page)
    return result.ir
  }

  async click(ref: string): Promise<void> {
    if (!this.page) throw new Error('Session not started')

    // Extract ref number (e.g., "@e3" -> 3)
    const match = ref.match(/@e(\d+)/)
    if (!match) throw new Error(`Invalid ref format: ${ref}`)

    // Use a11y to find the element
    const targetIndex = parseInt(match[1]) - 1
    const element = await this.page.evaluate((idx) => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]'
      )
      const el = interactive[idx]
      if (!el) return null
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        name: (el as HTMLElement).innerText || el.getAttribute('aria-label') || '',
        index: idx,
      }
    }, targetIndex)

    if (!element) throw new Error(`Element ${ref} not found`)

    // Click using evaluate to avoid selector issues
    await this.page.evaluate((idx) => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]'
      )
      const el = interactive[idx]
      if (el) (el as HTMLElement).click()
    }, targetIndex)
  }

  async screenshot(): Promise<string> {
    if (!this.page) throw new Error('Session not started')
    const buffer = await this.page.screenshot({ type: 'png' })
    return buffer.toString('base64')
  }

  async safeEvaluate<T>(fn: () => T): Promise<T | null> {
    try {
      return await this.page!.evaluate(fn)
    } catch (err) {
      console.warn('page.evaluate failed:', (err as Error).message)
      return null
    }
  }

  async getTabs(): Promise<Array<{ title: string; url: string; active: boolean }>> {
    if (!this.context) throw new Error('Session not started')

    const pages = this.context.pages()
    return pages.map((p) => ({
      title: '',
      url: p.url(),
      active: p === this.page,
    }))
  }
}
