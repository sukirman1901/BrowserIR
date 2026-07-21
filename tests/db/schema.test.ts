// bir/tests/db/schema.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createDatabase, migrateDatabase } from '../../src/db/index.js'

describe('Database', () => {
  let db: ReturnType<typeof createDatabase> extends Promise<infer T> ? T : never

  beforeEach(async () => {
    db = await createDatabase(':memory:')
  })

  it('should create all Phase 1+2 tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]
    const names = tables.map(t => t.name)
    expect(names).toContain('snapshots')
    expect(names).toContain('knowledge')
    expect(names).toContain('diffs')
    expect(names).toContain('events')
    expect(names).toContain('flows')
    expect(names).toContain('knowledge_nodes')
    expect(names).toContain('knowledge_edges')
  })

  it('should have proper indexes', () => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as any[]
    const names = indexes.map(i => i.name)
    expect(names).toContain('idx_knowledge_domain')
    expect(names).toContain('idx_events_type')
    expect(names).toContain('idx_flows_domain')
  })
})
