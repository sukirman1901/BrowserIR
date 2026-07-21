import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const wsConnected = writable(false)
export const wsEvents = writable<any[]>([])

let ws: WebSocket | null = null
let currentHostIndex = 0

export function connect(port = 3080) {
  if (!browser) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  const candidateHosts = [
    window.location.hostname || 'localhost',
    '127.0.0.1',
    'localhost',
  ]
  const targetHost = candidateHosts[currentHostIndex % candidateHosts.length]

  try {
    const socket = new WebSocket(`ws://${targetHost}:${port}`)
    ws = socket

    socket.onopen = () => {
      wsConnected.set(true)
      currentHostIndex = 0
    }

    socket.onclose = () => {
      wsConnected.set(false)
      if (ws === socket) ws = null
      currentHostIndex++
      setTimeout(() => connect(port), 2000)
    }

    socket.onerror = () => {
      wsConnected.set(false)
      if (ws === socket) {
        try { socket.close() } catch {}
        ws = null
      }
    }

    socket.onmessage = (e) => {
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
    currentHostIndex++
    setTimeout(() => connect(port), 2000)
  }

  // Start background REST poller to guarantee daemon connectivity status
  startDaemonPoller()
}

let pollerStarted = false
export function startDaemonPoller(restPort = 3081) {
  if (!browser || pollerStarted) return
  pollerStarted = true

  const check = async () => {
    const targetHost = window.location.hostname === 'localhost' ? '127.0.0.1' : (window.location.hostname || '127.0.0.1')
    try {
      const res = await fetch(`http://${targetHost}:${restPort}/status`)
      if (res.ok) {
        const data = await res.json()
        if (data && (typeof data.running === 'boolean' || data.engines !== undefined)) {
          wsConnected.set(true)
          return
        }
      }
    } catch {}

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      wsConnected.set(false)
    }
  }

  check()
  setInterval(check, 3000)
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

  // 2. Fallback to REST API via 127.0.0.1
  const targetHost = window.location.hostname === 'localhost' ? '127.0.0.1' : (window.location.hostname || '127.0.0.1')
  try {
    const res = await fetch(`http://${targetHost}:${restPort}/status`)
    if (res.ok) {
      const data = await res.json()
      return data
    }
  } catch {}

  return { error: 'Daemon not available' }
}

