import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import JSZip from 'jszip'

test('downloads an actual Word package with current text despite storage failure', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start writing' }).click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('button', { name: /Blank Document/ }).click()
  await page.getByRole('textbox', { name: 'Project title' }).fill('Family & Sons / <Draft>')
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError') } })
  const text = '# New chapter\n\nAaden & 家族 🐯\t<keep this>\nLast unsaved sentence.'
  await page.getByRole('textbox', { name: 'Writing editor' }).fill(text)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Word (.docx)', exact: true }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('family-sons-draft.docx')
  const path = testInfo.outputPath('word-export.docx')
  await download.saveAs(path)
  const zip = await JSZip.loadAsync(await readFile(path))
  expect(zip.file('[Content_Types].xml')).not.toBeNull()
  const xml = await zip.file('word/document.xml')!.async('string')
  expect(xml).toContain('Aaden &amp; 家族 🐯')
  expect(xml).toContain('&lt;keep this&gt;')
  expect(xml).toContain('Last unsaved sentence.')
  await expect(page.getByRole('textbox', { name: 'Writing editor' })).toHaveValue(text)
  await expect(page.getByRole('button', { name: 'Word (.docx)', exact: true })).toBeEnabled()
})
