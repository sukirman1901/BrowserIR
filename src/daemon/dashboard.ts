import { createServer, IncomingMessage, ServerResponse } from 'http'
import type { BrowserIR } from '../ir/types.js'

export interface DashboardState {
  currentIR: BrowserIR | null
  history: Array<{ url: string; timestamp: number; ir: BrowserIR }>
  sessions: Array<{ id: string; url: string; status: string; timestamp: number }>
  metrics: DashboardMetrics
}

export interface DashboardMetrics {
  totalAnalyses: number
  avgResponseTime: number
  successRate: number
  errorCount: number
}

export class Dashboard {
  private server: ReturnType<typeof createServer> | null = null
  private state: DashboardState = {
    currentIR: null,
    history: [],
    sessions: [],
    metrics: {
      totalAnalyses: 0,
      avgResponseTime: 0,
      successRate: 100,
      errorCount: 0
    }
  }
  private port: number
  private clients: Set<ServerResponse> = new Set()
  
  constructor(port: number = 4848) {
    this.port = port
  }
  
  async start(): Promise<void> {
    this.server = createServer((req, res) => this.handleRequest(req, res))
    
    return new Promise((resolve) => {
      this.server!.listen(this.port, () => {
        console.log(`Dashboard running at http://localhost:${this.port}`)
        resolve()
      })
    })
  }
  
  stop(): void {
    this.server?.close()
  }
  
  updateIR(ir: BrowserIR): void {
    this.state.currentIR = ir
    this.state.history.push({
      url: ir.page.url,
      timestamp: Date.now(),
      ir
    })
    if (this.state.history.length > 50) {
      this.state.history.shift()
    }
    this.state.metrics.totalAnalyses++
    this.broadcastUpdate()
  }
  
  updateSession(session: { id: string; url: string; status: string }): void {
    const existing = this.state.sessions.find(s => s.id === session.id)
    if (existing) {
      existing.url = session.url
      existing.status = session.status
      existing.timestamp = Date.now()
    } else {
      this.state.sessions.push({ ...session, timestamp: Date.now() })
    }
    this.broadcastUpdate()
  }
  
  recordError(): void {
    this.state.metrics.errorCount++
    this.state.metrics.successRate = 
      ((this.state.metrics.totalAnalyses - this.state.metrics.errorCount) / this.state.metrics.totalAnalyses) * 100
  }
  
  private broadcastUpdate(): void {
    const data = JSON.stringify(this.state)
    for (const client of this.clients) {
      if (!client.destroyed) {
        client.write(`data: ${data}\n\n`)
      }
    }
  }
  
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/'
    
