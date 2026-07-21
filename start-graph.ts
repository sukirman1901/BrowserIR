import { GraphVisualization } from './dist/index.js'
import Database from 'better-sqlite3'

console.log('=== Starting Graph Visualization Server ===\n')

// Setup database (persistent)
const db = new Database('bir-data.db')

// Create graph visualization on port 9749
const graph = new GraphVisualization(db, 9749)

// Start server (keeps running)
await graph.startServer()

console.log('')
console.log('Graph Visualization Server is running!')
console.log('')
console.log('Open in browser: http://localhost:9749')
console.log('')
console.log('Features:')
console.log('  - View all nodes and edges')
console.log('  - Search nodes')
console.log('  - Click nodes to see neighbors')
console.log('  - View statistics')
console.log('')
console.log('Press Ctrl+C to stop')
