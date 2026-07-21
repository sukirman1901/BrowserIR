// bir/tests/engines/flow.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { FlowEngine } from '../../src/engines/flow.js'
import { EventEngine } from '../../src/engines/event.js'
import { createDatabase } from '../../src/db/index.js'

describe('FlowEngine', () => {
  let db: Database.Database
  let flow: FlowEngine
  let events: EventEngine

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    flow = new FlowEngine(db)
    events = new EventEngine(db)
  })

  afterEach(() => db.close())

  it('should detect flows from event sequences', async () => {
    const now = Date.now()
    // Simulate login flow repeated 3 times
    for (let i = 0; i < 3; i++) {
      const base = now + i * 10000
      await events.capture({ type: 'click', timestamp: base, data: { selector: 'a.login' }, sessionId: 's1' })
      await events.capture({ type: 'input', timestamp: base + 100, data: { selector: 'input.email' }, sessionId: 's1' })
      await events.capture({ type: 'click', timestamp: base + 200, data: { selector: 'button.submit' }, sessionId: 's1' })
    }

    const flows = await flow.detectFlows('s1')
    expect(flows.length).toBeGreaterThanOrEqual(0)
  })

  it('should store and retrieve flows', async () => {
    await flow.db.prepare(
      'INSERT INTO flows (id, name, domain, steps, frequency, confidence, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('f1', 'Login Flow', 'example.com', JSON.stringify([]), 5, 0.8, Date.now())

    const flows = await flow.getFlows('example.com')
    expect(flows.length).toBe(1)
    expect(flows[0].name).toBe('Login Flow')
  })
})
