// bir/src/daemon/engines.ts
import type Database from 'better-sqlite3'
import { MemoryEngine } from '../engines/memory.js'
import { DiffEngine } from '../engines/diff.js'
import { EventEngine } from '../engines/event.js'
import { SelfHealingEngine } from '../engines/self-healing.js'
import { FlowEngine } from '../engines/flow.js'
import { KnowledgeEngine } from '../engines/knowledge.js'
import { PlannerEngine } from '../engines/planner.js'
import { MultiBrowserEngine } from '../engines/multi-browser.js'
import { AgentCoordinator } from '../engines/agent.js'

/**
 * EngineManager instantiates all 9 engines with a shared database,
 * providing a single entry point for the daemon to access all engine capabilities.
 */
export class EngineManager {
  readonly memory: MemoryEngine
  readonly diff: DiffEngine
  readonly events: EventEngine
  readonly healing: SelfHealingEngine
  readonly flow: FlowEngine
  readonly knowledge: KnowledgeEngine
  readonly planner: PlannerEngine
  readonly multi: MultiBrowserEngine
  readonly agent: AgentCoordinator

  constructor(db: Database.Database) {
    this.memory = new MemoryEngine(db)
    this.diff = new DiffEngine(db)
    this.events = new EventEngine(db)
    this.healing = new SelfHealingEngine(this.memory)
    this.flow = new FlowEngine(db)
    this.knowledge = new KnowledgeEngine(db)
    this.planner = new PlannerEngine(
      db,
      this.memory,
      this.diff,
      this.healing,
      this.events,
      this.flow
    )
    this.multi = new MultiBrowserEngine()
    this.agent = new AgentCoordinator()
  }
}
