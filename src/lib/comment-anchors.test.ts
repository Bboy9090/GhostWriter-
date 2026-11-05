import { describe, expect, it } from 'vitest'
import { rebaseDocumentComments } from './comment-anchors'
import type { DocumentComment } from './project-storage'

const comment = (start: number, end: number, quote: string): DocumentComment => ({
  id: 'c1',
  start,
  end,
  quote,
  body: 'note',
  created: '2026-11-05T00:00:00.000Z',
  resolved: false,
})

describe('comment anchor rebasing', () => {
  it('shifts anchors when text is inserted before the comment', () => {
    const result = rebaseDocumentComments('Alpha\nBeta', 'Intro\nAlpha\nBeta', [comment(6, 10, 'Beta')])
    expect(result[0]).toMatchObject({ start: 12, end: 16, anchorState: 'anchored' })
  })

  it('uses a unique quote to recover an edited anchor', () => {
    const result = rebaseDocumentComments('One two three', 'One brave two three', [comment(4, 7, 'two')])
    expect(result[0]).toMatchObject({ start: 10, end: 13, anchorState: 'anchored' })
  })

  it('marks a removed passage unresolved instead of pointing at unrelated text', () => {
    const result = rebaseDocumentComments('Keep this passage', 'Keep that passage', [comment(5, 9, 'this')])
    expect(result[0]?.anchorState).toBe('unresolved')
    expect(result[0]?.quote).toBe('this')
  })

  it('does not guess when the same quote appears more than once', () => {
    const result = rebaseDocumentComments('Echo here', 'Echo here and Echo again', [comment(0, 4, 'Echo')])
    expect(result[0]?.anchorState).toBe('anchored')
    expect(result[0]?.start).toBe(0)
  })

  it('keeps an unresolved anchor unresolved across unrelated edits', () => {
    const unresolved = {
      ...comment(5, 9, 'this'),
      anchorState: 'unresolved' as const,
    }
    const result = rebaseDocumentComments('Keep that passage', 'Keep that passage!', [unresolved])
    expect(result[0]?.anchorState).toBe('unresolved')
    expect(result[0]?.quote).toBe('this')
  })

  it('does not move a comment to a surviving duplicate after its occurrence is deleted', () => {
    const result = rebaseDocumentComments(
      'Echo here and Echo again',
      'here and Echo again',
      [comment(0, 4, 'Echo')],
    )
    expect(result[0]?.anchorState).toBe('unresolved')
    expect(result[0]?.start).toBe(0)
  })


  it('treats overlapping quote matches as ambiguous', () => {
    const result = rebaseDocumentComments('x ana y', 'banana', [comment(2, 5, 'ana')])
    expect(result[0]?.anchorState).toBe('unresolved')
  })

})
