import type { DocumentChange } from './project-storage'

export interface ResolvedChangeRange {
  start: number
  end: number
}

export interface DocumentEditRange {
  start: number
  end: number
}

function rangeMatches(
  content: string,
  change: Pick<DocumentChange, 'start' | 'end' | 'original'>,
): boolean {
  return (
    Boolean(change.original) &&
    change.start >= 0 &&
    change.end >= change.start &&
    content.slice(change.start, change.end) === change.original
  )
}

export function rebaseDocumentChanges(
  previousText: string,
  nextText: string,
  changes: DocumentChange[],
  edit: DocumentEditRange | null,
): DocumentChange[] {
  if (previousText === nextText || changes.length === 0) return changes

  const delta = nextText.length - previousText.length

  return changes.map(change => {
    if (change.status !== 'pending') return change
    if (change.anchorState === 'unresolved') return change

    if (!rangeMatches(previousText, change)) {
      return { ...change, anchorState: 'unresolved' }
    }

    if (!edit) {
      return rangeMatches(nextText, change)
        ? { ...change, anchorState: 'anchored' }
        : { ...change, anchorState: 'unresolved' }
    }

    if (change.end <= edit.start) {
      return rangeMatches(nextText, change)
        ? { ...change, anchorState: 'anchored' }
        : { ...change, anchorState: 'unresolved' }
    }

    if (change.start >= edit.end) {
      const shifted = {
        ...change,
        start: change.start + delta,
        end: change.end + delta,
        anchorState: 'anchored' as const,
      }
      return rangeMatches(nextText, shifted)
        ? shifted
        : { ...change, anchorState: 'unresolved' }
    }

    return { ...change, anchorState: 'unresolved' }
  })
}

export function resolveDocumentChangeRange(
  content: string,
  change: Pick<DocumentChange, 'start' | 'end' | 'original' | 'anchorState'>,
): ResolvedChangeRange | null {
  if (!change.original || change.anchorState === 'unresolved') return null

  if (
    change.start >= 0 &&
    change.end >= change.start &&
    content.slice(change.start, change.end) === change.original
  ) {
    return { start: change.start, end: change.end }
  }

  return null
}

export function acceptDocumentChange(
  content: string,
  change: Pick<DocumentChange, 'start' | 'end' | 'original' | 'replacement' | 'anchorState'>,
): string | null {
  const range = resolveDocumentChangeRange(content, change)
  if (!range) return null
  return content.slice(0, range.start) + change.replacement + content.slice(range.end)
}
