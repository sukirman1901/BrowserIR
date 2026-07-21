import * as net from 'net'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export type RPCRequest = {
  id: string
  method: string
  params?: Record<string, unknown>
}

export type RPCResponse = {
  id: string
  result?: unknown
  error?: { code: number; message: string }
}

export type RPCHandler = (
  method: string,
  params?: Record<string, unknown>
) => Promise<unknown>

const SOCKET_PATH = path.join(os.tmpdir(), 'browserd.sock')

export class UnixTransport {
  private server: net.Server | null = null
  private handler: RPCHandler

  constructor(handler: RPCHandler) {
    this.handler = handler
  }

  async start(): Promise<void> {
    // Remove existing socket
    try {
      fs.unlinkSync(SOCKET_PATH)
    } catch {}

    return new Promise((resolve) => {
      this.server = net.createServer((socket) => {
        let buffer = ''

        socket.on('error', () => {})

        socket.on('data', async (data) => {
          buffer += data.toString()

          // Process complete messages (newline-delimited JSON)
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue

            try {
              const request: RPCRequest = JSON.parse(line)
              const result = await this.handler(request.method, request.params)

              const response: RPCResponse = {
                id: request.id,
                result,
              }

              if (socket.writable) {
                socket.write(JSON.stringify(response) + '\n')
              }
            } catch (err) {
              const errorResponse: RPCResponse = {
                id: 'error',
                error: {
                  code: -1,
                  message: err instanceof Error ? err.message : 'Unknown error',
                },
              }
              if (socket.writable) {
                socket.write(JSON.stringify(errorResponse) + '\n')
              }
            }
          }
        })
      })

      this.server.listen(SOCKET_PATH, () => {
        console.log(`browserd listening on ${SOCKET_PATH}`)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close()
      this.server = null
    }

    try {
      fs.unlinkSync(SOCKET_PATH)
    } catch {}
  }
}

export class RPCClient {
  private socket: net.Socket | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(SOCKET_PATH, () => {
        resolve()
      })

      this.socket.on('error', reject)
    })
  }

  async call(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.socket) throw new Error('Not connected')
    const sock = this.socket

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2)
      const request: RPCRequest = { id, method, params }
      let buffer = ''

      const responseHandler = (data: Buffer) => {
        buffer += data.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const response: RPCResponse = JSON.parse(line)
            if (response.id === id) {
              sock.removeListener('data', responseHandler)
              if (response.error) {
                reject(new Error(response.error.message))
              } else {
                resolve(response.result)
              }
              return
            }
          } catch (err) {
            // Ignore incomplete chunks
          }
        }
      }

      sock.on('data', responseHandler)
      sock.write(JSON.stringify(request) + '\n')
    })
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end()
      this.socket = null
    }
  }
}
