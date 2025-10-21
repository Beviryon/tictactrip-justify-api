import { describe, it, expect } from 'vitest'
import { justifyText } from './algorithm.js'

describe('Text Justification Algorithm', () => {
  it('should handle a single word that fits on one line', () => {
    const input = 'Hello'
    const result = justifyText(input, 20)
    const expected = 'Hello               ' // 20 caractères total
    
    expect(result).toBe(expected)
    expect(result.length).toBe(20)
  })

  it('should handle multiple words on one line', () => {
    const input = 'Hello world'
    const result = justifyText(input, 20)
    const expected = 'Hello         world' 
    
    expect(result).toBe(expected)
    expect(result.length).toBe(20)
  })
})