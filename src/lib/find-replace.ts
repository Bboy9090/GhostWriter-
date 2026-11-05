export interface TextMatch {
  start: number
  end: number
}

function normalized(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLocaleLowerCase()
}

export function findNextTextMatch(
  content: string,
  query: string,
  from = 0,
  caseSensitive = false,
): TextMatch | null {
  if (!query) return null
  const haystack = normalized(content, caseSensitive)
  const needle = normalized(query, caseSensitive)
  const safeFrom = Math.max(0, Math.min(from, content.length))

  let start = haystack.indexOf(needle, safeFrom)
  if (start < 0 && safeFrom > 0) start = haystack.indexOf(needle, 0)
  return start < 0 ? null : { start, end: start + query.length }
}

export function replaceTextMatch(
  content: string,
  match: TextMatch,
  replacement: string,
): string {
  if (match.start < 0 || match.end < match.start || match.end > content.length) {
    throw new Error('Invalid replacement range')
  }
  return content.slice(0, match.start) + replacement + content.slice(match.end)
}

export function replaceAllText(
  content: string,
  query: string,
  replacement: string,
  caseSensitive = false,
): { content: string; count: number } {
  if (!query) return { content, count: 0 }

  const haystack = normalized(content, caseSensitive)
  const needle = normalized(query, caseSensitive)
  let cursor = 0
  let output = ''
  let count = 0

  while (cursor < content.length) {
    const start = haystack.indexOf(needle, cursor)
    if (start < 0) break
    output += content.slice(cursor, start) + replacement
    cursor = start + query.length
    count += 1
  }

  if (count === 0) return { content, count: 0 }
  output += content.slice(cursor)
  return { content: output, count }
}
