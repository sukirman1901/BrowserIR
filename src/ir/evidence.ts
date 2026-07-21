import type { Evidence, EvidenceSource } from './types.js'

const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  a11y: 0.25,
  react: 0.20,
  vue: 0.20,
  schema_org: 0.18,
  angular: 0.18,
  dom: 0.15,
  vision: 0.15,
  meta: 0.10,
  network: 0.08,
}

export function calculateConfidence(evidences: Evidence[]): number {
  if (evidences.length === 0) return 0

  let totalWeight = 0
  let weightedSum = 0

  for (const e of evidences) {
    const w = e.weight || SOURCE_WEIGHTS[e.source] || 0.1
    weightedSum += e.confidence * w
    totalWeight += w
  }

  // Bonus for multi-source agreement
  const uniqueSources = new Set(evidences.map((e) => e.source)).size
  const multiSourceBonus = uniqueSources > 1 ? 0.05 * (uniqueSources - 1) : 0

  return Math.min(weightedSum / totalWeight + multiSourceBonus, 1.0)
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
        // Detect role or label mismatch between DOM and A11y
        if (
          evidences[i].selector !== evidences[j].selector &&
          evidences[i].raw !== evidences[j].raw &&
          Math.abs(evidences[i].confidence - evidences[j].confidence) > 0.15
        ) {
          const winner = evidences[i].confidence >= evidences[j].confidence ? evidences[i] : evidences[j]
          conflicts.push({
            sources: [evidences[i], evidences[j]],
            resolution: `Resolved using higher-confidence source: ${winner.source} (confidence: ${winner.confidence})`,
          })
        }
      }
    }
  }

  return conflicts
}
