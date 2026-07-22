import { describe, it, expect, beforeEach } from 'vitest'
import { EmbeddingEngine } from '../../src/engines/embedding-engine.js'

describe('EmbeddingEngine', () => {
  let engine: EmbeddingEngine

  beforeEach(() => {
    engine = new EmbeddingEngine()
  })

  it('should generate embedding for text', async () => {
    const embedding = await engine.embed('hello world')
    expect(embedding).toBeInstanceOf(Array)
    expect(embedding.length).toBe(384) // MiniLM dimension
  })

  it('should generate consistent embeddings', async () => {
    const emb1 = await engine.embed('hello world')
    const emb2 = await engine.embed('hello world')
    expect(emb1).toEqual(emb2)
  })

  it('should calculate cosine similarity', () => {
    const vec1 = [1, 0, 0]
    const vec2 = [1, 0, 0]
    const vec3 = [0, 1, 0]

    const sim1 = engine.cosineSimilarity(vec1, vec2)
    const sim2 = engine.cosineSimilarity(vec1, vec3)

    expect(sim1).toBe(1.0) // Same vectors
    expect(sim2).toBe(0)   // Orthogonal vectors
  })

  it('should find similar texts', async () => {
    const texts = [
      'how to login to account',
      'pricing plans and billing',
      'API documentation reference',
      'sign in to your account'
    ]

    const query = await engine.embed('login to account')
    const similarities = await engine.findSimilar(query, texts)

    expect(similarities.length).toBe(texts.length)
    expect(similarities[0].text).toContain('login')
  })
})
