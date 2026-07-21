import { describe, it, expect } from 'vitest'
import { BIRError, ErrorCode } from '../../src/errors/index.js'

describe('BIRError', () => {
  it('should create error with code and message', () => {
    const error = new BIRError(ErrorCode.INVALID_URL, 'Invalid URL')
    
    expect(error.code).toBe(ErrorCode.INVALID_URL)
    expect(error.message).toBe('Invalid URL')
    expect(error).toBeInstanceOf(Error)
  })
  
  it('should include details when provided', () => {
    const error = new BIRError(ErrorCode.VALIDATION_FAILED, 'Validation failed', { field: 'url' })
    
    expect(error.details).toEqual({ field: 'url' })
  })
  
  it('should create error response with request ID', () => {
    const error = new BIRError(ErrorCode.INVALID_URL, 'Invalid URL')
    const response = error.toResponse('req-123')
    
    expect(response).toEqual({
      id: 'req-123',
      error: {
        code: 'INVALID_URL',
        message: 'Invalid URL',
        details: undefined,
      },
    })
  })
})