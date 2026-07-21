// bir/src/engines/planner.ts
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import type { MemoryEngine } from './memory.js'
import type { DiffEngine } from './diff.js'
import type { SelfHealingEngine } from './self-healing.js'
import type { EventEngine } from './event.js'
import type { FlowEngine } from './flow.js'

export interface Plan {
  id: string
  goal: string
  steps: PlanStep[]
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'paused'
  context: PlanContext
  createdAt: number
  updatedAt: number
}

export interface PlanStep {
  id: string
  action: 'navigate' | 'click' | 'type' | 'wait' | 'verify' | 'extract'
  target?: string
  value?: string
  expectation: Expectation
  status: 'pending' | 'executing' | 'done' | 'failed' | 'skipped'
  attempts: number
  maxAttempts: number
}

export interface Expectation {
  type: 'element_visible' | 'url_changed' | 'text_contains' | 'ir_changed'
  value: string
  timeout: number
}

export interface PlanContext {
  memory?: any
  currentIR?: any
  history: PlanStep[]
  sessionId: string
}

export interface PlanResult {
  plan: Plan
  success: boolean
  message: string
}

export class PlannerEngine {
  private stmts: {
    insert: Database.Statement
    getById: Database.Statement
    updateStatus: Database.Statement
  }

  constructor(
    private db: Database.Database,
    private memory: MemoryEngine,
    private diff: DiffEngine,
    private healing: SelfHealingEngine,
    private events: EventEngine,
    private flow: FlowEngine
  ) {
    this.stmts = {
      insert: db.prepare(`
        INSERT INTO plans (id, goal, steps, status, context, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      getById: db.prepare('SELECT * FROM plans WHERE id = ?'),
      updateStatus: db.prepare('UPDATE plans SET status = ?, context = ?, updated_at = ? WHERE id = ?'),
    }
  }

  async createPlan(goal: string, domain: string): Promise<Plan> {
    const id = randomUUID()
    const steps = this.generateSteps(goal, domain)
    const now = Date.now()
    const plan: Plan = {
      id,
      goal,
      steps,
      status: 'pending',
      context: { history: [], sessionId: `session_${id}` },
      createdAt: now,
      updatedAt: now
    }
    this.stmts.insert.run(id, goal, JSON.stringify(steps), 'pending', JSON.stringify(plan.context), now, now)
    return plan
  }

  async executePlan(plan: Plan, page?: any, currentIR?: any): Promise<PlanResult> {
    plan.status = 'executing'
    plan.updatedAt = Date.now()

    for (const step of plan.steps) {
      step.status = 'executing'
      try {
        await this.executeStep(step, page)
        step.status = 'done'
        plan.context.history.push(step)
      } catch (error) {
        step.status = 'failed'
        step.attempts++

        // Try self-healing fallback if target exists and page is present
        if (page && step.target) {
          try {
            const healIR = currentIR || {
              page: {
                url: page.url(),
                title: '',
                intent: {} as any,
                sections: [],
                metadata: {} as any,
              },
            }
            const healResult = await this.healing.heal(step.target, healIR)
            if (healResult.found && healResult.selector) {
              step.target = healResult.selector
              await this.executeStep(step, page)
              step.status = 'done'
              plan.context.history.push(step)
              continue
            }
          } catch {
            // Healing failed
          }
        }

        if (step.attempts < step.maxAttempts) {
          step.status = 'pending'
          continue
        }
        plan.status = 'failed'
        this.stmts.updateStatus.run(plan.status, JSON.stringify(plan.context), plan.updatedAt, plan.id)
        return { plan, success: false, message: `Step failed: ${step.action} on ${step.target || 'target'}` }
      }
    }

    plan.status = 'completed'
    plan.updatedAt = Date.now()
    this.stmts.updateStatus.run(plan.status, JSON.stringify(plan.context), plan.updatedAt, plan.id)
    return { plan, success: true, message: 'Plan completed successfully' }
  }

  async getPlan(id: string): Promise<Plan | null> {
    const row = this.stmts.getById.get(id) as any
    if (!row) return null
    return {
      id: row.id,
      goal: row.goal,
      steps: JSON.parse(row.steps),
      status: row.status,
      context: JSON.parse(row.context),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  private generateSteps(goal: string, domain: string): PlanStep[] {
    const goalLower = goal.toLowerCase()
    const steps: PlanStep[] = []

    // Navigation
    if (goalLower.includes('go to') || goalLower.includes('navigate') || goalLower.includes('open')) {
      const url = goal.match(/https?:\/\/[^\s]+/)?.[0] || `https://${domain}`
      steps.push(this.makeStep('navigate', url))
      return steps
    }

    // Authentication
    if (goalLower.includes('login') || goalLower.includes('sign in') || goalLower.includes('masuk')) {
      steps.push(this.makeStep('navigate', `https://${domain}`))
      steps.push(this.makeStep('wait', undefined, '2000'))
      steps.push(this.makeStep('click', 'button:Masuk'))
      steps.push(this.makeStep('type', 'input[type="email"]', goalLower.includes('@') ? goal : ''))
      steps.push(this.makeStep('type', 'input[type="password"]', ''))
      steps.push(this.makeStep('click', 'button[type="submit"]'))
      return steps
    }

    // Search
    if (goalLower.includes('search') || goalLower.includes('find') || goalLower.includes('cari')) {
      const query = goal.replace(/search|find|cari/gi, '').trim()
      steps.push(this.makeStep('navigate', `https://${domain}`))
      steps.push(this.makeStep('wait', undefined, '2000'))
      steps.push(this.makeStep('type', 'input[type="search"], input[name="q"]', query))
      steps.push(this.makeStep('click', 'button[type="submit"]'))
      return steps
    }

    // Purchase
    if (goalLower.includes('buy') || goalLower.includes('purchase') || goalLower.includes('beli')) {
      const product = goal.replace(/buy|purchase|beli/gi, '').trim()
      steps.push(this.makeStep('navigate', `https://${domain}`))
      steps.push(this.makeStep('wait', undefined, '2000'))
      steps.push(this.makeStep('type', 'input[type="search"]', product))
      steps.push(this.makeStep('click', 'button[type="submit"]'))
      steps.push(this.makeStep('wait', undefined, '2000'))
      steps.push(this.makeStep('click', 'a:product-item'))
      steps.push(this.makeStep('click', 'button:Beli'))
      return steps
    }

    // Default: navigate
    steps.push(this.makeStep('navigate', `https://${domain}`))
    return steps
  }

  private makeStep(action: PlanStep['action'], target?: string, value?: string): PlanStep {
    return {
      id: randomUUID(),
      action,
      target,
      value,
      expectation: { type: 'element_visible', value: target || '', timeout: 5000 },
      status: 'pending',
      attempts: 0,
      maxAttempts: 3
    }
  }

  private async executeStep(step: PlanStep, page?: any): Promise<void> {
    // 1. Log event
    await this.events.capture({
      type: step.action === 'click' ? 'click' : step.action === 'type' ? 'input' : 'navigation',
      timestamp: Date.now(),
      data: { selector: step.target, value: step.value },
      sessionId: `planner`
    })

    // 2. Perform live Playwright actions if page object is provided
    if (page) {
      if (step.action === 'navigate' && step.target) {
        await page.goto(step.target)
      } else if (step.action === 'click' && step.target) {
        await page.click(step.target)
      } else if (step.action === 'type' && step.target) {
        await page.fill(step.target, step.value || '')
      } else if (step.action === 'wait') {
        const ms = parseInt(step.value || '1000', 10)
        await page.waitForTimeout(ms)
      } else if (step.action === 'verify' && step.expectation) {
        await this.verifyExpectation(page, step.expectation)
      }
    }
  }

  private async verifyExpectation(page: any, expectation: Expectation): Promise<void> {
    if (expectation.type === 'element_visible') {
      await page.waitForSelector(expectation.value, { state: 'visible', timeout: expectation.timeout || 5000 })
    } else if (expectation.type === 'url_changed') {
      await page.waitForURL((url: URL) => url.toString().includes(expectation.value), { timeout: expectation.timeout || 5000 })
    } else if (expectation.type === 'text_contains') {
      const content = await page.textContent('body')
      if (!content || !content.includes(expectation.value)) {
        throw new Error(`Text "${expectation.value}" not found on page`)
      }
    }
  }
}
