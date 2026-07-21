import type { MemoryEngine } from './memory.js'
import type { BrowserIR } from '../ir/types.js'

export interface SuccessEvent {
  domain: string
  action: string
  selector: string
  timestamp: number
}

export interface FailureEvent {
  domain: string
  action: string
  selector: string
  error: string
  timestamp: number
}

export interface PageContext {
  url: string
  intent: string
  components: Array<{ type: string; label: string; selector: string }>
}

export interface Action {
  type: string
  target: string
  confidence: number
}

export interface Fix {
  selector: string
  confidence: number
  reason: string
}

export class MemoryLearner {
  constructor(private memory: MemoryEngine) {}

  async learnFromSuccess(success: SuccessEvent): Promise<void> {
    const entries = await this.memory.recallByDomain(success.domain)
    if (!entries.length) return

    const entry = entries[0]

    // Update selector success rate
    const existingSelector = entry.knowledge.knownElements.find(
      e => e.selectors.includes(success.selector)
    )

    if (existingSelector) {
      // Increase confidence for successful selector
      entry.confidence = Math.min(entry.confidence + 0.05, 1.0)
    }

    // Store pattern
    const pattern = {
      type: success.action,
      pattern: success.selector,
      frequency: 1,
      lastSeen: success.timestamp
    }

    // Update knowledge
    await this.memory.updateKnowledge(success.domain, {
      ...entry.knowledge,
      knownElements: entry.knowledge.knownElements.map(e => {
        if (e.selectors.includes(success.selector)) {
          return { ...e, selectors: [success.selector, ...e.selectors.filter(s => s !== success.selector)] }
        }
        return e
      })
    })
  }

  async learnFromFailure(failure: FailureEvent): Promise<void> {
    const entries = await this.memory.recallByDomain(failure.domain)
    if (!entries.length) return

    const entry = entries[0]

    // Store error
    const error = {
      type: failure.error,
      message: failure.error,
      count: 1,
      lastSeen: failure.timestamp
    }

    // Decrease confidence for failed selector
    entry.confidence = Math.max(entry.confidence - 0.02, 0.1)

    // Update knowledge with error
    await this.memory.updateKnowledge(failure.domain, {
      ...entry.knowledge,
      issues: [
        ...entry.knowledge.issues,
        { type: failure.error, description: failure.error, severity: 'medium' as const, timestamp: failure.timestamp }
      ]
    })
  }

  async predictNextAction(context: PageContext): Promise<Action[]> {
    const hostname = new URL(context.url).hostname
    const entries = await this.memory.recallByDomain(hostname)
    if (!entries.length) return []

    const entry = entries[0]
    const actions: Action[] = []

    // Predict based on intent
    const intentActions: Record<string, Action[]> = {
      'authentication': [
        { type: 'click', target: 'Login button', confidence: 0.8 },
        { type: 'fill', target: 'Email input', confidence: 0.7 },
      ],
      'search': [
        { type: 'fill', target: 'Search input', confidence: 0.9 },
        { type: 'click', target: 'Search button', confidence: 0.8 },
      ],
      'purchase': [
        { type: 'click', target: 'Buy button', confidence: 0.85 },
        { type: 'fill', target: 'Shipping form', confidence: 0.7 },
      ],
    }

    if (intentActions[context.intent]) {
      actions.push(...intentActions[context.intent])
    }

    // Boost confidence from memory
    for (const action of actions) {
      const memAction = entry.knowledge.commonFlows.find(f => f.includes(action.type))
      if (memAction) {
        action.confidence = Math.min(action.confidence + 0.1, 1.0)
      }
    }

    return actions.sort((a, b) => b.confidence - a.confidence)
  }

  async suggestFix(error: string): Promise<Fix[]> {
    const fixes: Fix[] = []

    // Common error patterns and fixes
    const errorPatterns: Record<string, Fix[]> = {
      'Element not found': [
        { selector: '[role="button"]', confidence: 0.7, reason: 'Try role-based selector' },
        { selector: 'button', confidence: 0.6, reason: 'Try tag selector' },
      ],
      'Timeout': [
        { selector: '[data-testid]', confidence: 0.8, reason: 'Try test ID selector' },
        { selector: '.loading', confidence: 0.5, reason: 'Wait for loading to complete' },
      ],
      'Element not visible': [
        { selector: '[style*="display"]', confidence: 0.6, reason: 'Check element visibility' },
      ],
    }

    for (const [pattern, suggestedFixes] of Object.entries(errorPatterns)) {
      if (error.includes(pattern)) {
        fixes.push(...suggestedFixes)
      }
    }

    return fixes.sort((a, b) => b.confidence - a.confidence)
  }
}