    // SSE endpoint for real-time updates
    if (url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })
      this.clients.add(res)
      req.on('close', () => this.clients.delete(res))
      return
    }
    
    if (url === '/' || url === '/index.html') {
      this.serveDashboard(res)
    } else if (url === '/api/state') {
      this.sendJSON(res, this.state)
    } else if (url === '/api/current') {
      this.sendJSON(res, this.state.currentIR)
    } else if (url === '/api/history') {
      this.sendJSON(res, this.state.history)
    } else if (url === '/api/metrics') {
      this.sendJSON(res, this.state.metrics)
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  }
  
  private serveDashboard(res: ServerResponse): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>BrowserIR Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #0a0a0a; color: #fff; }
    .header { background: #1a1a2e; padding: 20px; border-bottom: 1px solid #333; }
    .header h1 { font-size: 24px; color: #00d4ff; }
    .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
    .panel { background: #1a1a2e; border-radius: 8px; padding: 16px; border: 1px solid #333; }
    .panel h2 { font-size: 14px; color: #888; margin-bottom: 12px; text-transform: uppercase; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .metric { background: #0d1117; padding: 12px; border-radius: 6px; text-align: center; }
    .metric .value { font-size: 24px; font-weight: bold; color: #00d4ff; }
    .metric .label { font-size: 12px; color: #888; margin-top: 4px; }
    .intent { font-size: 24px; font-weight: bold; color: #00d4ff; }
    .meta { color: #666; font-size: 14px; margin-top: 8px; }
    .components { list-style: none; }
    .components li { padding: 8px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; }
    .components .ref { color: #00d4ff; font-family: monospace; }
    .components .type { color: #888; }
    .components .label { color: #fff; }
    .history { max-height: 400px; overflow-y: auto; }
    .history-item { padding: 12px; border-bottom: 1px solid #222; cursor: pointer; }
    .history-item:hover { background: #222; }
    .history-url { color: #00d4ff; font-size: 14px; }
    .history-time { color: #666; font-size: 12px; }
    .risk { background: #ff444420; border-left: 3px solid #ff4444; padding: 8px; margin-top: 8px; }
    .risk.high { border-left-color: #ff4444; }
    .risk.medium { border-left-color: #ffaa00; }
    .risk.low { border-left-color: #44ff44; }
    .risk.critical { border-left-color: #ff0000; }
    .status { position: fixed; bottom: 20px; right: 20px; background: #1a1a2e; padding: 12px; border-radius: 8px; border: 1px solid #333; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #44ff44; display: inline-block; margin-right: 8px; }
    .live { color: #44ff44; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 BrowserIR Dashboard</h1>
    <div class="meta">Semantic Browser Understanding Engine</div>
  </div>
  
  <div class="metrics">
    <div class="metric">
      <div class="value" id="total-analyses">0</div>
      <div class="label">Total Analyses</div>
    </div>
    <div class="metric">
      <div class="value" id="success-rate">100%</div>
      <div class="label">Success Rate</div>
    </div>
    <div class="metric">
      <div class="value" id="error-count">0</div>
      <div class="label">Errors</div>
    </div>
    <div class="metric">
      <div class="value" id="history-count">0</div>
      <div class="label">History</div>
    </div>
  </div>
  
  <div class="container">
    <div class="panel">
      <h2>Current Page Intent</h2>
      <div id="intent" class="intent">No page analyzed</div>
      <div id="meta" class="meta"></div>
    </div>
    
    <div class="panel">
      <h2>Components</h2>
      <ul id="components" class="components"></ul>
    </div>
    
    <div class="panel">
      <h2>Risk Assessment</h2>
      <div id="risks"></div>
    </div>
    
    <div class="panel">
      <h2>Analysis History</h2>
      <div id="history" class="history"></div>
    </div>
  </div>
  
  <div class="status">
    <span class="status-dot"></span>
    <span id="status">Connected</span>
    <span class="live">● LIVE</span>
  </div>
  
  <script>
    const eventSource = new EventSource('/events');
    
    eventSource.onmessage = function(event) {
      const state = JSON.parse(event.data);
      updateUI(state);
    };
    
    eventSource.onerror = function() {
      document.getElementById('status').textContent = 'Disconnected';
    };
    
    function updateUI(state) {
      // Update metrics
      document.getElementById('total-analyses').textContent = state.metrics.totalAnalyses;
      document.getElementById('success-rate').textContent = state.metrics.successRate.toFixed(1) + '%';
      document.getElementById('error-count').textContent = state.metrics.errorCount;
      document.getElementById('history-count').textContent = state.history.length;
      
      if (state.currentIR) {
        const ir = state.currentIR;
        document.getElementById('intent').textContent = ir.page.intent.category || 'unknown';
        document.getElementById('meta').textContent = ir.page.title + ' (' + ir.page.metadata.totalComponents + ' components)';
        
        const components = document.getElementById('components');
        components.innerHTML = ir.page.sections.flatMap(s => s.components).slice(0, 10).map(c =>
          '<li><span class="ref">' + c.id + '</span> <span class="type">' + c.type + '</span> <span class="label">' + c.label + '</span></li>'
        ).join('');
        
        const risks = document.getElementById('risks');
        risks.innerHTML = ir.page.intent.risk.map(r =>
          '<div class="risk ' + r.severity + '"><strong>' + r.type + '</strong>: ' + r.description + '</div>'
        ).join('') || '<div class="meta">No risks detected</div>';
      }
      
      const history = document.getElementById('history');
      history.innerHTML = state.history.slice(-10).reverse().map(h =>
        '<div class="history-item"><div class="history-url">' + h.url + '</div><div class="history-time">' + new Date(h.timestamp).toLocaleString() + '</div></div>'
      ).join('');
      
      document.getElementById('status').textContent = 'Connected';
    }
    
    // Initial load
    fetch('/api/state').then(r => r.json()).then(updateUI);
  </script>
</body>
</html>
    `
    
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
  }
  
  private sendJSON(res: ServerResponse, data: any): void {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  }
}
