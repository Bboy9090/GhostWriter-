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

export function diffDocumentLines(before: string, after: string): DocumentDiff {
  const a = before.split('\n')
  const b = after.split('\n')
  const rows = a.length + 1
  const cols = b.length + 1
  const lcs = Array.from({ length: rows }, () => new Uint32Array(cols))

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  let oldLine = 1
  let newLine = 1

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      lines.push({ kind: 'same', text: a[i], oldLine, newLine })
      i++
      j++
      oldLine++
      newLine++
      continue
    }

    if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({ kind: 'removed', text: a[i], oldLine, newLine: null })
      i++
      oldLine++
    } else {
      lines.push({ kind: 'added', text: b[j], oldLine: null, newLine })
      j++
      newLine++
    }
  }

  while (i < a.length) {
    lines.push({ kind: 'removed', text: a[i], oldLine, newLine: null })
    i++
    oldLine++
  }
  while (j < b.length) {
    lines.push({ kind: 'added', text: b[j], oldLine: null, newLine })
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
