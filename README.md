# BrowserIR (Browser Intelligence Runtime)

> Semantic browser understanding engine for AI agents. Built with **TypeScript**. Compiles web pages into typed, structured intermediate representations (IR) that AI can reason about.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Installation](#installation)
  - [Node.js Prerequisites](#nodejs-prerequisites)
  - [Claude Code](#claude-code)
  - [Cursor](#cursor)
  - [Codex](#codex)
  - [OpenCode](#opencode)
  - [Manual MCP Config](#manual-mcp-config)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [MCP Server Setup](#mcp-server-setup)
- [MCP Tools Reference](#mcp-tools-reference)
  - [Core Navigation & Analysis](#core-navigation--analysis)
  - [Web Fetch & Search](#web-fetch--search)
  - [Semantic Search Engine](#semantic-search-engine)
  - [Semantic Analysis](#semantic-analysis)
  - [Memory System](#memory-system)
  - [Knowledge Graph](#knowledge-graph)
  - [Event System](#event-system)
  - [Planner Engine](#planner-engine)
  - [Self-Healing](#self-healing)
  - [Multi-Browser](#multi-browser)
  - [Agent Coordination](#agent-coordination)
- [CLI Commands](#cli-commands)
- [Skills Guide](#skills-guide)
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

# Install BrowserIR globally (recommended - enables 'bir' CLI command)
npm install -g .

# Or install as dependency
npm install @browserir/core
```

### Global Install (Recommended)

Installing globally enables the `bir` CLI command:

```bash
npm install -g .

# Verify installation
bir --version
bir status
```

### Claude Code

#### Official Marketplace

```
/plugin install browserir@claude-plugins-official
```

#### Manual MCP Config

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["/path/to/BrowserIR/dist/adapters/mcp/index.js"]
    }
  }
}
```

### Cursor

- In Cursor Agent chat, install from marketplace:
  ```
  /add-plugin browserir
  ```
- Or search for "browserir" in the plugin marketplace.

### Codex

Available via the official Codex plugin marketplace.

#### Codex App

- In the Codex app, click on **Plugins** in the sidebar.
- Search for `BrowserIR` in the Browser section.
- Click the `+` next to BrowserIR and follow the prompts.

#### Codex CLI

```
/plugins
```

Search for BrowserIR and select `Install Plugin`.

### OpenCode

OpenCode uses its own plugin install. The plugin auto-registers the MCP server and all skills — no manual MCP config needed.

Add to your `opencode.json`:

```json
{
  "plugin": ["browserir@git+https://github.com/sukirman1901/BrowserIR.git"]
}
```

Restart OpenCode. The plugin auto-registers the MCP server, skills directory, and bootstrap context.

### Manual MCP Config

For platforms that don't auto-register the MCP server, add the MCP server to your platform's MCP configuration:

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["/path/to/BrowserIR/dist/adapters/mcp/index.js"]
    }
  }
}
```

---

## Quick Start

### Option 1: Use with AI Tools (Recommended)

After installation, just ask your AI agent naturally:

> "search Next.js documentation"
> "analyze https://example.com"
> "find Stripe pricing pages"

The AI will automatically use BrowserIR's MCP tools.

### Option 2: Use CLI directly

```bash
# Search with natural language
bir search query "Next.js documentation"

# Analyze a page
bir explain https://example.com

# Check status
bir status
```

### Example Session

**User:** "Analyze https://nusaiba.dev"

The AI will:

1. Load `bir` skill → call `bir_explain`
2. Get semantic IR with intent, components, risks
3. Present findings with recommendations

---

## How It Works

1. You ask something like *"analyze https://example.com"*
2. The AI detects the intent → matches the **bir** skill
3. The skill provides a methodology (step-by-step guide)
4. The AI calls MCP tools like `bir_explain`, `bir_click`, `bir_flow_detect`
5. Results are analyzed and presented

The AI follows a semantic understanding methodology: **Explain → Analyze → Interact → Test → Learn**

---

## MCP Server Setup

The BrowserIR MCP server provides 33 tools via stdio transport using TypeScript.

### Verify MCP Server

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/adapters/mcp/index.js
```

Expected: 33 tools listed.

---

## MCP Tools Reference

### Core Navigation & Analysis

| Tool | Description |
|------|-------------|
| `bir_navigate` | Navigate to URL and return status |
| `bir_explain` | Analyze page and return semantic BrowserIR |
| `bir_analyze` | Create a BrowserSession for analysis and interaction |
| `bir_click` | Click element by ref (@e1, @e2, ...) with self-healing |
| `bir_screenshot` | Take screenshot of current page |
| `bir_graph` | Get page structure as tree graph |
| `bir_tabs` | List all browser tabs |
| `bir_status` | Check daemon status |

### Web Fetch & Search

| Tool | Description |
|------|-------------|
| `bir_fetch` | Fetch URL content without browser (HTML→Markdown) |
| `bir_search_web` | Search web via DuckDuckGo API |
| `bir_read` | Read and extract semantic content from URL |

### Semantic Search Engine

| Tool | Description |
|------|-------------|
| `bir_search` | Search with semantic understanding. Returns BrowserIR with intent, components, actions. Auto-crawls if needed. |
| `bir_crawl` | Crawl URL, generate BrowserIR, and add to index |
| `bir_search_stats` | Get search index statistics |

**Key Feature:** `bir_search` returns **BrowserIR** (not just URLs), including:
- `intent` — Page purpose (documentation, pricing, login, etc.)
- `components` — Interactive elements (buttons, forms, tables)
- `actions` — Available user actions
- `flow` — Multi-step workflows
- `risk` — Security/compliance warnings

### Semantic Analysis

| Tool | Description |
|------|-------------|
| `bir_flow_detect` | Detect multi-step flows from captured events |
| `bir_flow_list` | List known flows for a domain |
| `bir_diff_compare` | Compare two BrowserIR snapshots semantically |

### Memory System

| Tool | Description |
|------|-------------|
| `bir_memory_recall` | Recall learned knowledge about a domain |
| `bir_memory_store` | Store BrowserIR knowledge about a domain |

### Knowledge Graph

| Tool | Description |
|------|-------------|
| `bir_knowledge_add_node` | Add node to knowledge graph |
| `bir_knowledge_add_edge` | Add edge between knowledge nodes |
| `bir_knowledge_search` | Search knowledge graph by label or type |
| `bir_knowledge_traverse` | Traverse graph from starting node |

### Event System

| Tool | Description |
|------|-------------|
| `bir_events_capture` | Capture custom event into event stream |
| `bir_events_get` | Query captured events for a session |

### Planner Engine

| Tool | Description |
|------|-------------|
| `bir_planner_create` | Create execution plan for a goal |
| `bir_planner_execute` | Execute a plan by ID |
| `bir_planner_status` | Get status of a plan |

### Self-Healing

| Tool | Description |
|------|-------------|
| `bir_heal_find` | Find replacement for broken selector using semantic IR |

### Multi-Browser

| Tool | Description |
|------|-------------|
| `bir_multi_create_session` | Create new multi-browser session |
| `bir_multi_execute` | Execute task across multiple tabs |
| `bir_multi_sessions` | List all multi-browser sessions |

### Agent Coordination

| Tool | Description |
|------|-------------|
| `bir_agent_register` | Register agent for coordination |
| `bir_agent_unregister` | Unregister agent |
| `bir_agent_claim` | Claim work on specific action |
| `bir_agent_graph` | Show agent dependency graph |

---

## CLI Commands

```bash
# Core Commands
bir explain <url>              # Get semantic IR of a page
bir click <ref>                # Click element by ref (e.g. @e3) with self-healing
bir screenshot                 # Take screenshot
bir graph <url>                # Show page structure as tree
bir diff <v1.json> <v2.json>   # Compare 2 IR snapshots
bir test <test-file>           # Run E2E tests from JSON file
bir memory recall <domain>     # Recall stored domain knowledge
bir memory store <json>        # Store domain knowledge
bir status                     # Check daemon status

# Search Engine Commands
bir search query <text>        # Semantic search with natural language
bir search crawl <url>         # Crawl URL and add to index
bir search stats               # Show search index statistics
```

---

## Skills Guide

The plugin includes methodology skills that guide the AI through structured browser analysis:

| Skill | Triggers When User Says... |
|-------|---------------------------|
| `bir` | "analyze", "explain", "understand", "browser" |
| `bir-testing` | "test", "E2E", "assertion", "verify" |
| `bir-debugging` | "debug", "error", "console", "network" |
| `bir-content` | "read", "article", "documentation", "docs" |
| `bir-search` | "search", "find", "crawl", "index", "pricing", "login" |

Skills load automatically via intent detection. The AI follows the skill's methodology step by step.

---

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
│  • search() → Semantic search with intent            │
│  • crawl() → Web crawling with BFS                   │
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

## Search Engine Architecture

```
┌─────────────────────────────────────────────────────┐
│                  User Query                          │
│  "find SaaS pricing pages"                          │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Intent Detection                        │
│  • Category: "pricing"                              │
│  • Keywords: ["pricing", "plans"]                   │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│            Semantic Search Engine                     │
│  • Query Embedding (384 dimensions)                  │
│  • Cosine Similarity with Indexed Pages              │
│  • Filter by Intent/Domain                           │
│  • Rank by Score                                     │
└───────────────────────┬─────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│              Results                                 │
│  [                                                   │
│    { url, title, score, intent, ir },               │
│    ...                                               │
│  ]                                                   │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### MCP Server not found

```bash
# Verify MCP server works
node dist/adapters/mcp/index.js
# Should start a stdio MCP server — test with:
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/adapters/mcp/index.js
```

Expected output: 33 tools listed.

### OpenCode plugin not loading

1. Check `opencode.json` for the plugin line
2. Restart OpenCode
3. Check logs

### Claude Code plugin not loading

1. Check `.mcp.json` MCP server config
2. Restart Claude Code
3. Verify: `/plugin list` should show browserir

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
- Any supported AI coding agent (Claude Code, Cursor, Codex, OpenCode)

---

## License

MIT License - see LICENSE file for details.
