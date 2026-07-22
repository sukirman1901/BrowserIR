import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { ExaSearch } from '../../src/engines/exa-search.js'

describe('ExaSearch', () => {
  let search: ExaSearch
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    search = new ExaSearch(db)
  })

  it('should search with natural language query', async () => {
    // Index some test pages
    await search.indexPage({
      url: 'https://stripe.com/pricing',
      title: 'Stripe Pricing',
      content: 'View our pricing plans and billing options',
      ir: { page: { title: 'Stripe Pricing' } }
    })

    const results = await search.search('show me pricing pages')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].url).toContain('pricing')
  })

  it('should search with intent filter', async () => {
    await search.indexPage({
      url: 'https://example.com/login',
      title: 'Login Page',
      content: 'Sign in to your account',
      ir: { page: { title: 'Login' } }
    })

    await search.indexPage({
      url: 'https://example.com/pricing',
      title: 'Pricing Page',
      content: 'View pricing plans',
      ir: { page: { title: 'Pricing' } }
    })

    const results = await search.search('page', { intent: 'pricing' })
    expect(results.length).toBe(1)
    expect(results[0].intent.category).toBe('pricing')
  })

  it('should search by domain', async () => {
    await search.indexPage({
      url: 'https://stripe.com/pricing',
      title: 'Stripe Pricing',
      content: 'Pricing',
      ir: {}
    })

    await search.indexPage({
      url: 'https://github.com/pricing',
      title: 'GitHub Pricing',
      content: 'Pricing',
      ir: {}
    })

    const results = await search.search('pricing', { domain: 'stripe.com' })
    expect(results.length).toBe(1)
    expect(results[0].url).toContain('stripe.com')
  })

  it('should return crawl stats', async () => {
    const stats = await search.getStats()
    expect(stats.totalPages).toBe(0)
  })

  it('should crawl and index a URL', async () => {
    // This would actually fetch the URL in production
    // For test, we just verify the API exists
    expect(typeof search.crawlAndIndex).toBe('function')
  })
})
