import { describe, it, expect } from 'vitest'
import type {
  BrowserIR,
  PageIR,
  SectionIR,
  ComponentIR,
  ExplainResult,
} from '../../src/ir/types.js'

describe('BrowserIR Types', () => {
  it('should create a valid BrowserIR object', () => {
    const ir: BrowserIR = {
      version: '0.1',
      page: {
        id: 'test',
        url: 'https://example.com',
        title: 'Test Page',
        intent: {
          primary: 'navigation',
          category: 'navigation',
          actions: [],
          flow: [],
          risk: [],
        },
        sections: [],
        metadata: {
          hasAccessibilityTree: true,
          hasReactFiber: false,
          totalComponents: 0,
          totalForms: 0,
          totalLinks: 0,
          loadTime: 100,
          domSize: 50,
        },
      },
      snapshot: {
        id: 'snap-1',
        timestamp: Date.now(),
        irHash: 'abc123',
      },
      evidence: {
        primary: {
          source: 'dom',
          selector: 'body',
          raw: '<body></body>',
          weight: 1.0,
          confidence: 0.9,
        },
        secondary: [],
        conflicts: [],
      },
    }

    expect(ir.version).toBe('0.1')
    expect(ir.page.intent.primary).toBe('navigation')
  })

  it('should create a valid ComponentIR', () => {
    const component: ComponentIR = {
      id: '@e1',
      type: 'button',
      label: 'Submit',
      intent: 'submit form',
      state: {
        visible: true,
        enabled: true,
        focused: false,
        loading: false,
      },
      confidence: 0.95,
      evidence: [
        {
          source: 'dom',
          selector: 'button[type="submit"]',
          raw: '<button>Submit</button>',
          weight: 1.0,
          confidence: 0.95,
        },
      ],
    }

    expect(component.id).toBe('@e1')
    expect(component.type).toBe('button')
    expect(component.state.enabled).toBe(true)
  })

  it('should create a valid ExplainResult', () => {
    const result: ExplainResult = {
      summary: 'This is a login page',
      components: [
        { label: 'Email', type: 'field', importance: 'primary', state: 'enabled' },
        { label: 'Password', type: 'field', importance: 'primary', state: 'enabled' },
        { label: 'Login', type: 'button', importance: 'primary', state: 'enabled' },
      ],
      flows: [
        { name: 'Login', steps: ['Enter email', 'Enter password', 'Click login'], estimatedTime: 10000 },
      ],
      risks: [],
      recommendations: ['Add remember me checkbox'],
    }

    expect(result.summary).toBe('This is a login page')
    expect(result.components).toHaveLength(3)
  })
})
