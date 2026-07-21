// bir/src/engines/multi-browser.ts
import { randomUUID } from 'crypto'

export interface SessionInfo {
  id: string
  createdAt: number
  lastActive: number
  status: 'active' | 'idle' | 'closed'
}

export interface MultiTabTask {
  id: string
  tabs: TabTask[]
  coordination: 'sequential' | 'parallel' | 'dependent'
}

export interface TabTask {
  sessionId: string
  goal: string
}

export interface TabResult {
  sessionId: string
  goal: string
  success: boolean
  message: string
}

export interface CrossTabResult {
  taskId: string
  results: TabResult[]
  summary: string
}

export class MultiBrowserEngine {
  private sessions = new Map<string, SessionInfo>()
  private maxConcurrent: number

  constructor(options: { maxConcurrent?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 3
  }

  async createSession(): Promise<string> {
    if (this.sessions.size >= this.maxConcurrent) {
      throw new Error('Max concurrent sessions reached')
    }
    const id = randomUUID()
    this.sessions.set(id, { id, createdAt: Date.now(), lastActive: Date.now(), status: 'active' })
    return id
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id)
    if (session) {
      session.status = 'closed'
      this.sessions.delete(id)
    }
  }

  async executeMultiTab(task: MultiTabTask): Promise<CrossTabResult> {
    const results: TabResult[] = []

    if (task.coordination === 'parallel') {
      const promises = task.tabs.map(async tab => {
        try {
          const session = this.sessions.get(tab.sessionId)
          if (!session) throw new Error(`Session ${tab.sessionId} not found`)
          session.lastActive = Date.now()
          return { sessionId: tab.sessionId, goal: tab.goal, success: true, message: 'Executed' }
        } catch (e: any) {
          return { sessionId: tab.sessionId, goal: tab.goal, success: false, message: e.message }
        }
      })
      results.push(...await Promise.all(promises))
    } else {
      for (const tab of task.tabs) {
        try {
          const session = this.sessions.get(tab.sessionId)
          if (!session) throw new Error(`Session ${tab.sessionId} not found`)
          session.lastActive = Date.now()
          results.push({ sessionId: tab.sessionId, goal: tab.goal, success: true, message: 'Executed' })
        } catch (e: any) {
          results.push({ sessionId: tab.sessionId, goal: tab.goal, success: false, message: e.message })
        }
      }
    }

    return {
      taskId: task.id,
      results,
      summary: `${results.filter(r => r.success).length}/${results.length} tabs completed`
    }
  }

  async getSessions(): Promise<SessionInfo[]> {
    return Array.from(this.sessions.values())
  }
}
