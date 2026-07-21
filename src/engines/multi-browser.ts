import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { randomUUID } from 'crypto'

export interface SessionInfo {
  id: string
  createdAt: number
  lastActive: number
  status: 'active' | 'idle' | 'closed'
}

export interface PoolConfig {
  minSize: number
  maxSize: number
  warmup: boolean
  idleTimeout: number
}

interface PooledBrowser {
  browser: Browser
  context: BrowserContext
  pages: Map<string, Page>
  inUse: boolean
  lastUsed: number
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
  private pool: PooledBrowser[] = []
  private poolConfig: PoolConfig
  private maxConcurrent: number

  constructor(options: { maxConcurrent?: number; pool?: Partial<PoolConfig> } = {}) {
    this.maxConcurrent = options.maxConcurrent || 3
    this.poolConfig = {
      minSize: 1,
      maxSize: 5,
      warmup: false,
      idleTimeout: 300000,
      ...options.pool
    }
  }

  async warmupPool(): Promise<void> {
    for (let i = 0; i < this.poolConfig.minSize; i++) {
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      })
      this.pool.push({
        browser,
        context,
        pages: new Map(),
        inUse: false,
        lastUsed: Date.now()
      })
    }
  }

  async acquireBrowser(): Promise<PooledBrowser> {
    // Find idle browser in pool
    const idle = this.pool.find(b => !b.inUse)
    if (idle) {
      idle.inUse = true
      idle.lastUsed = Date.now()
      return idle
    }

    // Create new if pool not full
    if (this.pool.length < this.poolConfig.maxSize) {
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      })
      const pooled: PooledBrowser = {
        browser,
        context,
        pages: new Map(),
        inUse: true,
        lastUsed: Date.now()
      }
      this.pool.push(pooled)
      return pooled
    }

    throw new Error('Max pool size reached')
  }

  async releaseBrowser(pooled: PooledBrowser): Promise<void> {
    pooled.inUse = false
    pooled.lastUsed = Date.now()
  }

  async cleanupIdleBrowsers(): Promise<void> {
    const now = Date.now()
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const pooled = this.pool[i]
      if (!pooled.inUse && now - pooled.lastUsed > this.poolConfig.idleTimeout) {
        await pooled.browser.close()
        this.pool.splice(i, 1)
      }
    }
  }

  async createSession(): Promise<string> {
    if (this.sessions.size >= this.maxConcurrent) {
      throw new Error('Max concurrent sessions reached')
    }
    const id = randomUUID()
    const pooled = await this.acquireBrowser()
    this.sessions.set(id, {
      info: { id, createdAt: Date.now(), lastActive: Date.now(), status: 'active' },
      browser: pooled.browser,
      context: pooled.context,
      pages: pooled.pages
    })
    return id
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (session) {
      // Find pooled browser and release it
      const pooled = this.pool.find(p => p.browser === session.browser)
      if (pooled) {
        await this.releaseBrowser(pooled)
      }
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
      summary: `${results.filter(r => r.success).length}/${results.length} tabs completed`
    }
  }

  async executeParallel(tasks: Array<{ sessionId: string; goal: string }>): Promise<CrossTabResult> {
    const results = await Promise.all(
      tasks.map(async (task) => {
        try {
          await this.navigate(task.sessionId, task.goal)
          return { sessionId: task.sessionId, goal: task.goal, success: true, message: 'Executed' }
        } catch (e: any) {
          return { sessionId: task.sessionId, goal: task.goal, success: false, message: e.message }
        }
      })
    )
    return {
      taskId: randomUUID(),
      results,
      summary: `${results.filter(r => r.success).length}/${results.length} completed`
    }
  }

  async getSessions(): Promise<SessionInfo[]> {
    return Array.from(this.sessions.values()).map(s => s.info)
  }

  getPoolSize(): number {
    return this.pool.length
  }

  getPoolStats(): { total: number; idle: number; inUse: number } {
    return {
      total: this.pool.length,
      idle: this.pool.filter(p => !p.inUse).length,
      inUse: this.pool.filter(p => p.inUse).length
    }
  }
}