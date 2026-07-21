import type { BIRPlugin, PluginContext, EngineDefinition, HealingStrategy, MCPToolDefinition } from './types.js'
import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'

export class PluginLoader {
  private plugins = new Map<string, BIRPlugin>()

  async load(plugin: BIRPlugin, context?: PluginContext): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' already loaded`)
    }

    if (plugin.onInit && context) {
      await plugin.onInit(context)
    }

    this.plugins.set(plugin.name, plugin)
  }

  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (plugin?.onDestroy) await plugin.onDestroy()
    this.plugins.delete(name)
  }

  get(name: string): BIRPlugin | null {
    return this.plugins.get(name) || null
  }

  list(): BIRPlugin[] {
    return Array.from(this.plugins.values())
  }

  getAllEngines(): EngineDefinition[] {
    return this.list().flatMap(p => p.engines || [])
  }

  getAllHealingStrategies(): HealingStrategy[] {
    return this.list().flatMap(p => p.healingStrategies || [])
  }

  getAllMCPTools(): MCPToolDefinition[] {
    return this.list().flatMap(p => p.mcpTools || [])
  }

  async discoverFromDir(dir: string, context?: PluginContext): Promise<string[]> {
    const loaded: string[] = []
    try {
      const entries = await readdir(dir)
      for (const entry of entries) {
        const entryPath = join(dir, entry)
        const entryStat = await stat(entryPath)
        if (!entryStat.isDirectory()) continue

        try {
          const pkgPath = join(entryPath, 'package.json')
          const pkgStat = await stat(pkgPath)
          if (!pkgStat.isFile()) continue

          const { default: pkg } = await import(pkgPath, { with: { type: 'json' } })
          if (!pkg['bir-plugin']) continue

          const pluginPath = resolve(entryPath, pkg['bir-plugin'].entry || './index.js')
          const { default: pluginFactory } = await import(pluginPath)
          const plugin: BIRPlugin = typeof pluginFactory === 'function'
            ? pluginFactory()
            : pluginFactory

          await this.load(plugin, context)
          loaded.push(plugin.name)
        } catch {
          // Skip plugins that fail to load
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
    return loaded
  }

  async discoverFromNodeModules(context?: PluginContext): Promise<string[]> {
    const cwd = process.cwd()
    const loaded: string[] = []

    // Try scoped plugins: @bir/*
    try {
      const scopedDir = join(cwd, 'node_modules', '@bir')
      loaded.push(...await this.discoverFromDir(scopedDir, context))
    } catch {}

    // Try unscoped plugins: bir-plugin-*
    try {
      const modulesDir = join(cwd, 'node_modules')
      const entries = await readdir(modulesDir)
      for (const entry of entries) {
        if (!entry.startsWith('bir-plugin-')) continue
        const entryPath = join(modulesDir, entry)
        try {
          loaded.push(...await this.discoverFromDir(join(cwd, 'node_modules'), context))
          break
        } catch {}
      }
    } catch {}

    return loaded
  }
}
