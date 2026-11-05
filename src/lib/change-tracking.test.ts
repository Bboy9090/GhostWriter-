import { describe, expect, it } from 'vitest'
import {
  acceptDocumentChange,
  inferDocumentEditRange,
  rebaseDocumentChanges,
  resolveDocumentChangeRange,
} from './change-tracking'
import type { DocumentChange } from './project-storage'

const pending = (
  start: number,
  end: number,
  original: string,
  replacement = 'delta',
): DocumentChange => ({
  id: 'change-1',
  start,
  end,
  original,
  replacement,
  created: '2026-11-05T00:00:00.000Z',
  status: 'pending',
  anchorState: 'anchored',
})

describe('tracked change anchoring', () => {
  it('uses the original range when it still matches', () => {
    expect(resolveDocumentChangeRange('alpha beta gamma', pending(6, 10, 'beta')))
      .toEqual({ start: 6, end: 10 })
  })

  it('infers insertion, deletion, and replacement ranges without browser beforeinput', () => {
    expect(inferDocumentEditRange('beta beta', 'prefix beta beta'))
      .toEqual({ start: 0, end: 0 })
    expect(inferDocumentEditRange('prefix beta beta', 'beta beta'))
      .toEqual({ start: 0, end: 7 })
    expect(inferDocumentEditRange('alpha beta gamma', 'alpha zeta gamma'))
      .toEqual({ start: 6, end: 7 })
  })

  it('rebases a pasted prefix before the second duplicate passage', () => {
    const previous = 'beta beta'
    const next = 'prefix beta beta'
    const [change] = rebaseDocumentChanges(
      previous,
      next,
      [pending(5, 9, 'beta')],
      inferDocumentEditRange(previous, next),
    )
    expect(change).toMatchObject({ start: 12, end: 16, anchorState: 'anchored' })
    expect(acceptDocumentChange(next, change!)).toBe('prefix beta delta')
  })

  it('rebases after a deletion before the tracked passage', () => {
    const previous = 'prefix alpha beta'
    const next = 'alpha beta'
    const [change] = rebaseDocumentChanges(
      previous,
      next,
      [pending(13, 17, 'beta')],
      inferDocumentEditRange(previous, next),
    )
    expect(change).toMatchObject({ start: 6, end: 10, anchorState: 'anchored' })
  })

  it('shifts a pending change when an edit occurs before its passage', () => {
    const [change] = rebaseDocumentChanges(
      'beta beta',
      'beta beta beta',
      [pending(5, 9, 'beta')],
      { start: 0, end: 0 },
    )
    expect(change).toMatchObject({ start: 10, end: 14, anchorState: 'anchored' })
    expect(acceptDocumentChange('beta beta beta', change!)).toBe('beta beta delta')
  })

  it('preserves a pending change when an edit occurs after its passage', () => {
    const [change] = rebaseDocumentChanges(
      'alpha beta',
      'alpha beta!',
      [pending(6, 10, 'beta')],
      { start: 10, end: 10 },
    )
    expect(change).toMatchObject({ start: 6, end: 10, anchorState: 'anchored' })
  })

  it('invalidates a pending change when its selected passage is edited', () => {
    const [change] = rebaseDocumentChanges(
      'alpha beta gamma',
      'alpha zeta gamma',
      [pending(6, 10, 'beta')],
      { start: 6, end: 10 },
    )
    expect(change?.anchorState).toBe('unresolved')
    expect(acceptDocumentChange('alpha zeta gamma', change!)).toBeNull()
  })

  it('does not move a deleted duplicate suggestion onto another occurrence', () => {
    const [change] = rebaseDocumentChanges(
      'beta beta',
      'beta',
      [pending(5, 9, 'beta')],
      { start: 4, end: 9 },
    )
    expect(change?.anchorState).toBe('unresolved')
    expect(acceptDocumentChange('beta', change!)).toBeNull()
  })

  it('fails closed when no reliable edit range is available', () => {
    const [change] = rebaseDocumentChanges(
      'alpha beta gamma',
      'prefix alpha beta gamma',
      [pending(6, 10, 'beta')],
      null,
    )
    expect(change?.anchorState).toBe('unresolved')
  })

  it('applies only a validated replacement', () => {
    expect(acceptDocumentChange('alpha beta gamma', pending(6, 10, 'beta')))
      .toBe('alpha delta gamma')
  })
})
