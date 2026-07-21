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

export class SelfHealingEngine {
  constructor(private memory: MemoryEngine) {}

  async heal(brokenSelector: string, ir: BrowserIR, intent?: string): Promise<HealingResult> {
    const attempts: HealingStep[] = []
    const components = getComponents(ir)

    // Strategy 1: Semantic match (type)
    const semanticMatch = components.find(c => c.type === 'button' || c.type === 'link')
    if (semanticMatch) {
      attempts.push({ method: 'semantic', confidence: 0.9, description: 'Found by type' })
      return { found: true, selector: `#${semanticMatch.id}`, confidence: 0.9, method: 'semantic', attempts }
    }

    // Strategy 2: Text match
    const text = brokenSelector.replace(/[#.\[\]"]/g, '').toLowerCase()
    const textMatch = components.find(c => c.label.toLowerCase().includes(text))
    if (textMatch) {
      attempts.push({ method: 'text', confidence: 0.8, description: 'Found by text content' })
      return { found: true, selector: `#${textMatch.id}`, confidence: 0.8, method: 'text', attempts }
    }

    // Strategy 3: Memory lookup
    const memoryMatch = await this.findByMemory(ir.page.url)
    if (memoryMatch) {
      attempts.push({ method: 'memory', confidence: 0.85, description: 'Found in memory' })
      return { found: true, selector: memoryMatch, confidence: 0.85, method: 'memory', attempts }
    }

    attempts.push({ method: 'semantic', confidence: 0, description: 'No match found' })
    return { found: false, confidence: 0, method: 'none', attempts }
  }

  private async findByMemory(url: string): Promise<string | null> {
    const entry = await this.memory.recall(url)
    if (entry && entry.knowledge.knownElements.length > 0) {
      return entry.knowledge.knownElements[0].selectors[0]
    }
    return null
  }
}
