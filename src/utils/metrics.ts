export interface Metric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export class MetricsCollector {
  private metrics: Metric[] = []
  
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({ name, value, timestamp: Date.now(), tags })
  }
  
  timing(name: string, fn: () => Promise<void>) {
    return async () => {
      const start = Date.now()
      await fn()
      this.record(name, Date.now() - start)
    }
  }
  
  getMetrics(name?: string): Metric[] {
    if (name) return this.metrics.filter(m => m.name === name)
    return this.metrics
  }
  
  flush() { this.metrics = [] }
}
