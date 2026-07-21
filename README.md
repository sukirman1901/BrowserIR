# BrowserIR

Semantic browser understanding engine for AI agents.

[![CI](https://github.com/browserir/browserir/actions/workflows/ci.yml/badge.svg)](https://github.com/browserir/browserir/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is BrowserIR?

BrowserIR compiles web pages into **semantic intermediate representations (IR)** — typed structures that AI can reason about.

Unlike browser automation tools (Playwright, Puppeteer) that control browsers, BrowserIR **understands** pages:

```
Raw HTML → BrowserIR → Semantic Tree (sections, components, intent, flow, risk)
```

## Installation

```bash
npm install @browserir/core
```

## Quick Start

### Start daemon

```bash
bir daemon start
```

### Explain a page

```bash
bir explain https://example.com
```

### MCP Tools (29 tools)

```json
{
  "mcpServers": {
    "bir": {
      "command": "node",
      "args": ["dist/adapters/mcp/index.js"]
    }
  }
}
```

## Features

- **Semantic Analysis** — Understands page purpose, not just DOM
- **Intent Recognition** — Classifies page type (auth, purchase, search, etc.)
- **Risk Assessment** — Warns about destructive actions
- **Flow Detection** — Identifies multi-step processes
- **Memory System** — Learns from past interactions
- **Self-Healing** — Automatically fixes broken selectors
- **Multi-Browser** — Coordinates multiple tabs/sessions
- **Agent Coordination** — Multiple AI agents can work together

## Documentation

- [AGENTS.md](AGENTS.md) — AI agent guide
- [API Reference](docs/api/README.md) — REST API documentation
- [OpenAPI Spec](docs/api/openapi.yaml) — OpenAPI 3.0 specification

## Configuration

BrowserIR can be configured via environment variables or config file.

### Environment Variables

```bash
BIR_WS_PORT=3080
BIR_REST_PORT=3081
BIR_DB_PATH=:memory:
BIR_API_KEY=your-api-key
BIR_LOG_LEVEL=info
```

### Config File

```json
{
  "wsPort": 3080,
  "restPort": 3081,
  "dbPath": "./data/bir.db",
  "apiKey": null,
  "logLevel": "info"
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

## License

MIT