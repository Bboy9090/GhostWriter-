import { useState, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Input } from './components/ui/input'
import { Textarea } from './components/ui/textarea'
import { Separator } from './components/ui/separator'
import { Badge } from './components/ui/badge'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/ui/sheet'
import {
  FilePlus,
  Download,
  Trash2,
  FolderOpen,
  Sparkle,
  Search,
} from 'lucide-react'

import { TEMPLATES, type Template } from './lib/templates'
import {
  createProject,
  saveProject,
  getProject,
  getAllProjectsMetadata,
  deleteProject,
  countWords,
  estimateReadingTime,
  type Project,
  type ProjectMetadata,
} from './lib/project-storage'
import { exportAsMarkdown, exportAsText } from './lib/export'
import { isAIAvailable } from './lib/ai-config'

function App() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [showProjects, setShowProjects] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = () => {
    const allProjects = getAllProjectsMetadata()
    // Sort by modified date (newest first)
    allProjects.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
    setProjects(allProjects)
  }

  // Auto-save current project
  useEffect(() => {
    if (!currentProject) return

    setSaveStatus('saving')
    const timer = setTimeout(() => {
      saveProject(currentProject)
      setSaveStatus('saved')
      loadProjects() // Refresh project list
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentProject?.content])

  const handleNewProject = (template: Template) => {
    const title = template.id === 'blank' ? 'Untitled Document' : `New ${template.name}`
    const project = createProject(title, template.id, template.content)
    setCurrentProject(project)
    setShowTemplates(false)
    toast.success(`Created new ${template.name}`)
  }

  const handleLoadProject = (id: string) => {
    const project = getProject(id)
    if (project) {
      setCurrentProject(project)
      setShowProjects(false)
      toast.success('Project loaded')
    } else {
      toast.error('Failed to load project')
    }
  }

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id)
      if (currentProject?.id === id) {
        setCurrentProject(null)
      }
      loadProjects()
      toast.success('Project deleted')
    }
  }

  const handleContentChange = (newContent: string) => {
    if (currentProject) {
      setSaveStatus('unsaved')
      setCurrentProject({ ...currentProject, content: newContent })
    }
  }

  const handleTitleChange = (newTitle: string) => {
    if (currentProject) {
      setCurrentProject({ ...currentProject, title: newTitle })
    }
  }

  const handleExportMarkdown = () => {
    if (currentProject) {
      exportAsMarkdown(currentProject)
      toast.success('Exported as Markdown')
    }
  }

  const handleExportText = () => {
    if (currentProject) {
      exportAsText(currentProject)
      toast.success('Exported as Text')
    }
  }

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const wordCount = currentProject ? countWords(currentProject.content) : 0
  const readingTime = currentProject ? estimateReadingTime(currentProject.content) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">✍️</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Ghost Writer
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Write without limits. Publish with confidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Project */}
            <Sheet open={showTemplates} onOpenChange={setShowTemplates}>
              <SheetTrigger asChild>
                <Button variant="default">
                  <FilePlus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Choose a Template</SheetTitle>
                  <SheetDescription>
                    Start with a template or create a blank document
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 grid gap-4">
                  {TEMPLATES.map(template => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => handleNewProject(template)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          {template.name}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Open Projects */}
            <Sheet open={showProjects} onOpenChange={setShowProjects}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Projects ({projects.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Your Projects</SheetTitle>
                  <SheetDescription>
                    Open or delete existing projects
                  </SheetDescription>
                </SheetHeader>

                {/* Search */}
                <div className="mt-6 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredProjects.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      {searchQuery ? 'No projects found' : 'No projects yet. Create your first one!'}
                    </p>
                  ) : (
                    filteredProjects.map(project => (
                      <Card
                        key={project.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1" onClick={() => handleLoadProject(project.id)}>
                              <CardTitle className="text-base">{project.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {project.wordCount} words · {new Date(project.modified).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Editor */}
        {currentProject ? (
          <div className="grid gap-6">
            {/* Toolbar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      value={currentProject.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="text-lg font-semibold border-none shadow-none focus-visible:ring-0"
                      placeholder="Document title..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {wordCount} words
                    </Badge>
                    <Badge variant="outline">
                      {readingTime} min read
                    </Badge>
                    <Badge variant={saveStatus === 'saved' ? 'default' : 'secondary'}>
                      {saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                      <Download className="mr-2 h-4 w-4" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportText}>
                      <Download className="mr-2 h-4 w-4" />
                      Text
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  value={currentProject.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start writing..."
                  className="min-h-[500px] text-base leading-relaxed font-serif resize-none border-none shadow-none focus-visible:ring-0"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Tip:</strong> Your work is automatically saved every 2 seconds.
                  Use Markdown formatting for headers (#), bold (**text**), italic (*text*), and more.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mt-12">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-6xl mb-4">✍️</div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Ghost Writer</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Create a new project or open an existing one to start writing.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button onClick={() => setShowTemplates(true)} size="lg">
                  <FilePlus className="mr-2 h-5 w-5" />
                  New Project
                </Button>
                {projects.length > 0 && (
                  <Button onClick={() => setShowProjects(true)} variant="outline" size="lg">
                    <FolderOpen className="mr-2 h-5 w-5" />
                    Open Project
                  </Button>
                )}
              </div>

              <Separator className="my-8" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                <div>
                  <h3 className="font-semibold mb-2">📝 Built-in Templates</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Email, essay, script, blog, and chapter templates to get you started.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">💾 Auto-Save</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your work is saved automatically every 2 seconds. Never lose your progress.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📤 Export Anywhere</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Export as Markdown or plain text. Your work, your format.
                  </p>
                </div>
              </div>

              {!isAIAvailable() && (
                <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <Sparkle className="inline h-4 w-4 mr-1" />
                    <strong>AI is optional:</strong> Ghost Writer works perfectly offline.
                    Configure AI assistance in settings if you want additional features.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Toaster />
      <SpeedInsights />
      <Analytics />
    </div>
  )
}

export default App
