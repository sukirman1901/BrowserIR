import type Database from 'better-sqlite3'
import type { BrowserIR, ComponentIR } from '../ir/types.js'

export interface DiffResult {
  url: string
  timestamp: number
  changes: Change[]
  summary: string
  semanticDelta: number
}

export interface Change {
  type: 'added' | 'removed' | 'modified' | 'moved'
  target: ComponentIR
  before?: ComponentIR
  after?: ComponentIR
  confidence: number
}

function getComponents(ir: BrowserIR): ComponentIR[] {
  const components: ComponentIR[] = []
  for (const section of ir.page.sections) {
    components.push(...section.components)
    for (const child of section.children) {
      components.push(...child.components)
    }
  }
  return components
}

export class DiffEngine {
  constructor(private db: Database.Database) {}

  async diffIRs(irBefore: BrowserIR, irAfter: BrowserIR): Promise<DiffResult> {
    const changes: Change[] = []
    const compsBefore = getComponents(irBefore)
    const compsAfter = getComponents(irAfter)

    const matched = new Map<string, { before: ComponentIR; after: ComponentIR }>()
    const unmatchedBefore = new Set(compsBefore.map(c => c.id))
    const unmatchedAfter = new Set(compsAfter.map(c => c.id))

    for (const compAfter of compsAfter) {
      for (const compBefore of compsBefore) {
        if (!unmatchedBefore.has(compBefore.id)) continue
        if (compBefore.type === compAfter.type && compBefore.intent === compAfter.intent) {
          matched.set(compBefore.id, { before: compBefore, after: compAfter })
          unmatchedBefore.delete(compBefore.id)
          unmatchedAfter.delete(compAfter.id)
          break
        }
      }
    }

    for (const [, { before, after }] of matched) {
      if (before.label !== after.label || before.confidence !== after.confidence) {
        changes.push({ type: 'modified', target: after, before, after, confidence: 0.8 })
      }
    }

    for (const id of unmatchedBefore) {
      const comp = compsBefore.find(c => c.id === id)!
      changes.push({ type: 'removed', target: comp, before: comp, confidence: 0.9 })
    }

    for (const id of unmatchedAfter) {
      const comp = compsAfter.find(c => c.id === id)!
      changes.push({ type: 'added', target: comp, after: comp, confidence: 0.9 })
    }

    const semanticDelta = changes.length === 0 ? 0 : Math.min(1, changes.length / Math.max(compsBefore.length, 1))

    return {
      url: irAfter.page.url,
      timestamp: Date.now(),
      changes,
      summary: this.generateSummary(changes),
      semanticDelta
    }
  }

  private generateSummary(changes: Change[]): string {
    if (changes.length === 0) return 'No changes detected'
    const added = changes.filter(c => c.type === 'added').length
    const removed = changes.filter(c => c.type === 'removed').length
    const modified = changes.filter(c => c.type === 'modified').length
    const parts = []
    if (added) parts.push(`${added} added`)
    if (removed) parts.push(`${removed} removed`)
    if (modified) parts.push(`${modified} modified`)
    return parts.join(', ')
  }
}
