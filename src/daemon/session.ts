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
    const launchArgs = ['--disable-blink-features=AutomationControlled']
    try {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: launchArgs,
        ...(this.options.channel ? { channel: this.options.channel } : {}),
      })
    } catch {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: launchArgs,
      })
    }

    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
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

    const match = ref.match(/@e(\d+)/)
    if (!match) throw new Error(`Invalid ref format: ${ref}`)

    const targetIndex = parseInt(match[1]) - 1

    // Try to find element using a11y snapshot for semantic matching
    try {
      if (typeof (this.page as any).accessibility?.snapshot === 'function') {
        const snapshot = await (this.page as any).accessibility.snapshot({ interestingOnly: false })
        if (snapshot) {
          const interactive = this.collectInteractiveA11y(snapshot)
          if (targetIndex < interactive.length) {
            const target = interactive[targetIndex]
            // Try to click by a11y role + name selector
            const selector = `[role="${target.role}"][aria-label="${target.name}"]`
            const el = await this.page.$(selector)
            if (el) {
              await el.click()
              return
            }
          }
        }
      }
    } catch {}

    // Fallback: use DOM interactive elements
    const clicked = await this.page.evaluate((idx) => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"]'
      )
      const el = interactive[idx] as HTMLElement | undefined
      if (el) {
        el.click()
        return true
      }
      return false
    }, targetIndex)

    if (!clicked) throw new Error(`Element ${ref} not found`)
  }

  private collectInteractiveA11y(node: any): Array<{ role: string; name: string }> {
    const result: Array<{ role: string; name: string }> = []
    const interactiveRoles = new Set(['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab', 'menuitem'])
    
    if (node.role && interactiveRoles.has(node.role.toLowerCase())) {
      result.push({ role: node.role, name: node.name || '' })
    }
    
    for (const child of (node.children || [])) {
      result.push(...this.collectInteractiveA11y(child))
    }
    
    return result
  }

  async screenshot(): Promise<string> {
    if (!this.page) throw new Error('Session not started')
    const buffer = await this.page.screenshot({ type: 'png' })
    return buffer.toString('base64')
  }

  getPage(): Page | null {
    return this.page
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
