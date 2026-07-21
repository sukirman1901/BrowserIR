import type { Page } from 'playwright'
import type { BrowserIR } from '../ir/types.js'

export interface FailureContext {
  step: string
  error: string
  timestamp: number
}

export interface AnalysisResult {
  networkErrors: Array<{url: string; status: number; error?: string}>
  consoleErrors: Array<{type: string; text: string; url: string}>
  runtimeErrors: Array<{message: string; url: string}>
  screenshot?: string
  elementState?: any
  recommendation: string
}

export class FailureAnalyzer {
  private networkLogs: Array<{url: string; status: number; error?: string}> = []
  private consoleLogs: Array<{type: string; text: string; url: string}> = []
  private runtimeErrors: Array<{message: string; url: string}> = []
  
  constructor(private page: Page) {
    this.setupListeners()
  }
  
  private setupListeners() {
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        url: msg.location()?.url || ''
      })
    })
    
    this.page.on('pageerror', (err) => {
      this.runtimeErrors.push({
        message: err.message,
        url: this.page.url()
      })
    })
  }
  
  async analyzeFailure(context: FailureContext): Promise<AnalysisResult> {
    const networkErrors = this.getNetworkErrors()
    const consoleErrors = this.getConsoleErrors()
    const runtimeErrors = this.getRuntimeErrors()
    
    let screenshot: string | undefined
    try {
      const buffer = await this.page.screenshot({ type: 'png' })
      screenshot = buffer.toString('base64')
    } catch {}
    
    const recommendation = this.generateRecommendation(context, networkErrors, consoleErrors, runtimeErrors)
    
    return {
      networkErrors,
      consoleErrors,
      runtimeErrors,
      screenshot,
      recommendation
    }
  }
  
  private getNetworkErrors() {
    return this.networkLogs.filter(n => n.status >= 400 || n.error)
  }
  
  private getConsoleErrors() {
    return this.consoleLogs.filter(c => c.type === 'error' || c.type === 'warning')
  }
  
  private getRuntimeErrors() {
    return [...this.runtimeErrors]
  }
  
  private generateRecommendation(
    context: FailureContext,
    networkErrors: any[],
    consoleErrors: any[],
    runtimeErrors: any[]
  ): string {
    const issues: string[] = []
    
    if (networkErrors.length > 0) {
      issues.push(`Network errors detected: ${networkErrors.map(e => e.url).join(', ')}`)
    }
    if (consoleErrors.length > 0) {
      issues.push(`Console errors: ${consoleErrors.map(e => e.text.substring(0, 50)).join('; ')}`)
    }
    if (runtimeErrors.length > 0) {
      issues.push(`JS runtime errors: ${runtimeErrors.map(e => e.message.substring(0, 50)).join('; ')}`)
    }
    
    if (issues.length === 0) {
      return `Step failed: ${context.step}. Error: ${context.error}. No network/console/runtime errors detected. Check element visibility and timing.`
    }
    
    return `Step failed: ${context.step}.\n${issues.join('\n')}\nRecommendation: Fix the errors above before retrying.`
  }
  
  clear() {
    this.networkLogs = []
    this.consoleLogs = []
    this.runtimeErrors = []
  }
}
