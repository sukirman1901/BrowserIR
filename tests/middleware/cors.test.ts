import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCorsMiddleware, CorsConfig } from '../../src/middleware/cors.js'
import { IncomingMessage, ServerResponse } from 'http'

describe('CORS Middleware', () => {
  let config: CorsConfig
  let middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
  let mockReq: Partial<IncomingMessage>
  let mockRes: Partial<ServerResponse>
  let mockNext: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    config = { allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:5173'] }
    middleware = createCorsMiddleware(config)
    mockReq = { headers: {} }
    mockRes = { 
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    }
    mockNext = vi.fn()
  })
  
  it('should set CORS headers for allowed origin', () => {
    mockReq.headers = { origin: 'http://localhost:3000' }
    
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000')
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
    expect(mockNext).toHaveBeenCalled()
  })
  
  it('should block disallowed origin', () => {
    mockReq.headers = { origin: 'http://evil.com' }
    
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'application/json' })
    expect(mockNext).not.toHaveBeenCalled()
  })
  
  it('should handle preflight OPTIONS request', () => {
    mockReq.method = 'OPTIONS'
    mockReq.headers = { origin: 'http://localhost:3000' }
    
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(204)
    expect(mockRes.end).toHaveBeenCalled()
    expect(mockNext).not.toHaveBeenCalled()
  })
})