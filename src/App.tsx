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
  Browser,
  Camera,
  DeviceMobile,
  Lightning,
  Lock,
  LockOpen,
  MagnifyingGlass,
  Share,
  Sparkle,
  Warning,
  Folder,
  House,
  GearSix,
  Eye,
  Vault,
  Ghost,
  CheckCircle,
  BookOpen,
  ListBullets,
  UploadSimple,
} from '@phosphor-icons/react'
import { useIsMobile } from './hooks/use-mobile'
import { usePopoutPortal } from './hooks/use-popout-portal'
import { useCaptureLog } from './hooks/use-capture-log'
import {
  FilePlus,
  Download,
  Trash2,
  FolderOpen,
  Sparkle,
  Search,
} from 'lucide-react'

type CaptureEntry = {
  id: string
  sourceApp: string
  content: string
  confidence: number
  tags: string[]
  capturedAt: string
}

type PipelineStep = {
  title: string
  description: string
  metric: string
  status: 'live' | 'warming' | 'idle'
  icon: string
  color: string
}

type ServiceStatus = {
  name: string
  status: 'healthy' | 'degraded' | 'offline'
  detail: string
}

const pipelineSteps: PipelineStep[] = [
  {
    title: 'Capture Buffer',
    description: 'MediaProjection frames with delta gating and overlay-first launch.',
    metric: '2.1% visual delta',
    status: 'live',
    icon: '📡',
    color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30',
  },
  {
    title: 'OCR Extraction',
    description: 'On-device ML Kit recognition with block geometry retention.',
    metric: '41ms p95',
    status: 'live',
    icon: '🔍',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  },
  {
    title: 'Dedup Gatekeeper',
    description: 'Levenshtein + SimHash over the last five blocks.',
    metric: '89% similarity cutoff',
    status: 'live',
    icon: '🛡️',
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  },
  {
    title: 'Healer Pass',
    description: 'Local LLM cleanup restores paragraphs and fixes line breaks.',
    metric: 'Gemma 2B',
    status: 'warming',
    icon: '🧠',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  },
  {
    title: 'Vault Sync',
    description: 'WebSocket stream into pgvector with RRF hybrid search.',
    metric: '32ms round-trip',
    status: 'live',
    icon: '🗄️',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  },
]

const captureFeed: CaptureEntry[] = [
  {
    id: 'cap-1',
    sourceApp: 'Chrome',
    content: 'MediaProjection must start after overlay is visible on Android 15.',
    confidence: 97,
    tags: ['portal', 'permissions'],
    capturedAt: '09:42 AM',
  },
  {
    id: 'cap-2',
    sourceApp: 'PDF Reader',
    content: 'Dedup gate ignored 4 repeated paragraphs during slow scroll.',
    confidence: 94,
    tags: ['dedupe', 'scroll'],
    capturedAt: '09:44 AM',
  },
  {
    id: 'cap-3',
    sourceApp: 'Instagram',
    content: 'Healer reconstructed the paragraph and removed line breaks.',
    confidence: 91,
    tags: ['healer', 'formatting'],
    capturedAt: '09:45 AM',
  },
  {
    id: 'cap-4',
    sourceApp: 'Docs',
    content: 'Portal captured block geometry for layout-aware syncing.',
    confidence: 96,
    tags: ['layout', 'blocks'],
    capturedAt: '09:47 AM',
  },
  {
    id: 'cap-5',
    sourceApp: 'News',
    content: 'Vault indexed the entry with vector embeddings in 28ms.',
    confidence: 93,
    tags: ['vault', 'pgvector'],
    capturedAt: '09:49 AM',
  },
]

const featureHighlights = [
  {
    title: 'Stealth Overlay',
    description: 'Floating portal UI stays above other apps without recording.',
    tag: 'Portal UI',
    icon: '👻',
    gradient: 'from-emerald-500/10 via-transparent to-cyan-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    title: 'On-Device Healer',
    description: 'Gemma-class LLM cleanup keeps paragraphs intact and readable.',
    tag: 'Healer',
    icon: '🧠',
    gradient: 'from-purple-500/10 via-transparent to-pink-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    title: 'Hybrid Search',
    description: 'RRF merges keyword and vector search into one ranking.',
    tag: 'Oracle',
    icon: '🔮',
    gradient: 'from-cyan-500/10 via-transparent to-blue-500/10',
    borderColor: 'border-cyan-500/20',
  },
  {
    title: 'Zero-Knowledge Vault',
    description: 'Raw frames never leave the device. Only healed text syncs.',
    tag: 'Security',
    icon: '🔐',
    gradient: 'from-amber-500/10 via-transparent to-orange-500/10',
    borderColor: 'border-amber-500/20',
  },
]

