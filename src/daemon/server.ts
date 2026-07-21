import { BrowserSession, type SessionOptions } from './session.js'
import { UnixTransport, type RPCHandler } from './transport.js'
import { WebSocketTransport, type WSHandler } from './websocket.js'
import { RESTAdapter } from '../adapters/rest/index.js'
import type { BrowserIR } from '../ir/types.js'
import { EngineManager } from './engines.js'
import { createDatabase } from '../db/index.js'
import type Database from 'better-sqlite3'

interface DaemonState {
  session: BrowserSession | null
  transport: UnixTransport | null
  wsTransport: WebSocketTransport | null
  restTransport: RESTAdapter | null
  engines: EngineManager | null
  db: Database.Database | null
  options: SessionOptions
}

const state: DaemonState = {
  session: null,
  transport: null,
  wsTransport: null,
  restTransport: null,
  engines: null,
  db: null,
  options: {},
}

const handler: RPCHandler = async (
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> => {
  // ── Session management (pre-existing) ──

  switch (method) {
    case 'start': {
      const options = params as SessionOptions | undefined
      state.options = options || {}
      state.session = new BrowserSession(state.options)
      await state.session.start()

      // Initialize engines on first start
      if (!state.db) {
        state.db = await createDatabase(':memory:')
        state.engines = new EngineManager(state.db)
      }

      return { status: 'started' }
    }

    case 'stop': {
      if (state.session) {
        await state.session.stop()
        state.session = null
      }
      return { status: 'stopped' }
    }

    case 'navigate': {
      if (!state.session) throw new Error('Session not started')
      const url = params?.url as string
      if (!url) throw new Error('URL required')
      await state.session.navigate(url)
      return { status: 'navigated', url }
    }

    case 'explain': {
      if (!state.session) throw new Error('Session not started')
      const ir: BrowserIR = await state.session.explain()
      return ir
    }

    case 'click': {
      if (!state.session) throw new Error('Session not started')
      const ref = params?.ref as string
      if (!ref) throw new Error('Ref required')
      await state.session.click(ref)
      return { status: 'clicked', ref }
    }

    case 'screenshot': {
      if (!state.session) throw new Error('Session not started')
      const base64 = await state.session.screenshot()
      return { screenshot: base64 }
    }

    case 'tabs': {
      if (!state.session) throw new Error('Session not started')
      const tabs = await state.session.getTabs()
      return { tabs }
    }

    case 'status': {
      return {
        running: !!state.session,
        options: state.options,
        engines: !!state.engines,
      }
    }

    // ── Memory engine ──

    case 'memory.recall': {
      ensureEngines()
      const domain = params?.domain as string
      if (!domain) throw new Error('domain required')
      const entry = await state.engines!.memory.recall(domain)
      return entry
    }

    case 'memory.store': {
      ensureEngines()
      const { domain, ir } = params as { domain: string; ir: BrowserIR }
      if (!domain || !ir) throw new Error('domain and ir required')
      const entry = await state.engines!.memory.remember(
        `https://${domain}`,
        ir
      )
      return { stored: true, entry }
    }

    // ── Diff engine ──

    case 'diff.compare': {
      ensureEngines()
      const { irBefore, irAfter } = params as {
        irBefore: BrowserIR
        irAfter: BrowserIR
      }
      if (!irBefore || !irAfter) throw new Error('irBefore and irAfter required')
      const result = await state.engines!.diff.diffIRs(irBefore, irAfter)
      return result
    }

    // ── Event engine ──

    case 'events.get': {
      ensureEngines()
      const { sessionId, query } = params as {
        sessionId: string
        query?: { type?: string; since?: number; limit?: number }
      }
      if (!sessionId) throw new Error('sessionId required')
      const events = await state.engines!.events.getEvents(sessionId, query)
      return { events }
    }

    case 'events.capture': {
      ensureEngines()
      const { type, sessionId, data, target, irHash } = params as {
        type: 'navigation' | 'click' | 'input' | 'scroll' | 'mutation' | 'error' | 'network'
        sessionId: string
        data: Record<string, any>
        target?: any
        irHash?: string
      }
      if (!type || !sessionId) throw new Error('type and sessionId required')
      const event = await state.engines!.events.capture({
        type,
        timestamp: Date.now(),
        data: data || {},
        target,
        sessionId,
        irHash,
      })
      // Broadcast to WebSocket clients (dashboard EventFeed)
      state.wsTransport?.broadcast({ type: 'event', event })
      return event
    }

    // ── Flow engine ──

    case 'flow.detect': {
      ensureEngines()
      const sessionId = params?.sessionId as string
      if (!sessionId) throw new Error('sessionId required')
      const flows = await state.engines!.flow.detectFlows(sessionId)
      return { flows }
    }

    case 'flow.list': {
      ensureEngines()
      const domain = params?.domain as string
      if (!domain) throw new Error('domain required')
      const flows = await state.engines!.flow.getFlows(domain)
      return { flows }
    }

    // ── Knowledge engine ──

    case 'knowledge.addNode': {
      ensureEngines()
      const { type, label, properties } = params as {
        type: string
        label: string
        properties: Record<string, any>
      }
      if (!type || !label) throw new Error('type and label required')
      const node = await state.engines!.knowledge.addNode(type, label, properties || {})
      return node
    }

    case 'knowledge.addEdge': {
      ensureEngines()
      const { source, target, type, weight } = params as {
        source: string
        target: string
        type: string
        weight?: number
      }
      if (!source || !target || !type) throw new Error('source, target, and type required')
      const edge = await state.engines!.knowledge.addEdge(source, target, type, weight || 0.5)
      return edge
    }

    case 'knowledge.search': {
      ensureEngines()
      const { query, type } = params as { query: string; type?: string }
      if (!query) throw new Error('query required')
      let nodes
      if (type) {
        nodes = await state.engines!.knowledge.findSimilar(type)
      } else {
        nodes = await state.engines!.knowledge.searchByLabel(query)
      }
      return { nodes }
    }

    case 'knowledge.traverse': {
      ensureEngines()
      const { startId, maxDepth } = params as { startId: string; maxDepth?: number }
      if (!startId) throw new Error('startId required')
      const graph = await state.engines!.knowledge.traverse(startId, maxDepth || 3)
      return graph
    }

    // ── Planner engine ──

    case 'planner.create': {
      ensureEngines()
      const { goal, domain } = params as { goal: string; domain: string }
      if (!goal || !domain) throw new Error('goal and domain required')
      const plan = await state.engines!.planner.createPlan(goal, domain)
      return plan
    }

    case 'planner.execute': {
      ensureEngines()
      const planId = params?.planId as string
      if (!planId) throw new Error('planId required')
      const plan = await state.engines!.planner.getPlan(planId)
      if (!plan) throw new Error(`Plan ${planId} not found`)
      const result = await state.engines!.planner.executePlan(plan, state.session?.page)
      return result
    }

    case 'planner.status': {
      ensureEngines()
      const planId = params?.planId as string
      if (!planId) throw new Error('planId required')
      const plan = await state.engines!.planner.getPlan(planId)
      if (!plan) throw new Error(`Plan ${planId} not found`)
      return plan
    }

    // ── Self-healing engine ──

    case 'heal.find': {
      ensureEngines()
      const { brokenSelector, intent, ir } = params as {
        brokenSelector: string
        intent?: string
        ir: BrowserIR
      }
      if (!brokenSelector || !ir) throw new Error('brokenSelector and ir required')
      const result = await state.engines!.healing.heal(brokenSelector, ir, intent)
      return result
    }

    // ── Multi-browser engine ──

    case 'multi.createSession': {
      ensureEngines()
      const sessionId = await state.engines!.multi.createSession()
      return { sessionId }
    }

    case 'multi.execute': {
      ensureEngines()
      const { task } = params as { task: any }
      if (!task) throw new Error('task required')
      const result = await state.engines!.multi.executeMultiTab(task)
      return result
    }

    case 'multi.sessions': {
      ensureEngines()
      const sessions = await state.engines!.multi.getSessions()
      return { sessions }
    }

    // ── Agent coordination ──

    case 'agent.register': {
      ensureEngines()
      const { id, name, role, sessionId, status: agentStatus } = params as {
        id: string
        name: string
        role: 'primary' | 'helper' | 'observer'
        sessionId: string
        status: 'idle' | 'working' | 'waiting' | 'done'
      }
      if (!id || !name || !role || !sessionId) throw new Error('id, name, role, and sessionId required')
      const agent = await state.engines!.agent.registerAgent({ id, name, role, sessionId, status: agentStatus || 'idle' })
      return agent
    }

    case 'agent.unregister': {
      ensureEngines()
      const agentId = params?.id as string
      if (!agentId) throw new Error('id required')
      await state.engines!.agent.unregisterAgent(agentId)
      return { unregistered: true }
    }

    case 'agent.claim': {
      ensureEngines()
      const action = params as { agentId: string; type: string; target?: string; value?: string; timestamp: number }
      if (!action.agentId || !action.type) throw new Error('agentId and type required')
      const result = await state.engines!.agent.claimAction(action as any)
      return result
    }

    case 'agent.graph': {
      ensureEngines()
      const graph = await state.engines!.agent.getGraph()
      return graph
    }

    default:
      throw new Error(`Unknown method: ${method}`)
  }
}

function ensureEngines(): void {
  if (!state.engines) throw new Error('Engines not initialized. Call start first.')
}

// WebSocket handler — wraps the same RPC handler for WebSocket clients
const wsHandler: WSHandler = async (req) => {
  return handler(req.method, req.params)
}

async function main() {
  console.log('browserd starting...')

  state.transport = new UnixTransport(handler)
  state.wsTransport = new WebSocketTransport({ port: 3080 })
  state.restTransport = new RESTAdapter(handler, { port: 3081 })

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('browserd shutting down...')
    if (state.session) await state.session.stop()
    if (state.transport) await state.transport.stop()
    if (state.wsTransport) state.wsTransport.stop()
    if (state.restTransport) state.restTransport.stop()
    if (state.db) state.db.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  state.wsTransport.onRequest(wsHandler)
  await state.transport.start()
  await state.wsTransport.start()
  await state.restTransport.start()
  console.log(`browserd WebSocket listening on ws://localhost:${state.wsTransport.getPort()}`)
  console.log(`browserd REST API listening on http://localhost:${state.restTransport.getPort()}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
