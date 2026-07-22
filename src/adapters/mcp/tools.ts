import { z } from 'zod'
import { RPCClient } from '../../daemon/transport.js'
import type { BrowserIR } from '../../ir/types.js'
import { explain as explainImpl, analyze as analyzeImpl, type BrowserSession } from '../../browserIR/session.js'
import { ExaSearch } from '../../engines/exa-search.js'
import { createDatabase } from '../../db/index.js'
import type { IntentCategory } from '../../ir/search-types.js'

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

// ── ExaSearch singleton ──

let exaSearchInstance: ExaSearch | null = null

async function getExaSearch(): Promise<ExaSearch> {
  if (!exaSearchInstance) {
    const dbPath = process.env.BIR_DB_PATH || 'data/bir.db'
    const db = await createDatabase(dbPath)
    exaSearchInstance = new ExaSearch(db)
  }
  return exaSearchInstance
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
  name: 'bir_analyze',
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
    properties: z.record(z.string(), z.any()).optional().describe('Node properties'),
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
    data: z.record(z.string(), z.any()).optional().describe('Event data payload'),
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
    query: z.record(z.string(), z.any()).optional().describe('Filter query options'),
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

// ── Semantic Web Tools ──

export const semanticWebFetchTool = {
  name: 'bir_webfetch',
  description: 'Fetch URL with semantic understanding — returns structured data with intent, components, and risks instead of raw HTML.',
  inputSchema: {
    url: z.string().url().describe('The URL to fetch'),
    format: z.enum(['semantic', 'markdown', 'html']).optional().describe('Output format (default: semantic)'),
  },
  handler: async ({ url, format }: { url: string; format?: string }) => {
    // Fetch content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Extract basic info from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : url
    
    // Simple semantic extraction
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    const body = bodyMatch ? bodyMatch[1] : html
    
    // Count interactive elements
    const buttonCount = (body.match(/<button/gi) || []).length
    const linkCount = (body.match(/<a\s/gi) || []).length
    const inputCount = (body.match(/<input/gi) || []).length
    const formCount = (body.match(/<form/gi) || []).length
    
    // Detect intent from content
    const contentLower = body.toLowerCase()
    let intent = 'content'
    if (/login|sign.?in|auth/i.test(contentLower)) intent = 'authentication'
    else if (/checkout|payment|pay|buy/i.test(contentLower)) intent = 'purchase'
    else if (/search|find|query/i.test(contentLower)) intent = 'search'
    else if (/register|sign.?up|create.?account/i.test(contentLower)) intent = 'registration'
    else if (/dashboard|admin|panel/i.test(contentLower)) intent = 'dashboard'
    
    // Convert to markdown (simple)
    const markdown = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000)
    
    if (format === 'html') {
      return { url, title, content: html, format: 'html' }
    }
    
    if (format === 'markdown') {
      return { url, title, content: markdown, format: 'markdown' }
    }
    
    // Semantic format (default)
    return {
      url,
      title,
      semantic: {
        intent,
        components: {
          buttons: buttonCount,
          links: linkCount,
          inputs: inputCount,
          forms: formCount,
          total: buttonCount + linkCount + inputCount
        },
        hasAuth: /login|sign.?in|password/i.test(contentLower),
        hasSearch: /search|find|query/i.test(contentLower),
        hasForms: formCount > 0,
        isEcommerce: /cart|checkout|buy|price|product/i.test(contentLower),
        isDocumentation: /docs|documentation|api|reference/i.test(contentLower),
      },
      content: markdown,
      format: 'semantic'
    }
  },
}

