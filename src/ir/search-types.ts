export interface SearchQuery {
  text: string
  intent?: SearchIntent
  filters?: SearchFilters
  limit?: number
  offset?: number
}

export interface SearchIntent {
  category: IntentCategory
  keywords: string[]
  confidence: number
}

export type IntentCategory =
  | 'pricing'
  | 'login'
  | 'documentation'
  | 'api_reference'
  | 'blog'
  | 'product'
  | 'support'
  | 'forum'
  | 'download'
  | 'signup'
  | 'checkout'
  | 'dashboard'
  | 'settings'
  | 'unknown'

export interface SearchFilters {
  domain?: string
  intent?: IntentCategory
  minScore?: number
  maxAge?: number // days
}

export interface SearchResult {
  id: string
  url: string
  title: string
  snippet: string
  score: number
  intent: SearchIntent
  ir?: any // BrowserIR
  metadata: SearchResultMetadata
}

export interface SearchResultMetadata {
  crawledAt: number
  lastIndexed: number
  domain: string
  framework?: string
  components: number
  links: number
}

export interface CrawlRequest {
  url: string
  depth: number
  priority: number
  discoveredAt: number
}

export interface CrawlResult {
  url: string
  title: string
  content: string
  links: string[]
  ir: any // BrowserIR
  crawledAt: number
  status: 'success' | 'error' | 'skipped'
  error?: string
}

export interface EmbeddingVector {
  id: string
  vector: number[]
  text: string
  metadata: Record<string, any>
}
