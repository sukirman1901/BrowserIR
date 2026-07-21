# BrowserIR Skill

## When to Use

Use this skill when the user wants to:
- **Understand** what a web page is for (intent, purpose, meaning)
- **Analyze** page structure semantically (sections, components, hierarchy)
- **Test** web UIs with semantic understanding
- **Compare** page versions (diff)
- **Learn** about websites (memory)
- **Detect** multi-step flows (checkout, registration, etc.)
- **Coordinate** multiple agents working on the same page
- **Heal** broken selectors automatically
- **Run** multi-browser sessions

## What This Skill Does

BrowserIR compiles web pages into **semantic intermediate representations (IR)** — typed structures that AI can reason about.

### Key Capabilities

1. **Semantic Analysis** — Understands page purpose, not just DOM
2. **Intent Recognition** — Classifies page type (auth, purchase, search, etc.)
3. **Risk Assessment** — Warns about destructive actions
4. **Flow Detection** — Identifies multi-step processes
5. **Memory System** — Learns from past interactions
6. **Evidence Chains** — Explains WHY it thinks something is what it is
7. **Self-Healing** — Automatically fixes broken selectors
8. **Multi-Browser** — Coordinates multiple tabs/sessions
9. **Agent Coordination** — Multiple AI agents can work together

---

## Interfaces (MCP Tools vs CLI Commands)

BrowserIR provides two distinct interfaces depending on how you interact:
- **MCP Tools** (for AI Assistants / LLMs): Functions prefixed with `bir_` (e.g. `bir_explain`, `bir_click`).
- **CLI Commands** (for Terminal / Shell): Command-line subcommands (e.g. `bir explain <url>`, `bir click @e3`).

---

## MCP Tools (30 tools for AI Agents)

### Core Navigation & Analysis
| Tool | Description | Input Schema |
|------|-------------|--------------|
| `bir_navigate` | Navigate to URL in browser | `{ url: string }` |
| `bir_explain` | Analyze page and return semantic BrowserIR | `{ url: string }` |
| `bir_click` | Click element by ref (`@e1`, `@e2`, ...) | `{ ref: string }` |
| `bir_screenshot` | Take screenshot of current page | `{}` |
| `bir_graph` | Get page structure as tree graph | `{ url: string }` |
| `bir_tabs` | List all open browser tabs | `{}` |
| `bir_status` | Check daemon status | `{}` |

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

1. **Always start with `bir_explain` / `bir explain`** — Dapatkan IR sebelum bertindak.
2. **Gunakan Ref (`@e5`), Bukan CSS Selector** — Ref bersifat deterministik dan tahan perubahan UI.
3. **Cek Intent & Risk** — Pahami risiko sebelum mengeksekusi tombol sensitif (seperti hapus data / checkout).
4. **Gunakan Memory & Flow** — Manfaatkan sistem memori untuk mengenali pola alur web yang sering dikunjungi.

---

## Troubleshooting

- **Daemon belum berjalan**: Jalankan `node dist/daemon/server.js` atau `bir daemon start`.
- **Ref tidak ditemukan**: Jalankan `bir_explain` ulang untuk memperbarui daftar ref komponen yang baru dirender.
- **Selector lama rusak**: Gunakan `bir_heal_find` untuk mendapatkan selector pengganti yang sesuai intent.
