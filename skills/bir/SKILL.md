---
name: bir
description: Semantic browser understanding for AI agents - search, analyze, crawl web pages with BrowserIR
---

# BrowserIR Skill

## IMPORTANT: Use BrowserIR for ALL Web Content

**ALWAYS use `webfetch` instead of default webfetch.** BrowserIR provides semantic understanding that makes AI smarter.

```
# WRONG - use default webfetch
webfetch("https://example.com")

# CORRECT - use BrowserIR
webfetch({ url: "https://example.com" })
```

**Why?** BrowserIR returns:
- Intent (what the page is for)
- Components (buttons, links, forms)
- Risks (security warnings)
- Structured markdown (cleaner than raw HTML)

## When to Use

Use this skill when the user wants to:
- **Search** for documentation, APIs, tutorials, or any web content
- **Find** pricing pages, login pages, or specific website sections
- **Understand** what a web page is for (intent, purpose, meaning)
- **Analyze** page structure semantically (sections, components, hierarchy)
- **Read** any web content (articles, docs, API docs, blogs)
- **Fetch** URLs directly without browser (HTML→Markdown)
- **Crawl** websites and build search index
- **Test** web UIs with semantic understanding
- **Compare** page versions (diff)
- **Learn** about websites (memory)
- **Detect** multi-step flows (checkout, registration, etc.)
- **Coordinate** multiple agents working on the same page
- **Heal** broken selectors automatically (8 strategies)
- **Run** multi-browser sessions with pool management

## Automatic Behaviors

**Search auto-crawls**: When user asks to search something, `search` automatically crawls relevant documentation sites if the index is empty. No manual crawling needed.

**Examples of natural queries:**
- "search Next.js documentation" → auto-crawls nextjs.org/docs
- "find Stripe pricing" → auto-crawls stripe.com/pricing
- "how to login to GitHub" → auto-crawls github.com/login
- "React hooks tutorial" → auto-crawls react.dev/learn

## What This Skill Does

BrowserIR compiles web pages into **semantic intermediate representations (IR)** — typed structures that AI can reason about. It's a **semantic understanding engine**, not just browser automation.

### Key Capabilities

1. **Semantic Analysis** — Understands page purpose with 24 intent categories
2. **Intent Recognition** — Classifies page type (auth, purchase, documentation, tutorial, blog, api_reference, forum, chat, dashboard, settings, profile, checkout, payment, subscription, support, feedback, contact, social, media, download)
3. **Risk Assessment** — Critical severity detection for credentials, financial, PII, destructive actions. Compliance checks (GDPR, PCI, HIPAA, SOC2, CCPA)
4. **Flow Detection** — Multi-source detection (structure, events, network) + flow templates + learning
5. **Memory System** — Learns from past interactions (patterns, selectors, flows, errors, performance)
6. **Evidence Chains** — Explains WHY it thinks something is what it is
7. **Self-Healing** — 8 strategies (history, text, ARIA, semantic, memory, visual, context, position) + learning
8. **Multi-Browser** — Pool management, warmup, parallel execution, idle cleanup
9. **Agent Coordination** — Multiple AI agents can work together (persistent)
10. **Network Capture** — Intercept and log HTTP requests/responses
11. **Console & Error Capture** — Auto-capture browser console logs and JS errors
12. **Script Injection** — Inject JavaScript before page load for mocking
13. **Cookie/Storage Management** — Setup and verify app state
14. **Element Highlight** — Visual debugging with colored outlines
15. **Failure Analysis Loop** — Test → fail → debug → fix → retest
16. **Content Extractor** — Universal reader for articles, docs, API docs, blogs
17. **Doc Parser** — Parse documentation structure, navigation, code examples
18. **Stealth Manager** — Anti-detection (webdriver, chrome, permissions, plugins, languages)
19. **Security Manager** — Domain allowlisting, offline mode, headers, credentials, truncation
20. **Input Manager** — Mouse, keyboard, dialog handling, frame switching
21. **File Manager** — Download, upload, PDF export
22. **Session Manager** — Idle timeout, auto-save, state expiration, encryption (AES-256)
23. **Dashboard** — Real-time semantic analysis monitoring with SSE (port 4848)
24. **Web Fetch** — Fetch URLs directly without browser (HTML→Markdown conversion)
25. **Web Search** — Search web via DuckDuckGo API
26. **Semantic Search** — Intent-based search returning BrowserIR
27. **Web Crawling** — BFS crawling with robots.txt, rate limiting
28. **Intent Classification** — Understand user queries beyond keywords

---

## Interfaces (MCP Tools vs CLI Commands)

BrowserIR provides two distinct interfaces depending on how you interact:
- **MCP Tools** (for AI Assistants / LLMs): Provided by the `bir` MCP server (e.g. `explain`, `click`).
- **CLI Commands** (for Terminal / Shell): Command-line subcommands (e.g. `bir explain <url>`, `bir click @e3`).

---

## MCP Tools (36 tools for AI Agents)

### Core Navigation & Analysis
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `navigate` | Navigate to URL in browser | `{ url: string }` |
| `explain` | Analyze page and return semantic BrowserIR | `{ url: string }` |
| `analyze` | Create a BrowserSession for analysis and interaction | `{ url: string }` |
| `click` | Click element by ref (`@e1`, `@e2`, ...) with self-healing | `{ ref: string }` |
| `screenshot` | Take screenshot of current page | `{}` |
| `graph` | Get page structure as tree graph | `{ url: string }` |
| `tabs` | List all open browser tabs | `{}` |
| `status` | Check daemon status | `{}` |

