// bir/tests/integration/engines.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { createDatabase } from '../../src/db/index.js'
import { MemoryEngine } from '../../src/engines/memory.js'
import { DiffEngine } from '../../src/engines/diff.js'
import { EventEngine } from '../../src/engines/event.js'
import { SelfHealingEngine } from '../../src/engines/self-healing.js'
import { FlowEngine } from '../../src/engines/flow.js'
import { KnowledgeEngine } from '../../src/engines/knowledge.js'
import { PlannerEngine } from '../../src/engines/planner.js'
import { MultiBrowserEngine } from '../../src/engines/multi-browser.js'

describe('Engine Integration', () => {
  let db: Database.Database
  let memory: MemoryEngine
  let diff: DiffEngine
  let events: EventEngine
  let healing: SelfHealingEngine
  let flow: FlowEngine
  let knowledge: KnowledgeEngine
  let planner: PlannerEngine
  let multi: MultiBrowserEngine

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    memory = new MemoryEngine(db)
    diff = new DiffEngine(db)
    events = new EventEngine(db)
    healing = new SelfHealingEngine(memory)
    flow = new FlowEngine(db)
    knowledge = new KnowledgeEngine(db)
    planner = new PlannerEngine(db, memory, diff, healing, events, flow)
    multi = new MultiBrowserEngine()
  })

  afterEach(() => db.close())

  it('should compose all engines together', async () => {
    // Memory stores knowledge
    const entry = await memory.remember('https://example.com', { url: 'https://example.com', title: 'Test', sections: [], components: [], metadata: {} } as any)
    expect(entry.domain).toBe('example.com')

    // Knowledge graph stores nodes
    const node = await knowledge.addNode('site', 'Example', { url: 'example.com' })
    expect(node.label).toBe('Example')

    // Events capture actions
    await events.capture({ type: 'click', timestamp: Date.now(), data: { selector: 'button' }, sessionId: 's1' })

    // Planner creates plan
    const plan = await planner.createPlan('Navigate to example.com', 'example.com')
    expect(plan.steps.length).toBeGreaterThan(0)

    // Multi-browser creates session
    const sessionId = await multi.createSession()
    expect(sessionId).toBeDefined()
  })
})
