import { describe, expect, it } from 'vitest'
import { acceptDocumentChange, resolveDocumentChangeRange } from './change-tracking'

describe('tracked change anchoring', () => {
  it('uses the original range when it still matches', () => {
    expect(resolveDocumentChangeRange('alpha beta gamma', {
      start: 6, end: 10, original: 'beta',
    })).toEqual({ start: 6, end: 10 })
  })

  it('reanchors a uniquely moved passage', () => {
    expect(resolveDocumentChangeRange('prefix alpha beta gamma', {
      start: 0, end: 4, original: 'beta',
    })).toEqual({ start: 13, end: 17 })
  })

  it('fails closed when the original passage is ambiguous', () => {
    expect(resolveDocumentChangeRange('beta alpha beta', {
      start: 0, end: 4, original: 'beta',
    })).toEqual({ start: 0, end: 4 })
    expect(resolveDocumentChangeRange('x beta alpha beta', {
      start: 0, end: 4, original: 'beta',
    })).toBeNull()
  })

  it('applies only a validated replacement', () => {
    expect(acceptDocumentChange('alpha beta gamma', {
      start: 6, end: 10, original: 'beta', replacement: 'delta',
    })).toBe('alpha delta gamma')
  })
})
