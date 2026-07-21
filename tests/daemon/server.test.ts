import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../../src/config/index.js'

describe('Server Config Integration', () => {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
  
  it('should use config for ports', () => {
    process.env.BIR_WS_PORT = '4000'
    process.env.BIR_REST_PORT = '4001'
    
    const config = loadConfig()
    
    expect(config.wsPort).toBe(4000)
    expect(config.restPort).toBe(4001)
  })
  
  it('should have default config values', () => {
    delete process.env.BIR_WS_PORT
    delete process.env.BIR_REST_PORT
    
    const config = loadConfig()
    
    expect(config.wsPort).toBe(3080)
    expect(config.restPort).toBe(3081)
  })
})