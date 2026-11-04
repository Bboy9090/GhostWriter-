export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffLine {
  kind: DiffKind
  text: string
  oldLine: number | null
  newLine: number | null
}

export interface DocumentDiff {
  lines: DiffLine[]
  added: number
  removed: number
  unchanged: number
}

const MAX_LCS_CELLS = 2_000_000

function summarize(lines: DiffLine[]): DocumentDiff {
  return summarize(lines)
}

function boundedLargeDocumentDiff(a: string[], b: string[]): DocumentDiff {
  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++

  let suffix = 0
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) suffix++

  const lines: DiffLine[] = []
  for (let index = 0; index < prefix; index++) {
    lines.push({ kind: 'same', text: a[index] ?? '', oldLine: index + 1, newLine: index + 1 })
  }

  const oldEnd = a.length - suffix
  const newEnd = b.length - suffix
  for (let index = prefix; index < oldEnd; index++) {
    lines.push({ kind: 'removed', text: a[index] ?? '', oldLine: index + 1, newLine: null })
  }
  for (let index = prefix; index < newEnd; index++) {
    lines.push({ kind: 'added', text: b[index] ?? '', oldLine: null, newLine: index + 1 })
  }

  for (let offset = suffix - 1; offset >= 0; offset--) {
    const oldIndex = a.length - 1 - offset
    const newIndex = b.length - 1 - offset
    lines.push({
      kind: 'same',
      text: a[oldIndex] ?? '',
      oldLine: oldIndex + 1,
      newLine: newIndex + 1,
    })
  }

  return summarize(lines)
}

export function diffDocumentLines(before: string, after: string): DocumentDiff {
  const a = before.split('\n')
  const b = after.split('\n')
  const rows = a.length + 1
  const cols = b.length + 1

  if (rows * cols > MAX_LCS_CELLS) {
    return boundedLargeDocumentDiff(a, b)
  }

  const lcs = Array.from({ length: rows }, () => new Uint32Array(cols))
  const score = (i: number, j: number) => lcs[i]?.[j] ?? 0

  for (let i = a.length - 1; i >= 0; i--) {
    const row = lcs[i]
    if (!row) continue
    for (let j = b.length - 1; j >= 0; j--) {
      const beforeLine = a[i] ?? ''
      const afterLine = b[j] ?? ''
      row[j] = beforeLine === afterLine
        ? score(i + 1, j + 1) + 1
        : Math.max(score(i + 1, j), score(i, j + 1))
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  let oldLine = 1
  let newLine = 1

  while (i < a.length && j < b.length) {
    const beforeLine = a[i] ?? ''
    const afterLine = b[j] ?? ''

    if (beforeLine === afterLine) {
      lines.push({ kind: 'same', text: beforeLine, oldLine, newLine })
      i++
      j++
      oldLine++
      newLine++
      continue
    }

    if (score(i + 1, j) >= score(i, j + 1)) {
      lines.push({ kind: 'removed', text: beforeLine, oldLine, newLine: null })
      i++
      oldLine++
    } else {
      lines.push({ kind: 'added', text: afterLine, oldLine: null, newLine })
      j++
      newLine++
    }
  }

  while (i < a.length) {
    lines.push({ kind: 'removed', text: a[i] ?? '', oldLine, newLine: null })
    i++
    oldLine++
  }
  while (j < b.length) {
    lines.push({ kind: 'added', text: b[j] ?? '', oldLine: null, newLine })
    j++
    newLine++
  }

  return {
    lines,
    added: lines.filter(line => line.kind === 'added').length,
    removed: lines.filter(line => line.kind === 'removed').length,
    unchanged: lines.filter(line => line.kind === 'same').length,
  }
}
