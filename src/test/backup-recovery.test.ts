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

  it('removes the new project record if its index update fails', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    const setItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'ghostwriter:projects') throw new Error('quota')
      return setItem.call(this, key, value)
    })
    try {
      const error = await importProjects(backup([original])).catch(error => error)
      expect(error).toBeInstanceOf(RestoreError)
      expect(error.restoredCount).toBe(0)
      expect(error.cleanupFailed).toBe(false)
      expect(Object.keys(localStorage).filter(key => key.startsWith('ghostwriter:project:'))).toEqual([`ghostwriter:project:${original.id}`])
      expect(getAllProjectsMetadata().map(item => item.id)).toEqual([original.id])
    } finally { spy.mockRestore() }
  })

  it('reports if cleanup of an incomplete record also fails', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    const setItem = Storage.prototype.setItem
    const writes = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'ghostwriter:projects') throw new Error('quota')
      return setItem.call(this, key, value)
    })
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    try {
      const error = await importProjects(backup([original])).catch(error => error)
      expect(error).toBeInstanceOf(RestoreError)
      expect(error.cleanupFailed).toBe(true)
      expect(getAllProjectsMetadata().map(item => item.id)).toEqual([original.id])
    } finally { writes.mockRestore(); remove.mockRestore() }
  })

  it('does not overwrite a damaged index when restoring', async () => {
    const original = createProject('Original', 'blank', 'Keep these words')
    localStorage.setItem('ghostwriter:projects', '{broken')
    await expect(importProjects(backup([original]))).rejects.toThrow()
    expect(localStorage.getItem('ghostwriter:projects')).toBe('{broken')
    expect(localStorage.getItem(`ghostwriter:project:${original.id}`)).toContain('Keep these words')
  })
})
