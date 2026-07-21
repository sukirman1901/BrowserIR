import { describe, it, expect, beforeEach } from 'vitest'
import { AgentCoordinator } from '../../src/engines/agent.js'

describe('AgentCoordinator', () => {
  let coordinator: AgentCoordinator

  beforeEach(() => {
    coordinator = new AgentCoordinator()
  })

  it('should register and unregister agents', async () => {
    await coordinator.registerAgent({
      id: 'agent-1', name: 'Primary', role: 'primary', sessionId: 's1', status: 'idle'
    })
    const graph = await coordinator.getGraph()
    expect(graph.agents.length).toBe(1)
    
    await coordinator.unregisterAgent('agent-1')
    expect((await coordinator.getGraph()).agents.length).toBe(0)
  })

  it('should allow non-conflicting actions', async () => {
    await coordinator.registerAgent({
      id: 'agent-1', name: 'A', role: 'primary', sessionId: 's1', status: 'working'
    })
    const result = await coordinator.claimAction({
      agentId: 'agent-1', type: 'click', target: '@e1', timestamp: Date.now()
    })
    expect(result.allowed).toBe(true)
  })

  it('should detect conflicting actions', async () => {
    await coordinator.registerAgent({
      id: 'agent-1', name: 'A', role: 'primary', sessionId: 's1', status: 'working'
    })
    await coordinator.registerAgent({
      id: 'agent-2', name: 'B', role: 'helper', sessionId: 's1', status: 'working'
    })
    
    await coordinator.claimAction({
      agentId: 'agent-1', type: 'click', target: '@e1', timestamp: Date.now()
    })
    const result = await coordinator.claimAction({
      agentId: 'agent-2', type: 'click', target: '@e1', timestamp: Date.now()
    })
    expect(result.allowed).toBe(false)
  })
})
