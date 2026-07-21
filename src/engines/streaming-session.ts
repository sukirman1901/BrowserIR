import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { EventEmitter } from 'events'

export interface StreamCommand {
  id: string
  type: 'connect' | 'navigate' | 'click' | 'screenshot' | 'evaluate' | 'close'
  params: Record<string, any>
  timestamp: number
}

export interface StreamResult {
  id: string
  success: boolean
  data?: any
  error?: string
  timestamp: number
}

export interface StreamEvent {
  type: 'command' | 'result' | 'screenshot' | 'error' | 'status'
  data: any
  timestamp: number
}

export class StreamingSession extends EventEmitter {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private connected = false
  private screenshotCounter = 0

  async connect(options?: { headless?: boolean }): Promise<StreamResult> {
    const id = this.generateId()
    
    try {
      this.browser = await chromium.launch({
        headless: options?.headless ?? true,
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
      })
      
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      })
      
      this.page = await this.context.newPage()
      this.connected = true
      
      this.emit('status', { connected: true, url: 'about:blank' })
      
      return { id, success: true, data: { status: 'connected' }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  async navigate(url: string): Promise<StreamResult> {
    const id = this.generateId()
    
    if (!this.page) {
      return { id, success: false, error: 'Not connected', timestamp: Date.now() }
    }
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      const title = await this.page.title()
      
      this.emit('status', { connected: true, url: this.page.url(), title })
      
      return { id, success: true, data: { url: this.page.url(), title }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  async click(selector: string): Promise<StreamResult> {
    const id = this.generateId()
    
    if (!this.page) {
      return { id, success: false, error: 'Not connected', timestamp: Date.now() }
    }
    
    try {
      await this.page.click(selector, { timeout: 5000 })
      return { id, success: true, data: { clicked: selector }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  async screenshot(): Promise<StreamResult> {
    const id = this.generateId()
    
    if (!this.page) {
      return { id, success: false, error: 'Not connected', timestamp: Date.now() }
    }
    
    try {
      const buffer = await this.page.screenshot({ type: 'png' })
      const base64 = buffer.toString('base64')
      this.screenshotCounter++
      
      this.emit('screenshot', { data: base64, counter: this.screenshotCounter })
      
      return { id, success: true, data: { screenshot: base64, counter: this.screenshotCounter }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  async evaluate(code: string): Promise<StreamResult> {
    const id = this.generateId()
    
    if (!this.page) {
      return { id, success: false, error: 'Not connected', timestamp: Date.now() }
    }
    
    try {
      const result = await this.page.evaluate(code)
      return { id, success: true, data: { result }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  async getPageInfo(): Promise<{ url: string; title: string }> {
    if (!this.page) return { url: '', title: '' }
    return { url: this.page.url(), title: await this.page.title() }
  }

  async close(): Promise<StreamResult> {
    const id = this.generateId()
    
    try {
      if (this.page) await this.page.close().catch(() => {})
      if (this.context) await this.context.close().catch(() => {})
      if (this.browser) await this.browser.close().catch(() => {})
      
      this.page = null
      this.context = null
      this.browser = null
      this.connected = false
      
      this.emit('status', { connected: false })
      
      return { id, success: true, data: { status: 'closed' }, timestamp: Date.now() }
    } catch (error: any) {
      return { id, success: false, error: error.message, timestamp: Date.now() }
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
