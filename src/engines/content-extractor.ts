import type { Page } from 'playwright'
import type { ContentResult, ContentSection, ContentMetadata, ContentLink, CodeBlock, ContentType } from './content-types.js'

export class ContentExtractor {
  private page: Page
  
  constructor(page: Page) {
    this.page = page
  }
  
  async extract(): Promise<ContentResult> {
    const title = await this.page.title()
    const url = this.page.url()
    const content = await this.extractMainContent()
    const markdown = await this.convertToMarkdown(content)
    const structure = await this.extractStructure()
    const metadata = await this.extractMetadata()
    const links = await this.extractLinks()
    const codeBlocks = await this.extractCodeBlocks()
    const type = this.detectContentType(title, content, structure)
    
    return { type, title, content, markdown, structure, metadata, links, codeBlocks }
  }
  
  private async extractMainContent(): Promise<string> {
    return this.page.evaluate(() => {
      const selectors = ['article', '[role="main"]', 'main', '.content', '.post-content', '.article-content', '#content', '.markdown-body']
      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el) return el.textContent || ''
      }
      return document.body.textContent || ''
    })
  }
  
  private async convertToMarkdown(content: string): Promise<string> {
    return this.page.evaluate((html) => {
      return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }, content)
  }
  
  private async extractStructure(): Promise<ContentSection[]> {
    return this.page.evaluate(() => {
      const sections: ContentSection[] = []
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1))
        const headingText = heading.textContent || ''
        let content = ''
        let sibling = heading.nextElementSibling
        while (sibling && !/^H[1-6]$/.test(sibling.tagName)) {
          content += sibling.textContent + ' '
          sibling = sibling.nextElementSibling
        }
        sections.push({ level, heading: headingText.trim(), content: content.trim(), type: 'text' })
      })
      return sections
    })
  }
  
  private async extractMetadata(): Promise<{wordCount: number; readingTime: number}> {
    return this.page.evaluate(() => {
      const text = document.body.textContent || ''
      const wordCount = text.split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 200)
      return { wordCount, readingTime }
    })
  }
  
  private async extractLinks(): Promise<ContentLink[]> {
    return this.page.evaluate(() => {
      const links: ContentLink[] = []
      const currentDomain = window.location.hostname
      document.querySelectorAll('a[href]').forEach((a) => {
        const href = a.getAttribute('href') || ''
        const text = a.textContent || ''
        if (text && href) {
          let type: ContentLink['type'] = 'external'
          if (href.startsWith('#')) type = 'anchor'
          else if (href.includes(currentDomain)) type = 'internal'
          links.push({ text: text.trim(), url: href, type })
        }
      })
      return links
    })
  }
  
  private async extractCodeBlocks(): Promise<Array<{language: string; code: string}>> {
    return this.page.evaluate(() => {
      const blocks: Array<{language: string; code: string}> = []
      document.querySelectorAll('pre code').forEach((code) => {
        const language = code.className.replace('language-', '').replace('lang-', '') || 'text'
        const codeText = code.textContent || ''
        blocks.push({ language, code: codeText })
      })
      return blocks
    })
  }
  
  private detectContentType(title: string, content: string, sections: ContentSection[]): ContentType {
    const text = (title + ' ' + content).toLowerCase()
    if (/api|endpoint|swagger|openapi/i.test(text)) return 'api'
    if (/tutorial|how.?to|step.?by.?step/i.test(text)) return 'tutorial'
    if (/docs|documentation|guide|reference/i.test(text)) return 'documentation'
    if (/blog|post|article|news/i.test(text)) return 'blog'
    if (/forum|discussion|thread|comment/i.test(text)) return 'forum'
    return 'article'
  }
}
