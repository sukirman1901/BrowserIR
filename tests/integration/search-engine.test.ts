// tests/integration/search-engine.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { ExaSearch } from '../../src/engines/exa-search.js'

describe('Search Engine Integration', () => {
  let db: Database.Database
  let search: ExaSearch

  beforeAll(() => {
    db = new Database(':memory:')
    search = new ExaSearch(db)
  })

  afterAll(() => {
    db.close()
  })

  it('should index and search pages', async () => {
    await search.indexPage({
      url: 'https://stripe.com/pricing',
      title: 'Stripe Pricing Page',
      content: 'View our pricing plans page. Starting at $0/month for basic features.',
      ir: { page: { title: 'Stripe Pricing', intent: { category: 'pricing' } } }
    })

    await search.indexPage({
      url: 'https://stripe.com/docs',
      title: 'Stripe Documentation Page',
      content: 'API reference and integration guides for Stripe.',
      ir: { page: { title: 'Stripe Docs', intent: { category: 'documentation' } } }
    })

    await search.indexPage({
      url: 'https://github.com/login',
      title: 'GitHub Login Page',
      content: 'Sign in page to GitHub to access your repositories.',
      ir: { page: { title: 'GitHub Login', intent: { category: 'login' } } }
    })

    const pricingResults = await search.search('pricing plans')
    expect(pricingResults.length).toBeGreaterThan(0)
    expect(pricingResults[0].url).toContain('pricing')

    const loginResults = await search.search('page', { intent: 'login' })
    expect(loginResults.length).toBe(1)
    expect(loginResults[0].url).toContain('login')

    const stripeResults = await search.search('page', { domain: 'stripe.com' })
    expect(stripeResults.length).toBe(2)
  })

  it('should handle complex queries', async () => {
    await search.indexPage({
      url: 'https://vercel.com/docs',
      title: 'Vercel Documentation',
      content: 'Deployment guides, API reference, and tutorials.',
      ir: {}
    })

    await search.indexPage({
      url: 'https://vercel.com/pricing',
      title: 'Vercel Pricing',
      content: 'Pro plans starting at $20/month.',
      ir: {}
    })

    const results = await search.search('how much does vercel cost')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should return stats', async () => {
    const stats = await search.getStats()
    expect(stats.totalPages).toBeGreaterThan(0)
    expect(stats.totalDomains).toBeGreaterThan(0)
  })
})
