import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RESTAdapter } from '../../src/adapters/rest/index.js'

describe('RESTAdapter', () => {
  let adapter: RESTAdapter
  let baseUrl: string
  
  const mockHandler = vi.fn().mockResolvedValue({ status: 'ok' })
  
  beforeEach(async () => {
    adapter = new RESTAdapter(mockHandler, { port: 0 })
    await adapter.start()
    baseUrl = `http://localhost:${adapter.getPort()}`
  })
  
  afterEach(async () => {
    await adapter.stop()
  })
  
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await fetch(`${baseUrl}/health`)
      
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('healthy')
      expect(data.uptime).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })
  })
  
  describe('GET /status', () => {
    it('should return status', async () => {
      mockHandler.mockResolvedValueOnce({ running: true })
      
      const res = await fetch(`${baseUrl}/status`)
      
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.running).toBe(true)
    })
  })
  
  describe('POST /navigate', () => {
    it('should navigate to URL', async () => {
      mockHandler.mockResolvedValueOnce({ url: 'https://example.com' })
      
      const res = await fetch(`${baseUrl}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' }),
      })
      
      expect(res.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith('navigate', { url: 'https://example.com' })
    })
  })
  
  describe('POST /explain', () => {
    it('should explain page', async () => {
      mockHandler.mockResolvedValueOnce({ page: { title: 'Test' } })
      
      const res = await fetch(`${baseUrl}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      
      expect(res.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith('explain', {})
    })
  })
  
  describe('GET /metrics', () => {
    it('should return metrics', async () => {
      const res = await fetch(`${baseUrl}/metrics`)
      
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.requests).toBeDefined()
      expect(data.memory).toBeDefined()
      expect(data.uptime).toBeDefined()
    })
  })
})