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

## MCP Tools (29 tools)

### Core Navigation & Analysis
| Tool | Description |
|------|-------------|
| `bir_navigate` | Navigate to URL and return status |
| `bir_explain` | Analyze page and return semantic BrowserIR |
| `bir_click` | Click element by ref (@e1, @e2, ...) |
| `bir_screenshot` | Take screenshot of current page |
| `bir_graph` | Get page structure as tree graph |
| `bir_tabs` | List all browser tabs |
| `bir_status` | Check daemon status |

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

## CLI Commands

```bash
bir explain [url]              # Get semantic IR
bir click @e3                  # Click element by ref
bir screenshot                 # Take screenshot
bir graph <url>                # Show page structure as tree
bir diff <before.json> <after.json>   # Compare IRs
bir memory recall <domain>     # Recall knowledge
bir memory store <json>        # Store knowledge
bir flow detect [url]          # Detect flows
bir status                     # Check daemon status
```

## Workflow

### Step 1: Start daemon (if not running)
```bash
bir daemon start
```

### Step 2: Analyze page
```bash
bir explain https://example.com
```

This returns BrowserIR with:
- `sections` — Semantic page structure
- `intent` — What the page is for
- `components` — Interactive elements with refs
- `risk` — Risk assessment
- `flow` — Multi-step flow if detected

### Step 3: Interact using refs
```bash
bir click @e5  # Click element with ref @e5
bir explain     # Re-analyze after interaction
```

### Step 4: Use memory
```bash
# Store what you learned
bir memory store '{"domain":"shop.com","commonFlows":["browse","cart","checkout"]}'

# Recall later
bir memory recall shop.com
```

### Step 5: Compare versions
```bash
bir diff compare before.json after.json
```

### Step 6: Self-healing (if selector breaks)
```bash
bir heal.find --selector "button.submit" --intent "submit form" --ir <current-ir>
# Returns: new working selector with semantic match
```

### Step 7: Multi-browser testing
```bash
bir multi.createSession
bir multi.execute --task '{"tabs":[{"url":"..."},...]}'
bir multi.sessions
```

### Step 8: Agent coordination
```bash
bir agent.register --id "agent-1" --name "tester" --role "primary" --sessionId "..."
bir agent.claim --agentId "agent-1" --type "click" --target "@e5"
bir agent.graph  # See who's working on what
```

## Tips

1. **Always start with `bir explain`** — get the IR before any action
2. **Use refs, not CSS** — `@e5` is deterministic, CSS selectors break
3. **Check intent** — understand what the page is for
4. **Check risks** — BrowserIR warns about destructive actions
5. **Use memory** — store and recall patterns
6. **Use flow** — detect multi-step processes
7. **Use diff** — compare page versions
8. **Use heal** — fix broken selectors automatically
9. **Use multi** — test across multiple tabs
10. **Use agent** — coordinate multiple AI agents

## Integration with Other Skills

### browser-smoke (Visual Testing)
```bash
# browser-smoke for screenshots
browser_screenshot

# BrowserIR for semantic understanding
bir explain

# Combine for comprehensive testing
```

### cybersec (Security Testing)
```bash
# BrowserIR for intent analysis
bir explain https://target.com/login

# Check if page has security concerns
# (intent.category = 'authentication', risk includes 'credentials')
```

## Common Patterns

### Login Flow Analysis
```bash
bir explain https://example.com/login
# Check: intent.category = 'authentication'
# Check: risk includes 'credentials'
# Components: email field, password field, submit button
```

### Checkout Flow Detection
```bash
bir flow detect https://example.com/checkout
# Returns: multi-step flow with steps, required, estimatedDuration
```

### Page Comparison
```bash
bir explain http://localhost:3000 > v1.json
# ... make changes ...
bir explain http://localhost:3000 > v2.json
bir diff compare v1.json v2.json
# Returns: semantic, structural, state, intent diffs
```

### Multi-Agent Coordination
```bash
bir agent.register --id "tester" --name "tester" --role "primary" --sessionId "..."
bir agent.claim --agentId "tester" --type "test_login"
bir agent.graph  # See who's working on what
```

### Self-Healing Broken Selectors
```bash
# Original selector broke after UI update
bir explain http://localhost:3000/login  # Get fresh IR
bir heal.find --selector "button.submit" --intent "submit form" --ir <ir>
# Returns: new semantic selector that matches intent
```

## Troubleshooting

### Daemon not running
```bash
bir status  # Check if daemon is running
bir daemon start  # Start if not
```

### No elements found
```bash
bir explain  # Check if page loaded
bir screenshot  # Visual check
```

### Ref not found
```bash
bir explain  # Refresh refs after navigation
bir click @e5  # Use fresh ref
```

### Selector broken
```bash
bir heal.find --selector "old-selector" --intent "what it does" --ir <current-ir>
# Get new working selector
```
