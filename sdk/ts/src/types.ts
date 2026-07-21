export interface BIRClientOptions {
  host?: string
  port?: number
}

export interface BIRRpcRequest {
  id: string
  method: string
  params?: Record<string, unknown>
}

export interface BIRRpcResponse {
  id: string
  result?: unknown
  error?: { code: number; message: string }
}

export interface BIREvent {
  type: 'event'
  data: Record<string, unknown>
}
