import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { createProject, getProject } from '../lib/project-storage'

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), success: vi.fn() },
}))

function openDraft(title: string) {
  fireEvent.click(screen.getByRole('button', { name: /Projects \(/ }))
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${title}`) }))
}

describe('edits waiting for autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('ghostwriter:onboarding-complete', 'true')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('preserves the latest text when switching projects before the debounce fires', () => {
    const first = createProject('First draft', 'blank', 'Old text')
    const second = createProject('Second draft', 'blank', 'Other text')
    render(<App />)
    openDraft('First draft')
    fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), {
      target: { value: 'Latest unsaved words' },
    })
    openDraft('Second draft')
    expect(getProject(first.id)?.content).toBe('Latest unsaved words')
    expect(screen.getByRole('textbox', { name: 'Writing editor' })).toHaveValue(second.content)
  })

  it('flushes the latest title and text when the page is hidden', () => {
    const draft = createProject('Draft', 'blank', 'Old text')
    render(<App />)
    openDraft('Draft')
    fireEvent.change(screen.getByRole('textbox', { name: 'Project title' }), {
      target: { value: 'Latest title' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), {
      target: { value: 'Latest text' },
    })
    act(() => window.dispatchEvent(new Event('pagehide')))
    expect(getProject(draft.id)).toMatchObject({ title: 'Latest title', content: 'Latest text' })
  })

  it('saves before generating a backup instead of exporting stale text', () => {
    const draft = createProject('Draft', 'blank', 'Old text')
    render(<App />)
    openDraft('Draft')
    fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), {
      target: { value: 'Text present in the backup' },
    })
    const createObjectURL = vi.fn(() => 'blob:test-backup')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Backup' }))
    expect(getProject(draft.id)?.content).toBe('Text present in the backup')
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    click.mockRestore()
    vi.unstubAllGlobals()
  })

  it('keeps the current draft open when saving fails during a project switch', () => {
    createProject('First draft', 'blank', 'Old text')
    createProject('Second draft', 'blank', 'Other text')
    render(<App />)
    openDraft('First draft')
    fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), {
      target: { value: 'Words that must remain recoverable' },
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    openDraft('Second draft')
    expect(screen.getByRole('textbox', { name: 'Writing editor' })).toHaveValue(
      'Words that must remain recoverable',
    )
    expect(screen.getByText('Save failed')).toBeInTheDocument()
  })

  it('does not download a stale backup when the latest draft cannot be saved', () => {
    createProject('Draft', 'blank', 'Old text')
    render(<App />)
    openDraft('Draft')
    fireEvent.change(screen.getByRole('textbox', { name: 'Writing editor' }), {
      target: { value: 'Latest text still in the editor' },
    })
    const createObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(screen.getByRole('button', { name: 'Backup' }))
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Writing editor' })).toHaveValue(
      'Latest text still in the editor',
    )
    expect(screen.getByText('Save failed')).toBeInTheDocument()
  })
})
