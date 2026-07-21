// bir/src/engines/flow.ts
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface Flow {
  id: string
  name: string
  domain: string
  steps: FlowStep[]
  frequency: number
  confidence: number
  lastSeen: number
}

export interface FlowStep {
  intent: string
  action: string
  selector?: string
  required?: boolean
  estimatedDuration?: number
  alternatives: string[]
}

export class FlowEngine {
  constructor(public db: Database.Database) {}

  async detectFlows(sessionId: string): Promise<Flow[]> {
    const rows = this.db.prepare(
      'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC'
    ).all(sessionId) as any[]

    if (rows.length === 0) return []

    // Group into sequences (5s gap = new sequence)
    const sequences: any[][] = []
    let current: any[] = [rows[0]]
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].timestamp - rows[i - 1].timestamp > 5000) {
        sequences.push(current)
        current = []
      }
      current.push(rows[i])
    }
    sequences.push(current)

    // Count sequence patterns
    const patternCounts = new Map<string, { count: number; steps: any[] }>()
    for (const seq of sequences) {
      const signature = seq.map(e => e.type).join('→')
      const existing = patternCounts.get(signature)
      if (existing) {
        existing.count++
      } else {
        patternCounts.set(signature, { count: 1, steps: seq })
      }
    }

    // Create flows for patterns
    const flows: Flow[] = []
    for (const [signature, { count, steps }] of patternCounts) {
      const id = randomUUID()

      // Extract domain from event data
      let domain = 'default'
      for (const s of steps) {
        try {
          const dataObj = typeof s.data === 'string' ? JSON.parse(s.data) : s.data
          if (dataObj?.url) {
            domain = new URL(dataObj.url).hostname
            break
          } else if (dataObj?.domain) {
            domain = dataObj.domain
            break
          }
        } catch {
          // ignore parsing error
        }
      }

      // Infer semantic flow name
      const fullText = steps.map(s => {
        const d = typeof s.data === 'string' ? s.data : JSON.stringify(s.data)
        return `${s.type} ${d}`
      }).join(' ').toLowerCase()

      let name = `Flow: ${signature}`
      if (/login|password|signin|auth/.test(fullText)) {
        name = 'Authentication Flow'
      } else if (/checkout|payment|card|pay/.test(fullText)) {
        name = 'Checkout & Payment Flow'
      } else if (/search|query|find/.test(fullText)) {
        name = 'Search Flow'
      }

      // Build flow steps with duration & requirement estimations
      const flowSteps: FlowStep[] = steps.map((s: any, idx: number) => {
        let parsedData: any = {}
        try {
          parsedData = typeof s.data === 'string' ? JSON.parse(s.data) : s.data
        } catch {}

        const prevTimestamp = idx > 0 ? steps[idx - 1].timestamp : s.timestamp
        const duration = Math.max(500, s.timestamp - prevTimestamp)

        return {
          intent: s.type,
          action: s.type,
          selector: parsedData.selector || undefined,
          required: s.type === 'input' || s.type === 'click',
          estimatedDuration: duration,
          alternatives: []
        }
      })

      const flow: Flow = {
        id,
        name,
        domain,
        steps: flowSteps,
        frequency: count,
        confidence: Math.min(1, count / 3),
        lastSeen: steps[steps.length - 1].timestamp
      }
      flows.push(flow)

      this.db.prepare(
        'INSERT OR REPLACE INTO flows (id, name, domain, steps, frequency, confidence, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(id, flow.name, flow.domain, JSON.stringify(flow.steps), flow.frequency, flow.confidence, flow.lastSeen)
    }

    return flows
  }

  async getFlows(domain: string): Promise<Flow[]> {
    const rows = this.db.prepare('SELECT * FROM flows WHERE domain = ? ORDER BY frequency DESC').all(domain) as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      steps: JSON.parse(r.steps),
      frequency: r.frequency,
      confidence: r.confidence,
      lastSeen: r.last_seen
    }))
  }

  async getFlow(id: string): Promise<Flow | null> {
    const row = this.db.prepare('SELECT * FROM flows WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      steps: JSON.parse(row.steps),
      frequency: row.frequency,
      confidence: row.confidence,
      lastSeen: row.last_seen
    }
  }
}
