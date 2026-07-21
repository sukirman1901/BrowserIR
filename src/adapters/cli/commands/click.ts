import { RPCClient } from '../../../daemon/transport.js'

export async function clickCommand(ref: string) {
  const client = new RPCClient()

  try {
    await client.connect()
    await client.call('click', { ref })
    console.log(`Clicked ${ref}`)
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.disconnect()
  }
}
