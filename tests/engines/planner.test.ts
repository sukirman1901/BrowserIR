// bir/tests/engines/planner.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { PlannerEngine } from '../../src/engines/planner.js'
import { MemoryEngine } from '../../src/engines/memory.js'
import { DiffEngine } from '../../src/engines/diff.js'
import { SelfHealingEngine } from '../../src/engines/self-healing.js'
import { EventEngine } from '../../src/engines/event.js'
import { FlowEngine } from '../../src/engines/flow.js'
import { createDatabase } from '../../src/db/index.js'

describe('PlannerEngine', () => {
  let db: Database.Database
  let planner: PlannerEngine

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    const memory = new MemoryEngine(db)
    const diff = new DiffEngine(db)
    const healing = new SelfHealingEngine(memory)
    const events = new EventEngine(db)
    const flow = new FlowEngine(db)
    planner = new PlannerEngine(db, memory, diff, healing, events, flow)
  })

  afterEach(() => db.close())

  it('should create a plan from goal', async () => {
    const plan = await planner.createPlan('Login to GitHub', 'github.com')
    expect(plan.id).toBeDefined()
    expect(plan.goal).toBe('Login to GitHub')
    expect(plan.steps.length).toBeGreaterThan(0)
    expect(plan.status).toBe('pending')
  })

  it('should execute plan steps', async () => {
    const plan = await planner.createPlan('Navigate to example.com', 'example.com')
    const result = await planner.executePlan(plan)
    expect(result.plan.status).toBe('completed')
  })

  it('should track plan history', async () => {
    const plan = await planner.createPlan('Test goal', 'example.com')
    await planner.executePlan(plan)
    const retrieved = await planner.getPlan(plan.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.context.history.length).toBeGreaterThan(0)
  })

  it('should persist plans in DB across engine restarts', async () => {
    const plan = await planner.createPlan('Login to GitHub', 'github.com')
    expect(plan.id).toBeDefined()

    // Create new PlannerEngine with same DB
    const memory2 = new MemoryEngine(db)
    const diff2 = new DiffEngine(db)
    const healing2 = new SelfHealingEngine(memory2)
    const events2 = new EventEngine(db)
    const flow2 = new FlowEngine(db)
    const planner2 = new PlannerEngine(db, memory2, diff2, healing2, events2, flow2)

    const retrieved = await planner2.getPlan(plan.id)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.goal).toBe('Login to GitHub')
    expect(retrieved!.status).toBe('pending')
  })
})
