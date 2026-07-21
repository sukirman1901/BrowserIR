import type { BrowserIR, ComponentIR } from '../ir/types.js'
import type { MemoryEngine } from './memory.js'

export interface HealingStep {
  method: 'semantic' | 'visual' | 'text' | 'position' | 'memory'
  confidence: number
  description: string
}

export interface HealingResult {
  found: boolean
  selector?: string
  confidence: number
  method: string
  attempts: HealingStep[]
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

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function stringSimilarity(a: string, b: string): number {
  const str1 = a.toLowerCase().trim()
  const str2 = b.toLowerCase().trim()
  if (str1 === str2) return 1.0
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1.0
  const dist = levenshteinDistance(str1, str2)
  return (maxLen - dist) / maxLen
}

export class SelfHealingEngine {
  constructor(private memory: MemoryEngine) {}

  async heal(brokenSelector: string, ir: BrowserIR, intent?: string): Promise<HealingResult> {
    const attempts: HealingStep[] = []
    const components = getComponents(ir)

    if (components.length === 0) {
      attempts.push({ method: 'semantic', confidence: 0, description: 'No components found in IR' })
      return { found: false, confidence: 0, method: 'none', attempts }
    }

    const cleanSelector = brokenSelector.replace(/[#.\[\]"=]/g, ' ').replace(/\s+/g, ' ').trim()

    // Strategy 1: Text & Label Fuzzy Match (Levenshtein)
    let bestTextMatch: { component: ComponentIR; score: number } | null = null
    for (const c of components) {
      const labelSim = stringSimilarity(cleanSelector, c.label)
      const placeholderSim = c.placeholder ? stringSimilarity(cleanSelector, c.placeholder) : 0
      const maxSim = Math.max(labelSim, placeholderSim)

      if (!bestTextMatch || maxSim > bestTextMatch.score) {
        bestTextMatch = { component: c, score: maxSim }
      }
    }

    if (bestTextMatch && bestTextMatch.score >= 0.5) {
      attempts.push({ method: 'text', confidence: bestTextMatch.score, description: `Fuzzy text match (${Math.round(bestTextMatch.score * 100)}% similarity)` })
      const sel = bestTextMatch.component.evidence[0]?.selector || `#${bestTextMatch.component.id}`
      return { found: true, selector: sel, confidence: Math.min(bestTextMatch.score, 0.95), method: 'text', attempts }
    } else if (bestTextMatch) {
      attempts.push({ method: 'text', confidence: bestTextMatch.score, description: `Best text similarity score (${Math.round(bestTextMatch.score * 100)}%) below threshold` })
    }

    // Strategy 2: ARIA & Attribute Recovery (check evidence array)
    for (const c of components) {
      for (const ev of c.evidence) {
        if (cleanSelector.split(' ').some(token => token.length > 2 && ev.selector.toLowerCase().includes(token))) {
          attempts.push({ method: 'semantic', confidence: 0.85, description: 'Found via ARIA evidence attribute match' })
          return { found: true, selector: ev.selector || `#${c.id}`, confidence: 0.85, method: 'semantic', attempts }
        }
      }
    }

    // Strategy 3: Intent & Type Alignment
    const reqIntent = (intent || '').toLowerCase()
    const typeToken = cleanSelector.split(' ')[0].toLowerCase()
    const semanticMatch = components.find(c =>
      (reqIntent && (c.intent.toLowerCase().includes(reqIntent) || c.label.toLowerCase().includes(reqIntent))) ||
      (typeToken && (c.type.toLowerCase() === typeToken || c.type.toLowerCase().includes(typeToken)))
    )

    if (semanticMatch) {
      attempts.push({ method: 'semantic', confidence: 0.9, description: 'Semantic match by type or intent' })
      const sel = semanticMatch.evidence[0]?.selector || `#${semanticMatch.id}`
      return { found: true, selector: sel, confidence: 0.9, method: 'semantic', attempts }
    }

    // Strategy 4: Memory Lookup
    try {
      const memoryMatch = await this.findByMemory(ir.page.url)
      if (memoryMatch) {
        attempts.push({ method: 'memory', confidence: 0.85, description: 'Found in domain memory' })
        return { found: true, selector: memoryMatch, confidence: 0.85, method: 'memory', attempts }
      }
    } catch {
      // Memory lookup error
    }

    attempts.push({ method: 'semantic', confidence: 0, description: 'No matching component found' })
    return { found: false, confidence: 0, method: 'none', attempts }
  }

  private async findByMemory(url: string): Promise<string | null> {
    const domain = new URL(url).hostname
    const entry = await this.memory.recall(domain)
    if (entry && entry.knowledge.knownElements.length > 0) {
      return entry.knowledge.knownElements[0].selectors[0]
    }
    return null
  }
}
