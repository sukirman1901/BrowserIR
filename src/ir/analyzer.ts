import type {
  BrowserIR,
  PageIR,
  SectionIR,
  ComponentIR,
  ComponentState,
  Evidence,
  PageIntent,
  PageMetadata,
  Snapshot,
  EvidenceChain,
  SectionRole,
  ComponentType,
  IntentCategory,
  ActionIR,
  FlowStep,
  RiskAssessment,
} from './types.js'
import { calculateConfidence, detectConflicts } from './evidence.js'

// DOM node types for analysis
interface DOMNode {
  tag: string
  role?: string
  label?: string
  text?: string
  attributes: Record<string, string>
  children: DOMNode[]
  rect?: { x: number; y: number; width: number; height: number }
}

// Accessibility tree node
interface A11yNode {
  role: string
  name: string
  description?: string
  states: string[]
  children: A11yNode[]
}

// Analyzer options
export interface AnalyzerOptions {
  url: string
  title: string
  dom?: DOMNode
  a11y?: A11yNode
  framework?: string
  frameworkVersion?: string
}

// Component detection rules
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'textbox',
  'combobox',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'menuitem',
  'tab',
  'option',
])

const FORM_ROLES = new Set([
  'textbox',
  'combobox',
  'checkbox',
  'radio',
  'switch',
  'slider',
])

const SECTION_PATTERNS: Array<{
  pattern: RegExp
  role: SectionRole
  intent: string
}> = [
  { pattern: /login|sign.?in|auth/i, role: 'form', intent: 'authentication' },
  { pattern: /checkout|payment|pay|cart/i, role: 'form', intent: 'purchase' },
  { pattern: /search|find|query/i, role: 'form', intent: 'search' },
  { pattern: /nav|menu|sidebar/i, role: 'navigation', intent: 'navigation' },
  { pattern: /table|list|grid/i, role: 'table', intent: 'data_display' },
  { pattern: /modal|dialog|popup/i, role: 'modal', intent: 'overlay' },
  { pattern: /footer|copyright/i, role: 'footer', intent: 'meta' },
  { pattern: /header|banner/i, role: 'header', intent: 'branding' },
]

const INTENT_KEYWORDS: Record<string, IntentCategory> = {
  login: 'authentication',
  signin: 'authentication',
  signup: 'authentication',
  register: 'authentication',
  checkout: 'purchase',
  pay: 'purchase',
  buy: 'purchase',
  cart: 'purchase',
  search: 'search',
  find: 'search',
  submit: 'form_submission',
  save: 'form_submission',
  create: 'data_entry',
  edit: 'data_entry',
}

export class SemanticAnalyzer {
  private componentCounter = 0

  analyze(options: AnalyzerOptions): BrowserIR {
    this.componentCounter = 0

    const sections = this.extractSections(options)
    const intent = this.classifyIntent(options, sections)
    const components = this.extractComponents(options)

    // If no sections found, create a default content section
    if (sections.length === 0) {
      sections.push({
        id: this.nextId(),
        role: 'content',
        label: 'Main Content',
        intent: intent.primary,
        components,
        importance: 0.5,
        children: [],
      })
    }

    const metadata = this.extractMetadata(options, sections)

    const page: PageIR = {
      id: this.nextId(),
      url: options.url,
      title: options.title,
      intent,
      sections,
      metadata,
    }

    const snapshot: Snapshot = {
      id: this.nextId(),
      timestamp: Date.now(),
      irHash: this.hashIR(page),
    }

    const evidenceChain: EvidenceChain = {
      primary: this.createEvidence('dom', 'body', '<body>', 1.0, 0.9),
      secondary: [],
      conflicts: [],
    }

    if (options.a11y) {
      evidenceChain.secondary.push(
        this.createEvidence('a11y', 'accessibility-tree', JSON.stringify(options.a11y), 0.8, 0.95)
      )
    }

    evidenceChain.conflicts = detectConflicts([
      evidenceChain.primary,
      ...evidenceChain.secondary,
    ])

    return {
      version: '0.1',
      page,
      snapshot,
      evidence: evidenceChain,
    }
  }

