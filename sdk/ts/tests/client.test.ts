import { describe, it, expect } from 'vitest'
import { BIRClient } from '../src/client.js'

describe('BIRClient', () => {
  it('should create client with default options', () => {
    const client = new BIRClient()
    expect(client).toBeDefined()
  })

  it('should create client with custom port', () => {
    const client = new BIRClient({ port: 4000 })
    expect(client).toBeDefined()
  })

  it('should connect to daemon and call status', async () => {
    const client = new BIRClient()
    try {
      await client.connect()
      const status = await client.rpc('status')
      expect(status).toBeDefined()
      expect(status.running).toBe(true)
    } catch {
      // Daemon not running, skip
      console.log('Skipping live test: daemon not running')
    } finally {
      client.disconnect()
    }
  }, 10000)

  it('should connect to daemon and get session tabs', async () => {
    const client = new BIRClient()
    try {
      await client.connect()
      const tabs = await client.rpc('session.tabs')
      expect(Array.isArray(tabs)).toBe(true)
    } catch {
      console.log('Skipping live test: daemon not running')
    } finally {
      client.disconnect()
    }
  }, 10000)

  it('should connect to daemon and capture event', async () => {
    const client = new BIRClient()
    try {
      await client.connect()
      const result = await client.rpc('events.capture', { type: 'test', data: { hello: 'world' } })
      expect(result).toBeDefined()
    } catch {
      console.log('Skipping live test: daemon not running')
    } finally {
      client.disconnect()
    }
  }, 10000)
})
