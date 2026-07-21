// ===== Top Level =====

export interface BrowserIR {
  version: '0.1'
  page: PageIR
  snapshot: Snapshot
  evidence: EvidenceChain
}

export interface PageIR {
  id: string
  url: string
  title: string
  intent: PageIntent
  sections: SectionIR[]
  metadata: PageMetadata
}

// ===== Sections =====

export interface SectionIR {
  id: string
  role: SectionRole
  label: string
  intent: string
  components: ComponentIR[]
  importance: number
  children: SectionIR[]
}

export type SectionRole =
  | 'navigation'
  | 'form'
  | 'table'
  | 'dialog'
  | 'content'
  | 'modal'
  | 'sidebar'
  | 'footer'
  | 'header'

// ===== Components =====

export interface ComponentIR {
  id: string
  type: ComponentType
  label: string
  intent: string
  placeholder?: string
  value?: string
  state: ComponentState
  confidence: number
  evidence: Evidence[]
}

export type ComponentType =
  | 'field'
  | 'button'
  | 'link'
  | 'text'
  | 'image'
  | 'table'
  | 'dropdown'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'modal'
  | 'tooltip'
  | 'accordion'
  | 'tabs'
  | 'code_block'
  | 'snippet'
  | 'pre'
  | 'video'
  | 'audio'
  | 'embed'
  | 'form'
  | 'fieldset'
  | 'legend'
  | 'label'
  | 'textarea'
  | 'select'
  | 'option'
  | 'progress'
  | 'meter'
  | 'output'
  | 'details'
  | 'summary'
  | 'dialog'

// ===== State =====

export interface ComponentState {
  visible: boolean
  enabled: boolean
  focused: boolean
  loading: boolean
  expanded?: boolean
  checked?: boolean
}

// ===== Intent =====

export interface PageIntent {
  primary: string
  category: IntentCategory
  actions: ActionIR[]
  flow: FlowStep[]
  risk: RiskAssessment[]
}

export type IntentCategory =
  | 'authentication'
  | 'purchase'
  | 'content_consumption'
  | 'search'
  | 'navigation'
  | 'form_submission'
  | 'data_entry'
  | 'documentation'
  | 'tutorial'
  | 'blog'
  | 'api_reference'
  | 'forum'
  | 'chat'
  | 'dashboard'
  | 'settings'
  | 'profile'
  | 'checkout'
  | 'payment'
  | 'subscription'
  | 'support'
  | 'feedback'
  | 'contact'
  | 'social'
  | 'media'
  | 'download'

export interface ActionIR {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'destructive' | 'navigation'
  componentRef: string
  enabled: boolean
}

export interface FlowStep {
  order: number
  action: string
  required: boolean
  estimatedDuration: number
}

export interface RiskAssessment {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  componentRef?: string
}

// ===== Evidence =====

export interface Evidence {
  source: EvidenceSource
  selector: string
  raw: string
  weight: number
  confidence: number
}

export type EvidenceSource =
  | 'dom'
  | 'a11y'
  | 'react'
  | 'vue'
  | 'angular'
  | 'vision'
  | 'network'
  | 'meta'
  | 'schema_org'

export interface EvidenceChain {
  primary: Evidence
  secondary: Evidence[]
  conflicts: Conflict[]
}

export interface Conflict {
  sources: [Evidence, Evidence]
  resolution: string
}

// ===== Snapshot =====

export interface Snapshot {
  id: string
  timestamp: number
  irHash: string
  previousSnapshotId?: string
}

// ===== Metadata =====

export interface PageMetadata {
  framework?: string
  frameworkVersion?: string
  hasAccessibilityTree: boolean
  hasReactFiber: boolean
  totalComponents: number
  totalForms: number
  totalLinks: number
  loadTime: number
  domSize: number
}

// ===== Diff Types =====

export interface DiffResult {
  semantic: SemanticDiff
  structural: StructuralDiff
  state: StateDiff
  intent: IntentDiff
}

export interface SemanticDiff {
  added: ComponentIR[]
  removed: ComponentIR[]
  changed: ComponentChange[]
}

export interface StructuralDiff {
  sectionsAdded: string[]
  sectionsRemoved: string[]
  sectionsReordered: string[]
}

export interface StateDiff {
  componentId: string
  field: string
  before: unknown
  after: unknown
}[]

export interface IntentDiff {
  before: string
  after: string
}

export interface ComponentChange {
  component: ComponentIR
  before: ComponentIR
  changes: string[]
}

// ===== Explain Types =====

export interface ExplainResult {
  summary: string
  components: ComponentSummary[]
  flows: FlowSummary[]
  risks: RiskSummary[]
  recommendations: string[]
}

export interface ComponentSummary {
  label: string
  type: string
  importance: 'primary' | 'secondary' | 'tertiary'
  state: string
}

export interface FlowSummary {
  name: string
  steps: string[]
  estimatedTime: number
}

export interface RiskSummary {
  type: string
  severity: string
  description: string
}

// ===== Website Knowledge (Memory Engine) =====

export interface WebsiteKnowledge {
  purpose: string
  commonFlows: string[]
  knownElements: KnownElement[]
  preferences: Record<string, any>
  issues: Issue[]
}

export interface KnownElement {
  selectors: string[]
  label: string
  role: string
}

export interface Issue {
  type: string
  description: string
  severity: 'low' | 'medium' | 'high'
  timestamp: number
}
