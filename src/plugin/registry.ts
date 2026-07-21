import type { BIRPlugin, PluginContext } from './types.js'
import { PluginLoader } from './loader.js'

/**
 * PluginRegistry provides a higher-level interface over PluginLoader
 * for managing plugins in the BIR ecosystem.
 */
export class PluginRegistry {
  private loader: PluginLoader
  private context: PluginContext | null = null

  constructor() {
    this.loader = new PluginLoader()
  }

  setContext(context: PluginContext): void {
    this.context = context
  }

  async register(plugin: BIRPlugin): Promise<void> {
    await this.loader.load(plugin, this.context || undefined)
  }

  async unregister(name: string): Promise<void> {
    await this.loader.unload(name)
  }

  get(name: string): BIRPlugin | null {
    return this.loader.get(name)
  }

  list(): BIRPlugin[] {
    return this.loader.list()
  }

  getEngines() {
    return this.loader.getAllEngines()
  }

  getHealingStrategies() {
    return this.loader.getAllHealingStrategies()
  }

  getMCPTools() {
    return this.loader.getAllMCPTools()
  }

  async discover(dir?: string): Promise<string[]> {
    const context = this.context || undefined
    if (dir) {
      return this.loader.discoverFromDir(dir, context)
    }
    return this.loader.discoverFromNodeModules(context)
  }
}
