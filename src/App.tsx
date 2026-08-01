import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Download, FilePlus, FolderOpen, HardDriveDownload, Moon, Search, Sun, Trash2, Upload } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Badge } from './components/ui/badge'
import { TEMPLATES, type Template } from './lib/templates'
import {
  clearAllProjects,
  countWords,
  createProject,
  deleteProject,
  estimateReadingTime,
  exportAllProjects,
  getAllProjectsMetadata,
  getProject,
  getStorageStats,
  importProjects,
  saveProject,
  type Project,
  type ProjectMetadata,
} from './lib/project-storage'
import { exportAsMarkdown, exportAsText } from './lib/export'

const APP_VERSION = '1.1.0-family.1'
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

  const refreshProjects = () => {
    const next = getAllProjectsMetadata().sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    )
    setProjects(next)
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
        toast.error('Could not save. Export a backup before continuing.')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [currentProject])

  const filteredProjects = useMemo(
    () => projects.filter(project => project.title.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  )

  const beginProject = (template: Template) => {
    const title = template.id === 'blank' ? 'Untitled Document' : `New ${template.name}`
    const project = createProject(title, template.id, template.content)
    setCurrentProject(project)
    setShowTemplates(false)
    refreshProjects()
    toast.success('Project created and saved on this device')
  }

  const openProject = (id: string) => {
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
    download(exportAllProjects(), `ghostwriter-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('Backup downloaded')
  }

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const imported = await importProjects(file)
      refreshProjects()
      toast.success(`${imported} project${imported === 1 ? '' : 's'} restored`)
    } catch {
      toast.error('That is not a valid GhostWriter backup')
    } finally {
      event.target.value = ''
    }
  }

  const wipeAll = () => {
    if (!window.confirm('Delete every GhostWriter project stored in this browser? This cannot be undone.')) return
    if (!window.confirm('Final warning: export a backup first if you need these projects. Continue?')) return
    clearAllProjects()
    setCurrentProject(null)
    refreshProjects()
    toast.success('Local projects cleared')
  }

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
              <h1 className="text-xl font-bold">GhostWriter</h1>
              <Badge variant="outline">Family Preview</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Private, local-first writing studio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowTemplates(true)}><FilePlus className="mr-2 h-4 w-4" />New</Button>
            <Button variant="outline" onClick={() => setShowProjects(true)}><FolderOpen className="mr-2 h-4 w-4" />Projects ({projects.length})</Button>
            <Button variant="outline" onClick={() => setDark(value => !value)} aria-label="Toggle color theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-5 grid gap-3 md:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Privacy</CardDescription><CardTitle className="text-base">Saved in this browser</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">No account or cloud upload is required.</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Recovery</CardDescription><CardTitle className="text-base">Portable backups</CardTitle></CardHeader><CardContent className="flex gap-2"><Button size="sm" variant="outline" onClick={exportBackup} disabled={!projects.length}><HardDriveDownload className="mr-2 h-4 w-4" />Backup</Button><Button size="sm" variant="outline" onClick={() => importRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Restore</Button><input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={restoreBackup} /></CardContent></Card>
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
                  <Button size="sm" variant="outline" onClick={() => exportAsMarkdown(currentProject)}><Download className="mr-2 h-4 w-4" />Markdown</Button>
                  <Button size="sm" variant="outline" onClick={() => exportAsText(currentProject)}><Download className="mr-2 h-4 w-4" />Text</Button>
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-6"><Textarea aria-label="Writing editor" value={currentProject.content} onChange={event => { setSaveStatus('saving'); setCurrentProject({...currentProject, content: event.target.value}) }} placeholder="Start writing…" className="min-h-[58vh] resize-y border-0 font-serif text-base leading-7 shadow-none focus-visible:ring-0" /></CardContent></Card>
          </section>
        ) : (
          <Card className="mx-auto mt-12 max-w-2xl"><CardContent className="py-14 text-center"><div className="mb-4 text-6xl">✍️</div><h2 className="text-2xl font-bold">Your words stay yours</h2><p className="mx-auto mt-2 max-w-lg text-muted-foreground">Create a blank document or start from a practical template. GhostWriter automatically saves your work on this device.</p><div className="mt-6 flex justify-center gap-3"><Button size="lg" onClick={() => setShowTemplates(true)}>Create a project</Button>{projects.length > 0 && <Button size="lg" variant="outline" onClick={() => setShowProjects(true)}>Open a project</Button>}</div></CardContent></Card>
        )}
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-border px-4 py-6 text-xs text-muted-foreground">
        <span>GhostWriter {APP_VERSION} · Local-first preview</span>
        <div className="flex gap-3"><button className="underline" onClick={() => setShowOnboarding(true)}>Help & privacy</button><button className="text-destructive underline" onClick={wipeAll}>Clear local data</button></div>
      </footer>

      {showTemplates && <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Choose a template"><Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Choose a starting point</CardTitle><CardDescription>Every project can be changed freely after creation.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{TEMPLATES.map(template => <button key={template.id} className="rounded-xl border border-border p-4 text-left hover:bg-muted" onClick={() => beginProject(template)}><span className="text-2xl">{template.icon}</span><strong className="mt-2 block">{template.name}</strong><span className="text-sm text-muted-foreground">{template.description}</span></button>)}<Button className="sm:col-span-2" variant="outline" onClick={() => setShowTemplates(false)}>Cancel</Button></CardContent></Card></div>}

      {showProjects && <div className="fixed inset-0 z-40 overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Projects"><Card className="mx-auto max-w-2xl"><CardHeader><CardTitle>Your projects</CardTitle><CardDescription>Stored only in this browser unless you export a backup.</CardDescription></CardHeader><CardContent><div className="relative mb-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search project titles" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="max-h-[55vh] space-y-2 overflow-y-auto">{filteredProjects.map(project => <div key={project.id} className="flex items-center gap-2 rounded-lg border border-border p-3"><button className="flex-1 text-left" onClick={() => openProject(project.id)}><strong className="block">{project.title}</strong><span className="text-xs text-muted-foreground">{project.wordCount} words · {new Date(project.modified).toLocaleString()}</span></button><Button size="sm" variant="ghost" aria-label={`Delete ${project.title}`} onClick={() => removeProject(project.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}{filteredProjects.length === 0 && <p className="py-8 text-center text-muted-foreground">No matching projects.</p>}</div><Button className="mt-4 w-full" variant="outline" onClick={() => setShowProjects(false)}>Close</Button></CardContent></Card></div>}

      {showOnboarding && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Welcome to GhostWriter"><Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Welcome to GhostWriter</CardTitle><CardDescription>A quiet place to draft, organize, and export your writing.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm"><ol className="list-decimal space-y-2 pl-5"><li>Create a project from a template or blank page.</li><li>Your work auto-saves in this browser.</li><li>Download backups regularly—clearing browser data can erase local projects.</li><li>Export finished work as Markdown or plain text.</li></ol><div className="rounded-lg bg-muted p-3"><strong>Privacy:</strong> this preview does not require an account and does not upload writing to a GhostWriter server. Optional analytics report general app usage on hosted Vercel deployments; they should be disabled if you require zero telemetry.</div><div className="rounded-lg border border-amber-500/40 p-3"><strong>Preview limitation:</strong> synchronization, AI writing, PDF/DOCX export, and app-store distribution are not included in this release.</div><Button className="w-full" onClick={() => { localStorage.setItem(ONBOARDING_KEY, 'true'); setShowOnboarding(false) }}>Start writing</Button></CardContent></Card></div>}
    </div>
  )
}
