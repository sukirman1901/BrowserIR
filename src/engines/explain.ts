import { SemanticAnalyzer, type AnalyzerOptions } from '../ir/analyzer.js'
import type { BrowserIR } from '../ir/types.js'
import type { Page } from 'playwright'

export interface ExplainResult {
  ir: BrowserIR
  framework?: { name?: string; version?: string }
  snapshot?: { a11y: any }
}

export class ExplainEngine {
  private analyzer = new SemanticAnalyzer()

  async explain(page: Page): Promise<ExplainResult> {
    const url = page.url()
    const title = await page.title()

    let a11y: AnalyzerOptions['a11y']

    // Strategy 1: Try Playwright native Accessibility snapshot API
    try {
      if (typeof (page as any).accessibility?.snapshot === 'function') {
        const snapshot = await (page as any).accessibility.snapshot({ interestingOnly: false })
        if (snapshot) {
          const mapNode = (node: any): any => ({
            role: node.role || 'generic',
            name: node.name || node.value || '',
            description: node.description || '',
            states: Object.entries(node)
              .filter(([k, v]) => typeof v === 'boolean' && v)
              .map(([k]) => k),
            children: (node.children || []).map(mapNode),
          })
          a11y = { role: 'Root', name: url, states: [], children: [mapNode(snapshot)] }
        }
      }
    } catch {
      // Fallback
    }

    // Strategy 2: CDP Session for Full AXTree if available on Chromium
    if (!a11y) {
      try {
        const cdpSession = await page.context().newCDPSession(page)
        const { nodes } = await cdpSession.send('Accessibility.getFullAXTree')
        if (nodes && nodes.length > 0) {
          // Convert CDP AXNode array to tree representation
          const nodeMap = new Map<string, any>()
          for (const n of nodes) {
            nodeMap.set(n.nodeId, {
              role: n.role?.value || 'generic',
              name: n.name?.value || '',
              description: n.description?.value || '',
              states: (n.properties || []).map((p: any) => p.name),
              childIds: n.childIds || [],
              children: [],
            })
          }
          for (const node of nodeMap.values()) {
            for (const childId of node.childIds) {
              const childNode = nodeMap.get(childId)
              if (childNode) node.children.push(childNode)
            }
          }
          const rootNode = nodeMap.get(nodes[0].nodeId)
          if (rootNode) {
            a11y = { role: 'Root', name: url, states: [], children: [rootNode] }
          }
        }
      } catch {
        // Fallback to DOM traversal
      }
    }

    // Strategy 3: DOM-based evaluation fallback
    if (!a11y) {
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
