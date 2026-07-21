// bir/tests/engines/knowledge.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { KnowledgeEngine } from '../../src/engines/knowledge.js'
import { createDatabase } from '../../src/db/index.js'

describe('KnowledgeEngine', () => {
  let db: Database.Database
  let knowledge: KnowledgeEngine

  beforeEach(async () => {
    db = await createDatabase(':memory:')
    knowledge = new KnowledgeEngine(db)
  })

  afterEach(() => db.close())

  it('should add and retrieve nodes', async () => {
    const node = await knowledge.addNode('site', 'Amazon', { url: 'amazon.com' })
    expect(node.id).toBeDefined()
    const found = await knowledge.getNode(node.id)
    expect(found?.label).toBe('Amazon')
  })

  it('should add and traverse edges', async () => {
    const n1 = await knowledge.addNode('site', 'Amazon', {})
    const n2 = await knowledge.addNode('flow', 'Checkout', {})
    await knowledge.addEdge(n1.id, n2.id, 'contains', 0.9)
    const relationships = await knowledge.getRelationships(n1.id)
    expect(relationships.length).toBe(1)
    expect(relationships[0].type).toBe('contains')
  })

  it('should find similar nodes', async () => {
    await knowledge.addNode('site', 'Amazon', {})
    await knowledge.addNode('site', 'Lazada', {})
    await knowledge.addNode('flow', 'Checkout', {})
    const similar = await knowledge.findSimilar('site')
    expect(similar.length).toBe(2)
  })

  it('should search by label', async () => {
    await knowledge.addNode('site', 'Amazon', {})
    await knowledge.addNode('site', 'Google', {})
    const results = await knowledge.searchByLabel('Amazon')
    expect(results.length).toBe(1)
  })
})