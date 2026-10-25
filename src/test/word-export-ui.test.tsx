import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { createProject } from '../lib/project-storage'
import { exportAsDocx } from '../lib/export'
vi.mock('../lib/export', async importOriginal => ({ ...await importOriginal<typeof import('../lib/export')>(), exportAsDocx: vi.fn() }))
vi.mock('sonner', () => ({ Toaster: () => null, toast: { error: vi.fn(), success: vi.fn() } }))
beforeEach(() => { localStorage.clear(); localStorage.setItem('ghostwriter:onboarding-complete', 'true'); vi.mocked(exportAsDocx).mockReset() })
afterEach(() => vi.restoreAllMocks())
function open() {
  createProject('My draft', 'blank', 'Previously saved text')
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Projects \(/ }))
  fireEvent.click(screen.getByRole('button', { name: /^My draft/ }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), { target: { value: 'Latest unsaved words 🐯' } })
}
it('exports the current editor snapshot even when storage is unavailable', async () => {
  open()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota') })
  vi.mocked(exportAsDocx).mockResolvedValue()
  fireEvent.click(screen.getByRole('button', { name: 'Word (.docx)' }))
  await waitFor(() => expect(exportAsDocx).toHaveBeenCalledWith(expect.objectContaining({ content: 'Latest unsaved words 🐯' })))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Word (.docx)' })).toBeEnabled())
})
it('preserves the draft and restores the export button after failure', async () => {
  open()
  vi.mocked(exportAsDocx).mockRejectedValue(Error('packing failure'))
  fireEvent.click(screen.getByRole('button', { name: 'Word (.docx)' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Word (.docx)' })).toBeEnabled())
  expect(screen.getByRole('textbox', { name: 'Writing editor' })).toHaveValue('Latest unsaved words 🐯')
})
