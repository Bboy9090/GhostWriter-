import { describe, expect, it } from 'vitest'
import { findNextTextMatch, replaceAllText, replaceTextMatch } from './find-replace'

describe('find and replace', () => {
  it('finds case-insensitively and wraps to the first match', () => {
    expect(findNextTextMatch('Alpha beta ALPHA', 'alpha', 1)).toEqual({ start: 11, end: 16 })
    expect(findNextTextMatch('Alpha beta ALPHA', 'alpha', 16)).toEqual({ start: 0, end: 5 })
  })

  it('supports case-sensitive search', () => {
    expect(findNextTextMatch('Alpha alpha', 'Alpha', 0, true)).toEqual({ start: 0, end: 5 })
    expect(findNextTextMatch('Alpha alpha', 'ALPHA', 0, true)).toBeNull()
  })

  it('replaces exactly one validated range', () => {
    expect(replaceTextMatch('alpha beta', { start: 6, end: 10 }, 'delta')).toBe('alpha delta')
  })

  it('replaces all non-overlapping matches and reports count', () => {
    expect(replaceAllText('one ONE stone', 'one', 'two')).toEqual({
      content: 'two two sttwo',
      count: 3,
    })
  })

  it('preserves original offsets when Unicode case folding changes length', () => {
    expect(findNextTextMatch('İ foo!', 'foo')).toEqual({ start: 2, end: 5 })
    expect(replaceAllText('İ foo!', 'foo', 'bar')).toEqual({
      content: 'İ bar!',
      count: 1,
    })
  })

  it('treats regex metacharacters as literal search text', () => {
    expect(findNextTextMatch('a+b a.b', 'a+b')).toEqual({ start: 0, end: 3 })
    expect(replaceAllText('a+b a+b', 'a+b', 'x')).toEqual({
      content: 'x x',
      count: 2,
    })
  })

  it('leaves content untouched for an empty or missing query', () => {
    expect(replaceAllText('alpha', '', 'x')).toEqual({ content: 'alpha', count: 0 })
    expect(replaceAllText('alpha', 'z', 'x')).toEqual({ content: 'alpha', count: 0 })
  })
})
