import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BrowserSession } from '../../src/daemon/session.js'
import { SemanticAnalyzer } from '../../src/ir/analyzer.js'

describe('Integration: Explain Flow', () => {
  let session: BrowserSession

  beforeAll(async () => {
    session = new BrowserSession({ headless: true })
    await session.start()
  }, 30000)

  afterAll(async () => {
    await session.stop()
  })

  it('should analyze example.com end-to-end', async () => {
    await session.navigate('https://example.com')
    const ir = await session.explain()

    // Verify structure
    expect(ir.version).toBe('0.1')
    expect(ir.page.url).toContain('example.com')
    expect(ir.page.title).toBeDefined()

    // Verify snapshot
    expect(ir.snapshot.id).toBeDefined()
    expect(ir.snapshot.timestamp).toBeGreaterThan(0)
    expect(ir.snapshot.irHash).toBeDefined()

    // Verify evidence
    expect(ir.evidence.primary).toBeDefined()
    expect(ir.evidence.primary.source).toBeDefined()
  }, 15000)

  it('should produce explain output format', async () => {
    await session.navigate('https://example.com')
    const ir = await session.explain()

    // Verify it has sections
    expect(Array.isArray(ir.page.sections)).toBe(true)

    // Verify each section has required fields
    for (const section of ir.page.sections) {
      expect(section.id).toBeDefined()
      expect(section.role).toBeDefined()
      expect(section.label).toBeDefined()
      expect(section.intent).toBeDefined()
      expect(Array.isArray(section.components)).toBe(true)
    }
  }, 15000)

  it('should handle navigation errors gracefully', async () => {
    await expect(
      session.navigate('https://this-domain-does-not-exist-12345.com')
    ).rejects.toThrow()
  }, 15000)
})
