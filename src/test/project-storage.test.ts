import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllProjects,
  countCharacters,
  countWords,
  createProject,
  deleteProject,
  estimateReadingTime,
  getAllProjectsMetadata,
  getProject,
  saveProject,
} from '../lib/project-storage'
import { sanitizeFilename, stripMarkdown } from '../lib/export'

describe('GhostWriter local project lifecycle', () => {
  beforeEach(() => localStorage.clear())

  it('creates, saves, reloads, indexes, and deletes a project', () => {
    const project = createProject('Family Story', 'blank', 'Once upon a time')
    expect(getProject(project.id)?.content).toBe('Once upon a time')
    expect(getAllProjectsMetadata()).toHaveLength(1)

    project.content = 'Once upon a better time with everyone together.'
    saveProject(project)
    expect(getProject(project.id)?.metadata.wordCount).toBe(8)

    deleteProject(project.id)
    expect(getProject(project.id)).toBeNull()
    expect(getAllProjectsMetadata()).toEqual([])
  })

  it('clears GhostWriter data without removing unrelated browser data', () => {
    createProject('Draft', 'blank', 'Safe words')
    localStorage.setItem('another-app:key', 'keep me')
    clearAllProjects()
    expect(getAllProjectsMetadata()).toEqual([])
    expect(localStorage.getItem('another-app:key')).toBe('keep me')
  })

  it('calculates writing statistics predictably', () => {
    expect(countWords('one  two\nthree')).toBe(3)
    expect(countCharacters('a b\nc')).toBe(3)
    expect(estimateReadingTime('word '.repeat(201))).toBe(2)
  })
})

describe('portable exports', () => {
  it('sanitizes filenames and removes common Markdown syntax', () => {
    expect(sanitizeFilename('My: Great / Draft!')).toBe('my-great-draft')
    expect(stripMarkdown('# Title\n\n**Bold** and [link](https://example.com)')).toBe('Title\n\nBold and link')
  })
})
