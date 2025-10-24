import { describe, it, expect } from 'vitest'
import { justifyText } from './algorithm.js'

describe('Text Justification Algorithm', () => {
  it('should handle a single word that fits on one line', () => {
    const input = 'Hello'
    const result = justifyText(input, 20)
    const expected = 'Hello               '
    
    expect(result).toBe(expected)
    expect(result.length).toBe(20)
  })

  it('should handle multiple words on one line', () => {
    const input = 'Hello world'
    const result = justifyText(input, 20)
    const expected = 'Hello          world' 
    
    console.log('Result:', JSON.stringify(result))
    console.log('Expected:', JSON.stringify(expected))
    console.log('Result length:', result.length)
    
    expect(result).toBe(expected)
    expect(result.length).toBe(20)
  })

  it('should handle multiple lines', () => {
    const input = 'Hello world this is a test'
    const result = justifyText(input, 20)
    const lines = result.split('\n')
    
    console.log('Lines:', lines.map(line => `"${line}" (${line.length})`))
    
    // Chaque ligne sauf la dernière doit faire 20 caractères
    for (let i = 0; i < lines.length - 1; i++) {
      expect(lines[i].length).toBe(20)
    }
  })
})