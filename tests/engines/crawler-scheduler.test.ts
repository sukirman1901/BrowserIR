import { describe, it, expect, beforeEach } from 'vitest'
import { CrawlScheduler } from '../../src/engines/crawler-scheduler.js'

describe('CrawlScheduler', () => {
  let scheduler: CrawlScheduler

  beforeEach(() => {
    scheduler = new CrawlScheduler({
      maxConcurrent: 2,
      retryAttempts: 3,
      retryDelay: 1000
    })
  })

  it('should add URLs to queue', () => {
    scheduler.enqueue('https://example.com')
    expect(scheduler.queueSize()).toBe(1)
  })

  it('should process queue in order', async () => {
    const processed: string[] = []
    
    scheduler.on('url', async (url) => {
      processed.push(url)
      return { status: 'success' as const }
    })

    scheduler.enqueue('https://example.com/1')
    scheduler.enqueue('https://example.com/2')
    scheduler.enqueue('https://example.com/3')

    await scheduler.processAll()

    expect(processed).toEqual([
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3'
    ])
  })

  it('should retry failed URLs', async () => {
    let attempts = 0
    
    scheduler.on('url', async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Temporary failure')
      }
      return { status: 'success' as const }
    })

    scheduler.enqueue('https://example.com/flaky')
    await scheduler.processAll()

    expect(attempts).toBe(3)
  })

  it('should respect max concurrent', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    scheduler.on('url', async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise(r => setTimeout(r, 100))
      concurrent--
      return { status: 'success' as const }
    })

    for (let i = 0; i < 10; i++) {
      scheduler.enqueue(`https://example.com/${i}`)
    }

    await scheduler.processAll()

    expect(maxConcurrent).toBeLessThanOrEqual(2)
  })
})