import { z } from 'zod'
import { RPCClient } from '../../daemon/transport.js'
import type { BrowserIR, BrowserSession } from '../../browserIR/session.js'
import { explain as explainImpl, analyze as analyzeImpl } from '../../browserIR/session.js'

let sharedClient: RPCClient | null = null
let sessionStarted = false

async function getClient(): Promise<RPCClient> {
  if (!sharedClient) {
    sharedClient = new RPCClient()
    await sharedClient.connect()
  }
  return sharedClient
}

async function ensureSession(): Promise<void> {
  if (!sessionStarted) {
    const client = await getClient()
    await client.call('start', {})
    sessionStarted = true
  }
}

async function rpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
  await ensureSession()
  const client = await getClient()
  return client.call(method, params)
}

function resetClient(): void {
  sharedClient = null
  sessionStarted = false
}

// ── Core Navigation & Analysis Tools ──

export const explainTool = {
  name: 'bir_explain',
  description:
    'Analyze a web page and return its semantic structure — intent, components, actions, flow, and risks. No CSS selectors needed.',
  inputSchema: {
    url: z.string().url().describe('The URL to analyze'),
  },
  handler: async ({ url }: { url: string }): Promise<BrowserIR> => {
    return await explainImpl(url)
  },
}

export const clickTool = {
  name: 'bir_click',
  description:
    'Click a component by its semantic ref (e.g., "@e3"). No CSS selectors needed.',
  inputSchema: {
    ref: z.string().describe('Component ref from browser explain (e.g., "@e3")'),
  },
  handler: async ({ ref }: { ref: string }) => {
    await rpc('click', { ref })
  },
}

export const graphTool = {
  name: 'bir_graph',
  description:
    'Get the page structure as a tree graph showing sections, components, and their relationships.',
  inputSchema: {
    url: z.string().url().describe('The URL to analyze'),
  },
  handler: async ({ url }: { url: string }) => {
    const session = await analyzeImpl(url)
    return session.graph()
  },
}

export const screenshotTool = {
  name: 'bir_screenshot',
  description: 'Take a screenshot of the current page.',
  inputSchema: {},
  handler: async () => {
    return rpc('screenshot') as Promise<{ screenshot: string }>
  },
}

export const navigateTool = {
  name: 'bir_navigate',
  description: 'Navigate to a URL in the browser.',
  inputSchema: {
    url: z.string().url().describe('URL to navigate to'),
  },
  handler: async ({ url }: { url: string }) => {
    await rpc('navigate', { url })
  },
}

export const tabsTool = {
  name: 'bir_tabs',
  description: 'List all open browser tabs.',
  inputSchema: {},
  handler: async () => {
    return rpc('tabs')
  },
}

export const statusTool = {
  name: 'bir_status',
  description: 'Check daemon status.',
  inputSchema: {},
  handler: async () => {
    return rpc('status')
  },
}

export const analyzeTool = {
  name: 'analyze',
  description: 'Create a BrowserSession for analysis and interaction',
  inputSchema: {
    url: z.string().url().describe('URL to analyze'),
  },
  handler: async ({ url }: { url: string }): Promise<BrowserSession> => {
    return await analyzeImpl(url)
  },
}

// ── Semantic Analysis ──

export const flowDetectTool = {
  name: 'bir_flow_detect',
  description: 'Detect multi-step flows from captured events for a session.',
  inputSchema: {
    sessionId: z.string().describe('Session ID to analyze'),
  },
  handler: async ({ sessionId }: { sessionId: string }) => {
    return rpc('flow.detect', { sessionId })
  },
}

export const flowListTool = {
  name: 'bir_flow_list',
  description: 'List known flows for a domain.',
  inputSchema: {
    domain: z.string().describe('Domain name'),
  },
  handler: async ({ domain }: { domain: string }) => {
    return rpc('flow.list', { domain })
  },
}

export const diffCompareTool = {
  name: 'bir_diff_compare',
  description: 'Compare two BrowserIR snapshots semantically.',
  inputSchema: {
    irBefore: z.any().describe('Before snapshot BrowserIR object'),
    irAfter: z.any().describe('After snapshot BrowserIR object'),
  },
  handler: async ({ irBefore, irAfter }: { irBefore: any; irAfter: any }) => {
    return rpc('diff.compare', { irBefore, irAfter })
  },
}

// ── Memory System ──

export const memoryRecallTool = {
  name: 'bir_memory_recall',
  description: 'Recall learned knowledge about a domain.',
  inputSchema: {
    domain: z.string().describe('Domain name to recall'),
  },
  handler: async ({ domain }: { domain: string }) => {
    return rpc('memory.recall', { domain })
  },
}

export const memoryStoreTool = {
  name: 'bir_memory_store',
  description: 'Store BrowserIR knowledge about a domain.',
  inputSchema: {
    domain: z.string().describe('Domain name'),
    ir: z.any().describe('BrowserIR page object to remember'),
  },
  handler: async ({ domain, ir }: { domain: string; ir: any }) => {
    return rpc('memory.store', { domain, ir })
  },
}

// ── Knowledge Graph ──

export const knowledgeAddNodeTool = {
  name: 'bir_knowledge_add_node',
  description: 'Add node to knowledge graph.',
  inputSchema: {
    type: z.string().describe('Node type'),
    label: z.string().describe('Node label'),
    properties: z.record(z.any()).optional().describe('Node properties'),
  },
  handler: async (params: { type: string; label: string; properties?: Record<string, any> }) => {
    return rpc('knowledge.addNode', params)
  },
}

