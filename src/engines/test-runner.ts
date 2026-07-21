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
  type: 'element_exists' | 'text_contains' | 'intent_is' | 'component_count'
  expected: any
  message?: string
}

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
      case 'text_contains': {
        const text = await page.textContent('body')
        return { passed: text?.includes(assertion.expected) ?? false, actual: text?.substring(0, 100) }
      }
      case 'intent_is': {
        return { passed: ir.page.intent.category === assertion.expected, actual: ir.page.intent.category }
      }
      case 'component_count': {
        const count = ir.page.sections.reduce((sum, s) => sum + s.components.length, 0)
        return { passed: count >= assertion.expected, actual: count }
      }
      default: return { passed: false, actual: 'unknown assertion type' }
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
