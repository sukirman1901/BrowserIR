// bir/src/engines/event.ts
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface EventEntry {
  id: string
  type: 'navigation' | 'click' | 'input' | 'scroll' | 'mutation' | 'error' | 'network'
  timestamp: number
  target?: any
  data: Record<string, any>
  sessionId: string
  irHash?: string
}

export interface EventPattern {
  type: 'click_sequence' | 'form_fill' | 'navigation_chain' | 'error_repeat'
  events: EventEntry[]
  frequency: number
  confidence: number
  description: string
}

export interface EventSequence {
  events: EventEntry[]
  intent: string
  duration: number
}

export interface EventQuery {
  type?: string
  since?: number
  limit?: number
}

export class EventEngine {
  private insertStmt: Database.Statement
  private getEventsStmt: Database.Statement

  constructor(private db: Database.Database) {
    this.insertStmt = db.prepare(`
      INSERT INTO events (id, type, session_id, target, data, ir_hash, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    this.getEventsStmt = db.prepare('SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC')
  }

  async capture(event: Omit<EventEntry, 'id'>): Promise<EventEntry> {
    const id = randomUUID()
    this.insertStmt.run(
      id,
      event.type,
      event.sessionId,
      event.target ? JSON.stringify(event.target) : null,
      JSON.stringify(event.data),
      event.irHash || null,
      event.timestamp
    )
    return { ...event, id }
  }

  async getEvents(sessionId: string, options?: EventQuery): Promise<EventEntry[]> {
    let sql = 'SELECT * FROM events WHERE session_id = ?'
    const params: any[] = [sessionId]
    if (options?.type) { sql += ' AND type = ?'; params.push(options.type) }
    if (options?.since) { sql += ' AND timestamp > ?'; params.push(options.since) }
    sql += ' ORDER BY timestamp ASC'
    if (options?.limit) { sql += ' LIMIT ?'; params.push(options.limit) }
    const rows = this.db.prepare(sql).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      timestamp: r.timestamp,
      target: r.target ? JSON.parse(r.target) : undefined,
      data: JSON.parse(r.data),
      sessionId: r.session_id,
      irHash: r.ir_hash
    }))
  }

  async getPatterns(domain: string): Promise<EventPattern[]> {
    const events = this.db.prepare(
      "SELECT * FROM events WHERE data LIKE ? ORDER BY timestamp ASC"
    ).all(`%${domain}%`) as any[]

    const patterns: EventPattern[] = []
    const clickGroups = new Map<string, any[]>()

    for (const e of events) {
      if (e.type === 'click') {
        const data = JSON.parse(e.data)
        const key = data.selector || 'unknown'
        if (!clickGroups.has(key)) clickGroups.set(key, [])
        clickGroups.get(key)!.push(e)
      }
    }

    for (const [selector, group] of clickGroups) {
      if (group.length >= 2) {
        patterns.push({
          type: 'click_sequence',
          events: group.map((e: any) => ({ id: e.id, type: e.type, timestamp: e.timestamp, data: JSON.parse(e.data), sessionId: e.session_id })),
          frequency: group.length,
          confidence: Math.min(1, group.length / 5),
          description: `Repeated click on ${selector}`
        })
      }
    }

    return patterns
  }

  async getSequences(sessionId: string, minLength: number = 2): Promise<EventSequence[]> {
    const events = await this.getEvents(sessionId)
    const sequences: EventSequence[] = []
    let current: EventEntry[] = []

    for (const event of events) {
      if (current.length > 0 && event.timestamp - current[current.length - 1].timestamp > 5000) {
        if (current.length >= minLength) {
          sequences.push({
            events: current,
            intent: current.map(e => e.type).join(' → '),
            duration: current[current.length - 1].timestamp - current[0].timestamp
          })
        }
        current = []
      }
      current.push(event)
    }

    if (current.length >= minLength) {
      sequences.push({
        events: current,
        intent: current.map(e => e.type).join(' → '),
        duration: current[current.length - 1].timestamp - current[0].timestamp
      })
    }

    return sequences
  }
}
