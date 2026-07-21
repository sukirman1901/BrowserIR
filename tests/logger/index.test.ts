import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLogger, Logger } from '../../src/logger/index.js'

describe('Logger', () => {
  let logger: Logger
  let consoleSpy: ReturnType<typeof vi.spyOn>
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    logger = createLogger({ level: 'info', destination: 'stdout' })
  })
  
  it('should log info messages', () => {
    logger.info('test message', { key: 'value' })
    
    expect(consoleSpy).toHaveBeenCalled()
    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.level).toBe('info')
    expect(output.message).toBe('test message')
    expect(output.key).toBe('value')
  })
  
  it('should not log debug when level is info', () => {
    logger.debug('debug message')
    
    expect(consoleSpy).not.toHaveBeenCalled()
  })
  
  it('should log debug when level is debug', () => {
    const debugLogger = createLogger({ level: 'debug', destination: 'stdout' })
    
    debugLogger.debug('debug message')
    
    expect(consoleSpy).toHaveBeenCalled()
    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.level).toBe('debug')
    expect(output.message).toBe('debug message')
  })
  
  it('should include timestamp', () => {
    logger.info('test message')
    
    const output = JSON.parse(consoleSpy.mock.calls[0][0])
    expect(output.time).toBeDefined()
  })
})