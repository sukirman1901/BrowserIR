import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { DiffEngine } from '../../src/engines/diff.js'
import { createDatabase } from '../../src/db/index.js'
import type { BrowserIR } from '../../src/ir/types.js'

describe('DiffEngine', () => {
  let db: Database.Database
  let diff: DiffEngine

  const makeIR = (components: Array<{ id: string; type?: string; label: string; intent?: string }>): BrowserIR => ({
    version: '0.1',
    page: {
      id: 'page_1',
      url: 'https://example.com',
      title: 'Test',
      intent: { primary: 'unknown', confidence: 0.5, evidence: [] },
      sections: [{
        id: 'sec_1',
        role: 'content',
        label: 'Main',
        intent: 'content',
        importance: 0.5,
        children: [],
        components: components.map(c => ({
          id: c.id,
          type: (c.type || 'button') as any,
          label: c.label,
          intent: c.intent || 'action',
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
    diff = new DiffEngine(db)
  })

  afterEach(() => db.close())

  it('should detect added components', async () => {
    const ir1 = makeIR([{ id: 'c1', label: 'Submit' }])
    const ir2 = makeIR([{ id: 'c1', label: 'Submit' }, { id: 'c2', type: 'link', label: 'Cancel' }])
    const result = await diff.diffIRs(ir1, ir2)
    expect(result.changes.some(c => c.type === 'added')).toBe(true)
  })

  it('should detect removed components', async () => {
    const ir1 = makeIR([{ id: 'c1', label: 'Submit' }, { id: 'c2', type: 'link', label: 'Cancel' }])
    const ir2 = makeIR([{ id: 'c1', label: 'Submit' }])
    const result = await diff.diffIRs(ir1, ir2)
    expect(result.changes.some(c => c.type === 'removed')).toBe(true)
  })

  it('should detect modified components', async () => {
    const ir1 = makeIR([{ id: 'c1', label: 'Submit' }])
    const ir2 = makeIR([{ id: 'c1', label: 'Buy Now' }])
    const result = await diff.diffIRs(ir1, ir2)
    expect(result.changes.some(c => c.type === 'modified')).toBe(true)
  })

  it('should calculate semantic delta', async () => {
    const ir1 = makeIR([{ id: 'c1', label: 'Submit' }])
    const ir2 = makeIR([{ id: 'c1', label: 'Submit' }])
    const result = await diff.diffIRs(ir1, ir2)
    expect(result.semanticDelta).toBe(0)
  })

  it('should match components efficiently', async () => {
    const before = Array.from({ length: 1000 }, (_, i) => ({
      id: `comp-${i}`,
      type: 'button',
      label: `Button ${i}`,
    }))
    
    const after = before.slice().map(comp => ({
      ...comp,
      label: `Updated ${comp.id}`,
    }))
    
    const ir1 = makeIR(before)
    const ir2 = makeIR(after)
    
    const start = Date.now()
    const result = await diff.diffIRs(ir1, ir2)
    const duration = Date.now() - start
    
    expect(duration).toBeLessThan(500) // Should be fast
    expect(result.changes.some(c => c.type === 'added')).toBe(false)
    expect(result.changes.some(c => c.type === 'removed')).toBe(false)
  })
})
