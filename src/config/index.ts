export interface BIRConfig {
  wsPort: number
  restPort: number
  dbPath: string
  headless: boolean
  logLevel: string
}

export function loadConfig(): BIRConfig {
  const wsPort = parsePort(process.env.BIR_WS_PORT || '3080')
  const restPort = parsePort(process.env.BIR_REST_PORT || '3081')
  const dbPath = process.env.BIR_DB_PATH || ':memory:'
  const headless = process.env.BIR_HEADLESS !== 'false'
  const logLevel = process.env.BIR_LOG_LEVEL || 'info'
  
  return { wsPort, restPort, dbPath, headless, logLevel }
}

function parsePort(value: string): number {
  const port = parseInt(value, 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`)
  }
  return port
}