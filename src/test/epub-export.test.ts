import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { createEpub } from '../lib/epub-export'

const project = {
  id: 'proj_test',
  title: 'A <Story> & More',
  content: 'First paragraph.\n\nSecond & <third> line.',
  created: '2026-11-01T00:00:00.000Z',
  modified: '2026-11-04T12:34:56.000Z',
}

describe('EPUB export', () => {
  it('creates the required EPUB 3 container and publication files', async () => {
    const bytes = await createEpub(project)
    const archive = await JSZip.loadAsync(bytes)

    expect(await archive.file('mimetype')?.async('string')).toBe('application/epub+zip')
    expect(archive.file('META-INF/container.xml')).toBeTruthy()
    expect(archive.file('OEBPS/package.opf')).toBeTruthy()
    expect(archive.file('OEBPS/nav.xhtml')).toBeTruthy()
    expect(archive.file('OEBPS/content.xhtml')).toBeTruthy()
  })

  it('escapes manuscript and title XML safely', async () => {
    const archive = await JSZip.loadAsync(await createEpub(project))
    const content = await archive.file('OEBPS/content.xhtml')!.async('string')
    expect(content).toContain('A &lt;Story&gt; &amp; More')
    expect(content).toContain('Second &amp; &lt;third&gt; line.')
    expect(content).not.toContain('Second & <third> line.')
  })

  it('uses a source-bound identifier and normalized modified timestamp', async () => {
    const archive = await JSZip.loadAsync(await createEpub(project))
    const opf = await archive.file('OEBPS/package.opf')!.async('string')
    expect(opf).toContain('urn:uuid:proj_test')
    expect(opf).toContain('2026-11-04T12:34:56Z')
  })
})
