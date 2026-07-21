import TurndownService from 'turndown'

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_TIMEOUT = 120000 // 2 minutes

export interface WebFetchOptions {
  format?: 'text' | 'markdown' | 'html'
  timeout?: number
  headers?: Record<string, string>
}

export interface WebFetchResult {
  url: string
  content: string
  format: string
  contentType: string
  title?: string
  metadata: Record<string, any>
}

export class WebFetchEngine {
  async fetch(url: string, options: WebFetchOptions = {}): Promise<WebFetchResult> {
    const format = options.format || 'markdown'
    const timeout = Math.min(options.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT)

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://')
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...options.headers
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      const content = await response.text()

      if (content.length > MAX_RESPONSE_SIZE) {
        throw new Error('Response too large (exceeds 5MB limit)')
      }

      // Extract title from HTML
      const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : undefined

      // Convert based on format
      let output: string
      switch (format) {
        case 'markdown':
          if (contentType.includes('text/html')) {
            output = this.convertHTMLToMarkdown(content)
          } else {
            output = content
          }
          break
        case 'text':
          if (contentType.includes('text/html')) {
            output = this.extractTextFromHTML(content)
          } else {
            output = content
          }
          break
        case 'html':
          output = content
          break
        default:
          output = content
      }

      return {
        url,
        content: output,
        format,
        contentType,
        title,
        metadata: {
          size: content.length,
          status: response.status
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private convertHTMLToMarkdown(html: string): string {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    })
    turndownService.remove(['script', 'style', 'meta', 'link'])
    return turndownService.turndown(html)
  }

  private extractTextFromHTML(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}