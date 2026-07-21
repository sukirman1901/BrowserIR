export interface WebSearchOptions {
  numResults?: number
  type?: 'auto' | 'fast' | 'deep'
  language?: string
}

export interface WebSearchResult {
  query: string
  results: SearchResult[]
  provider: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  score?: number
}

export class WebSearchEngine {
  private apiKey?: string
  private provider: 'google' | 'bing' | 'duckduckgo'

  constructor(options: { apiKey?: string; provider?: 'google' | 'bing' | 'duckduckgo' } = {}) {
    this.apiKey = options.apiKey || process.env.WEB_SEARCH_API_KEY
    this.provider = options.provider || 'duckduckgo'
  }

  async search(query: string, options: WebSearchOptions = {}): Promise<WebSearchResult> {
    const numResults = options.numResults || 8

    // Try DuckDuckGo (free, no API key needed)
    try {
      return await this.searchDuckDuckGo(query, numResults)
    } catch (error) {
      // Fallback to simple HTTP search
      return await this.searchFallback(query, numResults)
    }
  }

  private async searchDuckDuckGo(query: string, numResults: number): Promise<WebSearchResult> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`)
    }

    const data = await response.json()
    
    const results: SearchResult[] = []
    
    // Add abstract if available
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        score: 1.0
      })
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, numResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
            url: topic.FirstURL,
            snippet: topic.Text,
            score: 0.8
          })
        }
      }
    }

    return {
      query,
      results: results.slice(0, numResults),
      provider: 'duckduckgo'
    }
  }

  private async searchFallback(query: string, numResults: number): Promise<WebSearchResult> {
    // Simple fallback using HTML scraping
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const html = await response.text()
    
    // Extract results from HTML
    const results: SearchResult[] = []
    const resultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<[^>]*class="result__snippet"[^>]*>([^<]+)/g
    
    let match
    while ((match = resultPattern.exec(html)) !== null && results.length < numResults) {
      results.push({
        title: match[2].trim(),
        url: match[1],
        snippet: match[3].trim(),
        score: 0.7
      })
    }

    return {
      query,
      results,
      provider: 'duckduckgo-html'
    }
  }
}