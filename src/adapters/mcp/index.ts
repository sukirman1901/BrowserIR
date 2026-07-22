#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import {
  explainTool, clickTool, graphTool, screenshotTool,
  memoryRecallTool, memoryStoreTool,
  diffCompareTool,
  eventsGetTool, eventsCaptureTool,
  flowDetectTool, flowListTool,
  knowledgeAddNodeTool, knowledgeAddEdgeTool, knowledgeSearchTool, knowledgeTraverseTool,
  plannerCreateTool, plannerExecuteTool, plannerStatusTool,
  navigateTool, tabsTool, statusTool,
  healFindTool,
  multiCreateSessionTool, multiExecuteTool, multiSessionsTool,
  agentRegisterTool, agentUnregisterTool, agentClaimTool, agentGraphTool,
  analyzeTool,
  semanticWebFetchTool, semanticWebSearchTool, birAnalyzeContentTool,
  searchTool, crawlTool, searchStatsTool,
} from './tools.js'

async function ensureDaemonRunning(): Promise<void> {
  // Check if daemon is already running
  try {
    const response = await fetch('http://localhost:3081/health')
    const data = await response.json()
    if (data.status === 'healthy') {
      console.error('[BrowserIR] Daemon already running')
      return
    }
  } catch {
    // Daemon not running
  }

  console.error('[BrowserIR] Starting daemon...')
  
  // Find server.js path
  let serverPath = path.join(process.cwd(), 'dist', 'daemon', 'server.js')
  if (!fs.existsSync(serverPath)) {
    // Try relative to this file
    serverPath = path.resolve(__dirname, '../../daemon/server.js')
  }
  
  if (!fs.existsSync(serverPath)) {
    console.error('[BrowserIR] Warning: daemon server.js not found')
    return
  }

  const daemon = spawn('node', [serverPath], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  daemon.unref()

  // Wait for daemon to start
  await new Promise<void>((resolve) => {
    let started = false
    
    daemon.stdout?.on('data', (data) => {
      const output = data.toString()
      if (output.includes('listening') && !started) {
        started = true
        setTimeout(resolve, 500)
      }
    })
    
    // Timeout after 3 seconds
    setTimeout(() => {
      if (!started) {
        started = true
        resolve()
      }
    }, 3000)
  })

  console.error('[BrowserIR] Daemon started')
}

async function main() {
  // Auto-start daemon
  await ensureDaemonRunning()

  const server = new McpServer({
    name: 'browserir',
    version: '0.1.0',
  })

  function reg(tool: { name: string; description: string; inputSchema: Record<string, any>; handler: (params: any) => Promise<any> }, isImage = false) {
    const schema: Record<string, any> = {}
    for (const [key, val] of Object.entries(tool.inputSchema)) {
      schema[key] = val
    }
    server.tool(tool.name, tool.description, schema, async (params) => {
      const result = await tool.handler(params)
      if (isImage && result?.screenshot) {
        return { content: [{ type: 'image', data: result.screenshot, mimeType: 'image/png' }] }
      }
      if (typeof result === 'string') {
        return { content: [{ type: 'text', text: result }] }
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    })
  }

  // Core & Navigation
  reg(explainTool)
  reg(clickTool)
  reg(graphTool)
  reg(screenshotTool, true)
  reg(navigateTool)
  reg(tabsTool)
  reg(statusTool)
  reg(analyzeTool)

  // Memory
  reg(memoryRecallTool)
  reg(memoryStoreTool)

  // Diff & Flow
  reg(diffCompareTool)
  reg(flowDetectTool)
  reg(flowListTool)

  // Knowledge
  reg(knowledgeAddNodeTool)
  reg(knowledgeAddEdgeTool)
  reg(knowledgeSearchTool)
  reg(knowledgeTraverseTool)

  // Events
  reg(eventsCaptureTool)
  reg(eventsGetTool)

  // Planner
  reg(plannerCreateTool)
  reg(plannerExecuteTool)
  reg(plannerStatusTool)

  // Self-Healing
  reg(healFindTool)

  // Multi-Browser
  reg(multiCreateSessionTool)
  reg(multiExecuteTool)
  reg(multiSessionsTool)

  // Agent Coordination
  reg(agentRegisterTool)
  reg(agentUnregisterTool)
  reg(agentClaimTool)
  reg(agentGraphTool)

  // Semantic Web Tools
  reg(semanticWebFetchTool)
  reg(semanticWebSearchTool)
  reg(birAnalyzeContentTool)

  // Search & Crawl
  reg(searchTool)
  reg(crawlTool)
  reg(searchStatsTool)

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('BrowserIR MCP server running on stdio (36 tools)')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
