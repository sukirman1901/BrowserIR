import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { randomUUID } from 'crypto'

export interface SessionInfo {
  id: string
  createdAt: number
  lastActive: number
  status: 'active' | 'idle' | 'closed'
}

export interface MultiTabTask {
  id: string
  tabs: TabTask[]
  coordination: 'sequential' | 'parallel' | 'dependent'
}

export interface TabTask {
  sessionId: string
  goal: string
}

export interface TabResult {
  sessionId: string
  goal: string
  success: boolean
  message: string
}

export interface CrossTabResult {
  taskId: string
  results: TabResult[]
  summary: string
}

interface ManagedSession {
  info: SessionInfo
  browser: Browser
  context: BrowserContext
  pages: Map<string, Page>
}

export class MultiBrowserEngine {
  private sessions = new Map<string, ManagedSession>()
  private maxConcurrent: number

  constructor(options: { maxConcurrent?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 3
  }

  async createSession(): Promise<string> {
    if (this.sessions.size >= this.maxConcurrent) {
      throw new Error('Max concurrent sessions reached')
    }
    const id = randomUUID()
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    })
    this.sessions.set(id, {
      info: { id, createdAt: Date.now(), lastActive: Date.now(), status: 'active' },
      browser, context, pages: new Map(),
    })
    return id
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (session) {
      await session.browser.close().catch(() => {})
      this.sessions.delete(id)
    }
  }

  async navigate(sessionId: string, url: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    const page = await session.context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    const pageId = randomUUID()
    session.pages.set(pageId, page)
    session.info.lastActive = Date.now()
    return pageId
  }

  async getPage(sessionId: string, pageId: string): Promise<Page | undefined> {
    return this.sessions.get(sessionId)?.pages.get(pageId)
  }

  async click(sessionId: string, pageId: string, selector: string): Promise<void> {
    const page = await this.getPage(sessionId, pageId)
    if (!page) throw new Error(`Page ${pageId} not found in session ${sessionId}`)
    await page.click(selector)
    this.sessions.get(sessionId)!.info.lastActive = Date.now()
  }

  async executeMultiTab(task: MultiTabTask): Promise<CrossTabResult> {
    const results: TabResult[] = []
    for (const tab of task.tabs) {
      try {
        const session = this.sessions.get(tab.sessionId)
        if (!session) throw new Error(`Session ${tab.sessionId} not found`)
        await this.navigate(tab.sessionId, tab.goal)
        results.push({ sessionId: tab.sessionId, goal: tab.goal, success: true, message: 'Executed' })
      } catch (e: any) {
        results.push({ sessionId: tab.sessionId, goal: tab.goal, success: false, message: e.message })
      }
    }
    return {
      taskId: task.id,
      results,
      summary: `${results.filter(r => r.success).length}/${results.length} tabs completed`,
    }
  }

  async getSessions(): Promise<SessionInfo[]> {
    return Array.from(this.sessions.values()).map(s => s.info)
  }
}
