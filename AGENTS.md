# BrowserIR (BIR) — AI Agent Guide

BrowserIR is a **semantic browser understanding engine**. It compiles web pages into typed, structured intermediate representations (IR) that AI agents can reason about.

## What is BrowserIR?

Unlike browser automation tools (Playwright, Puppeteer) that control browsers, BrowserIR **understands** pages:

```
Raw HTML → BrowserIR → Semantic Tree (sections, components, intent, flow, risk)
```

**Key insight:** BrowserIR doesn't just "see" the page — it "understands" what the page is for, what actions are available, and what risks exist.

## Core Capabilities (36)

1. **Semantic Analysis** — 20+ intent categories, 38 component types
2. **Risk Assessment** — Critical severity, compliance checks (GDPR, PCI, HIPAA, SOC2, CCPA)
3. **Flow Detection** — Multi-source (structure, events, network) + templates + learning
4. **Self-Healing** — 8 strategies + selector learning
5. **Content Reading** — Universal reader for articles, docs, API docs, blogs
6. **Web Fetch** — Fetch URLs directly without browser (HTML→Markdown conversion)
7. **Web Search** — Search web via DuckDuckGo API
8. **Semantic Search** — Intent-based search with vector embeddings
9. **Web Crawling** — BFS crawling with robots.txt, rate limiting
10. **Stealth** — Anti-detection (webdriver, chrome, permissions, plugins, languages)
11. **Security** — Domain allowlisting, encryption (AES-256), output truncation
12. **E2E Testing** — 22 assertion types + HTML/JSON reports
13. **Memory** — Patterns, selectors, flows, errors, performance + learning
14. **Multi-Browser** — Pool management, parallel execution, idle cleanup
15. **Dashboard** — Real-time SSE monitoring (port 4848)

## Quick Start

### Start daemon
```bash
bir daemon start
# or: node dist/daemon/server.js
```

### Explain a page
```bash
bir explain https://example.com
# Returns: BrowserIR with sections, components, intent, flow
```

### CLI Commands
```bash
bir explain [url]              # Get semantic IR of page
bir click @e3                  # Click element by ref with self-healing
bir screenshot                 # Take screenshot
bir diff compare <ir1> <ir2>   # Compare two IRs
bir test <test-file>           # Run E2E tests from JSON
bir memory recall <domain>     # Recall known patterns
bir memory store <json>        # Store knowledge
bir flow detect [url]          # Detect multi-step flows
bir graph show                 # Show agent dependency graph
bir status                     # Check daemon status
```

### MCP Tools (36 tools)
Use via MCP integration in Claude, Cursor, OpenCode, etc.

### MCP Server Configuration

```json
{
  "mcpServers": {
    "bir": {
      "command": ["node", "/path/to/BrowserIR/dist/adapters/mcp/index.js"],
      "cwd": "/path/to/BrowserIR"
    }
  }
}
```

#### Core Navigation & Analysis
- `bir_navigate` — Navigate to URL and return status
- `bir_explain` — Analyze page and return semantic BrowserIR
- `bir_analyze` — Create a BrowserSession for analysis and interaction
- `bir_click` — Click element by ref (@e1, @e2, ...) with self-healing
- `bir_screenshot` — Take screenshot of current page
- `bir_graph` — Get page structure as tree graph
- `bir_tabs` — List all browser tabs
- `bir_status` — Check daemon status

#### Web Fetch & Search
- `bir_webfetch` — Fetch URL with semantic understanding (HTML→Markdown)
- `bir_websearch` — Search web with semantic results
- `bir_analyze_content` — Analyze text content and return semantic understanding

#### Semantic Search Engine
- `bir_search` — Semantic search returning BrowserIR with intent, components, actions
- `bir_crawl` — Crawl URL and add to search index
- `bir_search_stats` — Get search index statistics

#### Semantic Analysis
- `bir_flow_detect` — Detect multi-step flows from captured events
- `bir_flow_list` — List known flows for a domain
- `bir_diff_compare` — Compare two BrowserIR snapshots semantically

#### Memory System
- `bir_memory_recall` — Recall learned knowledge about a domain
- `bir_memory_store` — Store BrowserIR knowledge about a domain

#### Knowledge Graph
- `bir_knowledge_add_node` — Add node to knowledge graph
- `bir_knowledge_add_edge` — Add edge between knowledge nodes
- `bir_knowledge_search` — Search knowledge graph by label or type
- `bir_knowledge_traverse` — Traverse graph from starting node

#### Event System
- `bir_events_capture` — Capture custom event into event stream
- `bir_events_get` — Query captured events for a session

#### Planner Engine
- `bir_planner_create` — Create execution plan for a goal
- `bir_planner_execute` — Execute a plan by ID
- `bir_planner_status` — Get status of a plan

#### Self-Healing
- `bir_heal_find` — Find replacement for broken selector using semantic IR

#### Multi-Browser
- `bir_multi_create_session` — Create new multi-browser session
- `bir_multi_execute` — Execute task across multiple tabs
- `bir_multi_sessions` — List all multi-browser sessions

#### Agent Coordination
- `bir_agent_register` — Register agent for coordination
- `bir_agent_unregister` — Unregister agent
- `bir_agent_claim` — Claim work on specific action
- `bir_agent_graph` — Show agent dependency graph

## Core Concepts

### 1. BrowserIR (Semantic Representation)

Every page becomes a structured IR:

