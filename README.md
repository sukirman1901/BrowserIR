# BrowserIR (Browser Intelligence Runtime)

> Semantic browser understanding engine for AI agents. Compiles web pages into typed, structured intermediate representations (IR) that AI can reason about.

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

- 🧠 **Semantic Analysis**: Classifies page intent (`authentication`, `purchase`, `search`, etc.).
- 🏷️ **Deterministic Refs (`@e1`, `@e2`)**: Click elements without fragile CSS selectors.
- 🩹 **Self-Healing Selectors**: Automatically repairs broken selectors with 3 strategies (text, role, position) + history learning.
- 💾 **Domain Memory**: Learns domain patterns and stores them in persistent SQLite.
- 👥 **Multi-Agent & Multi-Tab**: Coordinate multiple AI agents on the same page.
- ⚠ **Risk Assessment**: Warns before performing irreversible or sensitive actions.
- 🔄 **Flow Detection**: Detects login, checkout, search, registration flows from page structure.
- 🧪 **E2E Testing**: Run JSON-based test cases with retries, parallel execution, HTML reports.
- 🖼 **Visual Debugging**: Screenshot capture and pixelmatch visual diff comparison.
- 🎯 **General Planner**: Pattern matching for navigation, auth, search, purchase tasks.
- 🔌 **Network Capture**: Intercept and log HTTP requests/responses for debugging.
- 📟 **Console & Error Capture**: Auto-capture browser console logs and JS runtime errors.
- 💉 **Script Injection**: Inject JavaScript before page load for mocking/testing.
- 🍪 **Cookie/Storage Management**: Setup and verify app state (cookies, localStorage).
- 🔦 **Element Highlight**: Visual debugging with colored outlines.
- 🔄 **Failure Analysis Loop**: Test → fail → debug (network/console/errors) → fix → retest.
- 🔒 **Security Manager**: Domain allowlisting, offline mode, headers, credentials.
- ⌨️ **Input Manager**: Mouse, keyboard, dialog handling, frame switching.
- 📁 **File Manager**: Download, upload, PDF export.
- 💾 **Session Manager**: Idle timeout, auto-save, state expiration, encryption.
- 📊 **Dashboard**: Real-time semantic analysis monitoring (port 4848).

---

## 📄 License

MIT © [BrowserIR](https://github.com/sukirman1901/BrowserIR)