  private extractSections(options: AnalyzerOptions): SectionIR[] {
    const sections: SectionIR[] = []

    // Analyze a11y tree for sections
    if (options.a11y) {
      for (const child of options.a11y.children) {
        const section = this.classifySection(child)
        if (section) {
          sections.push(section)
        }
      }
    }

    // Analyze DOM for sections
    if (options.dom) {
      for (const child of options.dom.children) {
        const section = this.classifyDOMSection(child)
        if (section && !sections.find((s) => s.role === section.role)) {
          sections.push(section)
        }
      }
    }

    return sections
  }

  private classifySection(node: A11yNode): SectionIR | null {
    const role = node.role.toLowerCase()
    const name = node.name.toLowerCase()

    // Check section patterns
    for (const { pattern, role: sectionRole, intent } of SECTION_PATTERNS) {
      if (pattern.test(name) || pattern.test(role)) {
        return {
          id: this.nextId(),
          role: sectionRole,
          label: node.name || sectionRole,
          intent,
          components: this.extractA11yComponents(node),
          importance: this.calculateImportance(node),
          children: [],
        }
      }
    }

    // Classify by role
    if (role === 'navigation') {
      return {
        id: this.nextId(),
        role: 'navigation',
        label: node.name || 'Navigation',
        intent: 'navigation',
        components: this.extractA11yComponents(node),
        importance: 0.7,
        children: [],
      }
    }

    if (role === 'main' || role === 'contentinfo' || role === 'banner') {
      const sectionRole: SectionRole =
        role === 'main' ? 'content' : role === 'contentinfo' ? 'footer' : 'header'
      return {
        id: this.nextId(),
        role: sectionRole,
        label: node.name || sectionRole,
        intent: 'content',
        components: this.extractA11yComponents(node),
        importance: role === 'main' ? 0.9 : 0.5,
        children: [],
      }
    }

    return null
  }

  private classifyDOMSection(node: DOMNode): SectionIR | null {
    const tag = node.tag.toLowerCase()
    const role = node.attributes['role']?.toLowerCase()
    const className = node.attributes['class']?.toLowerCase() || ''

    // Check class-based patterns
    for (const { pattern, role: sectionRole, intent } of SECTION_PATTERNS) {
      if (pattern.test(className) || pattern.test(role || '')) {
        return {
          id: this.nextId(),
          role: sectionRole,
          label: node.attributes['aria-label'] || sectionRole,
          intent,
          components: this.extractDOMComponents(node),
          importance: this.calculateDOMImportance(node),
          children: [],
        }
      }
    }

    // Semantic HTML elements
    if (tag === 'nav') {
      return {
        id: this.nextId(),
        role: 'navigation',
        label: node.attributes['aria-label'] || 'Navigation',
        intent: 'navigation',
        components: this.extractDOMComponents(node),
        importance: 0.7,
        children: [],
      }
    }

    if (tag === 'form') {
      return {
        id: this.nextId(),
        role: 'form',
        label: node.attributes['aria-label'] || 'Form',
        intent: 'form_submission',
        components: this.extractDOMComponents(node),
        importance: 0.8,
        children: [],
      }
    }

    return null
  }

  private extractComponents(options: AnalyzerOptions): ComponentIR[] {
    const components: ComponentIR[] = []

    if (options.a11y) {
      components.push(...this.extractA11yComponents(options.a11y))
    }

    if (options.dom && components.length === 0) {
      components.push(...this.extractDOMComponents(options.dom))
    }

    return components
  }

  private extractA11yComponents(node: A11yNode): ComponentIR[] {
    const components: ComponentIR[] = []

    if (INTERACTIVE_ROLES.has(node.role.toLowerCase())) {
      const component = this.createA11yComponent(node)
      if (component) components.push(component)
    }

    for (const child of node.children) {
      components.push(...this.extractA11yComponents(child))
    }

    return components
  }

