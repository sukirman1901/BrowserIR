import { chromium } from 'playwright';
import { SemanticAnalyzer, GraphVisualization } from './dist/index.js';
import Database from 'better-sqlite3';

console.log('=== Setting up Graph Visualization ===\n');

// Setup persistent database
const db = new Database('bir-graph.db');
const graph = new GraphVisualization(db, 9749);
const analyzer = new SemanticAnalyzer();

// Helper function
async function getA11y(page: any) {
  try {
    const cdpSession = await page.context().newCDPSession(page);
    const { nodes } = await cdpSession.send('Accessibility.getFullAXTree');
    const nodeMap = new Map();
    for (const n of nodes) {
      nodeMap.set(n.nodeId, {
        role: n.role?.value || 'generic',
        name: n.name?.value || '',
        states: (n.properties || []).map((p: any) => p.name),
        childIds: n.childIds || [],
        children: [],
      });
    }
    for (const node of nodeMap.values()) {
      for (const childId of node.childIds) {
        const childNode = nodeMap.get(childId);
        if (childNode) node.children.push(childNode);
      }
    }
    return { role: 'Root', name: page.url(), states: [], children: [nodeMap.get(nodes[0].nodeId)] };
  } catch { return null; }
}

// Launch browser and index websites
const browser = await chromium.launch({ 
  headless: true,
  channel: 'chrome',
  args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
});
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  viewport: { width: 1280, height: 720 }
});
const page = await context.newPage();

// Index Tokopedia
console.log('1. Indexing Tokopedia...');
try {
  await page.goto('https://www.tokopedia.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const a11y = await getA11y(page);
  const ir = analyzer.analyze({ url: page.url(), title: await page.title(), a11y });
  
  const nodeId = await graph.addNode('website', 'Tokopedia', { 
    purpose: 'e-commerce',
    intent: ir.page.intent.category,
    components: ir.page.metadata.totalComponents
  });
  
  // Add sections
  for (const section of ir.page.sections.slice(0, 5)) {
    const sectionId = await graph.addNode('section', section.label, {
      role: section.role,
      intent: section.intent
    });
    await graph.addEdge(nodeId, sectionId, 'has_section');
  }
  console.log('  Added:', ir.page.metadata.totalComponents, 'components');
} catch (e: any) {
  console.log('  Error:', e.message);
}

// Index Instagram
console.log('2. Indexing Instagram...');
try {
  await page.goto('https://www.instagram.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  const a11y = await getA11y(page);
  const ir = analyzer.analyze({ url: page.url(), title: await page.title(), a11y });
  
  const nodeId = await graph.addNode('website', 'Instagram', {
    purpose: 'social media',
    intent: ir.page.intent.category,
    components: ir.page.metadata.totalComponents
  });
  console.log('  Added:', ir.page.metadata.totalComponents, 'components');
} catch (e: any) {
  console.log('  Error:', e.message);
}

await browser.close();

// Add some relationships
console.log('3. Adding relationships...');
const nodes = await graph.getGraph();
if (nodes.nodes.length >= 2) {
  await graph.addEdge(nodes.nodes[0].id, nodes.nodes[1].id, 'similar_to');
}

// Show stats
console.log('\n4. Graph Stats:');
const stats = await graph.getGraph();
console.log('  Total nodes:', stats.stats.totalNodes);
console.log('  Total edges:', stats.stats.totalEdges);
console.log('  Node types:', Object.keys(stats.stats.nodeTypes));
console.log('  Edge types:', Object.keys(stats.stats.edgeTypes));

// Start server
console.log('\n5. Starting server...');
await graph.startServer();

console.log('\n=== Graph Visualization Ready ===');
console.log('Open http://localhost:9749 in your browser');
console.log('Press Ctrl+C to stop\n');

// Keep running
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  graph.stopServer();
  process.exit(0);
});

// Keep process alive
await new Promise(() => {});
