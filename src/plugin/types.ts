import type Database from 'better-sqlite3'

export interface BIRPlugin {
  name: string
  version: string
  description: string
  
  // Lifecycle
  onInit?: (context: PluginContext) => Promise<void>
  onDestroy?: () => Promise<void>
  
  // Extensions
  engines?: EngineDefinition[]
  healingStrategies?: HealingStrategy[]
  mcpTools?: MCPToolDefinition[]
  rpcMethods?: RPCMethodDefinition[]
}

export interface PluginContext {
  db: Database.Database
  engines: Record<string, unknown>
  config: Record<string, unknown>
}

export interface EngineDefinition {
  name: string
  create: (context: PluginContext) => Promise<unknown>
}

export interface HealingStrategy {
  name: string
  priority: number
  find: (brokenSelector: string, ir: Record<string, unknown>) => Promise<HealingResult>
}

export interface MCPToolDefinition {
  name: string
  description: string
  schema: Record<string, unknown>
  handler: (params: any) => Promise<unknown>
}

export interface RPCMethodDefinition {
  method: string
  handler: (params: any) => Promise<unknown>
}

export interface HealingResult {
  selector?: string
  confidence?: number
  [key: string]: unknown
}
