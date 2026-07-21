# BrowserIR Skill — Semantic Browser Understanding for AI Agents

## When to Use

Use this skill when the user wants to:
- **Understand** what a web page is for (intent, purpose, meaning)
- **Analyze** page structure semantically (sections, components, hierarchy)
- **Read** any web content (articles, docs, API docs, blogs)
- **Test** web UIs with semantic understanding
- **Compare** page versions (diff)
- **Learn** about websites (memory)
- **Detect** multi-step flows (checkout, registration, etc.)
- **Coordinate** multiple agents working on the same page
- **Heal** broken selectors automatically (8 strategies)
- **Run** multi-browser sessions with pool management
- **Stealth** browse without detection
- **Secure** with domain allowlisting and encryption
- **Input** with mouse, keyboard, dialogs, frames
- **Download/Upload** files and export PDFs

## What This Skill Does

BrowserIR compiles web pages into **semantic intermediate representations (IR)** — typed structures that AI can reason about. It's a **semantic understanding engine**, not just browser automation.

### Key Capabilities (23)

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

---

## MCP Server Configuration

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["/Users/aaa/Documents/Developer/BrowserIR/dist/adapters/mcp/index.js"],
      "cwd": "/Users/aaa/Documents/Developer/BrowserIR"
    }
  }
}
```

---

## Available MCP Tools (30 tools)

### Core Navigation & Analysis
- `bir_navigate({ url })` — Navigate to URL in browser
- `bir_explain({ url })` — Analyze page and return semantic BrowserIR
- `bir_analyze({ url })` — Create a BrowserSession for analysis and interaction
- `bir_click({ ref })` — Click element by ref (`@e1`, `@e2`, ...) with self-healing
- `bir_screenshot({})` — Take screenshot of current page
- `bir_graph({ url })` — Get page structure as tree graph
- `bir_tabs({})` — List all open browser tabs
- `bir_status({})` — Check daemon status

### Semantic Analysis
- `bir_flow_detect({ sessionId })` — Detect multi-step flows from captured events
- `bir_flow_list({ domain })` — List known flows for a domain
- `bir_diff_compare({ irBefore, irAfter })` — Compare two BrowserIR snapshots semantically

### Memory System
- `bir_memory_recall({ domain })` — Recall learned knowledge about a domain
- `bir_memory_store({ domain, ir })` — Store BrowserIR knowledge about a domain

### Knowledge Graph
- `bir_knowledge_add_node({ type, label, properties })` — Add node to knowledge graph
- `bir_knowledge_add_edge({ source, target, type, weight })` — Add edge between knowledge nodes
- `bir_knowledge_search({ query, type })` — Search knowledge graph by label or type
- `bir_knowledge_traverse({ startId, maxDepth })` — Traverse graph from starting node

### Event System
- `bir_events_capture({ type, sessionId, data })` — Capture custom event into event stream
- `bir_events_get({ sessionId, query })` — Query captured events for a session

### Planner Engine
- `bir_planner_create({ goal, domain })` — Create execution plan for a goal
- `bir_planner_execute({ planId })` — Execute a plan by ID
- `bir_planner_status({ planId })` — Get status of a plan

### Self-Healing
- `bir_heal_find({ brokenSelector, ir, intent })` — Find replacement for broken selector using semantic IR

### Multi-Browser
- `bir_multi_create_session({})` — Create new multi-browser session
- `bir_multi_execute({ task })` — Execute task across multiple tabs
- `bir_multi_sessions({})` — List all multi-browser sessions

### Agent Coordination
- `bir_agent_register({ id, name, role, sessionId })` — Register agent for coordination
- `bir_agent_unregister({ id })` — Unregister agent
- `bir_agent_claim({ agentId, type, target })` — Claim work on specific action
- `bir_agent_graph({})` — Show agent dependency graph

---

## CLI Commands Cheat Sheet

```bash
node dist/daemon/server.js     # Start BrowserIR daemon
bir explain [url]              # Get semantic IR
bir click @e3                  # Click element by ref
bir screenshot                 # Take screenshot
bir graph <url>                # Show page structure as tree
bir diff <before> <after>      # Compare 2 IR snapshots
bir memory recall <domain>     # Recall domain knowledge
bir status                     # Check daemon status
```