export const knowledgeAddEdgeTool = {
  name: 'bir_knowledge_add_edge',
  description: 'Add edge between knowledge nodes.',
  inputSchema: {
    source: z.string().describe('Source node ID'),
    target: z.string().describe('Target node ID'),
    type: z.string().describe('Edge type'),
    weight: z.number().optional().describe('Edge weight'),
  },
  handler: async (params: { source: string; target: string; type: string; weight?: number }) => {
    return rpc('knowledge.addEdge', params)
  },
}

export const knowledgeSearchTool = {
  name: 'bir_knowledge_search',
  description: 'Search knowledge graph by label or type.',
  inputSchema: {
    query: z.string().describe('Search query'),
    type: z.string().optional().describe('Filter by node type'),
  },
  handler: async (params: { query: string; type?: string }) => {
    return rpc('knowledge.search', params)
  },
}

export const knowledgeTraverseTool = {
  name: 'bir_knowledge_traverse',
  description: 'Traverse graph from starting node.',
  inputSchema: {
    startId: z.string().describe('Starting node ID'),
    maxDepth: z.number().optional().describe('Maximum traversal depth'),
  },
  handler: async (params: { startId: string; maxDepth?: number }) => {
    return rpc('knowledge.traverse', params)
  },
}

// ── Event System ──

export const eventsCaptureTool = {
  name: 'bir_events_capture',
  description: 'Capture custom event into event stream.',
  inputSchema: {
    type: z.string().describe('Event type'),
    sessionId: z.string().describe('Session ID'),
    data: z.record(z.any()).optional().describe('Event data payload'),
  },
  handler: async (params: { type: string; sessionId: string; data?: Record<string, any> }) => {
    return rpc('events.capture', params)
  },
}

export const eventsGetTool = {
  name: 'bir_events_get',
  description: 'Query captured events for a session.',
  inputSchema: {
    sessionId: z.string().describe('Session ID'),
    query: z.record(z.any()).optional().describe('Filter query options'),
  },
  handler: async (params: { sessionId: string; query?: Record<string, any> }) => {
    return rpc('events.get', params)
  },
}

// ── Planner Engine ──

export const plannerCreateTool = {
  name: 'bir_planner_create',
  description: 'Create execution plan for a goal.',
  inputSchema: {
    goal: z.string().describe('Goal description'),
    domain: z.string().describe('Target domain'),
  },
  handler: async (params: { goal: string; domain: string }) => {
    return rpc('planner.create', params)
  },
}

export const plannerExecuteTool = {
  name: 'bir_planner_execute',
  description: 'Execute a plan by ID.',
  inputSchema: {
    planId: z.string().describe('Plan ID to execute'),
  },
  handler: async ({ planId }: { planId: string }) => {
    return rpc('planner.execute', { planId })
  },
}

export const plannerStatusTool = {
  name: 'bir_planner_status',
  description: 'Get status of a plan.',
  inputSchema: {
    planId: z.string().describe('Plan ID'),
  },
  handler: async ({ planId }: { planId: string }) => {
    return rpc('planner.status', { planId })
  },
}

// ── Self-Healing ──

export const healFindTool = {
  name: 'bir_heal_find',
  description: 'Find replacement for broken selector using semantic IR.',
  inputSchema: {
    brokenSelector: z.string().describe('Broken selector string'),
    ir: z.any().describe('BrowserIR page object'),
    intent: z.string().optional().describe('Target intent'),
  },
  handler: async (params: { brokenSelector: string; ir: any; intent?: string }) => {
    return rpc('heal.find', params)
  },
}

// ── Multi-Browser ──

export const multiCreateSessionTool = {
  name: 'bir_multi_create_session',
  description: 'Create new multi-browser session.',
  inputSchema: {},
  handler: async () => {
    return rpc('multi.createSession')
  },
}

export const multiExecuteTool = {
  name: 'bir_multi_execute',
  description: 'Execute task across multiple tabs.',
  inputSchema: {
    task: z.any().describe('Multi-browser task specification'),
  },
  handler: async ({ task }: { task: any }) => {
    return rpc('multi.execute', { task })
  },
}

export const multiSessionsTool = {
  name: 'bir_multi_sessions',
  description: 'List all multi-browser sessions.',
  inputSchema: {},
  handler: async () => {
    return rpc('multi.sessions')
  },
}

// ── Agent Coordination ──

export const agentRegisterTool = {
  name: 'bir_agent_register',
  description: 'Register agent for coordination.',
  inputSchema: {
    id: z.string().describe('Agent ID'),
    name: z.string().describe('Agent Name'),
    role: z.enum(['primary', 'helper', 'observer']).describe('Agent role'),
    sessionId: z.string().describe('Session ID'),
    status: z.enum(['idle', 'working', 'waiting', 'done']).optional().describe('Initial status'),
  },
  handler: async (params: any) => {
    return rpc('agent.register', params)
  },
}

export const agentUnregisterTool = {
  name: 'bir_agent_unregister',
  description: 'Unregister agent.',
  inputSchema: {
    id: z.string().describe('Agent ID to unregister'),
  },
  handler: async ({ id }: { id: string }) => {
    return rpc('agent.unregister', { id })
  },
}

export const agentClaimTool = {
  name: 'bir_agent_claim',
  description: 'Claim work on specific action.',
  inputSchema: {
    agentId: z.string().describe('Agent ID'),
    type: z.string().describe('Action type'),
    target: z.string().optional().describe('Target element/action'),
    value: z.string().optional().describe('Value'),
  },
  handler: async (params: any) => {
    return rpc('agent.claim', { ...params, timestamp: Date.now() })
  },
}

export const agentGraphTool = {
  name: 'bir_agent_graph',
  description: 'Show agent dependency graph.',
  inputSchema: {},
  handler: async () => {
    return rpc('agent.graph')
  },
}

export { BrowserSession } from '../../browserIR/session.js'
export { resetClient }