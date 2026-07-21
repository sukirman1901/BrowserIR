import { chromium, Browser, BrowserContext, Page } from 'playwright'
import type { BrowserIR } from '../ir/types.js'
import { ExplainEngine } from '../engines/explain.js'
import { VisualDiffEngine, type VisualDiffResult } from '../engines/visual-diff.js'

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
  private visualDiffEngine = new VisualDiffEngine()
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
    const components = await this.getInteractiveComponents()
    if (targetIndex >= components.length) {
      throw new Error(`Element ${ref} not found (${components.length} interactive elements)`)
    }
    const target = components[targetIndex]

    // Try direct click strategies first
    try {
      // Strategy 1: a11y role + name
      const selector = `[role="${target.role}"][aria-label="${target.name}"]`
      const els = await this.page.$$(selector)
      if (els.length === 1) { await els[0].click(); return }
      if (els.length > targetIndex) { await els[targetIndex].click(); return }
    } catch {}

    try {
      // Strategy 2: text content
      const clicked = await this.page.evaluate((name) => {
        const els = document.querySelectorAll('button, a, input, [role="button"], [role="link"]')
        for (const el of els) {
          if (el.textContent?.trim() === name) { (el as HTMLElement).click(); return true }
        }
        return false
      }, target.name)
      if (clicked) return
    } catch {}

    // Try self-healing
    console.log(`Click failed for ${ref}, attempting self-healing...`)
    const healed = await this.healAndClick(target.name, target.role, targetIndex)
    if (healed) return

    throw new Error(`Element ${ref} (${target.name}) not clickable`)
  }

  private async healAndClick(targetName: string, targetType: string, targetIndex: number): Promise<boolean> {
    // Strategy 1: text match
    try {
      const clicked = await this.page!.evaluate((text) => {
        const els = document.querySelectorAll('button, a, input, [role="button"], [role="link"]')
        for (const el of els) {
          if (el.textContent?.includes(text)) { (el as HTMLElement).click(); return true }
        }
        return false
      }, targetName)
      if (clicked) return true
    } catch {}

    // Strategy 2: type match
    try {
      const roleMap: Record<string, string> = { button: 'button', link: 'link', field: 'textbox' }
      const role = roleMap[targetType] || targetType
      const el = await this.page!.$(`[role="${role}"]`)
      if (el) { await el.click(); return true }
    } catch {}

    // Strategy 3: position fallback
    try {
      const clicked = await this.page!.evaluate((idx) => {
        const els = document.querySelectorAll('button, a, input, [role="button"], [role="link"]')
        if (idx < els.length) { (els[idx] as HTMLElement).click(); return true }
        return false
      }, targetIndex)
      if (clicked) return true
    } catch {}

    return false
  }

  async getInteractiveComponents(): Promise<
    Array<{
      role: string
      name: string
      backendDOMNodeId?: number
      x?: number
      y?: number
      width?: number
      height?: number
    }>
  > {
    if (!this.page) throw new Error('Session not started')

    const interactiveRoles = new Set([
      'button', 'link', 'textbox', 'combobox', 'checkbox',
      'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'option', 'searchbox', 'spinbutton',
      'slider', 'scrollbar', 'treeitem',
    ])

    const components: Array<{
      role: string
      name: string
      backendDOMNodeId?: number
      x?: number
      y?: number
      width?: number
      height?: number
    }> = []

    try {
      const browser = this.page.context().browser()
      if (!browser) throw new Error('No browser')
      const cdp = await (browser as any).newBrowserCDPSession()

      // Enable accessibility domain
      await cdp.send('Accessibility.enable')
      const { nodes } = await cdp.send('Accessibility.getFullAXTree')

      const resolvePromises: Promise<void>[] = []

      for (const node of nodes) {
        const role = node.role?.value
        const name = node.name?.value
        if (role && interactiveRoles.has(role)) {
          const entry: {
            role: string
            name: string
            backendDOMNodeId?: number
            x?: number
            y?: number
            width?: number
            height?: number
          } = { role, name: name || '' }

          if (node.backendDOMNodeId) {
            entry.backendDOMNodeId = node.backendDOMNodeId
          }

          if (node.backendDOMNodeId) {
            resolvePromises.push(
              cdp.send('DOM.getBoxModel', { backendNodeId: node.backendDOMNodeId })
                .then((res: any) => {
                  const content = res.model.content
                  entry.x = (content[0] + content[2]) / 2
                  entry.y = (content[1] + content[5]) / 2
                  entry.width = Math.abs(content[2] - content[0])
                  entry.height = Math.abs(content[5] - content[1])
                })
                .catch(() => {})
            )
          }

          components.push(entry)
        }
      }

      await Promise.all(resolvePromises)
      await cdp.detach()
    } catch {}

    return components
  }

  async screenshot(): Promise<string> {
    if (!this.page) throw new Error('Session not started')
    return this.captureScreenshot()
  }

  async captureScreenshot(): Promise<string> {
    if (!this.page) throw new Error('Session not started')
    const buffer = await this.visualDiffEngine.captureScreenshot(this.page)
    return buffer.toString('base64')
  }

  async visualDiff(url1: string, url2: string): Promise<VisualDiffResult> {
    if (!this.page) throw new Error('Session not started')
    return this.visualDiffEngine.diffPage(this.page, url1, url2)
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

  async scroll(x: number = 0, y: number = 200): Promise<void> {
    if (!this.page) throw new Error('Session not started')
    await this.page.evaluate(([sx, sy]) => window.scrollTo(sx, sy), [x, y])
    await this.page.waitForTimeout(300)
  }

  async executeScript(code: string): Promise<any> {
    if (!this.page) throw new Error('Session not started')
    return this.page.evaluate(code)
  }

  async injectScript(script: string): Promise<void> {
    if (!this.context) throw new Error('Session not started')
    await this.context.addInitScript(script)
  }

  async openTab(url: string): Promise<void> {
    if (!this.context) throw new Error('Session not started')
    const page = await this.context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    this.page = page
  }
}
