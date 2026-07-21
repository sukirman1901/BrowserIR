import { IncomingMessage, ServerResponse } from 'http'

export interface CorsConfig {
  allowedOrigins: string[]
}

export function createCorsMiddleware(config: CorsConfig) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const origin = req.headers.origin
    
    if (!origin || !config.allowedOrigins.includes(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Forbidden' }))
      return
    }
    
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }
    
    next()
  }
}