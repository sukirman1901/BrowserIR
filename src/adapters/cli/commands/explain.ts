import { RPCClient } from '../../../daemon/transport.js'
import type { BrowserIR, ExplainResult } from '../../../ir/types.js'

function formatExplain(ir: BrowserIR): string {
  const lines: string[] = []

  lines.push('')
  lines.push('Semantic Analysis Complete')
  lines.push('')

  // Page info
  lines.push(`Page: ${ir.page.title}`)
  lines.push(`URL: ${ir.page.url}`)
  lines.push(`Intent: ${ir.page.intent.primary} (${ir.page.intent.category})`)
  lines.push('')

  // Components
  lines.push('Components:')
  for (const section of ir.page.sections) {
    lines.push(`  [${section.role}] ${section.label}`)
    for (const comp of section.components) {
      const stateStr = comp.state.enabled ? '' : ', DISABLED'
      const refStr = comp.id
      lines.push(`    - ${comp.label} (${comp.type}${stateStr}) [${refStr}]`)
    }
  }
  lines.push('')

  // Actions
  if (ir.page.intent.actions.length > 0) {
    lines.push('Actions:')
    for (const action of ir.page.intent.actions) {
      const status = action.enabled ? 'enabled' : 'DISABLED'
      lines.push(`  - ${action.label} [${action.type}] (${status})`)
    }
    lines.push('')
  }

  // Flow
  if (ir.page.intent.flow.length > 0) {
    lines.push('Flow:')
    for (const step of ir.page.intent.flow) {
      lines.push(`  ${step.order}. ${step.action}${step.required ? ' (required)' : ''}`)
    }
    lines.push('')
  }

  // Risks
  if (ir.page.intent.risk.length > 0) {
    lines.push('Risks:')
    for (const risk of ir.page.intent.risk) {
      lines.push(`  ⚠ [${risk.severity}] ${risk.description}`)
    }
    lines.push('')
  }

  // Metadata
  lines.push('Metadata:')
  lines.push(`  Framework: ${ir.page.metadata.framework || 'unknown'}`)
  lines.push(`  A11y Tree: ${ir.page.metadata.hasAccessibilityTree ? 'yes' : 'no'}`)
  lines.push(`  React Fiber: ${ir.page.metadata.hasReactFiber ? 'yes' : 'no'}`)
  lines.push(`  DOM Size: ${ir.page.metadata.domSize} nodes`)
  lines.push(`  IR Hash: ${ir.snapshot.irHash}`)
  lines.push('')

  return lines.join('\n')
}

export async function explainCommand(url: string, options: { json?: boolean }) {
  const client = new RPCClient()

  try {
    await client.connect()

    // Ensure session is started
    await client.call('start', {}).catch(() => {})

    // Navigate
    console.log(`Navigating to ${url}...`)
    await client.call('navigate', { url })

    // Explain
    console.log('Analyzing page...')
    const ir = (await client.call('explain')) as BrowserIR

    if (options.json) {
      console.log(JSON.stringify(ir, null, 2))
    } else {
      console.log(formatExplain(ir))
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await client.disconnect()
  }
}
