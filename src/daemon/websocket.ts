import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'

export interface WSRequest {
  id: string
  method: string
  params?: Record<string, unknown>
}

export type WSHandler = (req: WSRequest) => Promise<unknown>

export class WebSocketTransport {
  private wss: WebSocketServer | null = null
  private server: Server | null = null
  private handler: WSHandler | null = null
  private clients = new Set<WebSocket>()
  private port: number
  private actualPort: number = 0

  constructor(options: { port?: number } = {}) {
    this.port = options.port || 3080
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = new Server()
      this.wss = new WebSocketServer({ server: this.server })

      this.wss.on('connection', (ws) => {
        this.clients.add(ws)
        ws.on('close', () => this.clients.delete(ws))
        ws.on('message', async (data) => {
          if (!this.handler) return
          try {
            const req: WSRequest = JSON.parse(data.toString())
            const result = await this.handler(req)
            ws.send(JSON.stringify({ id: req.id, result }))
          } catch (e: any) {
            const req = JSON.parse(data.toString())
            ws.send(JSON.stringify({ id: req.id, error: { code: -1, message: e.message } }))
          }
        })
      })

      this.server.listen(this.port, () => {
        // When port is 0, the OS assigns a random port — capture it
        const addr = this.server!.address()
        if (addr && typeof addr === 'object') {
          this.actualPort = addr.port
        }
        resolve()
      })
    })
  }

  getPort(): number {
    return this.actualPort || this.port
  }

  onRequest(handler: WSHandler): void {
    this.handler = handler
  }

  broadcast(data: unknown): void {
    const msg = JSON.stringify(data)
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    }
  }

  stop(): void {
    for (const client of this.clients) {
      client.close()
    }
    this.clients.clear()
    this.wss?.close()
    this.server?.close()
  }
}