export const semanticWebSearchTool = {
  name: 'bir_websearch',
  description: 'Search the web with semantic understanding — returns structured results with intent and relevance scoring.',
  inputSchema: {
    query: z.string().describe('Search query'),
    numResults: z.number().optional().describe('Number of results (default: 5)'),
  },
  handler: async ({ query, numResults }: { query: string; numResults?: number }) => {
    const limit = numResults || 5
    
    // Use DuckDuckGo API
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }
    
    const data = await response.json()
    const results: any[] = []
    
    // Add abstract
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        relevance: 1.0,
        intent: 'information'
      })
    }
    
    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, limit - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
            url: topic.FirstURL,
            snippet: topic.Text,
            relevance: 0.7,
            intent: 'related'
          })
        }
      }
    }
    
    return {
      query,
      results: results.slice(0, limit),
      semantic: {
        totalResults: results.length,
        intents: [...new Set(results.map(r => r.intent))],
        avgRelevance: results.length > 0 ? results.reduce((sum, r) => sum + r.relevance, 0) / results.length : 0
      }
    }
  },
}

export const birAnalyzeContentTool = {
  name: 'bir_analyze_content',
  description: 'Analyze text content and return semantic understanding — intent, topics, sentiment, key entities.',
  inputSchema: {
    content: z.string().describe('Text content to analyze'),
    type: z.enum(['auto', 'article', 'documentation', 'code']).optional().describe('Content type (default: auto)'),
  },
  handler: async ({ content, type }: { content: string; type?: string }) => {
    const contentLower = content.toLowerCase()
    
    // Detect content type
    let detectedType = type || 'article'
    if (!type) {
      if (/function|class|import|export|const|let|var/i.test(content)) detectedType = 'code'
      else if (/api|endpoint|parameter|return/i.test(content)) detectedType = 'documentation'
    }
    
    // Detect intent
    let intent = 'information'
    if (/tutorial|how.?to|guide/i.test(contentLower)) intent = 'tutorial'
    else if (/api|endpoint|documentation/i.test(contentLower)) intent = 'reference'
    else if (/news|article|blog/i.test(contentLower)) intent = 'news'
    else if (/review|comparison/i.test(contentLower)) intent = 'review'
    
    // Extract key entities
    const entities: string[] = []
    const urlPattern = /https?:\/\/[^\s]+/g
    const urls = content.match(urlPattern) || []
    entities.push(...urls.slice(0, 5))
    
    // Extract code blocks if present
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length
    
    // Word count
    const wordCount = content.split(/\s+/).length
    
    // Reading time (200 WPM)
    const readingTime = Math.ceil(wordCount / 200)
    
    return {
      type: detectedType,
      intent,
      entities,
      metrics: {
        wordCount,
        readingTime: `${readingTime} min`,
        codeBlocks,
        sentences: content.split(/[.!?]+/).length - 1
      },
      summary: content.substring(0, 200) + '...'
    }
  },
}

// ── Search & Crawl Tools ──

export const searchTool = {
  name: 'bir_search',
  description: 'Search web pages semantically (like Exa). Understands intent beyond keywords.',
  inputSchema: {
    query: z.string().describe('Natural language search query'),
    domain: z.string().optional().describe('Filter by domain'),
    intent: z.string().optional().describe('Filter by intent (login, pricing, docs, etc.)'),
    limit: z.number().optional().describe('Max results (default 10)'),
  },
  handler: async ({ query, domain, intent, limit }: { query: string; domain?: string; intent?: string; limit?: number }) => {
    const exaSearch = await getExaSearch()
    const results = await exaSearch.search(query, { domain, intent: intent as IntentCategory | undefined, limit })
    return { results }
  },
}

export const crawlTool = {
  name: 'bir_crawl',
  description: 'Crawl a URL and add it to search index',
  inputSchema: {
    url: z.string().describe('URL to crawl'),
    depth: z.number().optional().describe('Crawl depth (default 2)'),
  },
  handler: async ({ url, depth }: { url: string; depth?: number }) => {
    const exaSearch = await getExaSearch()
    const result = await exaSearch.crawlAndIndex(url)
    return { crawled: !!result, result }
  },
}

export const searchStatsTool = {
  name: 'bir_search_stats',
  description: 'Get search index statistics',
  inputSchema: {},
  handler: async () => {
    const exaSearch = await getExaSearch()
    const stats = await exaSearch.getStats()
    return stats
  },
}

export { BrowserSession } from '../../browserIR/session.js'
export { resetClient }