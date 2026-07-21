import { IncomingMessage, ServerResponse } from 'http'

export interface AuthConfig {
  apiKey: string
  headerName: string
}

export function createAuthMiddleware(config: AuthConfig) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const key = req.headers[config.headerName.toLowerCase()]
    
    if (key !== config.apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Unauthorized' }))
      return
    }
    
    next()
  }
}