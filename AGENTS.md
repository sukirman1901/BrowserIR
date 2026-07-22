# BrowserIR (BIR) — AI Agent Guide

BrowserIR is a **semantic browser understanding engine**. It compiles web pages into typed, structured intermediate representations (IR) that AI agents can reason about.

## What is BrowserIR?

Unlike browser automation tools (Playwright, Puppeteer) that control browsers, BrowserIR **understands** pages:

```
Raw HTML → BrowserIR → Semantic Tree (sections, components, intent, flow, risk)
```

**Key insight:** BrowserIR doesn't just "see" the page — it "understands" what the page is for, what actions are available, and what risks exist.

## Core Capabilities

### IR Types (src/ir/types.ts)

- **31 Component Types** — field, button, link, text, image, table, dropdown, checkbox, radio, toggle, modal, tooltip, accordion, tabs, code_block, snippet, pre, video, audio, embed, form, fieldset, legend, label, textarea, select, option, progress, meter, output, details, summary, dialog
- **24 Intent Categories** — authentication, purchase, content_consumption, search, navigation, form_submission, data_entry, documentation, tutorial, blog, api_reference, forum, chat, dashboard, settings, profile, checkout, payment, subscription, support, feedback, contact, social, media, download
- **9 Section Roles** — navigation, form, table, dialog, content, modal, sidebar, footer, header
- **9 Evidence Sources** — dom, a11y, react, vue, angular, vision, network, meta, schema_org
- **5 Compliance Standards** — GDPR, PCI, HIPAA, SOC2, CCPA
- **4 Risk Severities** — low, medium, high, critical

### Engines (src/engines/ — 44 files)

1. **Semantic Analyzer** — Page intent classification with 24 categories
2. **Memory Engine** — Store/recall domain knowledge (SQLite)
3. **Diff Engine** — Semantic, structural, state, and intent diffing
4. **Self-Healing** — 8 strategies (history, text, ARIA, semantic, memory, visual, context, position)
5. **Flow Detection** — Multi-source (structure, events, network) + templates
6. **Knowledge Graph** — Node/edge graph with traversal
7. **Planner Engine** — Goal-based execution planning
8. **Multi-Browser** — Pool management, parallel tab execution
9. **Agent Coordinator** — Multi-agent coordination with claim system
10. **Session Memory** — Per-session state persistence
11. **Content Extractor** — Universal reader for articles, docs, API docs
12. **Doc Parser** — Documentation structure, navigation, code examples
13. **ExaSearch** — Semantic search (SemanticIndexer + IntentClassifier + WebCrawler)
14. **Embedding Engine** — 384-dimension vector embeddings
15. **Intent Classifier** — Query intent classification for search
16. **Web Crawler** — BFS with robots.txt, rate limiting
17. **Auto-Indexer** — Automatic page indexing
18. **Network Capture** — HTTP request/response interception
19. **Console Capture** — Browser console logs and JS errors
20. **Script Injection** — Pre-load JavaScript injection
21. **State Manager** — Cookie/storage state management
22. **Element Highlight** — Visual debugging with outlines
23. **Test Runner** — E2E test execution from JSON
24. **Visual Diff** — Visual regression with pixelmatch
25. **Failure Analyzer** — Test failure analysis and diagnosis
26. **File Manager** — Download, upload, PDF export
27. **Session Manager** — Idle timeout, auto-save, AES-256 encryption
28. **Stealth Manager** — Anti-detection (webdriver, chrome, permissions)
29. **Security Manager** — Domain allowlisting, offline mode
30. **Input Manager** — Mouse, keyboard, dialog, frame switching
31. **Graph Visualization** — Page structure as graph data
32. **Streaming Session** — Real-time session streaming

### MCP Server (src/adapters/mcp/)

- **MCP server name**: `bir`
- **36 tools** via stdio transport
- Auto-starts daemon if not running
- Registered in `index.ts:109-165`

### Daemon (src/daemon/)

- **Unix socket** transport for CLI
- **WebSocket** on port 3080
- **REST API** on port 3081
- **Dashboard SSE** on port 4848
- **10 engines** via EngineManager

### CLI (src/adapters/cli/)

```bash
bir explain [url]              # Get semantic IR of page
bir click <ref>                # Click by ref (e.g. @e3)
bir screenshot                 # Screenshot
bir graph <url>                # Page structure as tree
bir diff <v1.json> <v2.json>   # Compare 2 IR snapshots
bir memory recall <domain>     # Recall domain knowledge
bir memory store <json>        # Store domain knowledge
bir test <test-file>           # Run E2E tests from JSON
bir status                     # Check daemon status

# Search subcommands
bir search query <text>        # Semantic search
bir search crawl <url>         # Crawl and index
bir search stats               # Index statistics
```

