import { describe, it, expect } from 'vitest'
import { PluginLoader } from '../../src/plugin/loader.js'
import type { BIRPlugin } from '../../src/plugin/types.js'

const testPlugin: BIRPlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  description: 'A test plugin',
  engines: [{
    name: 'test-engine',
    create: async () => ({ name: 'test-engine', version: '1.0.0' })
  }]
}

const testPluginWithInit: BIRPlugin = {
  name: 'init-plugin',
  version: '1.0.0',
  description: 'Plugin with onInit',
  onInit: async (ctx) => {
    ctx.config.initialized = true
  }
}

describe('PluginLoader', () => {
  it('should load a plugin from object', async () => {
    const loader = new PluginLoader()
    await loader.load(testPlugin)
    expect(loader.get('test-plugin')).toBeDefined()
  })

  it('should list loaded plugins', async () => {
    const loader = new PluginLoader()
    await loader.load(testPlugin)
    const plugins = loader.list()
    expect(plugins.length).toBe(1)
    expect(plugins[0].name).toBe('test-plugin')
  })

  it('should reject duplicate plugin names', async () => {
    const loader = new PluginLoader()
    await loader.load(testPlugin)
    await expect(loader.load(testPlugin)).rejects.toThrow('already loaded')
  })

  it('should unload a plugin', async () => {
    const loader = new PluginLoader()
    await loader.load(testPlugin)
    await loader.unload('test-plugin')
    expect(loader.get('test-plugin')).toBeNull()
  })

  it('should call onInit during load with context', async () => {
    const loader = new PluginLoader()
    const ctx = { db: null, engines: {}, config: {} as Record<string, any> }
    await loader.load(testPluginWithInit, ctx)
    expect(ctx.config.initialized).toBe(true)
  })

  it('should call onDestroy during unload', async () => {
    let destroyed = false
    const plugin: BIRPlugin = {
      name: 'destroy-test',
      version: '1.0.0',
      description: 'Test destroy',
      onDestroy: async () => { destroyed = true }
    }
    const loader = new PluginLoader()
    await loader.load(plugin)
    await loader.unload('destroy-test')
    expect(destroyed).toBe(true)
  })
})
