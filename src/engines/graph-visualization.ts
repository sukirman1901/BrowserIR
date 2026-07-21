import type Database from 'better-sqlite3'
import { createServer, IncomingMessage, ServerResponse } from 'http'

export interface GraphNode {
  id: string
  type: string
  label: string
  properties: Record<string, any>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  weight: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    totalNodes: number
    totalEdges: number
    nodeTypes: Record<string, number>
    edgeTypes: Record<string, number>
  }
}

export class GraphVisualization {
  private db: Database.Database
  private server: ReturnType<typeof createServer> | null = null
  private port: number

  constructor(db: Database.Database, port: number = 9749) {
    this.db = db
    this.port = port
    this.ensureTables()
  }

  private ensureTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        properties TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS graph_edges (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        FOREIGN KEY (source) REFERENCES graph_nodes(id),
        FOREIGN KEY (target) REFERENCES graph_nodes(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
      CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source);
      CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target);
    `)
  }

  async addNode(type: string, label: string, properties: Record<string, any> = {}): Promise<string> {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.db.prepare(`
      INSERT INTO graph_nodes (id, type, label, properties, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, type, label, JSON.stringify(properties), Date.now())
    return id
  }

  async addEdge(source: string, target: string, type: string, weight: number = 1.0): Promise<string> {
    const id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.db.prepare(`
      INSERT INTO graph_edges (id, source, target, type, weight)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, source, target, type, weight)
    return id
  }

  async getGraph(): Promise<GraphData> {
    const nodes = this.db.prepare('SELECT * FROM graph_nodes').all() as any[]
    const edges = this.db.prepare('SELECT * FROM graph_edges').all() as any[]
    
    const nodeTypes: Record<string, number> = {}
    for (const node of nodes) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1
    }
    
    const edgeTypes: Record<string, number> = {}
    for (const edge of edges) {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1
    }
    
    return {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.label,
        properties: JSON.parse(n.properties || '{}')
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight
      })),
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodeTypes,
        edgeTypes
      }
    }
  }

  async getNeighbors(nodeId: string): Promise<{ incoming: GraphEdge[]; outgoing: GraphEdge[] }> {
    const incoming = this.db.prepare('SELECT * FROM graph_edges WHERE target = ?').all(nodeId) as any[]
    const outgoing = this.db.prepare('SELECT * FROM graph_edges WHERE source = ?').all(nodeId) as any[]
    
    return {
      incoming: incoming.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight
      })),
      outgoing: outgoing.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight
      }))
    }
  }

  async searchNodes(query: string, type?: string): Promise<GraphNode[]> {
    let sql = 'SELECT * FROM graph_nodes WHERE (label LIKE ? OR properties LIKE ?)'
    const params: any[] = [`%${query}%`, `%${query}%`]
    
    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    
    const rows = this.db.prepare(sql).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      label: r.label,
      properties: JSON.parse(r.properties || '{}')
    }))
  }

  async startServer(): Promise<void> {
    this.server = createServer((req, res) => this.handleRequest(req, res))
    
    return new Promise((resolve) => {
      this.server!.listen(this.port, () => {
        console.log(`Graph visualization at http://localhost:${this.port}`)
        resolve()
      })
    })
  }

  stopServer(): void {
    this.server?.close()
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/'
    
    if (url === '/' || url === '/index.html') {
      this.serveVisualization(res)
    } else if (url === '/api/graph') {
      this.getGraph().then(data => this.sendJSON(res, data))
    } else if (url.startsWith('/api/node/')) {
      const nodeId = url.split('/api/node/')[1]
      this.getNeighbors(nodeId).then(data => this.sendJSON(res, data))
    } else if (url.startsWith('/api/search')) {
      const params = new URL(url, `http://localhost:${this.port}`).searchParams
      const query = params.get('q') || ''
      const type = params.get('type') || undefined
      this.searchNodes(query, type).then(data => this.sendJSON(res, data))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  }

  private serveVisualization(res: ServerResponse): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>BrowserIR Knowledge Graph</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #0a0a0a; color: #fff; }
    .header { background: #1a1a2e; padding: 20px; border-bottom: 1px solid #333; }
    .header h1 { font-size: 24px; color: #00d4ff; }
    .container { padding: 20px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat { background: #1a1a2e; padding: 16px; border-radius: 8px; text-align: center; }
    .stat .value { font-size: 24px; font-weight: bold; color: #00d4ff; }
    .stat .label { font-size: 12px; color: #888; margin-top: 4px; }
    .search { margin-bottom: 20px; }
    .search input { width: 100%; padding: 12px; background: #1a1a2e; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 16px; }
    .graph { background: #1a1a2e; border-radius: 8px; padding: 20px; min-height: 400px; }
    .node { display: inline-block; padding: 8px 16px; margin: 4px; background: #0d1117; border-radius: 6px; border: 1px solid #333; cursor: pointer; }
    .node:hover { border-color: #00d4ff; }
    .node .type { color: #00d4ff; font-size: 12px; }
    .node .label { color: #fff; }
    .edge { color: #888; font-size: 12px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 BrowserIR Knowledge Graph</h1>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat">
        <div class="value" id="total-nodes">0</div>
        <div class="label">Nodes</div>
      </div>
      <div class="stat">
        <div class="value" id="total-edges">0</div>
        <div class="label">Edges</div>
      </div>
      <div class="stat">
        <div class="value" id="node-types">0</div>
        <div class="label">Node Types</div>
      </div>
      <div class="stat">
        <div class="value" id="edge-types">0</div>
        <div class="label">Edge Types</div>
      </div>
    </div>
    <div class="search">
      <input type="text" id="search-input" placeholder="Search nodes... (e.g., 'Tokopedia', 'documentation')">
    </div>
    <div class="graph" id="graph"></div>
  </div>
  <script>
    async function loadGraph() {
      const res = await fetch('/api/graph');
      const data = await res.json();
      
      document.getElementById('total-nodes').textContent = data.stats.totalNodes;
      document.getElementById('total-edges').textContent = data.stats.totalEdges;
      document.getElementById('node-types').textContent = Object.keys(data.stats.nodeTypes).length;
      document.getElementById('edge-types').textContent = Object.keys(data.stats.edgeTypes).length;
      
      const graph = document.getElementById('graph');
      graph.innerHTML = data.nodes.map(n => 
        '<div class="node" onclick="showNeighbors(\\'' + n.id + '\\')">' +
        '<div class="type">' + n.type + '</div>' +
        '<div class="label">' + n.label + '</div>' +
        '</div>'
      ).join('');
    }
    
    async function showNeighbors(nodeId) {
      const res = await fetch('/api/node/' + nodeId);
      const data = await res.json();
      console.log('Neighbors:', data);
      alert('Node: ' + nodeId + '\\nIncoming: ' + data.incoming.length + '\\nOutgoing: ' + data.outgoing.length);
    }
    
    document.getElementById('search-input').addEventListener('input', async (e) => {
      const query = e.target.value;
      if (query.length < 2) {
        loadGraph();
        return;
      }
      const res = await fetch('/api/search?q=' + encodeURIComponent(query));
      const results = await res.json();
      const graph = document.getElementById('graph');
      graph.innerHTML = results.map(n => 
        '<div class="node">' +
        '<div class="type">' + n.type + '</div>' +
        '<div class="label">' + n.label + '</div>' +
        '</div>'
      ).join('');
    });
    
    loadGraph();
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
