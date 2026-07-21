// bir/src/engines/agent.ts
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

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
  currentIR: any
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
  private stmts: {
    insertAgent: Database.Statement
    getAgent: Database.Statement
    updateAgent: Database.Statement
    deleteAgent: Database.Statement
    insertAction: Database.Statement
    getRecentActions: Database.Statement
  }
  private conflictsList: AgentConflict[] = []
  private sharedState: SharedPageState | null = null

  constructor(private db: Database.Database) {
    this.stmts = {
      insertAgent: db.prepare(`
        INSERT INTO agents (id, name, role, session_id, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `),
      getAgent: db.prepare('SELECT * FROM agents WHERE id = ?'),
      updateAgent: db.prepare('UPDATE agents SET status = ?, last_action = ? WHERE id = ?'),
      deleteAgent: db.prepare('DELETE FROM agents WHERE id = ?'),
      insertAction: db.prepare(`
        INSERT INTO agent_actions (id, agent_id, type, target, value, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `),
      getRecentActions: db.prepare(`
        SELECT * FROM agent_actions WHERE agent_id = ? ORDER BY timestamp DESC LIMIT 10
      `),
    }
  }

  async registerAgent(agent: Omit<Agent, 'createdAt'>): Promise<Agent> {
    const now = Date.now()
    this.stmts.insertAgent.run(agent.id, agent.name, agent.role, agent.sessionId, agent.status, now)
    return { ...agent, createdAt: now }
  }

  async unregisterAgent(id: string): Promise<void> {
    // Delete associated actions first to avoid FOREIGN KEY constraint
    this.db.prepare('DELETE FROM agent_actions WHERE agent_id = ?').run(id)
    this.stmts.deleteAgent.run(id)
  }

  async claimAction(action: AgentAction): Promise<{ allowed: boolean; reason?: string }> {
    // Check for conflicting actions in last 5 seconds
    const recent = this.db.prepare(`
      SELECT * FROM agent_actions 
      WHERE agent_id != ? AND type = ? AND target = ? AND timestamp > ?
      ORDER BY timestamp DESC LIMIT 1
    `).all(action.agentId, action.type, action.target, Date.now() - 5000) as any[]

    if (recent.length > 0) {
      const conflictEntry: AgentConflict = {
        agentA: recent[0].agent_id,
        agentB: action.agentId,
        action,
        resolution: 'wait',
      }
      this.conflictsList.push(conflictEntry)
      return { allowed: false, reason: `Conflicting action by agent ${recent[0].agent_id}` }
    }

    // Record action
    const id = randomUUID()
    this.stmts.insertAction.run(id, action.agentId, action.type, action.target, action.value, action.timestamp)
    
    // Update agent status
    this.stmts.updateAgent.run('working', JSON.stringify(action), action.agentId)
    
    return { allowed: true }
  }

  async updateSharedState(ir: any): Promise<SharedPageState> {
    const currentVersion = this.sharedState ? this.sharedState.version + 1 : 1
    this.sharedState = {
      currentIR: ir,
      lastUpdated: Date.now(),
      version: currentVersion,
    }
    return this.sharedState
  }

  async getGraph(): Promise<AgentGraph> {
    const agents = this.db.prepare('SELECT * FROM agents').all() as any[]
    return {
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        sessionId: a.session_id,
        status: a.status,
        lastAction: a.last_action ? JSON.parse(a.last_action) : undefined,
        createdAt: a.created_at,
      })),
      sharedState: this.sharedState || { currentIR: null, lastUpdated: 0, version: 0 },
      conflicts: this.conflictsList,
    }
  }
}