### MCP Server Configuration

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["/path/to/BrowserIR/dist/adapters/mcp/index.js"],
      "cwd": "/path/to/BrowserIR"
    }
  }
}
```

### MCP Tools (36 tools)

 #### Core Navigation & Analysis
- `explain` — Analyze page and return semantic BrowserIR
- `analyze` — Create a BrowserSession for analysis
- `click` — Click element by ref (@e1, @e2, ...) with self-healing
- `navigate` — Navigate to URL in browser
- `screenshot` — Take screenshot of current page
- `graph` — Get page structure as tree graph
- `tabs` — List all open browser tabs
- `status` — Check daemon status

#### Web Fetch & Search
- `webfetch` — Fetch URL with semantic understanding (HTML→Markdown)
- `websearch` — Search web with semantic results
- `analyze_content` — Analyze text content and return semantic understanding

#### Semantic Search Engine
- `search` — Semantic search returning BrowserIR. Auto-crawls if needed.
- `crawl` — Crawl URL and add to search index
- `search_stats` — Get search index statistics

#### Semantic Analysis
- `flow_detect` — Detect multi-step flows from captured events
- `flow_list` — List known flows for a domain
- `diff_compare` — Compare two BrowserIR snapshots semantically

#### Memory System
- `memory_recall` — Recall learned knowledge about a domain
- `memory_store` — Store BrowserIR knowledge about a domain

#### Knowledge Graph
- `knowledge_add_node` — Add node to knowledge graph
- `knowledge_add_edge` — Add edge between knowledge nodes
- `knowledge_search` — Search knowledge graph by label or type
- `knowledge_traverse` — Traverse graph from starting node

#### Event System
- `events_capture` — Capture custom event into event stream
- `events_get` — Query captured events for a session

#### Planner Engine
- `planner_create` — Create execution plan for a goal
- `planner_execute` — Execute a plan by ID
- `planner_status` — Get status of a plan

#### Self-Healing
- `heal_find` — Find replacement for broken selector using semantic IR

#### Multi-Browser
- `multi_create_session` — Create new multi-browser session
- `multi_execute` — Execute task across multiple tabs
- `multi_sessions` — List all multi-browser sessions

#### Agent Coordination
- `agent_register` — Register agent for coordination
- `agent_unregister` — Unregister agent
- `agent_claim` — Claim work on specific action
- `agent_graph` — Show agent dependency graph

## Core Concepts

### 1. BrowserIR (Semantic Representation)

```typescript
interface BrowserIR {
  version: '0.1'
  page: PageIR
  snapshot: Snapshot
  evidence: EvidenceChain
}

interface PageIR {
  id: string
  url: string
  title: string
  intent: PageIntent    // primary, category, actions[], flow[], risk[]
  sections: SectionIR[]
  metadata: PageMetadata
}
```

### 2. Component Refs (`@e1`, `@e2`, ...)

Every interactive element gets a unique ref for deterministic interaction:
```bash
bir click @e5  # Click by ref, not CSS selector
```

### 3. Intent Categories (24)

| Category | Risk |
|----------|------|
| `authentication` | medium (credentials) |
| `purchase` / `checkout` / `payment` | high (money) |
| `data_entry` / `form_submission` | medium (data) |
| `content_consumption` / `blog` / `documentation` | low |
| `navigation` / `search` | low |
| `settings` / `profile` | medium |
| `subscription` | high (recurring) |

### 4. Multi-Platform Integration

```
BrowserIR/
├── .claude-plugin/plugin.json    # Claude Code plugin manifest
├── .mcp.json                     # Claude Code MCP config (${CLAUDE_PROJECT_DIR})
├── skills/bir/SKILL.md           # Claude Code plugin skill
├── .cursor/rules/bir.mdc         # Cursor rule
├── .cursor/mcp.json             # Cursor MCP config (${workspaceFolder})
├── .opencode/skills/bir/SKILL.md # OpenCode skill (auto-discovered)
├── .opencode/agents/browserir.md  # OpenCode subagent
├── .opencode/plugins/browserir.js # OpenCode plugin (skill injection)
├── .agents/skills/bir/SKILL.md   # Cross-platform skill
└── opencode.json                 # Project config (no MCP — global handles)
```

## Tips

1. **Start with `explain`** — always get the IR first
2. **Use refs for clicks** — `@e5` is deterministic, CSS selectors break
3. **Check intent** — understand what the page is for before acting
4. **Check risks** — BrowserIR warns about destructive actions
5. **Use memory** — store what you learn about sites
6. **Use flow** — detect multi-step processes automatically
7. **Use diff** — compare page versions semantically