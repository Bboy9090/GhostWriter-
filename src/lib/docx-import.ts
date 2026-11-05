import JSZip from 'jszip'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_DOCX_BYTES = 25 * 1024 * 1024
const MAX_DOCUMENT_XML_BYTES = 10 * 1024 * 1024

export class DocxImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DocxImportError'
  }
}

export interface ImportedDocx {
  title: string
  content: string
}

function titleFromFilename(name: string): string {
  const withoutExtension = name.replace(/\.docx$/i, '').trim()
  return withoutExtension || 'Imported Word Document'
}

function textFromDocumentXml(xml: string): string {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  if (document.querySelector('parsererror')) {
    throw new DocxImportError('The Word document XML is malformed.')
  }

  const paragraphs = Array.from(document.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'p',
  ))

  return paragraphs.map(paragraph => {
    const parts: string[] = []
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_ELEMENT)
    let node = walker.nextNode()
    while (node) {
      const element = node as Element
      switch (element.localName) {
        case 't':
          parts.push(element.textContent || '')
          break
        case 'tab':
          parts.push('\t')
          break
        case 'br':
        case 'cr':
          parts.push('\n')
          break
      }
      node = walker.nextNode()
    }
    return parts.join('')
  }).join('\n')
}

export async function parseDocx(bytes: ArrayBuffer, filename = 'Imported Word Document.docx'): Promise<ImportedDocx> {
  if (bytes.byteLength === 0) throw new DocxImportError('The selected Word document is empty.')
  if (bytes.byteLength > MAX_DOCX_BYTES) {
    throw new DocxImportError('The selected Word document is larger than the 25 MB import limit.')
  }

  let archive: JSZip
  try {
    archive = await JSZip.loadAsync(bytes)
  } catch {
    throw new DocxImportError('The selected file is not a readable DOCX package.')
  }

  if (!archive.file('[Content_Types].xml') || !archive.file('_rels/.rels')) {
    throw new DocxImportError('The selected file is not a complete DOCX package.')
  }

  const documentEntry = archive.file('word/document.xml')
  if (!documentEntry) {
    throw new DocxImportError('The Word document does not contain word/document.xml.')
  }

  const uncompressedSize = (documentEntry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize
  if (typeof uncompressedSize === 'number' && uncompressedSize > MAX_DOCUMENT_XML_BYTES) {
    throw new DocxImportError('The Word document body exceeds the safe import limit.')
  }

  const xml = await documentEntry.async('string')
  if (new Blob([xml]).size > MAX_DOCUMENT_XML_BYTES) {
    throw new DocxImportError('The Word document body exceeds the safe import limit.')
  }

  const content = textFromDocumentXml(xml)
  if (!content.trim()) {
    throw new DocxImportError('The Word document does not contain readable paragraph text.')
  }

  return {
    title: titleFromFilename(filename),
    content,
  }
}

export async function importDocxFile(file: File): Promise<ImportedDocx> {
  if (
    !file.name.toLowerCase().endsWith('.docx') &&
    file.type !== DOCX_MIME
  ) {
    throw new DocxImportError('Choose a Microsoft Word .docx document.')
  }
  if (file.size > MAX_DOCX_BYTES) {
    throw new DocxImportError('The selected Word document is larger than the 25 MB import limit.')
  }
  return parseDocx(await file.arrayBuffer(), file.name)
}
