import type { Evidence, EvidenceSource } from './types.js'

const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  schema_org: 0.25,
  react: 0.20,
  vue: 0.18,
  angular: 0.18,
  a11y: 0.18,
  meta: 0.15,
  dom: 0.12,
  vision: 0.10,
  network: 0.08,
}

export function calculateConfidence(evidences: Evidence[]): number {
  if (evidences.length === 0) return 0

  let totalWeight = 0
  let weightedSum = 0

  for (const e of evidences) {
    const w = SOURCE_WEIGHTS[e.source] || 0.1
    weightedSum += e.confidence * w
    totalWeight += w
  }

  return Math.min(weightedSum / totalWeight, 1.0)
}

export function mergeEvidences(
  primary: Evidence,
  secondary: Evidence[]
): Evidence {
  const all = [primary, ...secondary]
  const best = all.reduce((best, curr) =>
    curr.confidence > best.confidence ? curr : best
  )
  return best
}

export function detectConflicts(evidences: Evidence[]): Array<{
  sources: [Evidence, Evidence]
  resolution: string
}> {
  const conflicts: Array<{ sources: [Evidence, Evidence]; resolution: string }> = []

  for (let i = 0; i < evidences.length; i++) {
    for (let j = i + 1; j < evidences.length; j++) {
      if (evidences[i].source !== evidences[j].source) {
        // Simple conflict detection: different selectors for same concept
        if (
          evidences[i].selector !== evidences[j].selector &&
          evidences[i].raw !== evidences[j].raw
        ) {
          conflicts.push({
            sources: [evidences[i], evidences[j]],
            resolution: `Using higher confidence source: ${evidences[i].confidence > evidences[j].confidence ? evidences[i].source : evidences[j].source}`,
          })
        }
      }
    }
  }

  return conflicts
}
