import type { Page } from 'playwright'

export class ElementHighlight {
  private page: Page
  
  constructor(page: Page) {
    this.page = page
  }
  
  async highlight(selector: string, color: string = 'red', duration: number = 2000): Promise<boolean> {
    try {
      await this.page.evaluate(({ sel, col, dur }) => {
        const el = document.querySelector(sel)
        if (!el) return false
        
        const orig = {
          outline: (el as HTMLElement).style.outline,
          outlineOffset: (el as HTMLElement).style.outlineOffset,
          boxShadow: (el as HTMLElement).style.boxShadow
        }
        
        ;(el as HTMLElement).style.outline = `3px solid ${col}`
        ;(el as HTMLElement).style.outlineOffset = '2px'
        ;(el as HTMLElement).style.boxShadow = `0 0 15px ${col}40`
        
        setTimeout(() => {
          ;(el as HTMLElement).style.outline = orig.outline
          ;(el as HTMLElement).style.outlineOffset = orig.outlineOffset
          ;(el as HTMLElement).style.boxShadow = orig.boxShadow
        }, dur)
        
        return true
      }, { sel: selector, col: color, dur: duration })
      
      return true
    } catch {
      return false
    }
  }
  
  async highlightRef(ref: string, color: string = 'red'): Promise<boolean> {
    const match = ref.match(/@(\w+)(\d+)/)
    if (!match) return false
    
    const components = await this.page.evaluate(() => {
      const els = document.querySelectorAll('button, a, input, [role="button"], [role="link"]')
      return Array.from(els).map((el, i) => ({ index: i, tag: el.tagName }))
    })
    
    const index = parseInt(match[2]) - 1
    if (index >= components.length) return false
    
    return this.highlight(`:nth-child(${index + 1})`, color)
  }
}
