export interface LoggerConfig {
  level: string
  destination: 'stdout' | 'stderr'
}

export interface Logger {
  info(message: string, data?: Record<string, any>): void
  debug(message: string, data?: Record<string, any>): void
  warn(message: string, data?: Record<string, any>): void
  error(message: string, data?: Record<string, any>): void
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error']

export function createLogger(config: LoggerConfig): Logger {
  const minLevel = LOG_LEVELS.indexOf(config.level)
  
  function shouldLog(level: string): boolean {
    return LOG_LEVELS.indexOf(level) >= minLevel
  }
  
  function format(level: string, message: string, data?: Record<string, any>): string {
    return JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...data,
    })
  }
  
  function log(level: string, message: string, data?: Record<string, any>): void {
    if (!shouldLog(level)) return
    console.log(format(level, message, data))
  }
  
  return {
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
  }
}