  private createA11yComponent(node: A11yNode): ComponentIR | null {
    const role = node.role.toLowerCase()
    const type = this.mapA11yRoleToComponentType(role)
    if (!type) return null

    const state: ComponentState = {
      visible: !node.states.includes('hidden'),
      enabled: !node.states.includes('disabled'),
      focused: node.states.includes('focused'),
      loading: false,
      checked: node.states.includes('checked'),
    }

    const evidence: Evidence = {
      source: 'a11y',
      selector: `[role="${node.role}"][name="${node.name}"]`,
      raw: JSON.stringify(node),
      weight: 0.9,
      confidence: 0.95,
    }

    const label = node.name || node.description || 'Unknown'
    const intent = this.inferIntent(label, type)

    return {
      id: this.nextId(),
      type,
      label,
      intent,
      state,
      confidence: calculateConfidence([evidence]),
      evidence: [evidence],
    }
  }

  private extractDOMComponents(node: DOMNode): ComponentIR[] {
    const components: ComponentIR[] = []

    if (this.isInteractiveElement(node)) {
      const component = this.createDOMComponent(node)
      if (component) components.push(component)
    }

    for (const child of node.children) {
      components.push(...this.extractDOMComponents(child))
    }

    return components
  }

  private createDOMComponent(node: DOMNode): ComponentIR | null {
    const type = this.mapTagToComponentType(node.tag)
    if (!type) return null

    const label =
      node.attributes['aria-label'] ||
      node.attributes['placeholder'] ||
      node.text ||
      node.attributes['title'] ||
      'Unknown'

    const state: ComponentState = {
      visible: !node.attributes['hidden'],
      enabled: !node.attributes['disabled'],
      focused: false,
      loading: false,
      checked: node.attributes['checked'] === 'true',
    }

    const evidence: Evidence = {
      source: 'dom',
      selector: this.generateSelector(node),
      raw: `<${node.tag}${this.attributesToString(node.attributes)}>`,
      weight: 0.8,
      confidence: 0.85,
    }

    const intent = this.inferIntent(label, type)

    return {
      id: this.nextId(),
      type,
      label,
      intent,
      placeholder: node.attributes['placeholder'],
      value: node.attributes['value'],
      state,
      confidence: calculateConfidence([evidence]),
      evidence: [evidence],
    }
  }

  private classifyIntent(
    options: AnalyzerOptions,
    sections: SectionIR[]
  ): PageIntent {
    const text = `${options.title} ${options.url}`.toLowerCase()

    let primary = 'unknown'
    let category: IntentCategory = 'navigation'

    // Check URL and title for intent keywords
    for (const [keyword, intentCategory] of Object.entries(INTENT_KEYWORDS)) {
      if (text.includes(keyword)) {
        primary = keyword
        category = intentCategory
        break
      }
    }

    // Check sections for intent
    if (primary === 'unknown' && sections.length > 0) {
      primary = sections[0].intent
    }

    // Extract actions from components
    const actions: ActionIR[] = []
    const flow: FlowStep[] = []
    const risks: RiskAssessment[] = []

    for (const section of sections) {
      for (const component of section.components) {
        if (component.type === 'button' || component.type === 'link') {
          actions.push({
            id: component.id,
            label: component.label,
            type: this.classifyActionType(component),
            componentRef: component.id,
            enabled: component.state.enabled,
          })
        }
      }
    }

    // Detect missing required fields as risks
    const formSections = sections.filter((s) => s.role === 'form')
    for (const form of formSections) {
      const requiredFields = form.components.filter((c) => c.type === 'field')
      if (requiredFields.length === 0) {
        risks.push({
          type: 'missing_field',
          severity: 'medium',
          description: 'Form section has no input fields',
        })
      }
    }

    return {
      primary,
      category,
      actions,
      flow,
      risk: risks,
    }
  }

  private extractMetadata(options: AnalyzerOptions, sections: SectionIR[]): PageMetadata {
    let totalComponents = 0
    let totalForms = 0
    let totalLinks = 0

    for (const s of sections) {
      if (s.role === 'form') totalForms++
      for (const c of s.components) {
        totalComponents++
        if (c.type === 'link') totalLinks++
      }
    }

    return {
      framework: options.framework,
      frameworkVersion: options.frameworkVersion,
      hasAccessibilityTree: !!options.a11y,
      hasReactFiber: options.framework === 'react',
      totalComponents,
      totalForms,
      totalLinks,
      loadTime: 0,
      domSize: this.countDOMNodes(options.dom),
    }
  }