```typescript
interface BrowserIR {
  page: {
    url: string
    title: string
    intent: {
      primary: string          // What the page is for
      category: 'auth' | 'purchase' | 'search' | 'navigation' | ...
      actions: ActionIR[]      // Available actions
      flow: FlowStep[]         // Multi-step flow
      risk: RiskAssessment[]   // Risk warnings
    }
    sections: SectionIR[]      // Semantic sections
    metadata: PageMetadata     // Framework, DOM size, etc
  }
  snapshot: Snapshot           // Version tracking
  evidence: EvidenceChain      // Why we think this
}
```

### 2. Component Refs (`@e1`, `@e2`, ...)

Every interactive element gets a unique ref:

```
- heading "Login" [@e1]
- form [@e2]
  - field "Email" [@e3]
  - field "Password" [@e4]
  - button "Submit" [@e5]
- link "Forgot password?" [@e6]
```

Use refs for deterministic interaction:
```bash
bir click @e5
```

### 3. Intent Recognition

BrowserIR automatically classifies page intent:

| Category | Example | Risk Level |
|----------|---------|------------|
| `authentication` | Login/register page | medium (credentials) |
| `purchase` | Checkout page | high (money) |
| `data_entry` | Form submission | medium (data) |
| `content_consumption` | Article/blog | low |
| `navigation` | Menu/search | low |
| `destructive` | Delete/cancel | high (irreversible) |

### 4. Flow Detection

Detects multi-step processes:

```bash
bir flow detect https://example.com/checkout
```

Output:
```json
{
  "flow": "checkout",
  "steps": [
    { "order": 1, "action": "fill shipping info", "required": true },
    { "order": 2, "action": "select payment", "required": true },
    { "order": 3, "action": "confirm order", "required": true }
  ]
}
```

### 5. Memory System

Learn from past interactions:

```bash
# Store knowledge about a site
bir memory store '{"domain":"shop.com","purpose":"e-commerce","commonFlows":["browse","cart","checkout"]}'

# Recall knowledge
bir memory recall shop.com
```

### 6. Evidence Chains

BrowserIR explains WHY it thinks something is what it is:

```json
{
  "component": "button Submit",
  "evidence": [
    { "source": "dom", "selector": "button[type=submit]", "confidence": 0.95 },
    { "source": "a11y", "role": "button", "confidence": 0.90 },
    { "source": "visual", "position": "bottom-right", "confidence": 0.80 }
  ]
}
```

## Use Cases by AI Tool

### Claude (Desktop/Web)
- Deep page analysis
- Accessibility audit
- Security review
- Documentation generation

### Cursor
- UI debugging
- Component verification
- E2E test generation
- Refactor impact analysis

### OpenCode
- Full testing pipeline (combine with browser-smoke)
- Smoke testing
- Visual regression
- Network debugging
- Failure analysis
- Console error tracking
- Security analysis
- File operations (download/upload)
- Session management

### Codex / Pi.dev
- Quick page queries
- Scripting automation
- CI/CD integration

## Multi-Platform Integration

BrowserIR integrates with multiple AI platforms:

### Claude Code
```
.claude-plugin/plugin.json   # Plugin manifest
.mcp.json                    # MCP server config (uses ${CLAUDE_PROJECT_DIR})
skills/bir/SKILL.md          # Plugin skill
```

### OpenCode
```
.opencode/skills/bir/SKILL.md   # Skill (auto-discovered)
.opencode/agents/browserir.md   # Subagent (mode: subagent)
.opencode/plugins/browserir.js  # Plugin (skill injection)
# MCP registered in global ~/.config/opencode/opencode.json
```

### Cursor
```
.cursor/rules/bir.mdc    # Rule with MCP tool docs
.cursor/mcp.json         # MCP server config (uses ${workspaceFolder})
```

### Cross-Platform
```
.agents/skills/bir/SKILL.md   # Agent-compatible skill
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AI Tool (any)                       │
│           Claude / Cursor / OpenCode / Codex         │
└───────────────────────┬─────────────────────────────┘
                        │ MCP or CLI
                        ▼
┌─────────────────────────────────────────────────────┐
│                  BrowserIR                           │
│            Semantic Understanding Engine             │
├─────────────────────────────────────────────────────┤
│  • explain() → BrowserIR (intent, flow, risk)        │
│  • memory → learned patterns                         │
│  • flow → multi-step detection                       │
│  • diff → change tracking                            │
│  • agent → multi-agent coordination                  │
└───────────────────────┬─────────────────────────────┘
                        │ Playwright/CDP
                        ▼
┌─────────────────────────────────────────────────────┐
│             Browser (Chrome/Firefox/WebKit)          │
└─────────────────────────────────────────────────────┘
```

## Tips

1. **Start with `bir explain`** — always get the IR first
2. **Use refs for clicks** — `@e5` is deterministic, CSS selectors are fragile
3. **Check intent** — understand what the page is for before acting
4. **Check risks** — BrowserIR warns about destructive actions
5. **Use memory** — store what you learn about sites
6. **Use flow** — detect multi-step processes automatically
7. **Use diff** — compare page versions semantically

## Examples

### Basic page analysis
```bash
bir explain https://example.com
# Returns: sections, components, intent, metadata
```

### Interactive testing
```bash
bir explain http://localhost:3000/login
bir click @e5  # Submit button
bir explain     # Check result
```

### Compare versions
```bash
bir explain http://localhost:3000 > v1.json
# ... make changes ...
bir explain http://localhost:3000 > v2.json
bir diff compare v1.json v2.json
```

### Flow validation
```bash
bir flow detect http://localhost:3000/checkout
# Returns: flow steps with order, required, estimatedDuration
```

### Memory
```bash
bir memory store '{"domain":"myapp.com","purpose":"SaaS dashboard","commonFlows":["login","dashboard","settings"]}'
bir memory recall myapp.com
# Returns: stored knowledge
```
