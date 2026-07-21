# BrowserIR (Browser Intelligence Runtime)

> Semantic browser understanding engine for AI agents. Built with **TypeScript**. Compiles web pages into typed, structured intermediate representations (IR) that AI can reason about.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 💡 Why BrowserIR?

Traditional browser automation tools (Playwright, Puppeteer, Selenium) operate at the **DOM level** — making them fragile and expensive for AI agents. **BrowserIR understands pages at the semantic level.**

| Feature | Playwright / Puppeteer | BrowserIR |
| :--- | :--- | :--- |
| **Perspective** | Raw HTML / CSS Selectors | Typed Semantic Tree (Intent, Sections, Components) |
| **Token Cost** | Thousands of HTML tokens per step | 70% fewer tokens with clean IR |
| **UI Resiliency** | Breaks when CSS classes change | Deterministic refs (`@e1`, `@e2`) + Self-Healing |
| **Risk Detection** | None | Automatic warning on destructive/credential actions |
| **AI Integration** | Requires custom wrapper | Native **30 MCP Tools** for Claude, Cursor, OpenCode |

---

## ⚡ Quick Start

### 1. Installation

```bash
npm install @browserir/core
```

### 2. Start Daemon

```bash
node dist/daemon/server.js
# or: bir daemon start
```

### 3. Analyze any web page via CLI

```bash
bir explain https://example.com
```

**Output:**
```yaml
Semantic Analysis Complete

Page: Example Domain
URL: https://example.com/
Intent: content_consumption (navigation)

Components:
  [content] Main Content
    - More information (link) [@e1]

Metadata:
  A11y Tree: yes
  React Fiber: no
  DOM Size: 12 nodes
```

---

## 🛠️ Usage Modes

### Mode 1: MCP Server (for AI Assistants / LLMs)
Add BrowserIR to your MCP config (`claude_desktop_config.json`, Cursor, OpenCode, Antigravity):

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

#### Core MCP Tools (30 Tools Total):
- `bir_explain` — Analyze web page and return BrowserIR
- `bir_analyze` — Create a BrowserSession for analysis and interaction
- `bir_click` — Click element by ref (e.g. `@e3`) with self-healing
- `bir_navigate` — Navigate to URL
- `bir_screenshot` — Capture screenshot
- `bir_diff_compare` — Compare two BrowserIR snapshots semantically
- `bir_flow_detect` — Detect multi-step processes (checkout, registration)
- `bir_memory_recall` & `bir_memory_store` — Remember domain patterns
- `bir_heal_find` — Automatically fix broken CSS selectors
- `bir_planner_create` & `bir_planner_execute` — General task planning

### Mode 2: TypeScript / Node.js SDK

```typescript
import { BrowserSession, explain, analyze } from '@browserir/core'

// Quick analysis
const ir = await explain('https://example.com')
console.log('Intent:', ir.page.intent.primary)

// Interactive session
const session = await analyze('https://example.com')
console.log(await session.graph())

await session.click('@e1')
```

### Mode 3: CLI Commands Cheat Sheet

```bash
bir explain <url>              # Get semantic IR of a page
bir click <ref>                # Click element by ref (e.g. @e3) with self-healing
bir screenshot                 # Take screenshot
bir graph <url>                # Show page structure as tree
bir diff <v1.json> <v2.json>   # Compare 2 IR snapshots
bir test <test-file>           # Run E2E tests from JSON file
bir memory recall <domain>     # Recall stored domain knowledge
bir memory store <json>        # Store domain knowledge
bir status                     # Check daemon status
```

### Mode 4: REST API & WebSockets

When the daemon is running:
- **REST API**: `http://localhost:3081` (e.g. `POST /navigate`, `GET /explain`)
- **WebSocket**: `ws://localhost:3080` (Real-time event feed)

---

## 🌟 Key Features

### Semantic Understanding
- 🧠 **Semantic Analysis**: Classifies page intent with 20+ categories (authentication, purchase, documentation, tutorial, blog, api_reference, forum, chat, dashboard, settings, profile, checkout, payment, subscription, support, feedback, contact, social, media, download).
- 🏷️ **Deterministic Refs (`@e1`, `@e2`)**: Click elements without fragile CSS selectors.
- 🏷️ **38 Component Types**: Rich component detection (button, link, field, modal, tooltip, accordion, tabs, code_block, video, audio, embed, form, dialog, etc.).
- ⚠ **Risk Assessment**: Critical severity detection for credentials, financial data, PII, destructive actions. Compliance checks (GDPR, PCI, HIPAA, SOC2, CCPA).
- 🔄 **Flow Detection**: Multi-source detection (structure, events, network) + flow templates + learning.
- 🧠 **Knowledge Graph**: SPARQL-like queries for semantic relationships.

### Content Reading
- 📖 **Universal Content Reader**: Extract semantic meaning from articles, docs, API docs, blogs.
- 📚 **Documentation Parser**: Parse documentation structure, navigation, code examples, API endpoints.
- 🛡 **Stealth Manager**: Anti-detection (webdriver, chrome, permissions, plugins, languages spoofing).

### Self-Healing
- 🩹 **8 Healing Strategies**: History, text match, ARIA match, semantic match, memory match, visual match, context match, position match.
- 📈 **Selector Learning**: Track success rates, top selectors, patterns per domain.

### Testing
- 🧪 **E2E Testing**: 22 assertion types (element, text, intent, component, URL, cookie, storage, network, visual, performance, accessibility).
- 📊 **Test Reports**: Comprehensive HTML (dark theme) + JSON reports with metrics.
- 🔄 **Failure Analysis Loop**: Test → fail → debug (network/console/errors) → fix → retest.

### Browser Automation
- 🔄 **Self-Healing**: 8 strategies + history learning.
- 🔌 **Network Capture**: Intercept and log HTTP requests/responses.
- 📟 **Console & Error Capture**: Auto-capture browser console logs and JS runtime errors.
- 💉 **Script Injection**: Inject JavaScript before page load for mocking/testing.
- 🍪 **Cookie/Storage Management**: Setup and verify app state (cookies, localStorage).
- 🔦 **Element Highlight**: Visual debugging with colored outlines.
- ⌨️ **Input Manager**: Mouse, keyboard, dialog handling, frame switching.
- 📁 **File Manager**: Download, upload, PDF export.

### Session & Security
- 💾 **Session Memory**: Persistent patterns, selectors, flows, errors, performance.
- 🧠 **Memory Learning**: Learn from success/failure, predict next actions, suggest fixes.
- 👥 **Multi-Browser**: Pool management, warmup, parallel execution, idle cleanup.
- 🔒 **Security Manager**: Domain allowlisting, offline mode, headers, credentials, output truncation.
- 💾 **Session Manager**: Idle timeout, auto-save, state expiration, encryption (AES-256).

### Infrastructure
- 📊 **Dashboard**: Real-time semantic analysis monitoring with SSE (port 4848).
- 🎯 **General Planner**: Pattern matching for navigation, auth, search, purchase tasks.
- 🔄 **Flow Templates**: Built-in templates for login, registration, checkout, search.

---

## 📄 License

MIT © [BrowserIR](https://github.com/sukirman1901/BrowserIR)