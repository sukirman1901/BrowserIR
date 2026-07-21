import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRequestLogger } from '../../src/logger/middleware.js'
import { IncomingMessage, ServerResponse } from 'http'

describe('Request Logger', () => {
  let mockReq: Partial<IncomingMessage>
  let mockRes: Partial<ServerResponse>
  let mockNext: ReturnType<typeof vi.fn>
  let mockLog: ReturnType<typeof vi.fn>
  
  beforeEach(() => {
    mockReq = { method: 'GET', url: '/test', headers: {} }
    mockRes = { 
      writeHead: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
    }
    mockNext = vi.fn()
    mockLog = vi.fn()
  })
  
  it('should call next and log request', () => {
    const logger = createRequestLogger(mockLog)
    
    logger(mockReq as IncomingMessage, mockRes as ServerResponse, mockNext)
    
    expect(mockNext).toHaveBeenCalled()
    expect(mockLog).toHaveBeenCalled()
  })
})