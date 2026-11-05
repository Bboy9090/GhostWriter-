import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { createDocx } from '../lib/docx-export'
import { DocxImportError, parseDocx } from '../lib/docx-import'

function exactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

describe('DOCX import', () => {
  it('round-trips Word Bench paragraph text, blank lines, tabs and Unicode', async () => {
    const source = 'Opening line\n\nTabbed\ttext\nUnicode: café 世界 ✨'
    const exported = await createDocx({ title: 'Round trip', content: source })

    const imported = await parseDocx(exported, 'Round trip.docx')

    expect(imported.title).toBe('Round trip')
    expect(imported.content).toBe(source)
  })

  it('rejects ZIP files that are not complete DOCX packages', async () => {
    const zip = new JSZip()
    zip.file('notes.txt', 'not a Word document')
    const bytes = await zip.generateAsync({ type: 'uint8array' })

    await expect(parseDocx(exactArrayBuffer(bytes), 'notes.docx'))
      .rejects.toThrow('not a complete DOCX package')
  })

  it('rejects a DOCX without the main Word document part', async () => {
    const zip = new JSZip()
    zip.file('[Content_Types].xml', '<Types />')
    zip.file('_rels/.rels', '<Relationships />')
    const bytes = await zip.generateAsync({ type: 'uint8array' })

    await expect(parseDocx(exactArrayBuffer(bytes), 'empty.docx'))
      .rejects.toThrow('does not contain word/document.xml')
  })

  it('rejects packages above the 25 MB input limit before parsing', async () => {
    const oversized = new ArrayBuffer(25 * 1024 * 1024 + 1)
    await expect(parseDocx(oversized, 'oversized.docx'))
      .rejects.toBeInstanceOf(DocxImportError)
  })
})
