// bir/src/engines/agent.ts
import type { BrowserIR } from '../ir/types.js'

export interface Agent {
  id: string
  name: string
  role: 'primary' | 'helper' | 'observer'
  sessionId: string
  status: 'idle' | 'working' | 'waiting' | 'done'
  lastAction?: AgentAction
  createdAt: number
}

export interface AgentAction {
  agentId: string
  type: 'click' | 'type' | 'navigate' | 'explain' | 'wait'
  target?: string
  value?: string
  timestamp: number
  result?: unknown
}

export interface AgentGraph {
  agents: Agent[]
  sharedState: SharedPageState
  conflicts: AgentConflict[]
}

export interface SharedPageState {
  currentIR: BrowserIR
  lastUpdated: number
  version: number
}

export interface AgentConflict {
  agentA: string
  agentB: string
  action: AgentAction
  resolution: 'wait' | 'retry' | 'abort'
}

export class AgentCoordinator {
  private agents = new Map<string, Agent>()
  private actions: AgentAction[] = []
  private sharedState: SharedPageState | null = null

  async registerAgent(agent: Omit<Agent, 'createdAt'>): Promise<Agent> {
    const full: Agent = { ...agent, createdAt: Date.now() }
    this.agents.set(agent.id, full)
    return full
  }

  async unregisterAgent(id: string): Promise<void> {
    this.agents.delete(id)
  }

  async claimAction(action: AgentAction): Promise<{ allowed: boolean; reason?: string }> {
    const recent = this.actions.slice(-10)
    const conflict = recent.find(a => 
      a.agentId !== action.agentId && 
      a.type === action.type && 
      a.target === action.target &&
      Date.now() - a.timestamp < 5000
    )
    
    if (conflict) {
      return { allowed: false, reason: `Conflicting action by agent ${conflict.agentId}` }
    }
    
    this.actions.push(action)
    return { allowed: true }
  }

  async getGraph(): Promise<AgentGraph> {
    return {
      agents: Array.from(this.agents.values()),
      sharedState: this.sharedState || { currentIR: null as any, lastUpdated: 0, version: 0 },
      conflicts: []
    }
  }
}
