import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const wsConnected = writable(false)
export const wsEvents = writable<any[]>([])

let ws: WebSocket | null = null

export function connect(port = 3080) {
  if (!browser) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  // Connect via 127.0.0.1 to avoid macOS localhost IPv6 resolution issues
  const targetHost = window.location.hostname === 'localhost' ? '127.0.0.1' : (window.location.hostname || '127.0.0.1')

  try {
    ws = new WebSocket(`ws://${targetHost}:${port}`)
    ws.onopen = () => {
      wsConnected.set(true)
    }
    ws.onclose = () => {
      wsConnected.set(false)
      ws = null
      setTimeout(() => connect(port), 2000)
    }
    ws.onerror = () => {
      wsConnected.set(false)
    }
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'event') {
          wsEvents.update(events => [...events.slice(-99), msg.data])
        }
      } catch {}
    }
  } catch {
    wsConnected.set(false)
    ws = null
    setTimeout(() => connect(port), 2000)
  }
}

export function sendRpc(method: string, params: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Not connected'))
    }
    const id = Math.random().toString(36).slice(2)
    const handler = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.id === id) {
          ws!.removeEventListener('message', handler)
          if (msg.error) reject(new Error(msg.error.message))
          else resolve(msg.result)
        }
      } catch {}
    }
    ws.addEventListener('message', handler)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

export async function getDaemonStatus(restPort = 3081): Promise<any> {
  // 1. Try WS if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      const result = await sendRpc('status')
      if (result) return result
    } catch {}
  }

  // 2. Fallback to REST API
  try {
    const res = await fetch(`http://localhost:${restPort}/status`)
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch {}

  return { error: 'Daemon not available' }
}
