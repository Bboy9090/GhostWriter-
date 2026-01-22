import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export async function extractText({ caseData }) {
  if (!caseData?.expected) {
    throw new Error('Mock adapter requires caseData.expected')
  }

  const expectedPath = path.resolve(process.cwd(), caseData.expected)
  const text = await readFile(expectedPath, 'utf8')
  return { text }
}
