import type { Page } from 'playwright'

export interface ConsoleEntry {
  type: string
  text: string
  url: string
  timestamp: number
}

export interface ErrorEntry {
  message: string
  stack?: string
  url: string
  timestamp: number
}

export class ConsoleCapture {
  private consoleLogs: ConsoleEntry[] = []
  private runtimeErrors: ErrorEntry[] = []
  private page: Page
  
  constructor(page: Page) {
    this.page = page
    this.setupListeners()
  }
  
  private setupListeners() {
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        url: msg.location()?.url || '',
        timestamp: Date.now()
      })
    })
    
    this.page.on('pageerror', (err) => {
      this.runtimeErrors.push({
        message: err.message,
        stack: err.stack,
        url: this.page.url(),
        timestamp: Date.now()
      })
    })
  }
  
  getConsoleLogs(type?: string): ConsoleEntry[] {
    if (type) return this.consoleLogs.filter(l => l.type === type)
    return [...this.consoleLogs]
  }
  
  getErrors(): ErrorEntry[] {
    return [...this.runtimeErrors]
  }
  
  getWarnings(): ConsoleEntry[] {
    return this.consoleLogs.filter(l => l.type === 'warning')
  }
  
  hasErrors(): boolean {
    return this.runtimeErrors.length > 0 || this.consoleLogs.some(l => l.type === 'error')
  }
  
  clear() {
    this.consoleLogs = []
    this.runtimeErrors = []
  }
}
