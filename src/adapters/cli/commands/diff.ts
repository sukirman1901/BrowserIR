import { readFileSync } from 'fs'
import { RPCClient } from '../../../daemon/transport.js'
import type { BrowserIR } from '../../../ir/types.js'

export async function diffCommand(beforePath: string, afterPath: string) {
  const client = new RPCClient()

  try {
    const beforeJson = readFileSync(beforePath, 'utf-8')
    const afterJson = readFileSync(afterPath, 'utf-8')
    const irBefore = JSON.parse(beforeJson) as BrowserIR
    const irAfter = JSON.parse(afterJson) as BrowserIR

    await client.connect()
    console.log('Comparing IRs...')
    const result = await client.call('diff.compare', { irBefore, irAfter })

    const diff = result as { summary: string; changes: any[]; semanticDelta: number }
    console.log('')
    console.log('Diff Result:')
    console.log(`  Summary: ${diff.summary}`)
    console.log(`  Semantic Delta: ${(diff.semanticDelta * 100).toFixed(1)}%`)
    console.log(`  Changes: ${diff.changes.length}`)
    console.log('')

    for (const change of diff.changes) {
      const label = change.target?.label || change.target?.id || 'unknown'
      console.log(`  [${change.type.toUpperCase()}] ${label}`)
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.disconnect()
  }
}
