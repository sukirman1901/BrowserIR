// bir/src/db/schema.ts
export const SCHEMA_SQL = `
-- Phase 0
CREATE TABLE IF NOT EXISTS snapshots (
  hash TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  ir TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Phase 1
CREATE TABLE IF NOT EXISTS knowledge (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  url_pattern TEXT NOT NULL,
  knowledge TEXT NOT NULL,
  ir_hash TEXT,
  patterns TEXT DEFAULT '[]',
  selectors TEXT DEFAULT '[]',
  flows TEXT DEFAULT '[]',
  errors TEXT DEFAULT '[]',
  performance TEXT DEFAULT '[]',
  confidence REAL DEFAULT 0.5,
  visit_count INTEGER DEFAULT 1,
  last_visit INTEGER NOT NULL,
  first_visit INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS diffs (
  id TEXT PRIMARY KEY,
  hash_before TEXT NOT NULL,
  hash_after TEXT NOT NULL,
  changes TEXT NOT NULL,
  semantic_delta REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  target TEXT,
  data TEXT NOT NULL,
  ir_hash TEXT,
  timestamp INTEGER NOT NULL
);

-- Phase 2
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  steps TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  confidence REAL DEFAULT 0.5,
  last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  properties TEXT NOT NULL,
  embedding BLOB
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  target TEXT NOT NULL,
  type TEXT NOT NULL,
  weight REAL DEFAULT 0.5,
  evidence TEXT,
  FOREIGN KEY (source) REFERENCES knowledge_nodes(id),
  FOREIGN KEY (target) REFERENCES knowledge_nodes(id)
);

-- Phase 3a
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  goal TEXT NOT NULL,
  steps TEXT NOT NULL,
  status TEXT NOT NULL,
  context TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Phase 3b: Multi-Agent Persistence
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  last_action TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_actions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target TEXT,
  value TEXT,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Phase 4: Session Memory
CREATE TABLE IF NOT EXISTS session_memory (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  url_pattern TEXT NOT NULL,
  intent TEXT NOT NULL,
  components TEXT NOT NULL,
  flows TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  visit_count INTEGER DEFAULT 1,
  last_visit INTEGER NOT NULL,
  first_visit INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_snapshots (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  ir TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

-- Selector History for Self-Healing
CREATE TABLE IF NOT EXISTS selector_history (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  original_selector TEXT NOT NULL,
  healed_selector TEXT NOT NULL,
  method TEXT NOT NULL,
  success INTEGER NOT NULL,
  timestamp INTEGER NOT NULL
);
`;

export const INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_knowledge_domain ON knowledge(domain);
CREATE INDEX IF NOT EXISTS idx_knowledge_url ON knowledge(url_pattern);
CREATE INDEX IF NOT EXISTS idx_diffs_before ON diffs(hash_before);
CREATE INDEX IF NOT EXISTS idx_diffs_after ON diffs(hash_after);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_flows_domain ON flows(domain);
CREATE INDEX IF NOT EXISTS idx_flows_frequency ON flows(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_label ON knowledge_nodes(label);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_source ON knowledge_edges(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_target ON knowledge_edges(target);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_type ON knowledge_edges(type);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_goal ON plans(goal);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_agents_session ON agents(session_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_type ON agent_actions(type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_timestamp ON agent_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_memory_domain ON session_memory(domain);
CREATE INDEX IF NOT EXISTS idx_session_snapshots_domain ON session_snapshots(domain);
CREATE INDEX IF NOT EXISTS idx_selector_history_original ON selector_history(original_selector);
`;
