import { Document, HeadingLevel, Packer, Paragraph, Tab, TextRun } from 'docx'
import type { Project } from './project-storage'

function containsInvalidXml(value: string): boolean {
  for (const character of value) {
    const point = character.codePointAt(0)!
    if ((point < 32 && point !== 9 && point !== 10 && point !== 13) ||
      (point >= 0xD800 && point <= 0xDFFF) || point === 0xFFFE || point === 0xFFFF) return true
  }
  return false
}

/** Word export keeps the draft literal: Markdown syntax is not stripped or rewritten. */
export async function createDocx(project: Pick<Project, 'title' | 'content'>): Promise<ArrayBuffer> {
  if (containsInvalidXml(project.title) || containsInvalidXml(project.content)) {
    throw new Error('This draft contains characters Word cannot represent. Use Markdown or Text export.')
  }
  const paragraphs = project.content.split(/\r\n|\r|\n/).map(line => new Paragraph({
    children: line.split('\t').flatMap((text, index) => [
      ...(index ? [new TextRun({ children: [new Tab()] })] : []),
      new TextRun(text),
    ]),
    spacing: { after: 0 },
  }))
  const document = new Document({
    title: project.title,
    creator: 'Ghost Writer',
    sections: [{ children: [new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }), ...paragraphs] }],
  })
  return Packer.toArrayBuffer(document)
}