### Web Fetch & Search
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `webfetch` | Fetch URL with semantic understanding (HTML→Markdown) | `{ url: string, format?: string }` |
| `websearch` | Search web with semantic results | `{ query: string, numResults?: number }` |
| `analyze_content` | Analyze text content and return semantic understanding | `{ content: string, type?: string }` |

### Semantic Search Engine
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `search` | Semantic search returning BrowserIR. Auto-crawls if index empty. | `{ query: string, domain?: string, intent?: string, limit?: number }` |
| `crawl` | Crawl URL and add to search index | `{ url: string, depth?: number }` |
| `search_stats` | Get search index statistics | `{}` |

### Semantic Analysis
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `flow_detect` | Detect multi-step flows from captured events | `{ sessionId: string }` |
| `flow_list` | List known flows for a domain | `{ domain: string }` |
| `diff_compare` | Compare two BrowserIR snapshots semantically | `{ irBefore: object, irAfter: object }` |

### Memory System
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `memory_recall` | Recall learned knowledge about a domain | `{ domain: string }` |
| `memory_store` | Store BrowserIR knowledge about a domain | `{ domain: string, ir: object }` |

### Knowledge Graph
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `knowledge_add_node` | Add node to knowledge graph | `{ type: string, label: string, properties?: object }` |
| `knowledge_add_edge` | Add edge between knowledge nodes | `{ source: string, target: string, type: string, weight?: number }` |
| `knowledge_search` | Search knowledge graph by label or type | `{ query: string, type?: string }` |
| `knowledge_traverse` | Traverse graph from starting node | `{ startId: string, maxDepth?: number }` |

### Event System
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `events_capture` | Capture custom event into event stream | `{ type: string, sessionId: string, data?: object }` |
| `events_get` | Query captured events for a session | `{ sessionId: string, query?: object }` |

### Planner Engine
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `planner_create` | Create execution plan for a goal | `{ goal: string, domain: string }` |
| `planner_execute` | Execute a plan by ID | `{ planId: string }` |
| `planner_status` | Get status of a plan | `{ planId: string }` |

### Self-Healing
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `heal_find` | Find replacement for broken selector using semantic IR | `{ brokenSelector: string, ir: object, intent?: string }` |

### Multi-Browser
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `multi_create_session` | Create new multi-browser session | `{}` |
| `multi_execute` | Execute task across multiple tabs | `{ task: object }` |
| `multi_sessions` | List all multi-browser sessions | `{}` |

### Agent Coordination
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `agent_register` | Register agent for coordination | `{ id: string, name: string, role: string, sessionId: string, status?: string }` |
| `agent_unregister` | Unregister agent | `{ id: string }` |
| `agent_claim` | Claim work on specific action | `{ agentId: string, type: string, target?: string, value?: string }` |
| `agent_graph` | Show agent dependency graph | `{}` |

---

## CLI Commands (Terminal Usage)

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
bir memory recall <domain>     # Recall domain knowledge
bir memory store <json>        # Store domain knowledge
bir test <test-file>            # Run E2E tests from JSON

# Search Engine
bir search query <text>        # Semantic search
bir search crawl <url>         # Crawl and index
bir search stats               # Index statistics
```

---

## Workflows & Examples

### Step 1: Start Daemon
```bash
npm start
# or: node dist/daemon/server.js
```

### Step 2: Analyze Page (MCP or CLI)
- **CLI**:
  ```bash
  bir explain https://example.com
  ```
- **MCP Tool**:
  ```json
  explain({ "url": "https://example.com" })
  ```

This returns BrowserIR containing:
- `sections` — Semantic page structure (`navigation`, `form`, `content`, `footer`)
- `intent` — Page purpose classification (`authentication`, `purchase`, `search`, etc.)
- `components` — Interactive components with refs (`@e1`, `@e2`, `@e3`)
- `risk` — Risk assessments (warnings on destructive or credential actions)

### Step 3: Interact Using Refs
- **CLI**:
  ```bash
  bir click @e5
  ```
- **MCP Tool**:
  ```json
  click({ "ref": "@e5" })
  ```

### Step 4: Self-Healing Broken Selectors (MCP Tool)
```json
heal_find({
  "brokenSelector": "button.submit",
  "intent": "submit form",
  "ir": currentBrowserIRObject
})
```

### Step 5: Multi-Browser Testing (MCP Tools)
```json
multi_create_session()
multi_execute({ "task": { "tabs": [{ "url": "https://example.com" }] } })
multi_sessions()
```

### Step 6: Agent Coordination (MCP Tools)
```json
agent_register({ "id": "agent-1", "name": "tester", "role": "primary", "sessionId": "session-123" })
agent_claim({ "agentId": "agent-1", "type": "click", "target": "@e5" })
agent_graph()
```

---

## Tips & Best Practices

1. **Always start with `explain`** — Get IR before acting.
2. **Use refs (`@e5`), not CSS selectors** — Refs are deterministic and survive UI changes.
3. **Check intent & risk** — Understand risks before executing sensitive actions (delete/checkout).
4. **Use memory & flow** — Leverage memory system to recognize recurring web patterns.
5. **Use `webfetch` instead of raw fetch** — Returns semantic data with intent and components.

---

## Troubleshooting

- **Daemon not running**: Run `node dist/daemon/server.js` or `npm start`.
- **Ref not found**: Re-run `explain` to refresh component refs.
- **Broken selector**: Use `heal_find` to find replacement matching intent.