const vaultStats = [
  { label: 'Vault Entries', value: '128,440', detail: '+1,482 today', color: 'text-emerald-400' },
  { label: 'Dedup Rate', value: '92.4%', detail: 'scroll-safe', color: 'text-cyan-400' },
  { label: 'OCR Latency', value: '41ms', detail: 'p95 on-device', color: 'text-purple-400' },
  { label: 'Sync Lag', value: '28ms', detail: 'websocket', color: 'text-amber-400' },
]

const serviceHealth: ServiceStatus[] = [
  { name: 'ghost-api', status: 'healthy', detail: 'p95 33ms' },
  { name: 'vault-db', status: 'healthy', detail: 'pgvector hnsw ready' },
  { name: 'ghost-stream', status: 'healthy', detail: 'redis fanout ok' },
  { name: 'embedding', status: 'degraded', detail: 'fallback to keywords' },
]

const captureModes = [
  { key: 'quality', label: 'Quality', fps: 3, delta: '1.5%', icon: '🎯' },
  { key: 'balanced', label: 'Balanced', fps: 5, delta: '2.0%', icon: '⚖️' },
  { key: 'turbo', label: 'Turbo', fps: 10, delta: '3.5%', icon: '⚡' },
]

// Nav items - "Upload" = iPhone Capture (screenshots/recordings)
const navItems = [
  { key: 'overview', label: 'Home', icon: House },
  { key: 'portal', label: 'Portal', icon: Eye },
  { key: 'extractor', label: 'God Mode', icon: Sparkle },
  { key: 'vault', label: 'Vault', icon: Vault },
  { key: 'search', label: 'Search', icon: MagnifyingGlass },
  { key: 'ios', label: 'Upload', icon: UploadSimple },
  { key: 'ops', label: 'Ops', icon: GearSix },
]

