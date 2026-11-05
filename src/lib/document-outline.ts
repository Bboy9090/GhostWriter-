export interface DocumentOutlineEntry {
  id: string
  level: number
  label: string
  start: number
  line: number
}

const CHAPTER_RE = /^(?:chapter|prologue|epilogue|part)\b(?:\s+[\w.-]+)?(?:\s*[:—-]\s*.*)?$/i

export function buildDocumentOutline(content: string): DocumentOutlineEntry[] {
  const entries: DocumentOutlineEntry[] = []
  let offset = 0
  const lines = content.split('\n')

  lines.forEach((raw, index) => {
    const line = raw.trim()
    let level = 0
    let label = ''

    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (heading) {
      level = heading[1]?.length ?? 1
      label = heading[2]?.trim() ?? ''
    } else if (CHAPTER_RE.test(line)) {
      level = /^(part)\b/i.test(line) ? 1 : 2
      label = line
    }

    if (label) {
      entries.push({
        id: `outline-${index + 1}-${offset}`,
        level,
        label,
        start: offset + raw.indexOf(raw.trimStart()),
        line: index + 1,
      })
    }

    offset += raw.length + (index < lines.length - 1 ? 1 : 0)
  })

  return entries
}
