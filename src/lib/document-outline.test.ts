import { describe, expect, it } from 'vitest'
import { buildDocumentOutline } from './document-outline'

describe('buildDocumentOutline', () => {
  it('recognizes markdown headings and chapter labels', () => {
    const content = '# Book One\nIntro\n\nChapter 1: Arrival\nText\n## Scene A\nMore'
    const outline = buildDocumentOutline(content)
    expect(outline.map(item => [item.level, item.label, item.line])).toEqual([
      [1, 'Book One', 1],
      [2, 'Chapter 1: Arrival', 4],
      [2, 'Scene A', 6],
    ])
  })

  it('recognizes prologue epilogue and part headings', () => {
    const outline = buildDocumentOutline('Prologue\nText\nPart II — The Fall\nEpilogue')
    expect(outline.map(item => item.label)).toEqual(['Prologue', 'Part II — The Fall', 'Epilogue'])
  })

  it('returns exact character offsets for navigation', () => {
    const content = 'Opening\n\nChapter 2\nBody'
    const [entry] = buildDocumentOutline(content)
    expect(entry?.start).toBe(content.indexOf('Chapter 2'))
  })
})
