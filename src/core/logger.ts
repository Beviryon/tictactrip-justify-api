/**
 * Logger personnalise - Systeme de log structure et performant
 * Style personnel: logs contextuels avec nivaux adaptatifs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, any>

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext | undefined
  requestId?: string | undefined
}

class Logger {
  private context: LogContext = {}
  private requestId?: string

  constructor(
    private minLevel: LogLevel = 'info',
    private enableColors = true
  ) {}

  static create(minLevel: LogLevel = 'info'): Logger {
    return new Logger(minLevel)
  }

  withContext(context: LogContext): Logger {
    const newLogger = new Logger(this.minLevel, this.enableColors)
    newLogger.context = { ...this.context, ...context }
    if (this.requestId) {
      newLogger.requestId = this.requestId
    }
    return newLogger
  }

  withRequestId(requestId: string): Logger {
    const newLogger = new Logger(this.minLevel, this.enableColors)
    newLogger.context = { ...this.context }
    newLogger.requestId = requestId
    return newLogger
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.minLevel]
  }

  private formatMessage(level: LogLevel, message: string): string {
    if (!this.enableColors) {
      return `[${level.toUpperCase()}] ${message}`
    }

    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m'  // Red
    }
    
    const reset = '\x1b[0m'
    return `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`
  }

  private createLogEntry(level: LogLevel, message: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
      requestId: this.requestId
    }
  }

  private write(level: LogLevel, message: string): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message)
    const formattedMessage = this.formatMessage(level, message)
    
    const contextStr = entry.context 
      ? ` ${JSON.stringify(entry.context)}`
      : ''
    
    const requestIdStr = entry.requestId 
      ? ` [req:${entry.requestId}]`
      : ''

    const output = `${entry.timestamp} ${formattedMessage}${requestIdStr}${contextStr}`

    if (level === 'error') {
      console.error(output)
    } else if (level === 'warn') {
      console.warn(output)
    } else {
      console.log(output)
    }
  }

  debug(message: string): void {
    this.write('debug', message)
  }

  info(message: string): void {
    this.write('info', message)
  }

  warn(message: string): void {
    this.write('warn', message)
  }

  error(message: string, error?: Error): void {
    let fullMessage = message
    if (error) {
      fullMessage += ` - ${error.message}`
      if (error.stack && this.shouldLog('debug')) {
        fullMessage += `\n${error.stack}`
      }
    }
    this.write('error', fullMessage)
  }

  // Helper pour logger les performances
  time<T>(label: string, fn: () => T): T
  time<T>(label: string, fn: () => Promise<T>): Promise<T>
  time<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now()
    
    const logEnd = (result: any) => {
      const duration = Math.round(performance.now() - start)
      this.debug(`${label} completed in ${duration}ms`)
      return result
    }

    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.then(logEnd).catch(error => {
          const duration = Math.round(performance.now() - start)
          this.error(`${label} failed after ${duration}ms`, error)
          throw error
        })
      }
      return logEnd(result)
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      this.error(`${label} failed after ${duration}ms`, error as Error)
      throw error
    }
  }
}

// Instance globale
export const logger = Logger.create(
  (process.env.NODE_ENV === 'development' ? 'debug' : 'info') as LogLevel
)

export { Logger, type LogLevel, type LogContext }