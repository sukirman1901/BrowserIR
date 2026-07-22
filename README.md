# BrowserIR (Browser Intelligence Runtime)

> Semantic browser understanding engine for AI agents. Built with **TypeScript**. Compiles web pages into typed, structured intermediate representations (IR) that AI can reason about.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [MCP Server Setup](#mcp-server-setup)
- [MCP Tools Reference](#mcp-tools-reference)
- [CLI Commands](#cli-commands)
- [Architecture](#architecture)
- [Search Engine Architecture](#search-engine-architecture)
- [Troubleshooting](#troubleshooting)
- [Requirements](#requirements)
- [License](#license)

---

## Installation

### Node.js Prerequisites

```bash
# Install Node.js 22+
node --version  # Should be >= 22

# Install BrowserIR globally (enables 'bir' CLI command)
npm install -g .

# Verify installation
bir --version
bir status
```

### Platform-Specific Setup

#### Claude Code

Create or edit `.mcp.json` in your project root (or use the included one):

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["${CLAUDE_PROJECT_DIR}/dist/adapters/mcp/index.js"],
      "cwd": "${CLAUDE_PROJECT_DIR}"
    }
  }
}
```

Plugin manifest at `.claude-plugin/plugin.json` and skill at `skills/bir/SKILL.md` are auto-loaded.

#### Cursor

The included `.cursor/mcp.json` and `.cursor/rules/bir.mdc` are auto-loaded:

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/adapters/mcp/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

#### OpenCode

Add the MCP server to your global `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "bir": {
      "type": "local",
      "command": ["node", "/path/to/BrowserIR/dist/adapters/mcp/index.cjs"],
      "cwd": "/path/to/BrowserIR",
      "enabled": true
    }
  }
}
```

Skills auto-discovered from `.opencode/skills/bir/SKILL.md`.

#### Manual MCP Config

For any platform that supports MCP stdio servers:

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

---

## Quick Start

### Option 1: Use with AI Tools

After installation, just ask your AI agent naturally:

> "search Next.js documentation"
> "analyze https://example.com"
> "find Stripe pricing pages"

The AI will automatically use BrowserIR's 36 MCP tools.

### Option 2: Use CLI directly

```bash
# Start daemon (required for CLI commands)
npm start
# or: node dist/daemon/server.js

# Analyze a page
bir explain https://example.com

# Check daemon status
bir status

# Semantic search
bir search query "Next.js documentation"
```

---

## How It Works

```
Raw HTML → BrowserIR → Semantic Tree (sections, components, intent, flow, risk)
```

1. You ask something like *"analyze https://example.com"*
2. The AI detects the intent → matches the **bir** skill
3. The skill provides a methodology (step-by-step guide)
4. The AI calls MCP tools like `explain`, `click`, `search`
5. Results are analyzed and presented

The AI follows a semantic understanding methodology: **Explain → Analyze → Interact → Test → Learn**

---

## MCP Server Setup

The BrowserIR MCP server provides 36 tools via stdio transport. The MCP server auto-starts the daemon if not running.

### Daemon Ports

| Service | Port |
|--------|------|
| WebSocket | 3080 |
| REST API | 3081 |
| Dashboard | 4848 |

### Verify MCP Server

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/adapters/mcp/index.js
```

Expected: 36 tools listed.

---

## MCP Tools Reference

### Core Navigation & Analysis (8)

| Tool | Description | Input |
|------|-------------|-------|
| `explain` | Analyze page and return semantic BrowserIR | `{ url }` |
| `analyze` | Create a BrowserSession for analysis and interaction | `{ url }` |
| `click` | Click element by ref (@e1, @e2, ...) with self-healing | `{ ref }` |
| `navigate` | Navigate to URL in browser | `{ url }` |
| `screenshot` | Take screenshot of current page | `{}` |
| `graph` | Get page structure as tree graph | `{ url }` |
| `tabs` | List all open browser tabs | `{}` |
| `status` | Check daemon status | `{}` |

### Web Fetch & Search (3)

| Tool | Description | Input |
|------|-------------|-------|
| `webfetch` | Fetch URL with semantic understanding (HTML→Markdown) | `{ url, format? }` |
| `websearch` | Search web with semantic results | `{ query, numResults? }` |
| `analyze_content` | Analyze text content and return semantic understanding | `{ content, type? }` |

### Semantic Search Engine (3)

| Tool | Description | Input |
|------|-------------|-------|
| `search` | Semantic search returning BrowserIR. Auto-crawls if index empty. | `{ query, domain?, intent?, limit? }` |
| `crawl` | Crawl URL and add to search index | `{ url, depth? }` |
| `search_stats` | Get search index statistics | `{}` |

### Semantic Analysis (3)

| Tool | Description | Input |
|------|-------------|-------|
| `flow_detect` | Detect multi-step flows from captured events | `{ sessionId }` |
| `flow_list` | List known flows for a domain | `{ domain }` |
| `diff_compare` | Compare two BrowserIR snapshots semantically | `{ irBefore, irAfter }` |

### Memory System (2)

| Tool | Description | Input |
|------|-------------|-------|
| `memory_recall` | Recall learned knowledge about a domain | `{ domain }` |
| `memory_store` | Store BrowserIR knowledge about a domain | `{ domain, ir }` |

### Knowledge Graph (4)

| Tool | Description | Input |
|------|-------------|-------|
| `knowledge_add_node` | Add node to knowledge graph | `{ type, label, properties? }` |
| `knowledge_add_edge` | Add edge between knowledge nodes | `{ source, target, type, weight? }` |
| `knowledge_search` | Search knowledge graph by label or type | `{ query, type? }` |
| `knowledge_traverse` | Traverse graph from starting node | `{ startId, maxDepth? }` |

### Event System (2)

| Tool | Description | Input |
|------|-------------|-------|
| `events_capture` | Capture custom event into event stream | `{ type, sessionId, data? }` |
| `events_get` | Query captured events for a session | `{ sessionId, query? }` |

### Planner Engine (3)

| Tool | Description | Input |
|------|-------------|-------|
| `planner_create` | Create execution plan for a goal | `{ goal, domain }` |
| `planner_execute` | Execute a plan by ID | `{ planId }` |
| `planner_status` | Get status of a plan | `{ planId }` |

### Self-Healing (1)

| Tool | Description | Input |
|------|-------------|-------|
| `heal_find` | Find replacement for broken selector using semantic IR | `{ brokenSelector, ir, intent? }` |

### Multi-Browser (3)

| Tool | Description | Input |
|------|-------------|-------|
| `multi_create_session` | Create new multi-browser session | `{}` |
| `multi_execute` | Execute task across multiple tabs | `{ task }` |
| `multi_sessions` | List all multi-browser sessions | `{}` |

### Agent Coordination (4)

| Tool | Description | Input |
|------|-------------|-------|
| `agent_register` | Register agent for coordination | `{ id, name, role, sessionId, status? }` |
| `agent_unregister` | Unregister agent | `{ id }` |
| `agent_claim` | Claim work on specific action | `{ agentId, type, target?, value? }` |
| `agent_graph` | Show agent dependency graph | `{}` |

---

## CLI Commands

```bash
# Start daemon (required before CLI commands)
npm start
# or: node dist/daemon/server.js

# Core Commands
bir explain [url]              # Get semantic IR of a page
bir status                     # Check daemon status
bir click <ref>                # Click element by ref (e.g. @e3)
bir graph <url>                # Show page structure as tree
bir diff <v1.json> <v2.json>   # Compare 2 IR snapshots
bir memory recall <domain>     # Recall stored domain knowledge
bir memory store <json>        # Store domain knowledge
bir test <test-file>           # Run E2E tests from JSON file

# Search Engine
bir search query <text>        # Semantic search with natural language
bir search crawl <url>         # Crawl URL and add to index
bir search stats               # Show search index statistics
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AI Tool (any)                       │
│           Claude / Cursor / OpenCode / Codex         │
└───────────────────────┬─────────────────────────────┘
                        │ MCP (stdio) or CLI
                        ▼
┌─────────────────────────────────────────────────────┐
│                  BrowserIR                           │
│            Semantic Understanding Engine             │
├─────────────────────────────────────────────────────┤
│  MCP Server (36 tools)  │  CLI (8 commands)         │
│  REST API (port 3081)   │  WebSocket (port 3080)    │
│  Dashboard SSE (port 4848)                          │
├─────────────────────────────────────────────────────┤
│  Engine Manager (10 engines):                       │
│  Memory · Diff · Events · Self-Healing · Flow       │
│  Knowledge · Planner · Multi-Browser · Agent         │
│  SessionMemory                                       │
│  + ExaSearch (SemanticIndexer + IntentClassifier)   │
│  + WebCrawler · ContentExtractor · DocParser        │
│  + StealthManager · SecurityManager · InputManager  │
│  + FileManager · TestRunner · NetworkCapture        │
│  + ConsoleCapture · ScriptInjection · VisualDiff     │
└───────────────────────┬─────────────────────────────┘
                        │ Playwright/CDP
                        ▼
┌─────────────────────────────────────────────────────┐
│             Browser (Chrome/Firefox/WebKit)          │
└─────────────────────────────────────────────────────┘
```

## Search Engine Architecture

```
User Query → IntentClassifier → SemanticIndexer (SQLite)
                              ↓ (if empty)
                             WebCrawler (BFS, robots.txt, rate limiting)
                              ↓
                             IndexPage → EmbeddingEngine (384 dims)
                              ↓
                             SearchResult (url, title, score, intent, ir)
```

---

## Troubleshooting

### MCP Server not found

```bash
# Verify MCP server works
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/adapters/mcp/index.js
# Expected: 36 tools listed
```

### Daemon not starting

```bash
# Start daemon manually
npm start
# or: node dist/daemon/server.js

# Check health
curl http://localhost:3081/health
# Expected: {"status":"healthy"}
```

### Build errors

```bash
npm run build
# If errors, check Node.js version >= 22
node --version
```

---

## Requirements

- **Node.js 22+**
- **Playwright** (auto-installed)
- Any supported AI coding agent (Claude Code, Cursor, OpenCode, Codex)

---

## License

MIT License - see LICENSE file for details.