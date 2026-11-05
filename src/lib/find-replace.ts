export interface TextMatch {
  start: number
  end: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')
}

function literalMatcher(query: string, caseSensitive: boolean): RegExp {
  return new RegExp(escapeRegExp(query), caseSensitive ? 'gu' : 'giu')
}

export function findNextTextMatch(
  content: string,
  query: string,
  from = 0,
  caseSensitive = false,
): TextMatch | null {
  if (!query) return null

  const matcher = literalMatcher(query, caseSensitive)
  const safeFrom = Math.max(0, Math.min(from, content.length))
  matcher.lastIndex = safeFrom

  let match = matcher.exec(content)
  if (!match && safeFrom > 0) {
    matcher.lastIndex = 0
    match = matcher.exec(content)
  }

  if (!match) return null
  return { start: match.index, end: match.index + match[0].length }
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

  const matcher = literalMatcher(query, caseSensitive)
  let cursor = 0
  let output = ''
  let count = 0

  for (let match = matcher.exec(content); match; match = matcher.exec(content)) {
    output += content.slice(cursor, match.index) + replacement
    cursor = match.index + match[0].length
    count += 1
  }

  if (count === 0) return { content, count: 0 }
  output += content.slice(cursor)
  return { content: output, count }
}