function StatusLegend({
  portalActive,
  vaultUnlocked,
  healerEnabled,
  stealthMode,
}: {
  portalActive: boolean
  vaultUnlocked: boolean
  healerEnabled: boolean
  stealthMode: boolean
}) {
  const items = [
    {
      label: 'Portal',
      active: portalActive,
      activeColor: 'bg-emerald-500',
      inactiveColor: 'bg-zinc-600',
      glowColor: 'shadow-emerald-500/50',
      icon: Ghost,
    },
    {
      label: 'Vault',
      active: vaultUnlocked,
      activeColor: 'bg-cyan-500',
      inactiveColor: 'bg-zinc-600',
      glowColor: 'shadow-cyan-500/50',
      icon: Vault,
    },
    {
      label: 'Healer',
      active: healerEnabled,
      activeColor: 'bg-purple-500',
      inactiveColor: 'bg-zinc-600',
      glowColor: 'shadow-purple-500/50',
      icon: Sparkle,
    },
    {
      label: 'Stealth',
      active: stealthMode,
      activeColor: 'bg-amber-500',
      inactiveColor: 'bg-zinc-600',
      glowColor: 'shadow-amber-500/50',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
      {items.map(item => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full bg-card/80 border border-border/50 backdrop-blur-sm"
        >
          <div className="relative">
            <div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-500 ${
                item.active ? `${item.activeColor} shadow-lg ${item.glowColor}` : item.inactiveColor
              }`}
            />
            {item.active && (
              <div
                className={`absolute inset-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${item.activeColor} animate-ping opacity-50`}
              />
            )}
          </div>
          <item.icon
            size={12}
            className={item.active ? 'text-foreground' : 'text-muted-foreground'}
          />
          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function StorageBar({ captureCount }: { captureCount: number }) {
  const stats = useMemo(() => getStorageStats(), [captureCount])
  const [showSettings, setShowSettings] = useState(false)
  const [maxInput, setMaxInput] = useState(String(getMaxEntries()))

  const barColor =
    stats.percentFull >= 90
      ? 'bg-red-500'
      : stats.percentFull >= 80
        ? 'bg-amber-500'
        : stats.percentFull >= 50
          ? 'bg-cyan-500'
          : 'bg-emerald-500'

  const handleSaveMax = () => {
    const n = parseInt(maxInput, 10)
    if (n >= 100) {
      setMaxEntries(n)
      toast.success(`Max entries set to ${n.toLocaleString()}`)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-3 space-y-2">
      {/* Storage bar */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium">
          Vault Storage: {stats.entryCount.toLocaleString()} / {stats.maxEntries.toLocaleString()}{' '}
          entries
        </span>
        <span>{stats.sizeFormatted}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 bottom-0 ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, stats.percentFull)}%` }}
        />
      </div>

      {/* Warning when near full */}
      {stats.isNearFull && (
        <div
          className={`flex items-center gap-2 text-[10px] p-2 rounded-lg ${
            stats.isFull
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}
        >
          <Warning size={14} weight="fill" />
          <span>
            {stats.isFull
              ? 'Vault is full! Export your data and clear to continue capturing.'
              : `Vault is ${stats.percentFull}% full. Consider exporting and clearing soon.`}
          </span>
        </div>
      )}

      {/* Export / settings row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] h-7"
          onClick={() => {
            downloadCaptures('json')
            toast.success('Captures exported as JSON')
          }}
          disabled={captureCount === 0}
        >
          Export JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] h-7"
          onClick={() => {
            downloadCaptures('text')
            toast.success('Captures exported as text')
          }}
          disabled={captureCount === 0}
        >
          Export Text
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-[10px] h-7 text-muted-foreground"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide limit' : 'Set limit'}
        </Button>
      </div>

      {/* Max entries setting */}
      {showSettings && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Max entries:</span>
          <Input
            type="number"
            min={100}
            max={50000}
            value={maxInput}
            onChange={e => setMaxInput(e.target.value)}
            className="text-xs bg-muted/30 border-border/50 w-28 h-7"
          />
          <Button size="sm" className="text-[10px] h-7" onClick={handleSaveMax}>
            Save
          </Button>
          <span className="text-[10px] text-muted-foreground">100 — 50,000</span>
        </div>
      )}
    </div>
  )
}

function PipelineNode({ step, index }: { step: PipelineStep; index: number }) {
  const statusColors = {
    live: { dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    warming: { dot: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
    idle: { dot: 'bg-zinc-500', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  }
  const colors = statusColors[step.status]

  return (
    <div
      className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${step.color} p-4 space-y-2 animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
    >
      {/* Connection line to next node */}
      {index < pipelineSteps.length - 1 && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-border/50 hidden lg:block" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{step.icon}</span>
          <div>
            <p className="font-semibold text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground">{step.metric}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`relative w-2 h-2 rounded-full ${colors.dot}`}>
            {step.status === 'live' && (
              <div
                className={`absolute inset-0 w-2 h-2 rounded-full ${colors.dot} animate-ping opacity-50`}
              />
            )}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
            {step.status}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
    </div>
  )
}

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
              </CardContent>
            </Card>
          </div>
        )

      case 'search':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card className="card-neon border-cyan-500/15 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MagnifyingGlass size={20} weight="fill" className="text-cyan-400" />
                  <h3 className="font-semibold">Semantic Vault Search</h3>
                </div>
                <div className="relative">
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Search by concept, source, or tag..."
                    className="pl-10 bg-muted/30 border-border/50 focus:border-cyan-500/50"
                  />
                </div>
                <div className="grid gap-3">
                  {filteredEntries.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border/50 bg-card/30 p-3 sm:p-4 space-y-2 animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {entry.sourceApp}
                          </Badge>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">
                            {entry.capturedAt}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">
                          {entry.confidence}% match
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {entry.content}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredEntries.length === 0 && (
                    <div className="rounded-xl border border-dashed border-muted-foreground/20 p-8 text-center text-sm text-muted-foreground">
                      <MagnifyingGlass size={32} className="mx-auto mb-3 opacity-30" />
                      No matches yet. Try a broader concept or remove filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'ios':
        return (
          <div id="upload-capture-section" className="animate-fade-in">
            <IOSCapture
              showHelp={showCaptureHelp}
              onHelpDismiss={() => setShowCaptureHelp(false)}
              onSyncToVault={(text, meta) => {
                const entry = addCaptureEntry(text, {
                  sourceApp: meta?.sourceApp ?? 'iPhone Capture',
                  confidence: meta?.confidence,
                  skipFilters: false,
                })
                if (entry) toast.success('OCR output synced to vault')
              }}
            />
          </div>
        )

      case 'ops':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card className="card-neon border-emerald-500/15 overflow-hidden">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Browser size={20} weight="fill" className="text-emerald-400" />
                    <h3 className="font-semibold">Service Health</h3>
                  </div>
                  <div className="space-y-3">
                    {serviceHealth.map((service, i) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-3 animate-fade-in-up"
                        style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                      >
                        <div>
                          <p className="font-medium text-sm font-mono">{service.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {service.detail}
                          </p>
                        </div>
                        <Badge
                          className={
                            service.status === 'healthy'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : service.status === 'degraded'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                              service.status === 'healthy'
                                ? 'bg-emerald-400'
                                : service.status === 'degraded'
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                            }`}
                          />
                          {service.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-neon border-cyan-500/15 overflow-hidden">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightning size={20} weight="fill" className="text-cyan-400" />
                    <h3 className="font-semibold">Quick Start</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 font-mono text-xs text-emerald-400">
                      $ docker-compose up -d
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Grant overlay + media projection permissions on-device.
                    </p>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 font-mono text-xs text-cyan-400">
                      $ ./ghostwriter portal --mode {selectedKey}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Scroll in any app and watch the vault fill in real time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-neon border-purple-500/15 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Share size={20} weight="fill" className="text-purple-400" />
                  <h3 className="font-semibold">Deployment Notes</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    {
                      text: 'Postgres 17 + pgvector with HNSW indexing for semantic recall.',
                      icon: '🗃️',
                    },
                    {
                      text: 'Redis Streams fan out updates to every connected portal.',
                      icon: '📡',
                    },
                    {
                      text: 'Fallback to keyword search if embeddings are unavailable.',
                      icon: '🔍',
                    },
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground p-2 rounded-lg bg-muted/10"
                    >
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Toaster />
      <SpeedInsights />
      <Analytics />

      {/* Floating Portal Toggle */}
      {/* Floating Portal - can be popped out onto other windows */}
      <FloatingPortal
        isActive={portalActive}
        onToggle={handlePortalToggle}
        onOpenVault={() => {
          setActiveTab('vault')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        isPoppedOut={isPoppedOut}
        onPopOut={popOut}
        onPopIn={popIn}
      />

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background ambient orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-[0.03]"
            style={{ background: 'oklch(0.72 0.22 160)' }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl opacity-[0.03]"
            style={{ background: 'oklch(0.62 0.25 300)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full blur-3xl opacity-[0.02]"
            style={{ background: 'oklch(0.75 0.18 195)' }}
          />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              {/* Logo */}
              <LogoWithText size={isMobile ? 32 : 38} />

              {/* Status Legend - hidden on very small screens, shown in header on desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <StatusLegend
                  portalActive={portalActive}
                  vaultUnlocked={vaultUnlocked}
                  healerEnabled={healerEnabled}
                  stealthMode={stealthMode}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={togglePortal}
                  className={
                    portalActive
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-muted hover:bg-muted/80'
                  }
                >
                  <Lightning size={16} className="mr-1" />
                  <span className="hidden sm:inline">
                    {portalActive ? 'Close Portal' : 'Open Portal'}
                  </span>
                  <span className="sm:hidden">{portalActive ? 'Close' : 'Open'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleVault}
                  className="border-border/50"
                >
                  {vaultUnlocked ? <LockOpen size={16} /> : <Lock size={16} />}
                  <span className="hidden sm:inline ml-1">{vaultUnlocked ? 'Lock' : 'Unlock'}</span>
                </Button>
              </div>
            </div>

            {/* Mobile-only status legend below header */}
            <div className="sm:hidden mt-3 overflow-x-auto">
              <StatusLegend
                portalActive={portalActive}
                vaultUnlocked={vaultUnlocked}
                healerEnabled={healerEnabled}
                stealthMode={stealthMode}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8">
          {/* Hero section */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr] mb-6 sm:mb-8">
            {/* Main hero card */}
            <Card className="card-neon overflow-hidden border-emerald-500/15 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full" />
              <CardContent className="p-4 sm:p-6 space-y-4 relative">
                <div className="flex items-center gap-3">
                  <Logo size={isMobile ? 36 : 44} animated={false} />
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider">
                      GhostWriter Portal
                    </p>
                    <h1 className="text-lg sm:text-2xl font-bold">
                      <span className="gradient-text-ghost">Screen Text Extraction</span>{' '}
                      <span className="text-foreground">Command Center</span>
                    </h1>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  GhostWriter captures screen text in real time, heals it on-device, and syncs a
                  clean, searchable memory vault with hybrid semantic retrieval.
                </p>
                <Button
                  onClick={() => {
                    setActiveTab('ios')
                    setTimeout(() => {
                      document.getElementById('upload-capture-section')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }, 50)
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                >
                  <DeviceMobile size={18} className="mr-2" />
                  Upload Screenshots & Recordings
                </Button>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-[10px] sm:text-xs">
                    On-device OCR
                  </Badge>
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/25 text-[10px] sm:text-xs">
                    LLM Healer
                  </Badge>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/25 text-[10px] sm:text-xs">
                    Hybrid Search
                  </Badge>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/25 text-[10px] sm:text-xs">
                    Stealth Overlay
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Telemetry card */}
            <Card className="card-neon overflow-hidden border-cyan-500/15 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full" />
              <CardContent className="p-4 sm:p-6 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-sm text-muted-foreground uppercase tracking-wider">
                      Live Capture
                    </p>
                    <h2 className="text-base sm:text-lg font-semibold">Portal Telemetry</h2>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] sm:text-xs"
                  >
                    {selectedFps} FPS
                  </Badge>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Frame delta gate',
                      value: '2.1%',
                      progress: 72,
                      color: 'text-emerald-400',
                    },
                    {
                      label: 'OCR queue',
                      value: '1.2 frames',
                      progress: 38,
                      color: 'text-cyan-400',
                    },
                    {
                      label: 'Dedup hit rate',
                      value: '92%',
                      progress: 92,
                      color: 'text-purple-400',
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>{item.label}</span>
                        <span className={`font-medium ${item.color}`}>{item.value}</span>
                      </div>
                      <Progress value={item.progress} className="mt-1.5 h-1.5" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground bg-purple-500/5 border border-purple-500/15 rounded-lg p-2.5">
                  <Sparkle size={14} className="text-purple-400" weight="fill" />
                  Healer batch runs every 10 seconds.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop tab navigation */}
          <div className="hidden sm:block mb-6">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm w-fit">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.key
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={16} weight={activeTab === item.key ? 'fill' : 'regular'} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>

        {/* Footer - desktop only */}
        <footer className="hidden sm:block border-t border-border/30 mt-12 py-8 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Logo size={28} animated={false} />
                <div className="text-sm text-muted-foreground">
                  GhostWriter <span className="opacity-40">|</span> Capture the thought, leave no
                  trace.
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-400 border-purple-500/25"
                >
                  Stealth Protocol
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Browser size={16} className="mr-1" />
                  Overlay Guide
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive/80"
                >
                  <Warning size={16} className="mr-1" />
                  Clear Trace
                </Button>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav mobile-bottom-nav">
          <div className="flex items-center justify-around px-2 py-1">
            {navItems
              .filter(item => item.key !== 'ops')
              .map(item => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] ${
                    activeTab === item.key ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`relative ${activeTab === item.key ? 'scale-110' : ''} transition-transform`}
                  >
                    <item.icon size={22} weight={activeTab === item.key ? 'fill' : 'regular'} />
                    {activeTab === item.key && (
                      <div className="absolute -inset-1 rounded-full bg-primary/10 -z-10" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      activeTab === item.key ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            {/* More menu: iPhone Capture, Ops, Guide */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[56px] ${
                    ['ios', 'ops'].includes(activeTab) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`relative ${['ios', 'ops'].includes(activeTab) ? 'scale-110' : ''} transition-transform`}
                  >
                    <ListBullets
                      size={22}
                      weight={['ios', 'ops'].includes(activeTab) ? 'fill' : 'regular'}
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
