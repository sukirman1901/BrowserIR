import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WebSocket } from 'ws'
import { WebSocketTransport } from '../../src/daemon/websocket.js'

describe('WebSocketTransport', () => {
  let server: WebSocketTransport
  let client: WebSocket

  beforeEach(async () => {
    server = new WebSocketTransport({ port: 0 })
    await server.start()
    const port = server.getPort()
    client = new WebSocket(`ws://localhost:${port}`)
    await new Promise<void>((resolve) => client.on('open', resolve))
  })

  afterEach(() => {
    client.close()
    server.stop()
  })

  it('should handle RPC request/response', async () => {
    server.onRequest(async (req) => {
      if (req.method === 'ping') return { pong: true }
      throw new Error(`Unknown method: ${req.method}`)
    })

    const result = await sendRpc(client, 'ping', {})
    expect(result).toEqual({ pong: true })
  })

  it('should broadcast events to subscribed clients', async () => {
    const events: any[] = []
    client.on('message', (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'event') events.push(msg)
    })

    server.broadcast({ type: 'event', data: { kind: 'click', ref: '@e1' } })
    await new Promise(r => setTimeout(r, 50))
    expect(events.length).toBe(1)
  })

  it('should broadcast after events.capture RPC call', async () => {
    const events: any[] = []
    client.on('message', (data) => {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'event') events.push(msg)
    })

    // Wire handler that simulates server.ts behavior
    server.onRequest(async (req) => {
      if (req.method === 'events.capture') {
        const event = { id: 'test-1', ...req.params }
        // Simulate what server.ts should do after capture
        server.broadcast({ type: 'event', event })
        return event
      }
      return null
    })

    await sendRpc(client, 'events.capture', { type: 'click', sessionId: 's1', data: {} })
    await new Promise(r => setTimeout(r, 50))
    expect(events.length).toBe(1)
    expect(events[0].event.type).toBe('click')
  })
})

function sendRpc(ws: WebSocket, method: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2)
    ws.send(JSON.stringify({ id, method, params }))
    function handler(data: Buffer) {
      const msg = JSON.parse(data.toString())
      if (msg.id === id) {
        ws.off('message', handler)
        if (msg.error) reject(new Error(msg.error.message))
        else resolve(msg.result)
      }
    }
    ws.on('message', handler)
  })
}
