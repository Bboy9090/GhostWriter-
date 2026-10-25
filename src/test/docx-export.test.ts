import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { createDocx } from '../lib/docx-export'

const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
async function readDocument(title: string, content: string) {
  const archive = await JSZip.loadAsync(await createDocx({ title, content }))
  expect(archive.file('[Content_Types].xml')).not.toBeNull()
  const xml = await archive.file('word/document.xml')!.async('string')
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  expect(document.querySelector('parsererror')).toBeNull()
  const paragraphs = Array.from(document.getElementsByTagNameNS(namespace, 'p')).map(paragraph =>
    Array.from(paragraph.getElementsByTagNameNS(namespace, 'r')).flatMap(run =>
      Array.from(run.children).map(child => child.localName === 't' ? child.textContent : child.localName === 'tab' ? '\t' : ''),
    ).join(''),
  )
  return { paragraphs, xml }
}
describe('real Word packages', () => {
  it('preserves literal Markdown, Unicode, spaces, tabs and blank lines without XML injection', async () => {
    const content = '# Chapter one\n\n  **Aaden & 家族 🐯**\t<unsafe/>  \nLast line\n'
    const { paragraphs, xml } = await readDocument('Family <Story> & Sons', content)
    expect(paragraphs[0]).toBe('Family <Story> & Sons')
    expect(paragraphs.slice(1).join('\n')).toBe(content)
    expect(xml).not.toContain('<unsafe/>')
  })
  it('normalizes platform line endings while retaining empty paragraphs', async () => {
    const { paragraphs } = await readDocument('Draft', 'one\r\n\r\ntwo\rthree')
    expect(paragraphs.slice(1)).toEqual(['one', '', 'two', 'three'])
  })
  it('exports an empty draft and does not truncate a long manuscript', async () => {
    expect((await readDocument('Empty', '')).paragraphs).toEqual(['Empty', ''])
    const content = Array.from({ length: 500 }, (_, index) => `Paragraph ${index}: the story continues.`).join('\n')
    expect((await readDocument('Long draft', content)).paragraphs.slice(1).join('\n')).toBe(content)
  })
  it('rejects unrepresentable XML characters instead of silently dropping writing', async () => {
    for (const content of ['bad\0text', '\uD800', 'bad\uFFFE']) {
      await expect(createDocx({ title: 'Draft', content })).rejects.toThrow('Word cannot represent')
    }
    await expect(createDocx({ title: 'Bad\0title', content: 'intact' })).rejects.toThrow()
  })
})
