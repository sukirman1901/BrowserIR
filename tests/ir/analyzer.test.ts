import { describe, it, expect } from 'vitest'
import { SemanticAnalyzer, AnalyzerOptions } from '../../src/ir/analyzer.js'

describe('SemanticAnalyzer', () => {
  const analyzer = new SemanticAnalyzer()

  it('should analyze a login page', () => {
    const options: AnalyzerOptions = {
      url: 'https://example.com/login',
      title: 'Login - Example',
      a11y: {
        role: 'Root',
        name: '',
        children: [
          {
            role: 'navigation',
            name: 'Main Navigation',
            children: [
              { role: 'link', name: 'Home', children: [], states: [] },
              { role: 'link', name: 'Login', children: [], states: [] },
            ],
            states: [],
          },
          {
            role: 'main',
            name: 'Login Form',
            children: [
              {
                role: 'textbox',
                name: 'Email',
                children: [],
                states: [],
              },
              {
                role: 'textbox',
                name: 'Password',
                children: [],
                states: [],
              },
              {
                role: 'button',
                name: 'Sign In',
                children: [],
                states: [],
              },
            ],
            states: [],
          },
        ],
      },
    }

    const result = analyzer.analyze(options)

    expect(result.version).toBe('0.1')
    expect(result.page.url).toBe('https://example.com/login')
    expect(result.page.title).toBe('Login - Example')
    expect(result.page.intent.category).toBe('authentication')
    expect(result.page.sections.length).toBeGreaterThan(0)

    // Should have navigation and form sections
    const roles = result.page.sections.map((s) => s.role)
    expect(roles).toContain('navigation')
    expect(roles).toContain('form')
  })

  it('should analyze a checkout page', () => {
    const options: AnalyzerOptions = {
      url: 'https://stripe.com/checkout',
      title: 'Checkout - Stripe',
      a11y: {
        role: 'Root',
        name: '',
        children: [
          {
            role: 'main',
            name: 'Checkout',
            children: [
              {
                role: 'form',
                name: 'Payment Form',
                children: [
                  { role: 'textbox', name: 'Card number', children: [], states: [] },
                  { role: 'textbox', name: 'Expiry', children: [], states: [] },
                  { role: 'textbox', name: 'CVC', children: [], states: [] },
                  { role: 'button', name: 'Pay $99.99', children: [], states: [] },
                ],
                states: [],
              },
            ],
            states: [],
          },
        ],
      },
    }

    const result = analyzer.analyze(options)

    expect(result.page.intent.primary).toBe('checkout')
    expect(result.page.intent.category).toBe('purchase')

    // Find the payment form section
    const formSection = result.page.sections.find((s) => s.role === 'form')
    expect(formSection).toBeDefined()
    expect(formSection!.intent).toBe('purchase')
    expect(formSection!.components.length).toBe(4)
  })

  it('should handle empty a11y tree', () => {
    const options: AnalyzerOptions = {
      url: 'https://example.com',
      title: 'Example',
    }

    const result = analyzer.analyze(options)

    expect(result.version).toBe('0.1')
    expect(result.page.sections).toBeDefined()
    expect(result.snapshot.irHash).toBeDefined()
  })

  it('should generate unique component IDs', () => {
    const options: AnalyzerOptions = {
      url: 'https://example.com',
      title: 'Test',
      a11y: {
        role: 'Root',
        name: '',
        children: [
          {
            role: 'main',
            name: 'Content',
            children: [
              { role: 'button', name: 'Button 1', children: [], states: [] },
              { role: 'button', name: 'Button 2', children: [], states: [] },
              { role: 'button', name: 'Button 3', children: [], states: [] },
            ],
            states: [],
          },
        ],
      },
    }

    const result = analyzer.analyze(options)
    const allIds = result.page.sections.flatMap((s) =>
      s.components.map((c) => c.id)
    )

    // All IDs should be unique
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('should detect form intent from URL', () => {
    const options: AnalyzerOptions = {
      url: 'https://example.com/checkout/payment',
      title: 'Payment',
    }

    const result = analyzer.analyze(options)

    expect(result.page.intent.category).toBe('purchase')
  })
})
