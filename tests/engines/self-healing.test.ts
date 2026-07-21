import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { SelfHealingEngine } from '../../src/engines/self-healing.js'
import { MemoryEngine } from '../../src/engines/memory.js'
import { createDatabase } from '../../src/db/index.js'
import type { BrowserIR } from '../../src/ir/types.js'

describe('SelfHealingEngine', () => {
  let db: Database.Database
  let healing: SelfHealingEngine
  let memory: MemoryEngine

  const makeIR = (components: Array<{ id: string; type?: string; label: string }>): BrowserIR => ({
    version: '0.1',
    page: {
      id: 'page_1',
      url: 'https://example.com',
      title: 'Test',
      intent: { primary: 'unknown', confidence: 0.5, evidence: [] },
      sections: [{
        id: 'sec_1', role: 'content', label: 'Main', intent: 'content',
        importance: 0.5, children: [],
        components: components.map(c => ({
          id: c.id,
          type: (c.type || 'button') as any,
          label: c.label,
          intent: 'action',
          state: { visible: true, enabled: true, focused: false, loading: false },
          confidence: 0.8,
          evidence: []
        }))
      }],
      metadata: { title: 'Test', description: '', lang: 'en' }
    },
    snapshot: { dom: '', a11y: '', timestamp: Date.now() } as any,
    evidence: { chain: [], root: { source: 'test', type: 'observed', confidence: 0.8, timestamp: Date.now(), data: {} } }
  } as any)

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    memory = new MemoryEngine(db)
    healing = new SelfHealingEngine(memory)
  })

  afterEach(() => db.close())

  it('should find element by semantic match', async () => {
    const ir = makeIR([{ id: 'c1', label: 'Submit' }])
    const result = await healing.heal('button.old-selector', ir, 'submit')
    expect(result.found).toBe(true)
    expect(result.method).toBe('semantic')
  })

  it('should find element by text match', async () => {
    const ir = makeIR([{ id: 'c1', type: 'text', label: 'Submit' }])
    const result = await healing.heal('Submit', ir)
    expect(result.found).toBe(true)
  })

  it('should return not found for unknown elements', async () => {
    const ir = makeIR([])
    const result = await healing.heal('div.unknown', ir)
    expect(result.found).toBe(false)
  })
})
