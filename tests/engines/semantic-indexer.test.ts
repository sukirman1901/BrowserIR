import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { SemanticIndexer } from '../../src/engines/semantic-indexer.js'

describe('SemanticIndexer', () => {
  let indexer: SemanticIndexer
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    indexer = new SemanticIndexer(db)
  })

  it('should index a page', async () => {
    const id = await indexer.indexPage({
      url: 'https://example.com',
      title: 'Example Page',
      content: 'This is an example page',
      ir: { page: { title: 'Example Page' } }
    })

    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
  })

  it('should search indexed pages', async () => {
    await indexer.indexPage({
      url: 'https://example.com/login',
      title: 'Login Page',
      content: 'Sign in to your account',
      ir: { page: { title: 'Login Page', intent: { category: 'login' } } }
    })

    await indexer.indexPage({
      url: 'https://example.com/pricing',
      title: 'Pricing Page',
      content: 'View our pricing plans',
      ir: { page: { title: 'Pricing Page', intent: { category: 'pricing' } } }
    })

    const results = await indexer.search('login', { limit: 10 })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toBe('Login Page')
  })

  it('should filter by intent', async () => {
    await indexer.indexPage({
      url: 'https://example.com/login',
      title: 'Login Page',
      content: 'Sign in',
      ir: { page: { title: 'Login', intent: { category: 'login' } } }
    })

    await indexer.indexPage({
      url: 'https://example.com/pricing',
      title: 'Pricing Page',
      content: 'Pricing plans',
      ir: { page: { title: 'Pricing', intent: { category: 'pricing' } } }
    })

    const results = await indexer.search('page', {
      intent: 'pricing',
      limit: 10
    })

    expect(results.length).toBe(1)
    expect(results[0].intent.category).toBe('pricing')
  })

  it('should get stats', async () => {
    await indexer.indexPage({
      url: 'https://example.com/1',
      title: 'Page 1',
      content: 'Content 1',
      ir: {}
    })

    const stats = await indexer.getStats()
    expect(stats.totalPages).toBe(1)
    expect(stats.totalDomains).toBe(1)
  })

  it('should delete a page', async () => {
    await indexer.indexPage({
      url: 'https://example.com/del',
      title: 'Delete Me',
      content: 'This page will be deleted',
      ir: {}
    })

    const deleted = await indexer.deletePage('https://example.com/del')
    expect(deleted).toBe(true)

    const page = await indexer.getPage('https://example.com/del')
    expect(page).toBeNull()
  })

  it('should return false when deleting non-existent page', async () => {
    const deleted = await indexer.deletePage('https://example.com/nonexistent')
    expect(deleted).toBe(false)
  })

  it('should get a page by url', async () => {
    await indexer.indexPage({
      url: 'https://example.com/get',
      title: 'Get Me',
      content: 'This page should be retrievable',
      ir: { sections: [] }
    })

    const page = await indexer.getPage('https://example.com/get')
    expect(page).not.toBeNull()
    expect(page!.url).toBe('https://example.com/get')
    expect(page!.title).toBe('Get Me')
    expect(page!.score).toBe(1.0)
    expect(page!.intent.keywords.length).toBeGreaterThan(0)
  })

  it('should return null for non-existent page', async () => {
    const page = await indexer.getPage('https://example.com/missing')
    expect(page).toBeNull()
  })

  it('should upsert on duplicate url', async () => {
    const id1 = await indexer.indexPage({
      url: 'https://example.com/upsert',
      title: 'Original Title',
      content: 'Original content',
      ir: { version: 1 }
    })

    const id2 = await indexer.indexPage({
      url: 'https://example.com/upsert',
      title: 'Updated Title',
      content: 'Updated content',
      ir: { version: 2 }
    })

    expect(id1).toBe(id2)

    const stats = await indexer.getStats()
    expect(stats.totalPages).toBe(1)

    const page = await indexer.getPage('https://example.com/upsert')
    expect(page!.title).toBe('Updated Title')
    expect(page!.snippet).toContain('Updated content')
  })

  it('should throw on invalid url', async () => {
    await expect(
      indexer.indexPage({
        url: 'not-a-valid-url',
        title: 'Bad URL',
        content: 'Content',
        ir: {}
      })
    ).rejects.toThrow('Invalid URL')
  })

  it('should filter by maxAge', async () => {
    await indexer.indexPage({
      url: 'https://example.com/old',
      title: 'Old Page',
      content: 'Old content',
      ir: {}
    })

    db.prepare('UPDATE semantic_pages SET indexed_at = ? WHERE url = ?')
      .run(Date.now() - 365 * 24 * 60 * 60 * 1000, 'https://example.com/old')

    const resultsNew = await indexer.search('page', { maxAge: 365 })
    expect(resultsNew.length).toBe(1)

    const resultsOld = await indexer.search('page', { maxAge: 1 })
    expect(resultsOld.length).toBe(0)
  })
})
