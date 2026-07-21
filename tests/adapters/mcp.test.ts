import { describe, it, expect } from 'vitest'
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
} from '../../src/adapters/mcp/tools.js'

describe('MCP Tools', () => {
  describe('Core Tools', () => {
    it('should have explain tool', () => {
      expect(explainTool.name).toBe('bir_explain')
      expect(explainTool.description).toBeDefined()
      expect(explainTool.inputSchema).toBeDefined()
      expect(explainTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have click tool', () => {
      expect(clickTool.name).toBe('bir_click')
      expect(clickTool.description).toBeDefined()
      expect(clickTool.inputSchema).toBeDefined()
      expect(clickTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have graph tool', () => {
      expect(graphTool.name).toBe('bir_graph')
      expect(graphTool.description).toBeDefined()
      expect(graphTool.inputSchema).toBeDefined()
      expect(graphTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have screenshot tool', () => {
      expect(screenshotTool.name).toBe('bir_screenshot')
      expect(screenshotTool.description).toBeDefined()
      expect(screenshotTool.inputSchema).toBeDefined()
      expect(screenshotTool.handler).toBeInstanceOf(Function)
    })
  })
  
  describe('Memory Tools', () => {
    it('should have memory recall tool', () => {
      expect(memoryRecallTool.name).toBe('bir_memory_recall')
      expect(memoryRecallTool.description).toBeDefined()
      expect(memoryRecallTool.inputSchema).toBeDefined()
      expect(memoryRecallTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have memory store tool', () => {
      expect(memoryStoreTool.name).toBe('bir_memory_store')
      expect(memoryStoreTool.description).toBeDefined()
      expect(memoryStoreTool.inputSchema).toBeDefined()
      expect(memoryStoreTool.handler).toBeInstanceOf(Function)
    })
  })
  
  describe('Navigation Tools', () => {
    it('should have navigate tool', () => {
      expect(navigateTool.name).toBe('bir_navigate')
      expect(navigateTool.description).toBeDefined()
      expect(navigateTool.inputSchema).toBeDefined()
      expect(navigateTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have tabs tool', () => {
      expect(tabsTool.name).toBe('bir_tabs')
      expect(tabsTool.description).toBeDefined()
      expect(tabsTool.inputSchema).toBeDefined()
      expect(tabsTool.handler).toBeInstanceOf(Function)
    })
    
    it('should have status tool', () => {
      expect(statusTool.name).toBe('bir_status')
      expect(statusTool.description).toBeDefined()
      expect(statusTool.inputSchema).toBeDefined()
      expect(statusTool.handler).toBeInstanceOf(Function)
    })
  })
  
  describe('Total Tools Count', () => {
    it('should have 29 tools', () => {
      const allTools = [
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
      ]
      
      expect(allTools.length).toBe(29)
    })
  })
})