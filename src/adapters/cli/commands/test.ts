import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { TestRunner, type TestCase } from '../../../engines/test-runner.js'
import { ExplainEngine } from '../../../engines/explain.js'

export async function testCommand(testFile: string, options: { url?: string }) {
  const content = readFileSync(testFile, 'utf-8')
  const testCases: TestCase[] = JSON.parse(content)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const runner = new TestRunner()
  const explainEngine = new ExplainEngine()
  const results = []
  for (const testCase of testCases) {
    const url = options.url || testCase.url
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    const { ir } = await explainEngine.explain(page)
    const result = await runner.runTest(page, testCase, ir)
    results.push(result)
  }
  console.log(runner.generateReport(results))
  await browser.close()
  process.exit(results.some(r => !r.passed) ? 1 : 0)
}
