import { EventEmitter } from 'events'
import type { CrawlResult } from '../ir/search-types.js'

export interface SchedulerOptions {
  maxConcurrent?: number
  retryAttempts?: number
  retryDelay?: number
}

interface QueueItem {
  url: string
  attempts: number
  enqueuedAt: number
}

export class CrawlScheduler extends EventEmitter {
  private queue: QueueItem[] = []
  private processing = new Set<string>()
  private options: Required<SchedulerOptions>
  private urlHandler: ((url: string) => Promise<CrawlResult>) | null = null

  constructor(options: SchedulerOptions = {}) {
    super()
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000
    }
  }

  on(event: string, handler: any): this {
    if (event === 'url') {
      this.urlHandler = handler
    }
    return super.on(event, handler)
  }

  enqueue(url: string): void {
    if (!this.processing.has(url) && !this.queue.find(q => q.url === url)) {
      this.queue.push({
        url,
        attempts: 0,
        enqueuedAt: Date.now()
      })
    }
  }

  queueSize(): number {
    return this.queue.length + this.processing.size
  }

  async processAll(): Promise<void> {
    while (this.queue.length > 0 || this.processing.size > 0) {
      while (
        this.processing.size < this.options.maxConcurrent &&
        this.queue.length > 0
      ) {
        const item = this.queue.shift()!
        this.processItem(item)
      }

      if (this.processing.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
  }

  private async processItem(item: QueueItem): Promise<void> {
    this.processing.add(item.url)

    try {
      await this.processUrl(item.url)
    } catch (error) {
      if (item.attempts < this.options.retryAttempts) {
        await new Promise(r => setTimeout(r, this.options.retryDelay))
        item.attempts++
        this.queue.unshift(item)
      }
    } finally {
      this.processing.delete(item.url)
    }
  }

  private async processUrl(url: string): Promise<CrawlResult> {
    if (this.urlHandler) {
      return this.urlHandler(url)
    }
    return {
      url,
      title: '',
      content: '',
      links: [],
      ir: {},
      crawledAt: Date.now(),
      status: 'success'
    }
  }

  clear(): void {
    this.queue = []
    this.processing.clear()
  }
}
