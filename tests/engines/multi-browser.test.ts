// bir/tests/engines/multi-browser.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MultiBrowserEngine } from '../../src/engines/multi-browser.js'

describe('MultiBrowserEngine', () => {
  let multi: MultiBrowserEngine

  beforeEach(() => {
    multi = new MultiBrowserEngine({ maxConcurrent: 3 })
  })

  it('should create and destroy sessions', async () => {
    const id = await multi.createSession()
    expect(id).toBeDefined()
    const sessions = await multi.getSessions()
    expect(sessions.length).toBe(1)
    await multi.destroySession(id)
    expect((await multi.getSessions()).length).toBe(0)
  })

  it('should enforce max concurrent sessions', async () => {
    await multi.createSession()
    await multi.createSession()
    await multi.createSession()
    await expect(multi.createSession()).rejects.toThrow('Max concurrent sessions reached')
  })

  it('should execute parallel tasks', async () => {
    const task = {
      id: 't1',
      tabs: [
        { sessionId: await multi.createSession(), goal: 'Tab 1' },
        { sessionId: await multi.createSession(), goal: 'Tab 2' }
      ],
      coordination: 'parallel' as const
    }
    const result = await multi.executeMultiTab(task)
    expect(result.results.length).toBe(2)
  })
})
