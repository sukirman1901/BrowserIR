import type { Page } from 'playwright'

export interface DocStructure {
  sections: DocSection[]
  navigation: DocNavigation[]
  codeExamples: CodeExample[]
  apiEndpoints: ApiEndpoint[]
}

export interface DocSection {
  title: string
  content: string
  subsections: DocSection[]
  codeBlocks: CodeBlock[]
}

export interface DocNavigation {
  title: string
  url: string
  children: DocNavigation[]
}

export interface CodeExample {
  language: string
  code: string
  description?: string
}

export interface ApiEndpoint {
  method: string
  path: string
  description: string
  parameters: ApiParameter[]
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface CodeBlock {
  language: string
  code: string
}

export class DocParser {
  private page: Page
  
  constructor(page: Page) {
    this.page = page
  }
  
  async parse(): Promise<DocStructure> {
    const sections = await this.extractSections()
    const navigation = await this.extractNavigation()
    const codeExamples = await this.extractCodeExamples()
    const apiEndpoints = await this.extractApiEndpoints()
    return { sections, navigation, codeExamples, apiEndpoints }
  }
  
  private async extractSections(): Promise<DocSection[]> {
    return this.page.evaluate(() => {
      const sections: any[] = []
      const contentSelectors = ['article', '.doc-content', '.documentation', '[role="main"]', 'main']
      for (const selector of contentSelectors) {
        const content = document.querySelector(selector)
        if (content) {
          const headings = content.querySelectorAll('h1, h2, h3')
          headings.forEach((heading) => {
            const level = parseInt(heading.tagName.charAt(1))
            const title = heading.textContent || ''
            let content = ''
            let sibling = heading.nextElementSibling
            while (sibling && !/^H[1-6]$/.test(sibling.tagName)) {
              content += sibling.textContent + ' '
              sibling = sibling.nextElementSibling
            }
            sections.push({ title: title.trim(), content: content.trim(), subsections: [], codeBlocks: [] })
          })
          break
        }
      }
      return sections
    })
  }
  
  private async extractNavigation(): Promise<DocNavigation[]> {
    return this.page.evaluate(() => {
      const nav: any[] = []
      const navSelectors = ['nav', '.sidebar', '.navigation', '[role="navigation"]']
      for (const selector of navSelectors) {
        const navEl = document.querySelector(selector)
        if (navEl) {
          const links = navEl.querySelectorAll('a')
          links.forEach((a) => {
            const title = a.textContent || ''
            const url = a.getAttribute('href') || ''
            if (title && url) nav.push({ title: title.trim(), url, children: [] })
          })
          break
        }
      }
      return nav
    })
  }
  
  private async extractCodeExamples(): Promise<CodeExample[]> {
    return this.page.evaluate(() => {
      const examples: any[] = []
      document.querySelectorAll('pre code').forEach((code) => {
        const language = code.className.replace('language-', '').replace('lang-', '') || 'text'
        const codeText = code.textContent || ''
        const pre = code.parentElement
        const prev = pre?.previousElementSibling
        const description = prev?.textContent || undefined
        examples.push({ language, code: codeText, description })
      })
      return examples
    })
  }
  
  private async extractApiEndpoints(): Promise<ApiEndpoint[]> {
    return this.page.evaluate(() => {
      const endpoints: any[] = []
      const content = document.body.textContent || ''
      const pattern = /(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-{}]+)/g
      let match
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({ method: match[0].split(' ')[0], path: match[1], description: '', parameters: [] })
      }
      return endpoints
    })
  }
}
