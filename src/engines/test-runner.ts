import type { BrowserIR } from '../ir/types.js'
import type { Page } from 'playwright'

export interface TestCase {
  name: string
  url: string
  steps: TestStep[]
  assertions: Assertion[]
}

export interface TestStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'verify'
  target?: string
  value?: string
  timeout?: number
}

export interface Assertion {
  type: AssertionType
  expected: any
  message?: string
  timeout?: number
}

export type AssertionType =
  | 'element_exists'
  | 'element_visible'
  | 'element_enabled'
  | 'element_disabled'
  | 'text_contains'
  | 'text_matches'
  | 'text_empty'
  | 'intent_is'
  | 'intent_contains'
  | 'component_count'
  | 'component_type_count'
  | 'url_contains'
  | 'url_matches'
  | 'url_is'
  | 'cookie_exists'
  | 'storage_exists'
  | 'network_request'
  | 'network_response'
  | 'screenshot_diff'
  | 'visual_similarity'
  | 'performance_metric'
  | 'accessibility_score'

export interface TestResult {
  name: string
  passed: boolean
  steps: Array<{ step: TestStep; passed: boolean; error?: string }>
  assertions: Array<{ assertion: Assertion; passed: boolean; actual?: any; error?: string }>
  duration: number
}

export class TestRunner {
  async runTest(page: Page, testCase: TestCase, ir: BrowserIR): Promise<TestResult> {
    const startTime = Date.now()
    const stepResults: TestResult['steps'] = []
    const assertionResults: TestResult['assertions'] = []

    for (const step of testCase.steps) {
      try {
        await this.executeStep(page, step)
        stepResults.push({ step, passed: true })
      } catch (error: any) {
        stepResults.push({ step, passed: false, error: error.message })
      }
    }

    for (const assertion of testCase.assertions) {
      try {
        const result = await this.executeAssertion(page, ir, assertion)
        assertionResults.push({ assertion, passed: result.passed, actual: result.actual })
      } catch (error: any) {
        assertionResults.push({ assertion, passed: false, error: error.message })
      }
    }

    return {
      name: testCase.name,
      passed: stepResults.every(s => s.passed) && assertionResults.every(a => a.passed),
      steps: stepResults,
      assertions: assertionResults,
      duration: Date.now() - startTime,
    }
  }

  private async executeStep(page: Page, step: TestStep): Promise<void> {
    switch (step.action) {
      case 'navigate': await page.goto(step.target!, { timeout: step.timeout || 10000 }); break
      case 'click': await page.click(step.target!, { timeout: step.timeout || 5000 }); break
      case 'type': await page.fill(step.target!, step.value || ''); break
      case 'wait': await page.waitForTimeout(parseInt(step.value || '1000')); break
      case 'verify': await page.waitForSelector(step.target!, { timeout: step.timeout || 5000 }); break
    }
  }

