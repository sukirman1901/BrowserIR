import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BrowserSession } from '../../src/daemon/session.js'

describe('BrowserSession', () => {
  let session: BrowserSession

  beforeAll(async () => {
    session = new BrowserSession({ headless: true })
    await session.start()
  }, 30000)

  afterAll(async () => {
    await session.stop()
  })

  it('should navigate to a page', async () => {
    await session.navigate('https://example.com')
    const tabs = await session.getTabs()
    expect(tabs.length).toBe(1)
    expect(tabs[0].url).toBe('https://example.com/')
  }, 15000)

  it('should explain a page', async () => {
    await session.navigate('https://example.com')
    const ir = await session.explain()

    expect(ir.version).toBe('0.1')
    expect(ir.page.url).toBe('https://example.com/')
    expect(ir.page.title).toBe('Example Domain')
    expect(ir.snapshot.irHash).toBeDefined()
  }, 15000)

  it('should take a screenshot', async () => {
    await session.navigate('https://example.com')
    const screenshot = await session.screenshot()

    expect(screenshot).toBeDefined()
    expect(typeof screenshot).toBe('string')
    // Should be valid base64
    expect(() => Buffer.from(screenshot, 'base64')).not.toThrow()
  }, 15000)

  it('should handle page.evaluate failure gracefully', async () => {
    await session.navigate('https://example.com')
    
    // Mock page.evaluate to throw
    const mockPage = session['page']
    if (mockPage) {
      const originalEvaluate = mockPage.evaluate.bind(mockPage)
      mockPage.evaluate = async () => {
        throw new Error('CSP blocked')
      }
      
      const result = await session.safeEvaluate(() => document.title)
      
      expect(result).toBeNull()
      
      // Restore original
      mockPage.evaluate = originalEvaluate
    }
  }, 15000)
})
