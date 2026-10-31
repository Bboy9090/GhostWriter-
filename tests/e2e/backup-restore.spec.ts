import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test('backup downloads the latest draft and restores it after reload', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start writing' }).click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('button', { name: /Blank Document/ }).click()
  await page.getByRole('textbox', { name: 'Project title' }).fill('Recovery story')
  await page.getByRole('textbox', { name: 'Writing editor' }).fill('Last words 🐯 & family')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Backup', exact: true }).click()
  const download = await pending
  const path = testInfo.outputPath('backup.json')
  await download.saveAs(path)
  const backup = JSON.parse(await readFile(path, 'utf8'))
  expect(backup.projects[0].content).toBe('Last words 🐯 & family')
  await page.reload()
  await page.locator('input[type=file]').setInputFiles(path)
  await expect(page.getByText('1 project restored')).toBeVisible()
  await page.getByRole('button', { name: /Projects \(/ }).click()
  await expect(page.getByRole('button', { name: /^Recovery story/ })).toHaveCount(2)
})

test('invalid backup restores nothing and reports failure', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start writing' }).click()
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByRole('button', { name: /Blank Document/ }).click()
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"projects":[{"title":"broken"}]}') })
  await expect(page.getByText('The backup could not be read or is invalid. No projects were restored.')).toBeVisible()
  await page.getByRole('button', { name: /Projects \(/ }).click()
  await expect(page.getByRole('button', { name: /^Untitled Document/ })).toHaveCount(1)
})
