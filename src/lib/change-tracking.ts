import type { DocumentChange } from './project-storage'

export interface ResolvedChangeRange {
  start: number
  end: number
}

export function resolveDocumentChangeRange(
  content: string,
  change: Pick<DocumentChange, 'start' | 'end' | 'original'>,
): ResolvedChangeRange | null {
  if (!change.original) return null

  if (
    change.start >= 0 &&
    change.end >= change.start &&
    content.slice(change.start, change.end) === change.original
  ) {
    return { start: change.start, end: change.end }
  }

  const matches: number[] = []
  let at = content.indexOf(change.original)
  while (at >= 0 && matches.length < 2) {
    matches.push(at)
    at = content.indexOf(change.original, at + 1)
  }

  if (matches.length !== 1) return null
  const start = matches[0]!
  return { start, end: start + change.original.length }
}

export function acceptDocumentChange(
  content: string,
  change: Pick<DocumentChange, 'start' | 'end' | 'original' | 'replacement'>,
): string | null {
  const range = resolveDocumentChangeRange(content, change)
  if (!range) return null
  return content.slice(0, range.start) + change.replacement + content.slice(range.end)
}
