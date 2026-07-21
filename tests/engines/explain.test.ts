import { describe, it, expect } from 'vitest'
import { extractSelectors } from '../../src/engines/explain.js'

describe('extractSelectors', () => {
  it('should extract valid selectors', () => {
    const selectors = extractSelectors('button.submit', 'a.link', 'div#main')
    
    expect(selectors).toEqual(['button.submit', 'a.link', 'div#main'])
  })
  
  it('should filter empty selectors', () => {
    const selectors = extractSelectors('button.submit', '', 'a.link')
    
    expect(selectors).toEqual(['button.submit', 'a.link'])
  })
  
  it('should filter invalid selectors', () => {
    const selectors = extractSelectors('button.submit', '>>>invalid', 'a.link')
    
    expect(selectors).toEqual(['button.submit', 'a.link'])
  })
  
  it('should return empty array for all invalid', () => {
    const selectors = extractSelectors('>>>', '???', '!!!')
    
    expect(selectors).toEqual([])
  })
})