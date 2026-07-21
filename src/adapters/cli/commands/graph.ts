import { RPCClient } from '../../../daemon/transport.js'
import type { BrowserIR } from '../../../ir/types.js'

function formatGraph(ir: BrowserIR): string {
  const lines: string[] = []
  lines.push(`Page: ${ir.page.title}`)
  lines.push(`Intent: ${ir.page.intent.primary}`)
  lines.push('')

  for (const section of ir.page.sections) {
    lines.push(`├── [${section.role}] ${section.label} (${section.intent})`)
    for (const comp of section.components) {
      const last = comp === section.components[section.components.length - 1]
      const prefix = last ? '└──' : '├──'
      const state = comp.state.enabled ? '' : ' DISABLED'
      lines.push(`│   ${prefix} ${comp.label} (${comp.type}${state}) [${comp.id}]`)
    }
  }

  return lines.join('\n')
}

export async function graphCommand(url: string, options: { json?: boolean }) {
  const client = new RPCClient()

  try {
    await client.connect()
    console.log(`Navigating to ${url}...`)
    await client.call('navigate', { url })
    console.log('Analyzing structure...')
    const ir = (await client.call('explain')) as BrowserIR

    if (options.json) {
      console.log(JSON.stringify(ir.page.sections, null, 2))
    } else {
      console.log(formatGraph(ir))
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.disconnect()
  }
}
