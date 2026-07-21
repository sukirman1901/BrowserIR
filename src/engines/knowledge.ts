// bir/src/engines/knowledge.ts
import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface KnowledgeNode {
  id: string
  type: string
  label: string
  properties: Record<string, any>
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  type: string
  weight: number
  evidence: any[]
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export class KnowledgeEngine {
  constructor(private db: Database.Database) {}

  async addNode(type: string, label: string, properties: Record<string, any>): Promise<KnowledgeNode> {
    const id = randomUUID()
    this.db.prepare(
      'INSERT INTO knowledge_nodes (id, type, label, properties) VALUES (?, ?, ?, ?)'
    ).run(id, type, label, JSON.stringify(properties))
    return { id, type, label, properties }
  }

  async getNode(id: string): Promise<KnowledgeNode | null> {
    const row = this.db.prepare('SELECT * FROM knowledge_nodes WHERE id = ?').get(id) as any
    if (!row) return null
    return { id: row.id, type: row.type, label: row.label, properties: JSON.parse(row.properties) }
  }

  async addEdge(source: string, target: string, type: string, weight: number = 0.5): Promise<KnowledgeEdge> {
    const id = randomUUID()
    this.db.prepare(
      'INSERT INTO knowledge_edges (id, source, target, type, weight, evidence) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, source, target, type, weight, JSON.stringify([]))
    return { id, source, target, type, weight, evidence: [] }
  }

  async getRelationships(nodeId: string): Promise<KnowledgeEdge[]> {
    const rows = this.db.prepare(
      'SELECT * FROM knowledge_edges WHERE source = ? OR target = ?'
    ).all(nodeId, nodeId) as any[]
    return rows.map(r => ({
      id: r.id, source: r.source, target: r.target,
      type: r.type, weight: r.weight, evidence: JSON.parse(r.evidence || '[]')
    }))
  }

  async findSimilar(type: string): Promise<KnowledgeNode[]> {
    const rows = this.db.prepare('SELECT * FROM knowledge_nodes WHERE type = ?').all(type) as any[]
    return rows.map(r => ({ id: r.id, type: r.type, label: r.label, properties: JSON.parse(r.properties) }))
  }

  async searchByLabel(query: string): Promise<KnowledgeNode[]> {
    const rows = this.db.prepare('SELECT * FROM knowledge_nodes WHERE label LIKE ?').all(`%${query}%`) as any[]
    return rows.map(r => ({ id: r.id, type: r.type, label: r.label, properties: JSON.parse(r.properties) }))
  }

  async traverse(startId: string, maxDepth: number = 3): Promise<KnowledgeGraph> {
    const visited = new Set<string>()
    const nodes: KnowledgeNode[] = []
    const edges: KnowledgeEdge[] = []
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }]

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id) || depth > maxDepth) continue
      visited.add(id)

      const node = await this.getNode(id)
      if (node) nodes.push(node)

      const rels = await this.getRelationships(id)
      for (const rel of rels) {
        edges.push(rel)
        const nextId = rel.source === id ? rel.target : rel.source
        if (!visited.has(nextId)) queue.push({ id: nextId, depth: depth + 1 })
      }
    }

    return { nodes, edges }
  }

  async getStats(): Promise<{ nodes: number; edges: number; types: Record<string, number> }> {
    const nodes = (this.db.prepare('SELECT COUNT(*) as c FROM knowledge_nodes').get() as any).c
    const edges = (this.db.prepare('SELECT COUNT(*) as c FROM knowledge_edges').get() as any).c
    const types = this.db.prepare('SELECT type, COUNT(*) as c FROM knowledge_nodes GROUP BY type').all() as any[]
    return { nodes, edges, types: Object.fromEntries(types.map(t => [t.type, t.c])) }
  }
}