  // Helper methods

  private nextId(): string {
    return `@e${++this.componentCounter}`
  }

  private mapA11yRoleToComponentType(role: string): ComponentType | null {
    const mapping: Record<string, ComponentType> = {
      button: 'button',
      link: 'link',
      textbox: 'field',
      combobox: 'dropdown',
      checkbox: 'checkbox',
      radio: 'radio',
      switch: 'toggle',
      img: 'image',
      heading: 'text',
      paragraph: 'text',
      list: 'table',
      table: 'table',
    }
    return mapping[role] || null
  }

  private mapTagToComponentType(tag: string): ComponentType | null {
    const mapping: Record<string, ComponentType> = {
      button: 'button',
      a: 'link',
      input: 'field',
      textarea: 'field',
      select: 'dropdown',
      img: 'image',
      table: 'table',
    }
    return mapping[tag.toLowerCase()] || null
  }

  private isInteractiveElement(node: DOMNode): boolean {
    const tag = node.tag.toLowerCase()
    return (
      ['button', 'a', 'input', 'textarea', 'select'].includes(tag) ||
      node.attributes['role'] !== undefined ||
      node.attributes['tabindex'] !== undefined
    )
  }

  private generateSelector(node: DOMNode): string {
    if (node.attributes['id']) return `#${node.attributes['id']}`
    if (node.attributes['data-testid']) return `[data-testid="${node.attributes['data-testid']}"]`
    if (node.attributes['name']) return `${node.tag}[name="${node.attributes['name']}"]`
    return node.tag
  }

  private attributesToString(attrs: Record<string, string>): string {
    return Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('')
  }

  private inferIntent(label: string, type: ComponentType): string {
    const lower = label.toLowerCase()

    if (type === 'button') {
      if (/submit|save|confirm|pay|buy|order/.test(lower)) return 'submit_action'
      if (/cancel|close|dismiss/.test(lower)) return 'cancel_action'
      if (/delete|remove|destroy/.test(lower)) return 'destructive_action'
      return 'action'
    }

    if (type === 'link') {
      if (/login|signin|auth/.test(lower)) return 'navigate_login'
      if (/signup|register/.test(lower)) return 'navigate_register'
      return 'navigation'
    }

    if (type === 'field') {
      if (/email|e-mail/.test(lower)) return 'email_input'
      if (/password|pass/.test(lower)) return 'password_input'
      if (/search|query/.test(lower)) return 'search_input'
      return 'data_input'
    }

    return 'unknown'
  }

  private classifyActionType(component: ComponentIR): ActionIR['type'] {
    if (component.type === 'link') return 'navigation'
    if (/delete|remove|destroy/.test(component.intent)) return 'destructive'
    if (/submit|save|confirm|pay/.test(component.intent)) return 'primary'
    return 'secondary'
  }

  private calculateImportance(node: A11yNode): number {
    if (node.role === 'main') return 0.9
    if (node.role === 'navigation') return 0.7
    if (node.role === 'form') return 0.8
    return 0.5
  }

  private calculateDOMImportance(node: DOMNode): number {
    const tag = node.tag.toLowerCase()
    if (tag === 'main') return 0.9
    if (tag === 'nav') return 0.7
    if (tag === 'form') return 0.8
    return 0.5
  }

  private countDOMNodes(node?: DOMNode): number {
    if (!node) return 0
    return 1 + node.children.reduce((sum, child) => sum + this.countDOMNodes(child), 0)
  }

  private createEvidence(
    source: Evidence['source'],
    selector: string,
    raw: string,
    weight: number,
    confidence: number
  ): Evidence {
    return { source, selector, raw, weight, confidence }
  }

  private hashIR(page: PageIR): string {
    const content = JSON.stringify({
      url: page.url,
      title: page.title,
      sections: page.sections.map(s => ({
        role: s.role,
        label: s.label,
        intent: s.intent,
        componentCount: s.components.length,
        componentLabels: s.components.map(c => c.label).join(','),
      })),
    })
    // Simple hash for now
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return hash.toString(36)
  }
}
