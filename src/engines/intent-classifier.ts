import type { SearchIntent, IntentCategory } from '../ir/search-types.js'

interface IntentPattern {
  category: IntentCategory
  keywords: string[]
  weight: number
}

const INTENT_PATTERNS: IntentPattern[] = [
  { category: 'login', keywords: ['login', 'signin', 'sign in', 'log in', 'authenticate'], weight: 1.0 },
  { category: 'signup', keywords: ['signup', 'sign up', 'register', 'create account'], weight: 1.0 },
  { category: 'pricing', keywords: ['pricing', 'price', 'cost', 'plans', 'billing', 'subscription'], weight: 1.0 },
  { category: 'documentation', keywords: ['docs', 'documentation', 'guide', 'manual', 'tutorial'], weight: 0.9 },
  { category: 'api_reference', keywords: ['api', 'reference', 'endpoint', 'swagger', 'openapi'], weight: 0.9 },
  { category: 'blog', keywords: ['blog', 'post', 'article', 'news'], weight: 0.8 },
  { category: 'support', keywords: ['support', 'help', 'faq', 'contact'], weight: 0.8 },
  { category: 'download', keywords: ['download', 'install', 'setup', 'get started'], weight: 0.8 },
  { category: 'checkout', keywords: ['checkout', 'cart', 'purchase', 'buy'], weight: 1.0 },
  { category: 'dashboard', keywords: ['dashboard', 'panel', 'admin', 'console'], weight: 0.9 },
  { category: 'settings', keywords: ['settings', 'preferences', 'config', 'options'], weight: 0.8 },
]

export class IntentClassifier {
  private patterns: IntentPattern[]

  constructor(patterns: IntentPattern[] = INTENT_PATTERNS) {
    this.patterns = patterns
  }

  classify(query: string): SearchIntent {
    const normalized = query.toLowerCase().trim()
    const words = normalized.split(/\s+/)

    let bestMatch: { category: IntentCategory; score: number } | null = null

    for (const pattern of this.patterns) {
      let score = 0

      for (const keyword of pattern.keywords) {
        if (normalized.includes(keyword)) {
          score = Math.max(score, pattern.weight * 1.0)
        } else if (words.some(w => keyword.includes(w) || w.includes(keyword))) {
          score = Math.max(score, pattern.weight * 0.5)
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { category: pattern.category, score }
      }
    }

    const keywords = this.extractKeywords(normalized)

    return {
      category: bestMatch?.category ?? 'unknown',
      keywords,
      confidence: bestMatch ? Math.min(bestMatch.score, 1.0) : 0
    }
  }

  classifyUrl(url: string): SearchIntent {
    const pathname = new URL(url).pathname.toLowerCase()

    if (pathname.includes('/login') || pathname.includes('/signin')) {
      return { category: 'login', keywords: ['login'], confidence: 0.9 }
    }
    if (pathname.includes('/pricing') || pathname.includes('/plans')) {
      return { category: 'pricing', keywords: ['pricing'], confidence: 0.9 }
    }
    if (pathname.includes('/docs') || pathname.includes('/documentation')) {
      return { category: 'documentation', keywords: ['docs'], confidence: 0.9 }
    }
    if (pathname.includes('/api') || pathname.includes('/reference')) {
      return { category: 'api_reference', keywords: ['api'], confidence: 0.9 }
    }
    if (pathname.includes('/blog') || pathname.includes('/post')) {
      return { category: 'blog', keywords: ['blog'], confidence: 0.9 }
    }
    if (pathname.includes('/support') || pathname.includes('/help')) {
      return { category: 'support', keywords: ['support'], confidence: 0.9 }
    }
    if (pathname.includes('/download')) {
      return { category: 'download', keywords: ['download'], confidence: 0.9 }
    }
    if (pathname.includes('/checkout') || pathname.includes('/cart')) {
      return { category: 'checkout', keywords: ['checkout'], confidence: 0.9 }
    }
    if (pathname.includes('/dashboard') || pathname.includes('/admin')) {
      return { category: 'dashboard', keywords: ['dashboard'], confidence: 0.9 }
    }
    if (pathname.includes('/settings') || pathname.includes('/preferences')) {
      return { category: 'settings', keywords: ['settings'], confidence: 0.9 }
    }

    return { category: 'unknown', keywords: [], confidence: 0 }
  }

  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'for', 'in', 'on', 'at', 'by', 'with'])
    return query
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 5)
  }
}
