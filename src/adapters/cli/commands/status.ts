import { RPCClient } from '../../../daemon/transport.js'

export async function statusCommand() {
  const client = new RPCClient()

  try {
    await client.connect()
    const status = (await client.call('status')) as {
      running: boolean
      options: Record<string, unknown>
    }

    console.log('')
    console.log('browserd status:')
    console.log(`  Running: ${status.running ? 'yes' : 'no'}`)
    if (status.running) {
      console.log(`  Options: ${JSON.stringify(status.options)}`)
    }
    console.log('')
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.disconnect()
  }
}
