import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RateLimiter } from '../../src/middleware/rate-limit.js'

describe('RateLimiter', () => {
  let limiter: RateLimiter
  
  beforeEach(() => {
    limiter = new RateLimiter({ windowMs: 1000, max: 3 })
  })
  
  it('should allow requests under limit', () => {
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
  })
  
  it('should block requests over limit', () => {
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(false)
  })
  
  it('should track different clients separately', () => {
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(true)
    expect(limiter.check('client-1')).toBe(false)
    
    expect(limiter.check('client-2')).toBe(true)
  })
  
  it('should reset after window expires', async () => {
    const shortLimiter = new RateLimiter({ windowMs: 50, max: 2 })
    
    expect(shortLimiter.check('client-1')).toBe(true)
    expect(shortLimiter.check('client-1')).toBe(true)
    expect(shortLimiter.check('client-1')).toBe(false)
    
    await new Promise(resolve => setTimeout(resolve, 60))
    
    expect(shortLimiter.check('client-1')).toBe(true)
  })
})