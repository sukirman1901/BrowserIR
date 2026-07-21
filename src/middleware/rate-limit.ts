interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimiterConfig {
  windowMs: number
  max: number
}

export class RateLimiter {
  private entries = new Map<string, RateLimitEntry>()
  private config: RateLimiterConfig
  
  constructor(config: RateLimiterConfig) {
    this.config = config
  }
  
  check(clientId: string): boolean {
    const now = Date.now()
    const entry = this.entries.get(clientId)
    
    if (!entry || now > entry.resetAt) {
      this.entries.set(clientId, {
        count: 1,
        resetAt: now + this.config.windowMs,
      })
      return true
    }
    
    if (entry.count >= this.config.max) {
      return false
    }
    
    entry.count++
    return true
  }
}