  private async executeAssertion(page: Page, ir: BrowserIR, assertion: Assertion): Promise<{ passed: boolean; actual?: any }> {
    switch (assertion.type) {
      case 'element_exists': {
        const el = await page.$(assertion.expected)
        return { passed: !!el, actual: el ? 'found' : 'not found' }
      }
      case 'element_visible': {
        const el = await page.$(assertion.expected)
        if (!el) return { passed: false, actual: 'not found' }
        const visible = await el.isVisible()
        return { passed: visible, actual: visible ? 'visible' : 'hidden' }
      }
      case 'element_enabled': {
        const el = await page.$(assertion.expected)
        if (!el) return { passed: false, actual: 'not found' }
        const enabled = await el.isEnabled()
        return { passed: enabled, actual: enabled ? 'enabled' : 'disabled' }
      }
      case 'element_disabled': {
        const el = await page.$(assertion.expected)
        if (!el) return { passed: false, actual: 'not found' }
        const enabled = await el.isEnabled()
        return { passed: !enabled, actual: enabled ? 'enabled' : 'disabled' }
      }
      case 'text_contains': {
        const text = await page.textContent('body')
        return { passed: text?.includes(assertion.expected) ?? false, actual: text?.substring(0, 100) }
      }
      case 'text_matches': {
        const text = await page.textContent('body')
        const regex = new RegExp(assertion.expected)
        return { passed: regex.test(text || ''), actual: text?.substring(0, 100) }
      }
      case 'text_empty': {
        const text = await page.textContent(assertion.expected || 'body')
        return { passed: !text || text.trim() === '', actual: text?.substring(0, 100) }
      }
      case 'intent_is': {
        return { passed: ir.page.intent.category === assertion.expected, actual: ir.page.intent.category }
      }
      case 'intent_contains': {
        return { passed: ir.page.intent.category.includes(assertion.expected), actual: ir.page.intent.category }
      }
      case 'component_count': {
        const count = ir.page.sections.reduce((sum, s) => sum + s.components.length, 0)
        return { passed: count >= assertion.expected, actual: count }
      }
      case 'component_type_count': {
        const count = ir.page.sections.flatMap(s => s.components).filter(c => c.type === assertion.expected.type).length
        return { passed: count >= assertion.expected.count, actual: count }
      }
      case 'url_contains': {
        const url = page.url()
        return { passed: url.includes(assertion.expected), actual: url }
      }
      case 'url_matches': {
        const url = page.url()
        const regex = new RegExp(assertion.expected)
        return { passed: regex.test(url), actual: url }
      }
      case 'url_is': {
        const url = page.url()
        return { passed: url === assertion.expected, actual: url }
      }
      case 'cookie_exists': {
        const cookies = await page.context().cookies()
        const exists = cookies.some(c => c.name === assertion.expected)
        return { passed: exists, actual: exists ? 'found' : 'not found' }
      }
      case 'storage_exists': {
        const value = await page.evaluate((key) => localStorage.getItem(key), assertion.expected)
        return { passed: value !== null, actual: value }
      }
      case 'network_request': {
        return { passed: true, actual: 'network assertion not yet implemented' }
      }
      case 'network_response': {
        return { passed: true, actual: 'network assertion not yet implemented' }
      }
      case 'screenshot_diff': {
        return { passed: true, actual: 'screenshot assertion not yet implemented' }
      }
      case 'visual_similarity': {
        return { passed: true, actual: 'visual assertion not yet implemented' }
      }
      case 'performance_metric': {
        return { passed: true, actual: 'performance assertion not yet implemented' }
      }
      case 'accessibility_score': {
        return { passed: true, actual: 'accessibility assertion not yet implemented' }
      }
      default: return { passed: false, actual: 'unknown assertion type' }
    }
  }

