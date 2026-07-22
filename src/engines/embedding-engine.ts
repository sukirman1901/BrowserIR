// Simple hash-based embedding (lightweight alternative to ONNX)
// For production, replace with actual ONNX Runtime model

export class EmbeddingEngine {
  private dimension = 384
  private cache = new Map<string, number[]>()

  async embed(text: string): Promise<number[]> {
    const normalized = text.toLowerCase().trim()

    if (this.cache.has(normalized)) {
      return this.cache.get(normalized)!
    }

    // Generate deterministic embedding from text hash
    const embedding = this.generateHashEmbedding(normalized)
    this.cache.set(normalized, embedding)

    return embedding
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  async findSimilar(
    queryEmbedding: number[],
    texts: string[]
  ): Promise<Array<{ text: string; score: number }>> {
    const results: Array<{ text: string; score: number }> = []

    for (const text of texts) {
      const embedding = await this.embed(text)
      const score = this.cosineSimilarity(queryEmbedding, embedding)
      results.push({ text, score })
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private generateHashEmbedding(text: string): number[] {
    const embedding: number[] = new Array(this.dimension).fill(0)

    // Split into words and generate word-level features
    const words = text.split(/\s+/)

    for (const word of words) {
      // Each word contributes to specific dimensions based on its hash
      const wordHash = this.hashString(word)

      // Use word hash to determine which dimensions this word activates
      // This creates a bag-of-words style embedding where shared words
      // result in higher cosine similarity
      const startDim = Math.abs(wordHash) % this.dimension
      const numDims = 3 + (Math.abs(wordHash) % 5) // 3-7 dimensions per word

      for (let i = 0; i < numDims; i++) {
        const dim = (startDim + i) % this.dimension
        // Use a consistent value based on word hash
        embedding[dim] += 1.0
      }
    }

    // Normalize
    let norm = 0
    for (const val of embedding) {
      norm += val * val
    }
    norm = Math.sqrt(norm)

    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        embedding[i] /= norm
      }
    }

    return embedding
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0 // Convert to 32-bit integer
    }
    return hash
  }

  clearCache(): void {
    this.cache.clear()
  }
}
