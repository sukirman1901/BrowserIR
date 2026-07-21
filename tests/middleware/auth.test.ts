import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAuthMiddleware, AuthConfig } from '../../src/middleware/auth.js'
import { IncomingMessage, ServerResponse } from 'http'

describe('Auth Middleware', () => {
  let config: AuthConfig
  let middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
  let mockReq: Partial<IncomingMessage>
  let mockRes: Partial<ServerResponse>
  let mockNext: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    config = { apiKey: 'test-api-key', headerName: 'X-API-Key' }
    middleware = createAuthMiddleware(config)
    mockReq = { headers: {} }
    mockRes = { 
      writeHead: vi.fn(),
      end: vi.fn(),
    }
    mockNext = vi.fn()
  })
  
  it('should call next when API key is valid', () => {
    mockReq.headers = { 'x-api-key': 'test-api-key' }
    
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
  })
  
  it('should return 401 when API key is missing', () => {
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(401, { 'Content-Type': 'application/json' })
    expect(mockRes.end).toHaveBeenCalled()
    expect(mockNext).not.toHaveBeenCalled()
  })
  
  it('should return 401 when API key is invalid', () => {
    mockReq.headers = { 'x-api-key': 'wrong-key' }
    
    middleware(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockRes.writeHead).toHaveBeenCalledWith(401, { 'Content-Type': 'application/json' })
    expect(mockNext).not.toHaveBeenCalled()
  })
})