import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const wsConnected = writable(false)
export const wsEvents = writable<any[]>([])

let ws: WebSocket | null = null

export function connect(port = 3080) {
  if (!browser) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  ws = new WebSocket(`ws://localhost:${port}`)
  ws.onopen = () => wsConnected.set(true)
  ws.onclose = () => {
    wsConnected.set(false)
    // Auto-reconnect after 3 seconds
    setTimeout(() => connect(port), 3000)
  }
  ws.onerror = () => {
    wsConnected.set(false)
  }
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'event') {
      wsEvents.update(events => [...events.slice(-99), msg.data])
    }
  }
}

export function sendRpc(method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'))
    }
    const id = Math.random().toString(36).slice(2)
    ws.send(JSON.stringify({ id, method, params }))
    const handler = (e: MessageEvent) => {
      const msg = JSON.parse(e.data)
      if (msg.id === id) {
        ws!.removeEventListener('message', handler)
        if (msg.error) reject(new Error(msg.error.message))
        else resolve(msg.result)
      }
    }
    ws.addEventListener('message', handler)
  })
}
