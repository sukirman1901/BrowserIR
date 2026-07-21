// bir/tests/engines/memory.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { MemoryEngine } from '../../src/engines/memory.js'
import { createDatabase } from '../../src/db/index.js'
import { BIRError, ErrorCode } from '../../src/errors/index.js'
import type { BrowserIR } from '../../src/ir/types.js'

describe('MemoryEngine', () => {
  let db: Database.Database
  let memory: MemoryEngine

  const sampleIR: BrowserIR = {
    url: 'https://example.com/page',
    title: 'Example Page',
    sections: [],
    components: [
      {
        id: 'comp_1',
        role: 'button',
        intent: { primary: 'action', secondary: 'navigation', confidence: 0.9, evidence: [] },
        label: 'Submit',
        importance: { score: 0.8, reason: 'primary action', evidence: [] },
        selectors: ['button.submit'],
        a11y: { role: 'button', name: 'Submit', states: [] },
        position: { x: 100, y: 200, width: 120, height: 40 },
        metadata: {}
      }
    ],
    metadata: { framework: null, title: 'Example Page', description: '', lang: 'en' }
  } as any

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    memory = new MemoryEngine(db)
  })

  afterEach(() => {
    db.close()
  })

  it('should store and recall a memory entry', async () => {
    const entry = await memory.remember('https://example.com/page', sampleIR)
    expect(entry.id).toBeDefined()
    expect(entry.domain).toBe('example.com')
    expect(entry.visitCount).toBe(1)

    const recalled = await memory.recall('https://example.com/page')
    expect(recalled).not.toBeNull()
    expect(recalled!.domain).toBe('example.com')
  })

  it('should increase confidence on repeat visits', async () => {
    await memory.remember('https://example.com/page', sampleIR)
    const entry2 = await memory.remember('https://example.com/page', sampleIR)
    expect(entry2.visitCount).toBe(2)
    expect(entry2.confidence).toBeGreaterThan(0.5)
  })

  it('should deduplicate by hash', async () => {
    await memory.remember('https://example.com/page', sampleIR)
    const entry2 = await memory.remember('https://example.com/page', sampleIR)
    expect(entry2.visitCount).toBe(2)

    const all = db.prepare('SELECT * FROM knowledge').all()
    expect(all.length).toBe(1)
  })

  it('should recall by domain', async () => {
    await memory.remember('https://example.com/page1', sampleIR)
    await memory.remember('https://example.com/page2', sampleIR)
    const entries = await memory.recallByDomain('example.com')
    expect(entries.length).toBe(2)
  })

  it('should prune old entries', async () => {
    await memory.remember('https://example.com/page', sampleIR)
    // Use -1 day to ensure cutoff is in the future (entry will be "old")
    const pruned = await memory.prune(-1)
    expect(pruned).toBe(1)
  })

  it('should throw BIRError for invalid URL', async () => {
    await expect(memory.remember('not-a-url', sampleIR))
      .rejects.toThrow(BIRError)
  })
})
