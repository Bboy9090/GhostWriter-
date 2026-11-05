import type { DocumentComment } from './project-storage'

export type CommentAnchorState = 'anchored' | 'unresolved'

function findQuoteMatches(text: string, quote: string): number[] {
  const matches: number[] = []
  if (!quote) return matches

  let at = text.indexOf(quote)
  while (at >= 0) {
    matches.push(at)
    at = text.indexOf(quote, at + Math.max(1, quote.length))
  }
  return matches
}

function rangeMatches(text: string, start: number, end: number, quote: string): boolean {
  return Boolean(quote) && start >= 0 && end >= start && text.slice(start, end) === quote
}

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
    const previousMatches = findQuoteMatches(previousText, comment.quote)
    const nextMatches = findQuoteMatches(nextText, comment.quote)
    const previousRangeWasValid = rangeMatches(
      previousText,
      comment.start,
      comment.end,
      comment.quote,
    )

    // An unresolved comment stays unresolved through unrelated edits. It may
    // recover only when its exact quote is uniquely present again and the
    // prior document did not contain multiple indistinguishable candidates.
    if (comment.anchorState === 'unresolved') {
      if (nextMatches.length === 1 && previousMatches.length <= 1) {
        const start = nextMatches[0]!
        return { ...comment, start, end: start + comment.quote.length, anchorState: 'anchored' }
      }
      return { ...comment, anchorState: 'unresolved' }
    }

    // Positional preservation is safest when the original range really held
    // the quote and the corresponding range still holds it after the edit.
    if (previousRangeWasValid && comment.end <= prefix) {
      if (rangeMatches(nextText, comment.start, comment.end, comment.quote)) {
        return { ...comment, anchorState: 'anchored' }
      }
    }

    if (previousRangeWasValid && comment.start >= oldSuffixStart) {
      const start = Math.max(0, comment.start + delta)
      const end = Math.max(0, comment.end + delta)
      if (rangeMatches(nextText, start, end, comment.quote)) {
        return { ...comment, start, end, anchorState: 'anchored' }
      }
    }

    // Unique-quote recovery is only identity-safe when the previous document
    // did not contain duplicate candidates. If one of several old occurrences
    // was deleted, a single remaining occurrence is not proof of identity.
    if (nextMatches.length === 1 && previousMatches.length <= 1) {
      const start = nextMatches[0]!
      return { ...comment, start, end: start + comment.quote.length, anchorState: 'anchored' }
    }

    return { ...comment, anchorState: 'unresolved' }
  })
}
