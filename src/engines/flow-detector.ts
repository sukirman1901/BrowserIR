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

interface FlowNode {
  id: string
  type: string
  label: string
  intent: string
  section: string
}

interface FlowEdge {
  from: string
  to: string
  type: 'input_to_submit' | 'navigation' | 'dependency'
}

interface FlowGraph {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export class FlowDetector {
  detectFlows(ir: BrowserIR): DetectedFlow[] {
    const flows: DetectedFlow[] = []

    // Legacy pattern detection
    const loginFlow = this.detectLoginFlow(ir)
    if (loginFlow) flows.push(loginFlow)
    const checkoutFlow = this.detectCheckoutFlow(ir)
    if (checkoutFlow) flows.push(checkoutFlow)
    const searchFlow = this.detectSearchFlow(ir)
    if (searchFlow) flows.push(searchFlow)
    const regFlow = this.detectRegistrationFlow(ir)
    if (regFlow) flows.push(regFlow)

    // Dynamic graph-based detection
    const graph = this.analyzePageGraph(ir)
    const graphFlows = this.detectFlowsFromGraph(graph)
    flows.push(...graphFlows)

    return flows
  }

  private analyzePageGraph(ir: BrowserIR): FlowGraph {
    const graph: FlowGraph = { nodes: [], edges: [] }

    for (const section of ir.page.sections) {
      for (const comp of section.components) {
        graph.nodes.push({
          id: comp.id,
          type: comp.type,
          label: comp.label,
          intent: comp.intent,
          section: section.role
        })

        if (comp.type === 'field') {
          const submitBtn = section.components.find(c =>
            c.type === 'button' && /submit|send|save|confirm/i.test(c.label)
          )
          if (submitBtn) {
            graph.edges.push({ from: comp.id, to: submitBtn.id, type: 'input_to_submit' })
          }
        }
      }
    }

    return graph
  }

  private detectFlowsFromGraph(graph: FlowGraph): DetectedFlow[] {
    const flows: DetectedFlow[] = []
    const submitButtons = graph.nodes.filter(n =>
      n.type === 'button' && /submit|send|save|confirm|login|register/i.test(n.label)
    )

    for (const btn of submitButtons) {
      const connectedFields = graph.edges
        .filter(e => e.to === btn.id && e.type === 'input_to_submit')
        .map(e => graph.nodes.find(n => n.id === e.from))
        .filter(Boolean)

      if (connectedFields.length > 0) {
        flows.push({
          name: `${btn.label} Flow`,
          steps: [
            ...connectedFields.map((f, i) => ({
              order: i + 1,
              action: `input ${f!.label}`,
              componentRef: f!.id,
              required: true
            })),
            { order: connectedFields.length + 1, action: `click ${btn.label}`, componentRef: btn.id, required: true }
          ],
          confidence: 0.85
        })
      }
    }

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
