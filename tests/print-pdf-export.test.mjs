import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const css = await readFile('src/styles/theme.css', 'utf8')
const preview = await readFile('docs/FAMILY_PREVIEW.md', 'utf8')

for (const required of [
  'Print / PDF',
  'window.print()',
  'print-manuscript',
  'print-manuscript-content',
]) assert.ok(app.includes(required), 'App missing print/PDF contract: ' + required)

for (const required of [
  '@media print',
  '.print-manuscript',
  'visibility: hidden',
  'white-space: pre-wrap',
]) assert.ok(css.includes(required), 'Print stylesheet missing: ' + required)

assert.ok(preview.includes("browser's native print dialog"))
assert.equal(preview.includes('PDF export, desktop installers'), false)

console.log('Word Bench print/PDF export contract: PASS')
