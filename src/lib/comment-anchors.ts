import type { DocumentComment } from './project-storage'

export type CommentAnchorState = 'anchored' | 'unresolved'

export function rebaseDocumentComments(
  previousText: string,
  nextText: string,
  comments: DocumentComment[],
): DocumentComment[] {
  if (previousText === nextText || comments.length === 0) return comments

  let prefix = 0
  const maxPrefix = Math.min(previousText.length, nextText.length)
  while (prefix < maxPrefix && previousText[prefix] === nextText[prefix]) prefix++

  let suffix = 0
  while (
    suffix < previousText.length - prefix &&
    suffix < nextText.length - prefix &&
    previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix++

  const oldSuffixStart = previousText.length - suffix
  const delta = nextText.length - previousText.length

  return comments.map(comment => {
    const exactMatches: number[] = []
    if (comment.quote) {
      let at = nextText.indexOf(comment.quote)
      while (at >= 0 && exactMatches.length < 2) {
        exactMatches.push(at)
        at = nextText.indexOf(comment.quote, at + 1)
      }
    }

    if (exactMatches.length === 1) {
      const start = exactMatches[0]!
      return { ...comment, start, end: start + comment.quote.length, anchorState: 'anchored' }
    }

    if (comment.end <= prefix) {
      return { ...comment, anchorState: 'anchored' }
    }

    if (comment.start >= oldSuffixStart) {
      return {
        ...comment,
        start: Math.max(0, comment.start + delta),
        end: Math.max(0, comment.end + delta),
        anchorState: 'anchored',
      }
    }

    return { ...comment, anchorState: 'unresolved' }
  })
}
