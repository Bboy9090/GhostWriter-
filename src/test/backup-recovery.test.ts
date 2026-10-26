import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject, exportAllProjects, getAllProjectsMetadata, importProjects, RestoreError } from '../lib/project-storage'

const backup = (projects: unknown[]) => new File([JSON.stringify({ version: '1.0', projects })], 'backup.json', { type: 'application/json' })

describe('backup recovery', () => {
  beforeEach(() => localStorage.clear())

  it('rejects an invalid later project before restoring anything', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    await expect(importProjects(backup([original, { title: 'broken' }]))).rejects.toThrow('Invalid backup')
    expect(getAllProjectsMetadata().map(project => project.id)).toEqual([original.id])
  })

  it('reports completed restores if storage fails mid-import', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    const setItem = Storage.prototype.setItem
    let projectWrites = 0
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key.startsWith('ghostwriter:project:') && ++projectWrites === 2) throw new Error('quota')
      return setItem.call(this, key, value)
    })
    try {
      const error = await importProjects(backup([original, original])).catch(error => error)
      expect(error).toBeInstanceOf(RestoreError)
      expect(error.restoredCount).toBe(1)
      expect(getAllProjectsMetadata()).toHaveLength(2)
    } finally { spy.mockRestore() }
  })

  it('does not create an incomplete backup when an indexed project is missing', () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    localStorage.removeItem(`ghostwriter:project:${original.id}`)
    expect(() => exportAllProjects()).toThrow('Backup was not created')
  })

  it('does not overwrite a damaged index when restoring', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    localStorage.setItem('ghostwriter:projects', '{broken')
    await expect(importProjects(backup([original]))).rejects.toThrow()
    expect(localStorage.getItem('ghostwriter:projects')).toBe('{broken')
    expect(localStorage.getItem(`ghostwriter:project:${original.id}`)).toContain('Keep these words')
  })
})
