import type { BrowserIR, ComponentIR } from '../ir/types.js'

export interface DetectedFlow {
  name: string
  steps: Array<{
    order: number
    action: string
    componentRef?: string
    required: boolean
  }>
  confidence: number
}

export class FlowDetector {
  detectFlows(ir: BrowserIR): DetectedFlow[] {
    const flows: DetectedFlow[] = []
    const loginFlow = this.detectLoginFlow(ir)
    if (loginFlow) flows.push(loginFlow)
    const checkoutFlow = this.detectCheckoutFlow(ir)
    if (checkoutFlow) flows.push(checkoutFlow)
    const searchFlow = this.detectSearchFlow(ir)
    if (searchFlow) flows.push(searchFlow)
    const regFlow = this.detectRegistrationFlow(ir)
    if (regFlow) flows.push(regFlow)
    return flows
  }

  private detectLoginFlow(ir: BrowserIR): DetectedFlow | null {
    const emailFields = this.findByIntent(ir, 'email_input')
    const passwordFields = this.findByIntent(ir, 'password_input')
    if (emailFields.length === 0 || passwordFields.length === 0) return null
    const submitBtn = this.findByLabel(ir, /submit|login|masuk|sign.?in/i)[0]
    return {
      name: 'Login Flow',
      steps: [
        { order: 1, action: 'input email', componentRef: emailFields[0].id, required: true },
        { order: 2, action: 'input password', componentRef: passwordFields[0].id, required: true },
        { order: 3, action: 'click submit', componentRef: submitBtn?.id, required: true },
      ],
      confidence: 0.9,
    }
  }

  private detectCheckoutFlow(ir: BrowserIR): DetectedFlow | null {
    const buyButtons = this.findByLabel(ir, /beli|buy|checkout|pay|bayar/i)
    if (buyButtons.length === 0) return null
    return {
      name: 'Checkout Flow',
      steps: [
        { order: 1, action: 'click buy', componentRef: buyButtons[0].id, required: true },
        { order: 2, action: 'fill shipping', required: true },
        { order: 3, action: 'select payment', required: true },
        { order: 4, action: 'confirm order', required: true },
      ],
      confidence: 0.8,
    }
  }

  private detectSearchFlow(ir: BrowserIR): DetectedFlow | null {
    const searchInputs = [...this.findByIntent(ir, 'search_input'), ...this.findByLabel(ir, /search|cari|find|query/i)]
    if (searchInputs.length === 0) return null
    return {
      name: 'Search Flow',
      steps: [
        { order: 1, action: 'input search query', componentRef: searchInputs[0].id, required: true },
        { order: 2, action: 'submit search', required: true },
      ],
      confidence: 0.85,
    }
  }

  private detectRegistrationFlow(ir: BrowserIR): DetectedFlow | null {
    const emailFields = this.findByIntent(ir, 'email_input')
    const registerButtons = this.findByLabel(ir, /register|daftar|sign.?up/i)
    if (emailFields.length === 0 || registerButtons.length === 0) return null
    return {
      name: 'Registration Flow',
      steps: [
        { order: 1, action: 'input email', componentRef: emailFields[0].id, required: true },
        { order: 3, action: 'click register', componentRef: registerButtons[0].id, required: true },
      ],
      confidence: 0.85,
    }
  }

  private findByIntent(ir: BrowserIR, intent: string): ComponentIR[] {
    const result: ComponentIR[] = []
    for (const s of ir.page.sections) for (const c of s.components) if (c.intent.includes(intent)) result.push(c)
    return result
  }

  private findByLabel(ir: BrowserIR, pattern: RegExp): ComponentIR[] {
    const result: ComponentIR[] = []
    for (const s of ir.page.sections) for (const c of s.components) if (pattern.test(c.label)) result.push(c)
    return result
  }
}
