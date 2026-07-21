import { SemanticAnalyzer, type AnalyzerOptions } from '../ir/analyzer.js'
import type { BrowserIR } from '../ir/types.js'
import type { Page } from 'playwright'

export interface ExplainResult {
  ir: BrowserIR
  framework?: { name?: string; version?: string }
  snapshot?: { a11y: any }
}

export function extractSelectors(...selectors: string[]): string[] {
  return selectors.filter(s => {
    if (!s || s.trim() === '') return false
    // Basic CSS selector validation
    if (/^[a-zA-Z]/.test(s) || /^[.#\[]/.test(s)) return true
    return false
  })
}

export class ExplainEngine {
  private analyzer = new SemanticAnalyzer()

  async explain(page: Page): Promise<ExplainResult> {
    const url = page.url()
    const title = await page.title()

    let a11y: AnalyzerOptions['a11y']
    try {
      const roles = await page.evaluate(() => {
        const tree = (el: Element): { role: string; name: string; states: string[]; children: any[] } => {
          const role = el.getAttribute('role') || el.tagName.toLowerCase()
          const name = (el as HTMLElement).innerText || el.getAttribute('aria-label') || ''
          const children = Array.from(el.children).map(tree).filter(c => c.name || c.children.length)
          return { role, name: (el as HTMLElement).innerText || el.getAttribute('aria-label') || '', states: [], children }
        }
        return tree(document.documentElement)
      })
      a11y = { role: 'Root', name: url, states: [], children: [roles] }
    } catch {
      // A11y not available
    }

    const framework = await this.detectFramework(page)

    const ir = this.analyzer.analyze({
      url,
      title,
      a11y,
      framework: framework.name,
      frameworkVersion: framework.version,
    })

    return {
      ir,
      framework,
      snapshot: a11y ? { a11y } : undefined,
    }
  }

  async detectFramework(page: Page): Promise<{ name?: string; version?: string }> {
    try {
      return await page.evaluate(() => {
        const reactRoot = document.querySelector('[data-reactroot]') ||
          document.querySelector('#__next') ||
          document.querySelector('#root')
        if (reactRoot || (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          return { name: 'react', version: undefined }
        }

        if ((window as any).__VUE__) {
          return { name: 'vue', version: undefined }
        }

        if ((window as any).ng || document.querySelector('[ng-version]')) {
          return { name: 'angular', version: undefined }
        }

        return {}
      })
    } catch {
      return {}
    }
  }
}
