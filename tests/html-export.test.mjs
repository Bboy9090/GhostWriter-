import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const exportsSource = await readFile('src/lib/export.ts', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')

for (const required of [
  'export function exportAsHtml',
  'text/html;charset=utf-8',
  'escapeHtml',
  '<!doctype html>',
  '<article>',
]) assert.ok(exportsSource.includes(required), 'HTML export missing: ' + required)

assert.equal(exportsSource.includes('<article>' + '${project.content}' + '</article>'), false)
assert.equal(exportsSource.includes('<title>' + '${project.title}' + '</title>'), false)
assert.ok(app.includes('exportAsHtml'))
assert.ok(app.includes('>HTML</Button>'))

console.log('Word Bench HTML export contract: PASS')
