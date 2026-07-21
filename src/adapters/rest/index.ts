import { createServer, IncomingMessage, ServerResponse } from 'http'

type RPCHandler = (method: string, params?: Record<string, unknown>) => Promise<unknown>

interface Route {
  method: 'GET' | 'POST'
  path: string
  rpcMethod: string
  extractParams: (req: IncomingMessage, body: any) => Record<string, unknown>
}

const routes: Route[] = [
  // Session
  { method: 'GET', path: '/status', rpcMethod: 'status', extractParams: () => ({}) },
  { method: 'POST', path: '/navigate', rpcMethod: 'navigate', extractParams: (_r, b) => ({ url: b.url }) },
  { method: 'POST', path: '/explain', rpcMethod: 'explain', extractParams: () => ({}) },
  { method: 'POST', path: '/click', rpcMethod: 'click', extractParams: (_r, b) => ({ ref: b.ref }) },
  { method: 'POST', path: '/screenshot', rpcMethod: 'screenshot', extractParams: () => ({}) },
  { method: 'GET', path: '/tabs', rpcMethod: 'tabs', extractParams: () => ({}) },

  // Memory
  { method: 'POST', path: '/memory/recall', rpcMethod: 'memory.recall', extractParams: (_r, b) => ({ domain: b.domain }) },
  { method: 'POST', path: '/memory/store', rpcMethod: 'memory.store', extractParams: (_r, b) => ({ domain: b.domain, ir: b.ir }) },

  // Diff
  { method: 'POST', path: '/diff/compare', rpcMethod: 'diff.compare', extractParams: (_r, b) => ({ irBefore: b.irBefore, irAfter: b.irAfter }) },

  // Events
  { method: 'GET', path: '/events/:sessionId', rpcMethod: 'events.get', extractParams: (req, b) => {
    const sessionId = req.url?.split('/events/')[1]?.split('?')[0] || ''
    return { sessionId, query: b }
  }},
  { method: 'POST', path: '/events/capture', rpcMethod: 'events.capture', extractParams: (_r, b) => ({
    type: b.type, sessionId: b.sessionId, data: b.data || {}, target: b.target, irHash: b.irHash
  })},

  // Flow
  { method: 'POST', path: '/flow/detect', rpcMethod: 'flow.detect', extractParams: (_r, b) => ({ sessionId: b.sessionId }) },
  { method: 'GET', path: '/flow/list/:domain', rpcMethod: 'flow.list', extractParams: (req) => {
    const domain = req.url?.split('/flow/list/')[1]?.split('?')[0] || ''
    return { domain }
  }},

  // Knowledge
  { method: 'POST', path: '/knowledge/addNode', rpcMethod: 'knowledge.addNode', extractParams: (_r, b) => ({
    type: b.type, label: b.label, properties: b.properties || {}
  })},
  { method: 'POST', path: '/knowledge/addEdge', rpcMethod: 'knowledge.addEdge', extractParams: (_r, b) => ({
    source: b.source, target: b.target, type: b.type, weight: b.weight
  })},
  { method: 'GET', path: '/knowledge/search', rpcMethod: 'knowledge.search', extractParams: (req) => {
    const params = new URL(req.url!, `http://${req.headers.host}`).searchParams
    return { query: params.get('q') || '', type: params.get('type') || undefined }
  }},
  { method: 'POST', path: '/knowledge/traverse', rpcMethod: 'knowledge.traverse', extractParams: (_r, b) => ({
    startId: b.startId, maxDepth: b.maxDepth
  })},

  // Planner
  { method: 'POST', path: '/planner/create', rpcMethod: 'planner.create', extractParams: (_r, b) => ({
    goal: b.goal, domain: b.domain
  })},
  { method: 'POST', path: '/planner/execute', rpcMethod: 'planner.execute', extractParams: (_r, b) => ({ planId: b.planId }) },
  { method: 'GET', path: '/planner/:planId', rpcMethod: 'planner.status', extractParams: (req) => {
    const planId = req.url?.split('/planner/')[1]?.split('?')[0] || ''
    return { planId }
  }},

  // Self-healing
  { method: 'POST', path: '/heal/find', rpcMethod: 'heal.find', extractParams: (_r, b) => ({
    brokenSelector: b.brokenSelector, intent: b.intent, ir: b.ir
  })},

  // Multi-browser
  { method: 'POST', path: '/multi/session', rpcMethod: 'multi.createSession', extractParams: () => ({}) },
  { method: 'POST', path: '/multi/execute', rpcMethod: 'multi.execute', extractParams: (_r, b) => ({ task: b.task }) },
  { method: 'GET', path: '/multi/sessions', rpcMethod: 'multi.sessions', extractParams: () => ({}) },

  // Agent coordination
  { method: 'POST', path: '/agent/register', rpcMethod: 'agent.register', extractParams: (_r, b) => ({
    id: b.id, name: b.name, role: b.role, sessionId: b.sessionId, status: b.status
  })},
  { method: 'POST', path: '/agent/unregister', rpcMethod: 'agent.unregister', extractParams: (_r, b) => ({ id: b.id }) },
  { method: 'POST', path: '/agent/claim', rpcMethod: 'agent.claim', extractParams: (_r, b) => ({
    agentId: b.agentId, type: b.type, target: b.target, value: b.value, timestamp: b.timestamp
  })},
  { method: 'GET', path: '/agent/graph', rpcMethod: 'agent.graph', extractParams: () => ({}) },
]

export class RESTAdapter {
  private server: ReturnType<typeof createServer> | null = null
  private port: number
  private actualPort: number = 0

  constructor(handler: RPCHandler, options: { port?: number } = {}) {
    this.port = options.port || 3081

    this.server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // Health check (no route matching needed)
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        }))
        return
      }

      // Metrics (no route matching needed)
      if (req.method === 'GET' && req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          requests: { total: 0, errors: 0 },
          memory: {
            heapUsed: process.memoryUsage().heapUsed,
            heapTotal: process.memoryUsage().heapTotal,
          },
          uptime: process.uptime(),
        }))
        return
      }

      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      try {
        const body = await readBody(req)
        const route = routes.find(r => r.method === req.method && matchPath(r.path, req.url || ''))

        if (!route) {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not found', url: req.url }))
          return
        }

        const params = route.extractParams(req, body)
        const result = await handler(route.rpcMethod, params)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server!.listen(this.port, () => {
        const addr = this.server!.address()
        if (addr && typeof addr === 'object') {
          this.actualPort = addr.port
        }
        resolve()
      })
    })
  }

  getPort(): number {
    return this.actualPort || this.port
  }

  stop(): void {
    this.server?.close()
  }
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function matchPath(pattern: string, url: string): boolean {
  const path = url.split('?')[0]
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (patternParts.length !== pathParts.length) return false

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue
    if (patternParts[i] !== pathParts[i]) return false
  }
  return true
}
