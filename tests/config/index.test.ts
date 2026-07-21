import { describe, it, expect, beforeEach } from 'vitest'
import { loadConfig, BIRConfig } from '../../src/config/index.js'

describe('Config', () => {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv }
  })
  
  it('should load default config', () => {
    const config = loadConfig()
    
    expect(config.wsPort).toBe(3080)
    expect(config.restPort).toBe(3081)
    expect(config.dbPath).toBe(':memory:')
    expect(config.headless).toBe(true)
    expect(config.logLevel).toBe('info')
  })
  
  it('should override with environment variables', () => {
    process.env.BIR_WS_PORT = '4000'
    process.env.BIR_REST_PORT = '4001'
    process.env.BIR_DB_PATH = './data/test.db'
    process.env.BIR_LOG_LEVEL = 'debug'
    
    const config = loadConfig()
    
    expect(config.wsPort).toBe(4000)
    expect(config.restPort).toBe(4001)
    expect(config.dbPath).toBe('./data/test.db')
    expect(config.logLevel).toBe('debug')
  })
  
  it('should parse headless as boolean', () => {
    process.env.BIR_HEADLESS = 'false'
    
    const config = loadConfig()
    
    expect(config.headless).toBe(false)
  })
  
  it('should validate port numbers', () => {
    process.env.BIR_WS_PORT = 'not-a-number'
    
    expect(() => loadConfig()).toThrow('Invalid port')
  })
})