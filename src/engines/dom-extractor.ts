// src/engines/dom-extractor.ts

export interface ClassifiedElements {
  buttons: DOMElement[]
  inputs: DOMElement[]
  links: DOMElement[]
  others: DOMElement[]
  total: number
}

export interface DOMElement {
  tag: string
  text: string
  selector: string
  type: string
  visible: boolean
  enabled: boolean
  rect: { x: number; y: number; width: number; height: number }
}

export function classifyInputs(elements: DOMElement[]): ClassifiedElements {
  const buttons = elements.filter(e => e.tag === 'button' && e.visible && e.enabled)
  const inputs = elements.filter(e => e.tag === 'input' && e.visible)
  const links = elements.filter(e => e.tag === 'a' && e.visible)
  const others = elements.filter(e => !buttons.includes(e) && !inputs.includes(e) && !links.includes(e))
  
  return {
    buttons,
    inputs,
    links,
    others,
    total: elements.length
  }
}

export function guessInputValue(inputEl: DOMElement): string {
  const type = inputEl.type.toLowerCase()
  
  if (type.includes('email')) return 'test@test.com'
  if (type.includes('password') || type.includes('pass')) return 'Test1234!'
  if (type.includes('search')) return 'test search'
  if (type.includes('url')) return 'https://example.com'
  if (type.includes('tel') || type.includes('phone')) return '08123456789'
  if (type.includes('number')) return '123'
  
  return 'test'
}
