#!/usr/bin/env node

import { Command } from 'commander'
import { explainCommand } from './commands/explain.js'
import { statusCommand } from './commands/status.js'
import { clickCommand } from './commands/click.js'
import { graphCommand } from './commands/graph.js'
import { diffCommand } from './commands/diff.js'
import { memoryCommand } from './commands/memory.js'
import { testCommand } from './commands/test.js'

const program = new Command()

program
  .name('bir')
  .description('Browser Intelligence Runtime CLI')
  .version('0.1.0')

program
  .command('explain [url]')
  .description('Analyze a page and return BrowserIR')
  .option('--json', 'Output raw JSON')
  .action(async (url: string | undefined, options: { json?: boolean }) => {
    if (!url) {
      console.error('Error: URL required')
      process.exit(1)
    }
    await explainCommand(url, options)
  })

program
  .command('status')
  .description('Check browserd status')
  .action(statusCommand)

program
  .command('click <ref>')
  .description('Click a component by its BrowserIR ref (e.g., "@e3")')
  .action(clickCommand)

program
  .command('graph <url>')
  .description('Show page structure as a tree graph')
  .option('--json', 'Output raw JSON')
  .action(graphCommand)

program
  .command('diff <before.json> <after.json>')
  .description('Compare two BrowserIR snapshots')
  .action(diffCommand)

memoryCommand(program)

program
  .command('test <test-file>')
  .description('Run E2E tests from JSON file')
  .option('--url <url>', 'Override base URL')
  .action(testCommand)

program.parse()