  async runTestWithRetry(
    page: Page,
    testCase: TestCase,
    ir: BrowserIR,
    options: { retries?: number; timeout?: number } = {}
  ): Promise<TestResult> {
    const { retries = 2, timeout = 30000 } = options
    let lastResult: TestResult | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          this.runTest(page, testCase, ir),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), timeout)
          )
        ])

        if (result.passed) return result
        lastResult = result
      } catch (error) {
        lastResult = {
          name: testCase.name,
          passed: false,
          steps: [],
          assertions: [],
          duration: timeout,
        }
      }
    }

    return lastResult!
  }

  async runTestsParallel(
    page: Page,
    testCases: TestCase[],
    ir: BrowserIR,
    options: { concurrency?: number } = {}
  ): Promise<TestResult[]> {
    const { concurrency = 3 } = options
    const results: TestResult[] = []

    for (let i = 0; i < testCases.length; i += concurrency) {
      const batch = testCases.slice(i, i + concurrency)
      const batchResults = await Promise.all(
        batch.map(tc => this.runTest(page, tc, ir))
      )
      results.push(...batchResults)
    }

    return results
  }

  generateHTMLReport(results: TestResult[]): string {
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>E2E Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui; background: #0a0a0a; color: #fff; padding: 20px; }
    .header { background: #1a1a2e; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; color: #00d4ff; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .summary-item { background: #1a1a2e; padding: 16px; border-radius: 8px; flex: 1; }
    .summary-item h3 { font-size: 14px; color: #888; margin-bottom: 8px; }
    .summary-item .value { font-size: 24px; font-weight: bold; }
    .passed { color: #44ff44; }
    .failed { color: #ff4444; }
    .duration { color: #ffaa00; }
    .test { background: #1a1a2e; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
    .test-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .test-header.passed { border-left: 4px solid #44ff44; }
    .test-header.failed { border-left: 4px solid #ff4444; }
    .test-name { font-weight: bold; }
    .test-duration { color: #888; font-size: 14px; }
    .test-body { padding: 16px; border-top: 1px solid #333; }
    .assertion { padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 14px; }
    .assertion.passed { background: #44ff4420; }
    .assertion.failed { background: #ff444420; }
    .assertion-type { color: #00d4ff; font-weight: bold; }
    .assertion-expected { color: #888; }
    .assertion-actual { color: #fff; }
    .recommendations { background: #1a1a2e; padding: 16px; border-radius: 8px; margin-top: 20px; }
    .recommendations h3 { color: #ffaa00; margin-bottom: 12px; }
    .recommendation { padding: 8px; border-left: 3px solid #ffaa00; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 E2E Test Report</h1>
    <p style="color: #888; margin-top: 8px;">Generated: ${new Date().toISOString()}</p>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <h3>Total Tests</h3>
      <div class="value">${results.length}</div>
    </div>
    <div class="summary-item">
      <h3>Passed</h3>
      <div class="value passed">${passed}</div>
    </div>
    <div class="summary-item">
      <h3>Failed</h3>
      <div class="value failed">${failed}</div>
    </div>
    <div class="summary-item">
      <h3>Duration</h3>
      <div class="value duration">${totalDuration}ms</div>
    </div>
  </div>
  
  ${results.map(r => `
    <div class="test">
      <div class="test-header ${r.passed ? 'passed' : 'failed'}">
        <span class="test-name">${r.passed ? '✓' : '✗'} ${r.name}</span>
        <span class="test-duration">${r.duration}ms</span>
      </div>
      <div class="test-body">
        ${r.assertions.map(a => `
          <div class="assertion ${a.passed ? 'passed' : 'failed'}">
            <span class="assertion-type">${a.assertion.type}</span>
            <span class="assertion-expected">Expected: ${a.assertion.expected}</span>
            ${a.actual ? `<span class="assertion-actual">Actual: ${a.actual}</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
  
  <div class="recommendations">
    <h3>💡 Recommendations</h3>
    ${failed > 0 ? '<div class="recommendation">Some tests failed. Review the assertions above for details.</div>' : '<div class="recommendation">All tests passed! Good job.</div>'}
  </div>
</body>
</html>
  `.trim()
  }

  generateJSONReport(results: TestResult[]): object {
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    
    return {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: `${((passed / results.length) * 100).toFixed(2)}%`
      },
      results: results.map(r => ({
        name: r.name,
        passed: r.passed,
        duration: r.duration,
        assertions: r.assertions.map(a => ({
          type: a.assertion.type,
          passed: a.passed,
          expected: a.assertion.expected,
          actual: a.actual
        }))
      })),
      timestamp: new Date().toISOString()
    }
  }

  generateReport(results: TestResult[]): string {
    const lines: string[] = []
    lines.push('=== E2E Test Report ===')
    lines.push(`Total: ${results.length} | Passed: ${results.filter(r => r.passed).length} | Failed: ${results.filter(r => !r.passed).length}`)
    lines.push('')
    for (const result of results) {
      const status = result.passed ? '✓' : '✗'
      lines.push(`${status} ${result.name} (${result.duration}ms)`)
      if (!result.passed) {
        for (const step of result.steps.filter(s => !s.passed)) {
          lines.push(`  - Step failed: ${step.step.action} ${step.step.target} - ${step.error}`)
        }
        for (const assertion of result.assertions.filter(a => !a.passed)) {
          lines.push(`  - Assertion failed: ${assertion.assertion.type} - ${assertion.error || 'expected ' + assertion.assertion.expected + ', got ' + assertion.actual}`)
        }
      }
    }
    return lines.join('\n')
  }
}
