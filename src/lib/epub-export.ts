import JSZip from 'jszip'
import type { Project } from './project-storage'

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character] || character))
}

function paragraphs(content: string): string {
  return content
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${escapeXml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('\n')
}

export async function createEpub(project: Pick<Project, 'id' | 'title' | 'content' | 'created' | 'modified'>): Promise<Uint8Array> {
  const zip = new JSZip()
  const title = project.title.trim() || 'Untitled Document'
  const identifier = `urn:uuid:${project.id}`
  const modified = new Date(project.modified || project.created).toISOString().replace(/\.\d{3}Z$/, 'Z')

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`,
  )

  zip.file(
    'OEBPS/styles.css',
    `body{font-family:serif;line-height:1.6;margin:5%;}h1{font-family:sans-serif;line-height:1.2;}p{margin:0 0 1em;} .meta{color:#666;font-size:.85em;margin-bottom:2em;}`,
  )

  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
<nav epub:type="toc" id="toc">
  <h1>Contents</h1>
  <ol><li><a href="content.xhtml">${escapeXml(title)}</a></li></ol>
</nav>
</body>
</html>
`,
  )

  zip.file(
    'OEBPS/content.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  <div class="meta">Exported from Bobby&apos;s Word Bench</div>
  <main>${paragraphs(project.content) || '<p></p>'}</main>
</body>
</html>
`,
  )

  zip.file(
    'OEBPS/package.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${escapeXml(identifier)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Bobby's Word Bench</dc:creator>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="styles" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>
`,
  )

  return zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}
