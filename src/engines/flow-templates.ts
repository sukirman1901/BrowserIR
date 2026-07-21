export interface FlowTemplate {
  name: string
  description: string
  steps: FlowStepTemplate[]
  conditions: FlowCondition[]
  alternatives: FlowAlternative[]
  confidence: number
}

export interface FlowStepTemplate {
  order: number
  action: string
  type: 'click' | 'fill' | 'select' | 'wait' | 'verify'
  selector?: string
  selectorType?: 'text' | 'role' | 'aria' | 'css'
  value?: string
  required: boolean
  timeout?: number
}

export interface FlowCondition {
  type: 'element_exists' | 'text_contains' | 'url_matches'
  value: string
}

export interface FlowAlternative {
  condition: string
  steps: FlowStepTemplate[]
}

export class FlowTemplateEngine {
  private templates: FlowTemplate[] = [
    {
      name: 'Login Flow',
      description: 'Standard login flow with email/password',
      steps: [
        { order: 1, action: 'Navigate to login page', type: 'click', selector: 'Login link', selectorType: 'text', required: true },
        { order: 2, action: 'Enter email', type: 'fill', selector: 'Email input', selectorType: 'role', value: 'test@example.com', required: true },
        { order: 3, action: 'Enter password', type: 'fill', selector: 'Password input', selectorType: 'role', value: 'password', required: true },
        { order: 4, action: 'Click submit', type: 'click', selector: 'Submit button', selectorType: 'text', required: true },
      ],
      conditions: [{ type: 'element_exists', value: 'form' }],
      alternatives: [],
      confidence: 0.9
    },
    {
      name: 'Registration Flow',
      description: 'Standard registration flow',
      steps: [
        { order: 1, action: 'Navigate to register page', type: 'click', selector: 'Register link', selectorType: 'text', required: true },
        { order: 2, action: 'Enter email', type: 'fill', selector: 'Email input', selectorType: 'role', required: true },
        { order: 3, action: 'Enter password', type: 'fill', selector: 'Password input', selectorType: 'role', required: true },
        { order: 4, action: 'Confirm password', type: 'fill', selector: 'Confirm password input', selectorType: 'role', required: true },
        { order: 5, action: 'Click register', type: 'click', selector: 'Register button', selectorType: 'text', required: true },
      ],
      conditions: [{ type: 'element_exists', value: 'form' }],
      alternatives: [],
      confidence: 0.85
    },
    {
      name: 'Checkout Flow',
      description: 'Standard e-commerce checkout',
      steps: [
        { order: 1, action: 'Click buy', type: 'click', selector: 'Buy button', selectorType: 'text', required: true },
        { order: 2, action: 'Enter shipping info', type: 'fill', selector: 'Shipping form', selectorType: 'role', required: true },
        { order: 3, action: 'Select payment', type: 'click', selector: 'Payment option', selectorType: 'role', required: true },
        { order: 4, action: 'Confirm order', type: 'click', selector: 'Confirm button', selectorType: 'text', required: true },
      ],
      conditions: [{ type: 'element_exists', value: 'form' }],
      alternatives: [],
      confidence: 0.8
    },
    {
      name: 'Search Flow',
      description: 'Standard search flow',
      steps: [
        { order: 1, action: 'Click search input', type: 'click', selector: 'Search input', selectorType: 'role', required: true },
        { order: 2, action: 'Enter search query', type: 'fill', selector: 'Search input', selectorType: 'role', required: true },
        { order: 3, action: 'Submit search', type: 'click', selector: 'Search button', selectorType: 'text', required: true },
      ],
      conditions: [{ type: 'element_exists', value: 'search' }],
      alternatives: [],
      confidence: 0.85
    },
  ]

  getTemplates(): FlowTemplate[] {
    return this.templates
  }

  getTemplate(name: string): FlowTemplate | undefined {
    return this.templates.find(t => t.name.toLowerCase() === name.toLowerCase())
  }

  matchTemplate(pageContent: string): FlowTemplate | null {
    const content = pageContent.toLowerCase()
    
    for (const template of this.templates) {
      const matchScore = this.calculateMatchScore(content, template)
      if (matchScore > 0.7) {
        return template
      }
    }
    
    return null
  }

  private calculateMatchScore(content: string, template: FlowTemplate): number {
    let score = 0
    
    for (const step of template.steps) {
      if (step.selector && content.includes(step.selector.toLowerCase())) {
        score += 0.2
      }
    }
    
    for (const condition of template.conditions) {
      if (condition.type === 'text_contains' && content.includes(condition.value.toLowerCase())) {
        score += 0.3
      }
    }
    
    return Math.min(score, 1.0)
  }

  learnFromFlow(flow: { name: string; steps: string[] }): void {
    const existing = this.templates.find(t => t.name === flow.name)
    if (existing) {
      existing.confidence = Math.min(existing.confidence + 0.05, 1.0)
    } else {
      this.templates.push({
        name: flow.name,
        description: `Learned from observed flow`,
        steps: flow.steps.map((step, i) => ({
          order: i + 1,
          action: step,
          type: 'click' as const,
          required: true
        })),
        conditions: [],
        alternatives: [],
        confidence: 0.5
      })
    }
  }
}