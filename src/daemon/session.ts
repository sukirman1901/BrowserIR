import { chromium, Browser, BrowserContext, Page } from 'playwright'
import type { BrowserIR } from '../ir/types.js'
import { ExplainEngine } from '../engines/explain.js'
import { VisualDiffEngine, type VisualDiffResult } from '../engines/visual-diff.js'
import { ContentExtractor } from '../engines/content-extractor.js'
import type { ContentResult } from '../engines/content-types.js'
import { DocParser } from '../engines/doc-parser.js'
import type { DocStructure } from '../engines/doc-parser.js'
import { StealthManager } from '../engines/stealth-manager.js'
import type { StealthConfig } from '../engines/stealth-manager.js'

export interface SessionOptions {
  headless?: boolean
  viewport?: { width: number; height: number }
  channel?: string
}

interface CachedComponent {
  role: string
  name: string
  backendDOMNodeId?: number
  backendNodeId?: number
  x?: number
  y?: number
  width?: number
  height?: number
}

export class BrowserSession {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private explainEngine = new ExplainEngine()
  private visualDiffEngine = new VisualDiffEngine()
  private options: SessionOptions
  private cachedComponents: CachedComponent[] = []
  private lastIR: BrowserIR | null = null

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
    this.cachedComponents = []
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Session not started')
    this.cachedComponents = []
    this.lastIR = null
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
  }

  async explain(): Promise<BrowserIR> {
    if (!this.page) throw new Error('Session not started')
    const result = await this.explainEngine.explain(this.page)
    this.lastIR = result.ir
    // Cache components so click() uses the same list as explain()
    this.cachedComponents = await this.getInteractiveComponents()
    return result.ir
  }

  async click(ref: string): Promise<void> {
    if (!this.page) throw new Error('Session not started')

    const match = ref.match(/@e(\d+)/)
    if (!match) throw new Error(`Invalid ref format: ${ref}`)

    const targetIndex = parseInt(match[1]) - 1

    // Capture URL before click for navigation detection
    const urlBefore = this.page.url()

    // Strategy 0: Use backendNodeId from IR (most reliable — exact CDP node match)
    if (this.lastIR) {
      const allComponents = this.lastIR.page.sections.flatMap(s => s.components)
      const target = allComponents[targetIndex]
      if (target?.backendNodeId) {
        try {
          const cdp = await this.page.context().newCDPSession(this.page)
          // Get box model for exact coordinates
          const { model } = await cdp.send('DOM.getBoxModel', { backendNodeId: target.backendNodeId }) as any
          const x = (model.content[0] + model.content[2]) / 2
          const y = (model.content[1] + model.content[5]) / 2
          await this.page.mouse.click(x, y)
          await cdp.detach()
          const changed = await this.verifyClick(urlBefore)
          if (changed) return
        } catch (err) {
          console.log(`[BrowserSession] Strategy 0 (backendNodeId) failed:`, (err as Error).message)
        }
      }
    }

    // Use cached components from explain(), fallback to fresh fetch
    let components = this.cachedComponents
    if (components.length === 0) {
      console.log(`[BrowserSession] No cached components, fetching...`)
      components = await this.getInteractiveComponents()
      console.log(`[BrowserSession] Found ${components.length} interactive components`)
    }
    if (targetIndex >= components.length || targetIndex < 0) {
      throw new Error(`Element ${ref} not found (${components.length} interactive elements)`)
    }
    const target = components[targetIndex]
    console.log(`[BrowserSession] Clicking ${ref}: role=${target.role} name="${target.name}" x=${target.x} y=${target.y}`)

    // Strategy 1: CDP coordinates from cached components
    if (target.x != null && target.y != null) {
      try {
        await this.page.mouse.click(target.x, target.y)
        const changed = await this.verifyClick(urlBefore)
        if (changed) return
      } catch {}
    }

    // Strategy 2: text content match via page.evaluate (broad match)
    try {
      const clicked = await this.page.evaluate((name) => {
        const selectors = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="radio"]'
        const els = document.querySelectorAll(selectors)
        // Exact match first
        for (const el of els) {
          if (el.textContent?.trim() === name) {
            (el as HTMLElement).click()
            return true
          }
        }
        // Fallback: includes match
        for (const el of els) {
          if (el.textContent?.includes(name) && name.length > 0) {
            (el as HTMLElement).click()
            return true
          }
        }
        return false
      }, target.name)
      if (clicked) return
    } catch {}

    // Strategy 3: aria-label or role-based selector
    try {
      const selectors: string[] = []
      if (target.name) {
        selectors.push(`[aria-label="${target.name}"]`)
        selectors.push(`[aria-labelledby]`)
      }
      const roleMap: Record<string, string> = {
        button: 'button',
        link: 'a',
        field: 'input, textarea',
        textbox: 'input, textarea',
        combobox: 'select',
        checkbox: '[role="checkbox"], input[type="checkbox"]',
        radio: '[role="radio"], input[type="radio"]',
        switch: '[role="switch"], input[type="checkbox"]',
        menuitem: '[role="menuitem"]',
        tab: '[role="tab"]',
        option: 'option',
      }
      const tagSelector = roleMap[target.role]
      if (tagSelector) selectors.push(tagSelector)

      for (const sel of selectors) {
        const els = await this.page.$$(sel)
        if (els.length === 1) {
          await els[0].click()
          return
        }
        if (els.length > targetIndex) {
          await els[targetIndex].click()
          return
        }
      }
    } catch {}

    // Strategy 4: self-healing (last resort)
    console.log(`Click failed for ${ref}, attempting self-healing...`)
    const healed = await this.healAndClick(target.name, target.role, targetIndex)
    if (healed) return

    throw new Error(`Element ${ref} (${target.name || target.role}) not clickable`)
  }

  private async verifyClick(urlBefore: string): Promise<boolean> {
    // Wait briefly for page to react
    await this.page!.waitForTimeout(500).catch(() => {})
    // Check if URL changed (navigation happened)
    if (this.page!.url() !== urlBefore) return true
    // Check if DOM changed (content mutation)
    try {
      const hasNewContent = await this.page!.evaluate(() => {
        return document.readyState === 'complete' || document.readyState === 'interactive'
      })
      return hasNewContent
    } catch {
      return false
    }
  }

  private async healAndClick(targetName: string, targetType: string, targetIndex: number): Promise<boolean> {
    // Strategy 1: text includes match
    try {
      const clicked = await this.page!.evaluate((text) => {
        const selectors = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
        const els = document.querySelectorAll(selectors)
        for (const el of els) {
          if (el.textContent?.includes(text)) { (el as HTMLElement).click(); return true }
        }
        return false
      }, targetName)
      if (clicked) return true
    } catch {}

    // Strategy 2: type-based selector with index
    try {
      const roleMap: Record<string, string> = {
        button: 'button, [role="button"]',
        link: 'a, [role="link"]',
        field: 'input, textarea, [role="textbox"]',
        textbox: 'input, textarea, [role="textbox"]',
        combobox: 'select, [role="combobox"]',
        checkbox: 'input[type="checkbox"], [role="checkbox"]',
        radio: 'input[type="radio"], [role="radio"]',
        switch: 'input[type="checkbox"], [role="switch"]',
        menuitem: '[role="menuitem"]',
        tab: '[role="tab"]',
        option: 'option',
      }
      const selector = roleMap[targetType] || 'button, a, input'
      const els = await this.page!.$$(selector)
      if (els.length > targetIndex) {
        await els[targetIndex].click()
        return true
      }
      if (els.length === 1) {
        await els[0].click()
        return true
      }
    } catch {}

    // Strategy 3: position fallback (use cached coordinates)
    if (this.cachedComponents.length > targetIndex) {
      const cached = this.cachedComponents[targetIndex]
      if (cached.x != null && cached.y != null) {
        try {
          await this.page!.mouse.click(cached.x, cached.y)
          return true
        } catch {}
      }
    }

    // Strategy 4: sequential position fallback (nth interactive element)
    try {
      const clicked = await this.page!.evaluate((idx) => {
        const selectors = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
        const els = document.querySelectorAll(selectors)
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
      // Use page-level CDP session (supports Accessibility domain)
      const cdp = await this.page.context().newCDPSession(this.page)

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
              Promise.race([
                cdp.send('DOM.getBoxModel', { backendNodeId: node.backendDOMNodeId })
                  .then((res: any) => {
                    const content = res.model.content
                    entry.x = (content[0] + content[2]) / 2
                    entry.y = (content[1] + content[5]) / 2
                    entry.width = Math.abs(content[2] - content[0])
                    entry.height = Math.abs(content[5] - content[1])
                  }),
                new Promise<void>((resolve) => setTimeout(resolve, 2000))
              ]).catch(() => {})
            )
          }

          components.push(entry)
        }
      }

      await Promise.all(resolvePromises)
      await cdp.detach()
    } catch (err) {
      console.error('[BrowserSession] getInteractiveComponents error:', (err as Error).message)
    }

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

  async readContent(): Promise<ContentResult> {
    if (!this.page) throw new Error('Session not started')
    const extractor = new ContentExtractor(this.page)
    return extractor.extract()
  }

  async parseDocs(): Promise<DocStructure> {
    if (!this.page) throw new Error('Session not started')
    const parser = new DocParser(this.page)
    return parser.parse()
  }

  async enableStealth(config?: Partial<StealthConfig>): Promise<void> {
    if (!this.context) throw new Error('Session not started')
    const stealth = new StealthManager(config)
    await stealth.apply(this.context)
  }
}
