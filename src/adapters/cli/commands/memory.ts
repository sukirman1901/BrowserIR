// bir/src/adapters/cli/commands/memory.ts
import { Command } from 'commander'
import { RPCClient } from '../../../daemon/transport.js'

export function memoryCommand(program: Command): void {
  const memory = program.command('memory').description('Manage website knowledge')

  memory
    .command('recall <domain>')
    .description('Recall learned knowledge for a domain')
    .action(async (domain: string) => {
      const client = new RPCClient()
      try {
        await client.connect()
        const entry = await client.call('memory.recall', { domain })
        if (!entry) {
          console.log(`No knowledge found for ${domain}`)
          return
        }
        const e = entry as any
        console.log(`Domain: ${e.domain}`)
        console.log(`Visits: ${e.visitCount}`)
        console.log(`Confidence: ${(e.confidence * 100).toFixed(0)}%`)
        if (e.knowledge?.purpose) console.log(`Purpose: ${e.knowledge.purpose}`)
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })

  memory
    .command('store <domain> <ir-file>')
    .description('Store IR knowledge for a domain')
    .action(async (domain: string, irFile: string) => {
      const { readFileSync } = await import('fs')
      const client = new RPCClient()
      try {
        const ir = JSON.parse(readFileSync(irFile, 'utf-8'))
        await client.connect()
        await client.call('memory.store', { domain, ir })
        console.log(`Stored knowledge for ${domain}`)
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
      } finally {
        await client.disconnect()
      }
    })
}
