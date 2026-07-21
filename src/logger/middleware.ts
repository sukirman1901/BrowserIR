import { IncomingMessage, ServerResponse } from 'http'
import { randomUUID } from 'crypto'

export function createRequestLogger(log: (data: any) => void) {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const start = Date.now()
    const requestId = randomUUID()
    
    log({ requestId, method: req.method, url: req.url, event: 'request_started' })
    
    res.on('finish', () => {
      const duration = Date.now() - start
      log({ 
        requestId, 
        method: req.method, 
        url: req.url, 
        status: res.statusCode,
        duration,
        event: 'request_completed'
      })
    })
    
    next()
  }
}