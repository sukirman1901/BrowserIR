import WebSocket from 'ws'
import { EventEmitter } from 'events'

export interface BIRClientOptions {
  host?: string
  port?: number
}

export class BIRClient extends EventEmitter {
  private ws: WebSocket | null = null
  private host: string
  private port: number
  private pending = new Map<string, { resolve: Function, reject: Function }>()

  constructor(options: BIRClientOptions = {}) {
    super()
    this.host = options.host || 'localhost'
    this.port = options.port || 3080
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${this.host}:${this.port}`)
      this.ws.on('open', () => resolve())
      this.ws.on('error', reject)
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString())
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id)!
          this.pending.delete(msg.id)
          if (msg.error) reject(new Error(msg.error.message))
          else resolve(msg.result)
        } else if (msg.type === 'event') {
          this.emit('event', msg.data)
        }
      })
    })
  }

  async rpc(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('Not connected'))
      const id = Math.random().toString(36).slice(2)
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  // Convenience methods
  async explain(url?: string) {
    if (url) await this.rpc('navigate', { url })
    return this.rpc('explain')
  }

  async screenshot() {
    return this.rpc('screenshot')
  }

  async click(ref: string) {
    return this.rpc('click', { ref })
  }

  get memory() {
    return {
      recall: (domain: string) => this.rpc('memory.recall', { domain }),
      store: (data: any) => this.rpc('memory.store', data)
    }
  }

  get planner() {
    return {
      create: (goal: string, domain: string) => this.rpc('planner.create', { goal, domain }),
      execute: (planId: string) => this.rpc('planner.execute', { planId }),
      status: (planId: string) => this.rpc('planner.status', { planId })
    }
  }

  get agents() {
    return {
      register: (agent: any) => this.rpc('agent.register', agent),
      unregister: (id: string) => this.rpc('agent.unregister', { id }),
      claim: (agentId: string, action: any) => this.rpc('agent.claim', { agentId, ...action }),
      graph: () => this.rpc('agent.graph')
    }
  }

  disconnect() {
    this.ws?.close()
  }
}
