// BrowserIR Session Management
// Easy-to-use object-oriented API

import { RPCClient } from '../daemon/transport.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'
import { spawn } from 'child_process'
import type { BrowserIR, DiffResult } from '../ir/types.js'

const execAsync = promisify(exec)

let sharedClient: RPCClient | null = null

async function isDaemonRunning(): Promise<boolean> {
  try {
    const result = await execAsync('curl -s http://localhost:3081/health')
    return result.stdout.includes('"status":"healthy"')
  } catch {
    return false
  }
}

async function ensureDaemon(): Promise<void> {
  const running = await isDaemonRunning()
  if (running) return

  let serverPath = path.join(process.cwd(), 'dist', 'daemon', 'server.js')
  if (!fs.existsSync(serverPath)) {
    serverPath = path.resolve(__dirname, '../../daemon/server.js')
  }
  if (!fs.existsSync(serverPath)) return

  const daemon = spawn('node', [serverPath], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  daemon.unref()

  await new Promise<void>((resolve) => {
    let started = false
    daemon.stdout?.on('data', (data) => {
      if (data.toString().includes('listening') && !started) {
        started = true
        setTimeout(resolve, 500)
      }
    })
    setTimeout(() => { if (!started) { started = true; resolve() } }, 3000)
  })
}

async function getClient(): Promise<RPCClient> {
  await ensureDaemon()
  if (!sharedClient) {
    sharedClient = new RPCClient()
    await sharedClient.connect()
  }
  return sharedClient
}

export interface BrowserSessionOptions {
  headless?: boolean
  timeout?: number
}

export interface MemoryEntry {
  domain: string
  purpose: string
  commonFlows: string[]
  knownElements: any[]
}

export interface AuditResult {
  risks: any[]
  suggestions: any[]
  confidence: number
  recommendations: string[]
}

export interface Plan {
  planId: string
  goal: string
  domain: string
  steps: PlanStep[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
  executedAt?: string
  results?: any[]
}

export interface PlanStep {
  order: number
  action: string
  target?: string
  required: boolean
  estimatedDuration: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  actualDuration?: number
  result?: any
}

export class BrowserSession {
  private static sessions = new Map<string, BrowserSession>()
  private ir?: BrowserIR
  private sessionId: string

  constructor(
    public url: string,
    public options: BrowserSessionOptions = {}
  ) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    BrowserSession.sessions.set(this.sessionId, this)
  }

  static get(sessionId: string): BrowserSession | undefined {
    return BrowserSession.sessions.get(sessionId)
  }

  static delete(sessionId: string): boolean {
    return BrowserSession.sessions.delete(sessionId)
  }

  static list(): BrowserSession[] {
    return Array.from(BrowserSession.sessions.values())
  }

  // Core workflow methods
  async explain(): Promise<BrowserIR> {
    if (!this.ir) {
      const client = await getClient()
      await client.call('navigate', { url: this.url })
      this.ir = (await client.call('explain')) as BrowserIR
    }
    return this.ir
  }

  async graph(): Promise<string> {
    if (!this.ir) {
      await this.explain()
    }
    return formatGraph(this.ir!)
  }

  async audit(): Promise<AuditResult> {
    if (!this.ir) {
      await this.explain()
    }
    return performAudit(this.ir!)
  }

  async plan(): Promise<Plan> {
    if (!this.ir) {
      await this.explain()
    }
    return createPlan(this.ir!)
  }

  // Action methods
  async click(ref: string): Promise<void> {
    const client = await getClient()
    await client.call('click', { ref })
  }

  async navigate(url: string): Promise<void> {
    this.url = url
    this.ir = undefined
    const client = await getClient()
    await client.call('navigate', { url })
    this.ir = (await client.call('explain')) as BrowserIR
  }

  async screenshot(): Promise<string> {
    const client = await getClient()
    const result = await client.call('screenshot')
    return (result as any).screenshot
  }

  // Memory methods
  async recall(): Promise<MemoryEntry> {
    const domain = new URL(this.url).hostname
    const client = await getClient()
    return (await client.call('memory.recall', { domain })) as MemoryEntry
  }

  async store(): Promise<void> {
    if (!this.ir) {
      await this.explain()
    }
    const domain = new URL(this.url).hostname
    const client = await getClient()
    await client.call('memory.store', { domain, ir: this.ir })
  }

  // Comparison
  async diff(otherSession: BrowserSession): Promise<DiffResult> {
    if (!this.ir) {
      await this.explain()
    }
    if (!otherSession.ir) {
      await otherSession.explain()
    }
    const client = await getClient()
    return (await client.call('diff.compare', {
      irBefore: otherSession.ir,
      irAfter: this.ir,
    })) as DiffResult
  }

  // Internal helpers
  get id(): string {
    return this.sessionId
  }

  isValid(): boolean {
    return BrowserSession.sessions.has(this.sessionId)
  }

  destroy(): void {
    BrowserSession.sessions.delete(this.sessionId)
    this.ir = undefined
  }
}

// BrowserIR Helper Functions
async function analyze(url: string): Promise<BrowserSession> {
  return new BrowserSession(url)
}

async function explain(url: string): Promise<BrowserIR> {
  const session = new BrowserSession(url)
  return await session.explain()
}

// Format helper function
function formatGraph(ir: BrowserIR): string {
  const lines: string[] = []
  lines.push(`Page: ${ir.page.title}`)
  lines.push(`Intent: ${ir.page.intent.primary}`)
  lines.push('')

  for (const section of ir.page.sections) {
    lines.push(`├── [${section.role}] ${section.label} (${section.intent})`)
    for (const comp of section.components) {
      const last = comp === section.components[section.components.length - 1]
      const prefix = last ? '└──' : '├──'
      const state = comp.state.enabled ? '' : ' DISABLED'
      lines.push(`│   ${prefix} ${comp.label} (${comp.type}${state}) [${comp.id}]`)
    }
  }

  return lines.join('\n')
}

// Audit function
async function performAudit(ir: BrowserIR): Promise<AuditResult> {
  const risks: any[] = []
  const suggestions: any[] = []

  if (ir.page.intent.risk && ir.page.intent.risk.length > 0) {
    risks.push(...ir.page.intent.risk.map((r) => r.description))
  }

  if (ir.page.metadata.framework) {
    suggestions.push(`Framework detected: ${ir.page.metadata.framework}`)
  }

  return {
    risks,
    suggestions,
    confidence: calculateConfidence(ir),
    recommendations: generateRecommendations(ir),
  }
}

// Plan generation
async function createPlan(ir: BrowserIR): Promise<Plan> {
  const planId = `plan_${Date.now()}`
  const steps: PlanStep[] = []

  for (const section of ir.page.sections) {
    for (const comp of section.components) {
      if (comp.type === 'button' || comp.type === 'link') {
        steps.push({
          order: steps.length + 1,
          action: `interact with ${comp.label}`,
          target: comp.id,
          required: comp.state.enabled,
          estimatedDuration: 500,
          status: 'pending',
        })
      }
    }
  }

  return {
    planId,
    goal: `analyze ${ir.page.title} for ${ir.page.intent.primary} intent`,
    domain: new URL(ir.page.url).hostname,
    steps,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

function calculateConfidence(ir: BrowserIR): number {
  let confidence = 0.5

  if (ir.page.title) confidence += 0.2
  if (ir.page.intent.category) confidence += 0.2
  if (ir.page.sections.length > 0) confidence += 0.1

  return Math.min(confidence, 1.0)
}

function generateRecommendations(ir: BrowserIR): string[] {
  const recommendations: string[] = []

  if (ir.page.intent.category === 'authentication') {
    recommendations.push('Ensure valid credentials before proceeding')
  }

  if (ir.page.intent.category === 'purchase') {
    recommendations.push('Review terms and conditions before completing purchase')
  }

  return recommendations
}

// Export main functions
export { analyze, explain, formatGraph, performAudit, createPlan }
