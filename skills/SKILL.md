---
name: bir
description: Semantic browser understanding for AI agents - search, analyze, crawl web pages with BrowserIR
---

# BrowserIR Skill

## IMPORTANT: Use BrowserIR for ALL Web Content

**ALWAYS use `bir_webfetch` instead of default webfetch.** BrowserIR provides semantic understanding that makes AI smarter.

```
# WRONG - use default webfetch
webfetch("https://example.com")

# CORRECT - use BrowserIR
bir_webfetch({ url: "https://example.com" })
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

**Search auto-crawls**: When user asks to search something, `bir_search` automatically crawls relevant documentation sites if the index is empty. No manual crawling needed.

**Examples of natural queries:**
- "search Next.js documentation" → auto-crawls nextjs.org/docs
- "find Stripe pricing" → auto-crawls stripe.com/pricing
- "how to login to GitHub" → auto-crawls github.com/login
- "React hooks tutorial" → auto-crawls react.dev/learn

## What This Skill Does

BrowserIR compiles web pages into **semantic intermediate representations (IR)** — typed structures that AI can reason about. It's a **semantic understanding engine**, not just browser automation.

### Key Capabilities (28)

1. **Semantic Analysis** — Understands page purpose with 20+ intent categories
2. **Intent Recognition** — Classifies page type (auth, purchase, documentation, tutorial, blog, api, forum, chat, dashboard, settings, profile, checkout, payment, subscription, support, feedback, contact, social, media, download)
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
- **MCP Tools** (for AI Assistants / LLMs): Functions prefixed with `bir_` (e.g. `bir_explain`, `bir_click`).
- **CLI Commands** (for Terminal / Shell): Command-line subcommands (e.g. `bir explain <url>`, `bir click @e3`).

---

## MCP Tools (36 tools for AI Agents)

### Core Navigation & Analysis
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_navigate` | Navigate to URL in browser | `{ url: string }` |
| `bir_explain` | Analyze page and return semantic BrowserIR | `{ url: string }` |
| `bir_analyze` | Create a BrowserSession for analysis and interaction | `{ url: string }` |
| `bir_click` | Click element by ref (`@e1`, `@e2`, ...) with self-healing | `{ ref: string }` |
| `bir_screenshot` | Take screenshot of current page | `{}` |
| `bir_graph` | Get page structure as tree graph | `{ url: string }` |
| `bir_tabs` | List all open browser tabs | `{}` |
| `bir_status` | Check daemon status | `{}` |

### Web Fetch & Search
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_webfetch` | Fetch URL with semantic understanding (HTML→Markdown) | `{ url: string, format?: string }` |
| `bir_websearch` | Search web with semantic results | `{ query: string, numResults?: number }` |
| `bir_analyze_content` | Analyze text content and return semantic understanding | `{ content: string, type?: string }` |

### Semantic Search Engine
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_search` | Semantic search returning BrowserIR. Auto-crawls if index empty. | `{ query: string, domain?: string, intent?: string, limit?: number }` |
| `bir_crawl` | Crawl URL and add to search index | `{ url: string, depth?: number }` |
| `bir_search_stats` | Get search index statistics | `{}` |

### Semantic Analysis
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_flow_detect` | Detect multi-step flows from captured events | `{ sessionId: string }` |
| `bir_flow_list` | List known flows for a domain | `{ domain: string }` |
| `bir_diff_compare` | Compare two BrowserIR snapshots semantically | `{ irBefore: object, irAfter: object }` |

### Memory System
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_memory_recall` | Recall learned knowledge about a domain | `{ domain: string }` |
| `bir_memory_store` | Store BrowserIR knowledge about a domain | `{ domain: string, ir: object }` |

