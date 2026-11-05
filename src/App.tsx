import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock3, Download, FilePlus, FolderOpen, GitCompareArrows, HardDriveDownload, History, MessageSquarePlus, Moon, RotateCcw, Search, Sun, Trash2, Upload } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Badge } from './components/ui/badge'
import { AIWritingPanel } from './components/AIWritingPanel'
import { TEMPLATES, type Template } from './lib/templates'
import {
  clearAllProjects,
  countWords,
  createProject,
  createProjectRevision,
  deleteProject,
  estimateReadingTime,
  exportAllProjects,
  getAllProjectsMetadata,
  getProject,
  getStorageStats,
  importProjects,
  RestoreError,
  restoreProjectRevision,
  saveProject,
  type Project,
  type DocumentComment,
  type DocumentChange,
  type ProjectMetadata,
} from './lib/project-storage'
import { exportAsDocx, exportAsMarkdown, exportAsText } from './lib/export'
import { rebaseDocumentComments } from './lib/comment-anchors'
import { diffDocumentLines } from './lib/document-diff'
import { acceptDocumentChange, inferDocumentEditRange, rebaseDocumentChanges } from './lib/change-tracking'

const APP_VERSION = '1.1.0'
const ONBOARDING_KEY = 'ghostwriter:onboarding-complete'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [projects, setProjects] = useState<ProjectMetadata[]>(() =>
    getAllProjectsMetadata().sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    ),
  )
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [query, setQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_KEY) !== 'true')
  const [dark, setDark] = useState(() => localStorage.getItem('ghostwriter:theme') !== 'light')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const importRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [exportingDocx, setExportingDocx] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [changeReplacement, setChangeReplacement] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [compareRevisionId, setCompareRevisionId] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; quote: string } | null>(null)

  const refreshProjects = () => {
    const next = getAllProjectsMetadata().sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    )
    setProjects(next)
  }

  // Navigation and backup must not discard edits waiting for the debounce.
  const flushCurrentProject = () => {
    if (!currentProject) return true
    try {
      saveProject(currentProject)
      refreshProjects()
      setSaveStatus('saved')
      return true
    } catch {
      setSaveStatus('error')
      toast.error('Could not save. Export this draft as Markdown or Text before leaving it.')
      return false
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('ghostwriter:theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (!currentProject) return
    const timer = window.setTimeout(() => {
      try {
        saveProject(currentProject)
        refreshProjects()
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
        toast.error('Could not save. Export this draft as Markdown or Text before leaving it.')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [currentProject])

  useEffect(() => {
    if (!currentProject) return
    const saveBeforeLeaving = () => {
      try {
        saveProject(currentProject)
      } catch {
        // Keep the in-memory draft available if the browser remains open.
        setSaveStatus('error')
      }
    }
    const saveWhenHidden = () => {
      if (document.visibilityState === 'hidden') saveBeforeLeaving()
    }
    window.addEventListener('pagehide', saveBeforeLeaving)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      window.removeEventListener('pagehide', saveBeforeLeaving)
      document.removeEventListener('visibilitychange', saveWhenHidden)
    }
  }, [currentProject])

  const filteredProjects = useMemo(
    () => projects.filter(project => project.title.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  )

  const beginProject = (template: Template) => {
    if (!flushCurrentProject()) return
    const title = template.id === 'blank' ? 'Untitled Document' : `New ${template.name}`
    try {
      const project = createProject(title, template.id, template.content)
      setCurrentProject(project)
      setShowTemplates(false)
      refreshProjects()
      toast.success('Project created and saved on this device')
    } catch {
      toast.error('Could not create a project. Free browser storage or export your existing drafts.')
    }
  }

  const openProject = (id: string) => {
    if (!flushCurrentProject()) return
    const project = getProject(id)
    if (!project) {
      toast.error('That project could not be opened')
      return
    }
    setCurrentProject(project)
    setShowProjects(false)
  }

  const removeProject = (id: string) => {
    if (!window.confirm('Delete this project from this device? Export a backup first if you may need it.')) return
    deleteProject(id)
    if (currentProject?.id === id) setCurrentProject(null)
    refreshProjects()
    toast.success('Project deleted')
  }

  const exportBackup = () => {
    if (!flushCurrentProject()) return
    try {
      download(exportAllProjects(), `ghostwriter-backup-${new Date().toISOString().slice(0, 10)}.json`)
      toast.success('Backup download started')
    } catch {
      toast.error('Backup failed because a project or the project list could not be read. Your original data is still on this device.')
    }
  }

  const exportWord = async () => {
    if (!currentProject || exportingDocx) return
    setExportingDocx(true)
    try {
      await exportAsDocx(currentProject)
      toast.success('Word document download started')
    } catch {
      toast.error('Word export failed. Your draft is still here; try Markdown or Text export.')
    } finally {
      setExportingDocx(false)
    }
  }

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = await importProjects(file)
      refreshProjects()
      toast.success(`${imported} project${imported === 1 ? '' : 's'} restored`)
    } catch (error) {
      refreshProjects()
      if (error instanceof RestoreError) {
        toast.error(`Restore stopped after ${error.restoredCount} completed project(s). ${error.cleanupFailed ? 'An incomplete record may remain in browser storage. ' : ''}Check your project list before retrying.`)
      } else {
        toast.error('The backup could not be read or is invalid. No projects were restored.')
      }
    } finally {
      event.target.value = ''
    }
  }

  const wipeAll = () => {
    if (!window.confirm("Delete every Bobby's Word Bench project stored in this browser? This cannot be undone.")) return
    if (!window.confirm('Final warning: export a backup first if you need these projects. Continue?')) return
    clearAllProjects()
    setCurrentProject(null)
    refreshProjects()
    toast.success('Local projects cleared')
  }

  const captureSelection = () => {
    const editor = editorRef.current
    if (!editor) return
    const start = editor.selectionStart
    const end = editor.selectionEnd
    const quote = editor.value.slice(start, end)
    setSelectedRange(end > start && quote.trim() ? { start, end, quote } : null)
  }

  const addComment = () => {
    if (!currentProject || !selectedRange || !commentBody.trim()) return
    const comment: DocumentComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      start: selectedRange.start,
      end: selectedRange.end,
      quote: selectedRange.quote,
      body: commentBody.trim(),
      created: new Date().toISOString(),
      resolved: false,
    }
    setSaveStatus('saving')
    setCurrentProject({
      ...currentProject,
      comments: [...(currentProject.comments || []), comment],
    })
    setCommentBody('')
    setSelectedRange(null)
    toast.success('Comment added to the selected text')
  }

  const patchComment = (commentId: string, patch: Partial<DocumentComment>) => {
    if (!currentProject) return
    setSaveStatus('saving')
    setCurrentProject({
      ...currentProject,
      comments: (currentProject.comments || []).map(comment =>
        comment.id === commentId ? { ...comment, ...patch } : comment
      ),
    })
  }

  const removeComment = (commentId: string) => {
    if (!currentProject) return
    setSaveStatus('saving')
    setCurrentProject({
      ...currentProject,
      comments: (currentProject.comments || []).filter(comment => comment.id !== commentId),
    })
  }

  const addTrackedChange = () => {
    if (!currentProject || !selectedRange) return
    const replacement = changeReplacement
    if (replacement === selectedRange.quote) {
      toast.error('The replacement is identical to the selected text')
      return
    }
    const change: DocumentChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      start: selectedRange.start,
      end: selectedRange.end,
      original: selectedRange.quote,
      replacement,
      created: new Date().toISOString(),
      status: 'pending',
      anchorState: 'anchored',
    }
    setSaveStatus('saving')
    setCurrentProject({
      ...currentProject,
      changes: [...(currentProject.changes || []), change],
    })
    setChangeReplacement('')
    setSelectedRange(null)
    toast.success('Tracked change added for review')
  }

  const resolveTrackedChange = (changeId: string, decision: 'accepted' | 'rejected') => {
    if (!currentProject) return
    const change = (currentProject.changes || []).find(item => item.id === changeId)
    if (!change || change.status !== 'pending') return

    if (decision === 'rejected') {
      setSaveStatus('saving')
      setCurrentProject({
        ...currentProject,
        changes: (currentProject.changes || []).map(item =>
          item.id === changeId ? { ...item, status: 'rejected' as const } : item
        ),
      })
      toast.success('Tracked change rejected; draft unchanged')
      return
    }

    const nextContent = acceptDocumentChange(currentProject.content, change)
    if (nextContent === null) {
      toast.error('This tracked change can no longer be anchored uniquely. Review the passage manually.')
      return
    }

    setSaveStatus('saving')
    const acceptedChanges = (currentProject.changes || []).map(item =>
      item.id === changeId ? { ...item, status: 'accepted' as const } : item
    )
    setCurrentProject({
      ...currentProject,
      content: nextContent,
      comments: rebaseDocumentComments(
        currentProject.content,
        nextContent,
        currentProject.comments || [],
      ),
      changes: rebaseDocumentChanges(
        currentProject.content,
        nextContent,
        acceptedChanges,
        { start: change.start, end: change.end },
      ),
    })
    toast.success('Tracked change accepted')
  }

  const saveRevision = () => {
    if (!currentProject) return
    try {
      const next = createProjectRevision(currentProject)
      setCurrentProject(next)
      refreshProjects()
      setSaveStatus('saved')
      toast.success('Version checkpoint saved')
    } catch {
      toast.error('Could not save version checkpoint')
    }
  }

  const restoreRevision = (revisionId: string) => {
    if (!currentProject) return
    if (!window.confirm('Restore this version? Your current draft will be saved as a new checkpoint first.')) return
    try {
      const next = restoreProjectRevision(currentProject, revisionId)
      setCurrentProject(next)
      refreshProjects()
      setSaveStatus('saved')
      toast.success('Version restored; previous draft preserved')
    } catch {
      toast.error('Could not restore that version')
    }
  }

  const comparedRevision = currentProject?.revisions?.find(revision => revision.id === compareRevisionId) || null
  const checkpointDiff = currentProject && comparedRevision
    ? diffDocumentLines(comparedRevision.content, currentProject.content)
    : null
  const storage = getStorageStats()
  const words = currentProject ? countWords(currentProject.content) : 0
  const readTime = currentProject ? estimateReadingTime(currentProject.content) : 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>✍️</span>
              <h1 className="text-xl font-bold">Bobby&apos;s Word Bench</h1>
            </div>
            <p className="text-xs text-muted-foreground">Private, local-first writing studio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" onClick={() => setShowTemplates(true)}><FilePlus className="mr-2 h-4 w-4" />New</Button>
            <Button className="min-h-11" variant="outline" onClick={() => setShowProjects(true)}><FolderOpen className="mr-2 h-4 w-4" />Projects ({projects.length})</Button>
            <Button className="min-h-11 min-w-11" variant="outline" onClick={() => setDark(value => !value)} aria-label="Toggle color theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-5 grid gap-3 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Privacy</CardDescription><CardTitle className="text-base">Saved in this browser</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No account or cloud upload is required.</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Recovery</CardDescription><CardTitle className="text-base">Portable backups</CardTitle></CardHeader><CardContent className="flex gap-2"><Button className="min-h-11" size="sm" variant="outline" onClick={exportBackup} disabled={!projects.length}><HardDriveDownload className="mr-2 h-4 w-4" />Backup</Button><Button className="min-h-11" size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Restore</Button><input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={restoreBackup} /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Local storage estimate</CardDescription><CardTitle className="text-base">{Math.round(storage.percentage)}% used</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Back up before clearing browser data or changing devices.</CardContent></Card>
        </section>

        {currentProject ? (
          <section className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center">
                <Input aria-label="Project title" value={currentProject.title} onChange={event => { setSaveStatus('saving'); setCurrentProject({...currentProject, title: event.target.value}) }} className="text-lg font-semibold" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{words} words</Badge><Badge variant="outline">{readTime} min</Badge>
                  <Badge variant={saveStatus === 'error' ? 'destructive' : 'secondary'}>{saveStatus === 'saved' ? 'Saved locally' : saveStatus === 'saving' ? 'Saving…' : 'Save failed'}</Badge>
                  <Button size="sm" variant="outline" onClick={saveRevision}><Clock3 className="mr-2 h-4 w-4" />Checkpoint</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}><History className="mr-2 h-4 w-4" />History ({currentProject.revisions?.length || 0})</Button>
                  <Button size="sm" variant="outline" onClick={() => exportAsMarkdown(currentProject)}><Download className="mr-2 h-4 w-4" />Markdown</Button>
                  <Button size="sm" variant="outline" onClick={exportWord} disabled={exportingDocx}><Download className="mr-2 h-4 w-4" />{exportingDocx ? 'Preparing Word…' : 'Word (.docx)'}</Button>
                  <Button size="sm" variant="outline" onClick={() => exportAsText(currentProject)}><Download className="mr-2 h-4 w-4" />Text</Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    ref={editorRef}
                    aria-label="Writing editor"
                    value={currentProject.content}
                    onSelect={captureSelection}
                    onKeyUp={captureSelection}
                    onClick={captureSelection}
                    onChange={event => {
                      setSaveStatus('saving')
                      const nextContent = event.target.value
                      const editRange = inferDocumentEditRange(currentProject.content, nextContent)
                      setCurrentProject({
                        ...currentProject,
                        content: nextContent,
                        comments: rebaseDocumentComments(
                          currentProject.content,
                          nextContent,
                          currentProject.comments || [],
                        ),
                        changes: rebaseDocumentChanges(
                          currentProject.content,
                          nextContent,
                          currentProject.changes || [],
                          editRange,
                        ),
                      })
                      setSelectedRange(null)
                    }}
                    placeholder="Start writing…"
                    className="min-h-[58vh] resize-y border-0 font-serif text-base leading-7 shadow-none focus-visible:ring-0"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquarePlus className="h-4 w-4" />
                    Review
                  </CardTitle>
                  <CardDescription>Select text to add a comment or propose a tracked replacement. Suggestions do not change the draft until accepted.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Selected text</div>
                    <div className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-2 text-sm">
                      {selectedRange?.quote || 'Select a passage in the editor.'}
                    </div>
                    <Input
                      aria-label="Comment text"
                      value={commentBody}
                      onChange={event => setCommentBody(event.target.value)}
                      placeholder="Add review note…"
                      disabled={!selectedRange}
                    />
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={addComment}
                      disabled={!selectedRange || !commentBody.trim()}
                    >
                      <MessageSquarePlus className="mr-2 h-4 w-4" />
                      Add comment
                    </Button>
                    <div className="border-t border-border pt-2">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">Tracked replacement</div>
                      <Textarea
                        aria-label="Replacement text"
                        value={changeReplacement}
                        onChange={event => setChangeReplacement(event.target.value)}
                        placeholder="Propose replacement text…"
                        disabled={!selectedRange}
                        className="min-h-20 text-sm"
                      />
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant="outline"
                        onClick={addTrackedChange}
                        disabled={!selectedRange}
                      >
                        Suggest replacement
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tracked changes ({(currentProject.changes || []).filter(change => change.status === 'pending').length} pending)
                    </div>
                    {(currentProject.changes || []).length === 0 && (
                      <p className="py-2 text-center text-sm text-muted-foreground">No tracked changes yet.</p>
                    )}
                    {(currentProject.changes || [])
                      .slice()
                      .sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending') || a.start - b.start)
                      .map(change => (
                        <div key={change.id} className={`rounded-lg border p-3 ${
                          change.status === 'pending'
                            ? 'border-blue-500/30 bg-blue-500/5'
                            : 'border-border bg-muted/40 opacity-70'
                        }`}>
                          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {change.status}
                          </div>
                          <div className="mt-2 text-xs">
                            <div className="rounded bg-rose-500/10 p-2 text-rose-300 line-through">− {change.original}</div>
                            <div className="mt-1 rounded bg-emerald-500/10 p-2 text-emerald-300">+ {change.replacement || 'Delete selected text'}</div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">{new Date(change.created).toLocaleString()}</span>
                            {change.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => resolveTrackedChange(change.id, 'accepted')}>Accept</Button>
                                <Button size="sm" variant="ghost" onClick={() => resolveTrackedChange(change.id, 'rejected')}>Reject</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comments</div>
                  </div>
                  <div className="max-h-[44vh] space-y-3 overflow-y-auto">
                    {(currentProject.comments || []).length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">No review comments yet.</p>
                    )}
                    {(currentProject.comments || [])
                      .slice()
                      .sort((a, b) => Number(a.resolved) - Number(b.resolved) || a.start - b.start)
                      .map(comment => (
                        <div key={comment.id} className={`rounded-lg border p-3 ${comment.resolved ? 'border-border bg-muted/40 opacity-70' : 'border-amber-500/30 bg-amber-500/5'}`}>
                          <div className="line-clamp-3 whitespace-pre-wrap text-xs font-medium">“{comment.quote}”</div>
                          {comment.anchorState === 'unresolved' && (
                            <div className="mt-2 rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-300">
                              Anchor unresolved — passage changed or was removed. Review this comment manually.
                            </div>
                          )}
                          <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">{new Date(comment.created).toLocaleString()}</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => patchComment(comment.id, { resolved: !comment.resolved })}
                                aria-label={comment.resolved ? 'Reopen comment' : 'Resolve comment'}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeComment(comment.id)}
                                aria-label="Delete comment"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <AIWritingPanel
              draft={currentProject.content}
              onApply={content => {
                setSaveStatus('saving')
                const editRange = inferDocumentEditRange(currentProject.content, content)
                setCurrentProject({
                  ...currentProject,
                  content,
                  comments: rebaseDocumentComments(
                    currentProject.content,
                    content,
                    currentProject.comments || [],
                  ),
                  changes: rebaseDocumentChanges(
                    currentProject.content,
                    content,
                    currentProject.changes || [],
                    editRange,
                  ),
                })
              }}
            />
          </section>
        ) : (
          <Card className="mx-auto mt-12 max-w-2xl"><CardContent className="py-14 text-center"><div className="mb-4 text-6xl">✍️</div><h2 className="text-2xl font-bold">Your words stay yours</h2><p className="mx-auto mt-2 max-w-lg text-muted-foreground">Create a blank document or start from a practical template. GhostWriter automatically saves your work on this device.</p><div className="mt-6 flex justify-center gap-3"><Button className="min-h-11" size="lg" onClick={() => setShowTemplates(true)}>Create a project</Button>{projects.length > 0 && <Button className="min-h-11" size="lg" variant="outline" onClick={() => setShowProjects(true)}>Open a project</Button>}</div></CardContent></Card>
        )}
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-border px-4 py-6 text-xs text-muted-foreground">
        <span>Bobby&apos;s Word Bench {APP_VERSION} · Local-first writing studio</span>
        <div className="flex gap-3"><button className="min-h-11 px-2 underline" onClick={() => setShowOnboarding(true)}>Help & privacy</button><button className="min-h-11 px-2 text-destructive underline" onClick={wipeAll}>Clear local data</button></div>
      </footer>

      {showHistory && currentProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Version history">
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle>Version history</CardTitle>
              <CardDescription>Manual local checkpoints. Restoring a version first preserves your current draft as a new checkpoint.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                {(currentProject.revisions || []).length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">No checkpoints yet.</p>
                )}
                {(currentProject.revisions || []).map(revision => (
                  <div key={revision.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate">{revision.title}</strong>
                      <span className="text-xs text-muted-foreground">
                        {revision.wordCount} words · {new Date(revision.created).toLocaleString()}
                      </span>
                      <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {revision.content.slice(0, 220) || 'Empty document'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Button size="sm" variant="outline" onClick={() => setCompareRevisionId(revision.id)}>
                        <GitCompareArrows className="mr-2 h-4 w-4" />Compare
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => restoreRevision(revision.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {comparedRevision && checkpointDiff && (
                <div className="mt-5 rounded-lg border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
                    <div>
                      <div className="font-semibold">Checkpoint comparison</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(comparedRevision.created).toLocaleString()} → current draft
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">+{checkpointDiff.added} lines</Badge>
                      <Badge variant="outline">-{checkpointDiff.removed} lines</Badge>
                      <Badge variant="secondary">{checkpointDiff.unchanged} unchanged</Badge>
                      <Button size="sm" variant="ghost" onClick={() => setCompareRevisionId(null)}>Clear</Button>
                    </div>
                  </div>
                  <div className="max-h-[38vh] overflow-auto font-mono text-xs">
                    {checkpointDiff.lines.map((line, index) => (
                      <div
                        key={`${index}-${line.kind}-${line.oldLine ?? 'x'}-${line.newLine ?? 'x'}`}
                        className={
                          line.kind === 'added'
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : line.kind === 'removed'
                              ? 'bg-rose-500/10 text-rose-200'
                              : 'text-muted-foreground'
                        }
                      >
                        <div className="grid grid-cols-[3rem_3rem_1fr] gap-2 px-3 py-1">
                          <span className="text-right opacity-60">{line.oldLine ?? ''}</span>
                          <span className="text-right opacity-60">{line.newLine ?? ''}</span>
                          <span className="whitespace-pre-wrap break-words">
                            {line.kind === 'added' ? '+ ' : line.kind === 'removed' ? '- ' : '  '}
                            {line.text || ' '}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={saveRevision}>Save checkpoint</Button>
                <Button className="flex-1" variant="outline" onClick={() => { setShowHistory(false); setCompareRevisionId(null) }}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showTemplates && <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Choose a template"><Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Choose a starting point</CardTitle><CardDescription>Every project can be changed freely after creation.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{TEMPLATES.map(template => <button key={template.id} className="rounded-xl border border-border p-4 text-left hover:bg-muted" onClick={() => beginProject(template)}><span className="text-2xl">{template.icon}</span><strong className="mt-2 block">{template.name}</strong><span className="text-sm text-muted-foreground">{template.description}</span></button>)}<Button className="sm:col-span-2" variant="outline" onClick={() => setShowTemplates(false)}>Cancel</Button></CardContent></Card></div>}

      {showProjects && <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Projects"><Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Your projects</CardTitle><CardDescription>Stored only in this browser unless you export a backup.</CardDescription></CardHeader><CardContent><div className="relative mb-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search project titles" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="max-h-[55vh] space-y-2 overflow-y-auto">{filteredProjects.map(project => <div key={project.id} className="flex items-center gap-2 rounded-lg border border-border p-3"><button className="flex-1 text-left" onClick={() => openProject(project.id)}><strong className="block">{project.title}</strong><span className="text-xs text-muted-foreground">{project.wordCount} words · {new Date(project.modified).toLocaleString()}</span></button><Button size="sm" variant="ghost" aria-label={`Delete ${project.title}`} onClick={() => removeProject(project.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}{filteredProjects.length === 0 && <p className="py-8 text-center text-muted-foreground">No matching projects.</p>}</div><Button className="mt-4 w-full" variant="outline" onClick={() => setShowProjects(false)}>Close</Button></CardContent></Card></div>}

      {showOnboarding && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Welcome to GhostWriter"><Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Welcome to Bobby&apos;s Word Bench</CardTitle><CardDescription>A quiet place to draft, organize, and export your writing.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><ol className="list-decimal space-y-2 pl-5"><li>Create a project from a template or blank page.</li><li>Your work auto-saves in this browser.</li><li>Download backups regularly—clearing browser data can erase local projects.</li><li>Export finished work as Word, Markdown, or plain text. Word export keeps your text and Markdown symbols as typed.</li></ol><div className="rounded-lg bg-muted p-3"><strong>Privacy:</strong> this app does not require an account and does not upload writing to a Bobby's Word Bench server. Optional analytics report general app usage on hosted Vercel deployments; they should be disabled if you require zero telemetry.</div><div className="rounded-lg border border-amber-500/40 p-3"><strong>Current feature set:</strong> Bobby's Word Bench is local-first. Synchronization, AI writing, and PDF export are not part of this version.</div><Button className="min-h-11 w-full" onClick={() => { localStorage.setItem(ONBOARDING_KEY, 'true'); setShowOnboarding(false) }}>Start writing</Button></CardContent></Card></div>}
    </div>
  )
}
