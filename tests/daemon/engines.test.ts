// bir/tests/daemon/engines.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { EngineManager } from '../../src/daemon/engines.js'
import { createDatabase } from '../../src/db/index.js'

describe('EngineManager', () => {
  let db: Database.Database
  let manager: EngineManager

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    manager = new EngineManager(db)
  })

  afterEach(() => db.close())

  it('should initialize all 9 engines', () => {
    expect(manager.memory).toBeDefined()
    expect(manager.diff).toBeDefined()
    expect(manager.events).toBeDefined()
    expect(manager.healing).toBeDefined()
    expect(manager.flow).toBeDefined()
    expect(manager.knowledge).toBeDefined()
    expect(manager.planner).toBeDefined()
    expect(manager.multi).toBeDefined()
    expect(manager.agent).toBeDefined()
  })

  it('should store and recall knowledge via memory engine', async () => {
    const entry = await manager.memory.remember('https://example.com', {
      url: 'https://example.com',
      title: 'Test',
      sections: [],
      components: [],
      metadata: {},
    } as any)
    expect(entry).toBeDefined()
    expect(entry.domain).toBe('example.com')

    const recalled = await manager.memory.recall('https://example.com')
    expect(recalled).not.toBeNull()
    expect(recalled!.domain).toBe('example.com')
  })

  it('should handle planner create and execute', async () => {
    const plan = await manager.planner.createPlan('Login to GitHub', 'github.com')
    expect(plan.steps.length).toBeGreaterThan(0)
    const result = await manager.planner.executePlan(plan)
    expect(result.plan.status).toBe('completed')
  })

  it('should add and traverse knowledge graph', async () => {
    const node1 = await manager.knowledge.addNode('site', 'Example', { url: 'example.com' })
    const node2 = await manager.knowledge.addNode('site', 'GitHub', { url: 'github.com' })
    const edge = await manager.knowledge.addEdge(node1.id, node2.id, 'links_to', 0.8)

    expect(edge.source).toBe(node1.id)
    expect(edge.target).toBe(node2.id)

    const graph = await manager.knowledge.traverse(node1.id, 2)
    expect(graph.nodes.length).toBeGreaterThanOrEqual(2)
    expect(graph.edges.length).toBeGreaterThanOrEqual(1)
  })

  it('should capture and query events', async () => {
    await manager.events.capture({
      type: 'click',
      timestamp: Date.now(),
      data: { selector: 'button.submit' },
      sessionId: 'test-session',
    })

    const events = await manager.events.getEvents('test-session')
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('click')
  })

  it('should create and destroy multi-browser sessions', async () => {
    const sessionId = await manager.multi.createSession()
    expect(sessionId).toBeDefined()

    const sessions = await manager.multi.getSessions()
    expect(sessions.length).toBe(1)
    expect(sessions[0].status).toBe('active')

    await manager.multi.destroySession(sessionId)
    const afterDestroy = await manager.multi.getSessions()
    expect(afterDestroy.length).toBe(0)
  })

  it('should register and coordinate agents', async () => {
    const agent = await manager.agent.registerAgent({
      id: 'agent-1', name: 'Primary', role: 'primary', sessionId: 's1', status: 'idle'
    })
    expect(agent.id).toBe('agent-1')
    expect(agent.createdAt).toBeDefined()

    const graph = await manager.agent.getGraph()
    expect(graph.agents.length).toBe(1)

    const claim = await manager.agent.claimAction({
      agentId: 'agent-1', type: 'click', target: '@e1', timestamp: Date.now()
    })
    expect(claim.allowed).toBe(true)

    await manager.agent.unregisterAgent('agent-1')
    expect((await manager.agent.getGraph()).agents.length).toBe(0)
  })
})