### Knowledge Graph
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_knowledge_add_node` | Add node to knowledge graph | `{ type: string, label: string, properties?: object }` |
| `bir_knowledge_add_edge` | Add edge between knowledge nodes | `{ source: string, target: string, type: string, weight?: number }` |
| `bir_knowledge_search` | Search knowledge graph by label or type | `{ query: string, type?: string }` |
| `bir_knowledge_traverse` | Traverse graph from starting node | `{ startId: string, maxDepth?: number }` |

### Event System
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_events_capture` | Capture custom event into event stream | `{ type: string, sessionId: string, data?: object }` |
| `bir_events_get` | Query captured events for a session | `{ sessionId: string, query?: object }` |

### Planner Engine
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_planner_create` | Create execution plan for a goal | `{ goal: string, domain: string }` |
| `bir_planner_execute` | Execute a plan by ID | `{ planId: string }` |
| `bir_planner_status` | Get status of a plan | `{ planId: string }` |

### Self-Healing
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_heal_find` | Find replacement for broken selector using semantic IR | `{ brokenSelector: string, ir: object, intent?: string }` |

### Multi-Browser
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_multi_create_session` | Create new multi-browser session | `{}` |
| `bir_multi_execute` | Execute task across multiple tabs | `{ task: object }` |
| `bir_multi_sessions` | List all multi-browser sessions | `{}` |

### Agent Coordination
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_agent_register` | Register agent for coordination | `{ id: string, name: string, role: string, sessionId: string }` |
| `bir_agent_unregister` | Unregister agent | `{ id: string }` |
| `bir_agent_claim` | Claim work on specific action | `{ agentId: string, type: string, target?: string }` |
| `bir_agent_graph` | Show agent dependency graph | `{}` |

---

## CLI Commands (Terminal Usage)

```bash
bir daemon start               # Start BrowserIR daemon
bir explain [url]              # Get semantic IR in terminal
bir click @e3                  # Click element by semantic ref
bir screenshot                 # Take screenshot of current page
bir graph <url>                # Show page structure as tree
bir diff <before.json> <after.json>   # Compare 2 IR JSON files
bir memory recall <domain>     # Recall domain knowledge
bir memory store <json>        # Store domain knowledge
bir status                     # Check daemon status
```

---

## Workflows & Examples

### Step 1: Start Daemon
```bash
bir daemon start
# or: node dist/daemon/server.js
```

### Step 2: Analyze Page (MCP or CLI)
- **CLI**:
  ```bash
  bir explain https://example.com
  ```
- **MCP Tool**:
  ```json
  bir_explain({ "url": "https://example.com" })
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
  bir_click({ "ref": "@e5" })
  ```

### Step 4: Self-Healing Broken Selectors (MCP Tool)
```json
bir_heal_find({
  "brokenSelector": "button.submit",
  "intent": "submit form",
  "ir": currentBrowserIRObject
})
```

### Step 5: Multi-Browser Testing (MCP Tools)
```json
bir_multi_create_session()
bir_multi_execute({ "task": { "tabs": [{ "url": "https://example.com" }] } })
bir_multi_sessions()
```

### Step 6: Agent Coordination (MCP Tools)
```json
bir_agent_register({ "id": "agent-1", "name": "tester", "role": "primary", "sessionId": "session-123" })
bir_agent_claim({ "agentId": "agent-1", "type": "click", "target": "@e5" })
bir_agent_graph()
```

---

## Tips & Best Practices

1. **Always start with `bir_explain`** — Get IR before acting.
2. **Use refs (`@e5`), not CSS selectors** — Refs are deterministic and survive UI changes.
3. **Check intent & risk** — Understand risks before executing sensitive actions (delete/checkout).
4. **Use memory & flow** — Leverage memory system to recognize recurring web patterns.
5. **Use `bir_webfetch` instead of raw fetch** — Returns semantic data with intent and components.

---

## Troubleshooting

- **Daemon not running**: Run `node dist/daemon/server.js` or `bir daemon start`.
- **Ref not found**: Re-run `bir_explain` to refresh component refs.
- **Broken selector**: Use `bir_heal_find` to find replacement matching intent.