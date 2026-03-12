import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { Logo, LogoWithText } from './components/Logo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './components/ui/sheet'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'
import { Switch } from './components/ui/switch'
import { Toaster } from './components/ui/sonner'
import { IOSCapture } from './components/IOSCapture'
import { FloatingPortal } from './components/FloatingPortal'
import { GodModeExtractor } from './components/GodModeExtractor'
import { CaptureFilters } from './components/CaptureFilters'
import { toast } from 'sonner'
import {
  Browser,
  Check,
  Copy,
  DeviceMobile,
  GearSix,
  Ghost,
  Lightning,
  LockOpen,
  MagnifyingGlass,
  PencilSimple,
  Share,
  Sparkle,
  UploadSimple,
  Vault,
  Warning,
  Folder,
  Eye,
  X,
} from '@phosphor-icons/react'
import { useIsMobile } from './hooks/use-mobile'
import { usePopoutPortal } from './hooks/use-popout-portal'
import { useCaptureLog } from './hooks/use-capture-log'
import {
  startDemoCapture,
  stopDemoCapture,
  clearCaptureEntries,
  addCaptureEntry,
  getStorageStats,
  downloadCaptures,
  getMaxEntries,
  setMaxEntries,
} from './lib/capture-store'

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

// Pulse indicator states
type GhostPulseState = 'active' | 'saved' | 'idle'

function GhostPulseIndicator({ state }: { state: GhostPulseState }) {
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      {/* Outer glow ring */}
      {state === 'saved' && (
        <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
      )}
      {state === 'active' && (
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
      )}
      <Ghost
        size={24}
        weight={state === 'idle' ? 'regular' : 'fill'}
        className={
          state === 'saved'
            ? 'text-emerald-400 transition-colors duration-300'
            : state === 'active'
              ? 'text-primary animate-pulse'
              : 'text-muted-foreground/40 transition-colors duration-500'
        }
      />
    </div>
  )
}

function App() {
  const [showCaptureHelp, setShowCaptureHelp] = useState(false)
  const [portalActive, setPortalActive] = useState(true)
  const [vaultUnlocked, setVaultUnlocked] = useState(true)
  const [stealthMode, setStealthMode] = useState(true)
  const [dedupeGuard, setDedupeGuard] = useState(true)
  const [healerEnabled, setHealerEnabled] = useState(true)
  const [captureMode, setCaptureMode] = useState('balanced')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDevDrawer, setShowDevDrawer] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
  const [ghostPulse, setGhostPulse] = useState<GhostPulseState>('idle')
  const [isDragOver, setIsDragOver] = useState(false)
  const [devActiveTab, setDevActiveTab] = useState('pipeline')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const selectedCaptureModeObj = captureModes.find(m => m.key === captureMode)

  // Popout portal hook - allows the portal to float over other windows/apps
  const handlePopoutToggle = useCallback(() => {
    setPortalActive(prev => !prev)
  }, [])
  const handlePopoutOpenVault = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const handlePopoutToggleVault = useCallback(() => {
    setVaultUnlocked(prev => !prev)
  }, [])

  const { isPoppedOut, popOut, popIn } = usePopoutPortal({
    state: {
      isActive: portalActive,
      vaultUnlocked,
      stealthMode,
      healerEnabled,
      captureMode,
      captureFps: selectedCaptureModeObj?.fps ?? 5,
    },
    onToggle: handlePopoutToggle,
    onOpenVault: handlePopoutOpenVault,
    onToggleVault: handlePopoutToggleVault,
  })

  // Live capture log — shared with popout portal via BroadcastChannel
  const captureLog = useCaptureLog()

  // Update ghost pulse when new capture arrives
  const prevCaptureCount = useRef(captureLog.length)
  useEffect(() => {
    if (captureLog.length > prevCaptureCount.current) {
      setGhostPulse('saved')
      const savedTimer = setTimeout(() => {
        setGhostPulse(portalActive ? 'active' : 'idle')
      }, 1500)
      prevCaptureCount.current = captureLog.length
      return () => clearTimeout(savedTimer)
    }
    return undefined
  }, [captureLog.length, portalActive])

  // Update pulse state when portal active state changes
  useEffect(() => {
    if (ghostPulse !== 'saved') {
      setGhostPulse(portalActive ? 'active' : 'idle')
    }
  }, [portalActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop demo capture when portal is toggled
  useEffect(() => {
    if (portalActive) {
      startDemoCapture()
    } else {
      stopDemoCapture()
    }
    return () => stopDemoCapture()
  }, [portalActive])

  // Search filters both static demo data and live capture log
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    // Merge live captures + static feed, newest first
    const allEntries = [
      ...captureLog.map(e => ({
        id: e.id,
        sourceApp: e.sourceApp,
        content: e.content,
        confidence: e.confidence,
        tags: e.tags,
        capturedAt: e.capturedAt,
      })),
      ...captureFeed,
    ]
    if (!query) return allEntries
    return allEntries.filter(
      entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.sourceApp.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [searchQuery, captureLog])

  const selectedCaptureMode =
    captureModes.find(mode => mode.key === captureMode) ?? captureModes[1]!

  const selectedFps = selectedCaptureMode?.fps ?? 5
  const selectedDelta = selectedCaptureMode?.delta ?? '2.0%'
  const selectedKey = selectedCaptureMode?.key ?? 'balanced'

  const handlePortalToggle = (active: boolean) => {
    setPortalActive(active)
    toast.success(
      active ? '👻 Portal opened. Streaming live frames.' : 'Portal closed. Capture paused.'
    )
  }

  const handleDropzoneFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please drop an image or video file.')
      return
    }
    toast.success(`Processing: ${file.name}`)
    addCaptureEntry(`[File uploaded: ${file.name}]`, { sourceApp: 'Upload' })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    handleDropzoneFiles(e.dataTransfer.files)
  }

  const getTextForEntry = (id: string, content: string) =>
    editedTexts[id] !== undefined ? editedTexts[id] : content

  const devNavItems = [
    { key: 'pipeline', label: 'Pipeline', icon: Lightning },
    { key: 'portal', label: 'Portal', icon: Eye },
    { key: 'vault', label: 'Vault', icon: Vault },
    { key: 'ops', label: 'Ops', icon: Browser },
    { key: 'extractor', label: 'God Mode', icon: Sparkle },
    { key: 'ios', label: 'iOS Upload', icon: DeviceMobile },
  ]

  const renderDevContent = () => {
    switch (devActiveTab) {
      case 'pipeline':
        return (
          <div className="space-y-4">
            {/* Telemetry metrics */}
            <Card className="card-neon overflow-hidden border-cyan-500/15">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Portal Telemetry</h3>
                  <Badge
                    variant="secondary"
                    className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px]"
                  >
                    {selectedFps} FPS
                  </Badge>
                </div>
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
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{item.label}</span>
                      <span className={`font-medium ${item.color}`}>{item.value}</span>
                    </div>
                    <Progress value={item.progress} className="mt-1 h-1.5" />
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-purple-500/5 border border-purple-500/15 rounded-lg p-2">
                  <Sparkle size={12} className="text-purple-400" weight="fill" />
                  Healer batch runs every 10 seconds.
                </div>
              </CardContent>
            </Card>

            {/* Phase-Shift Pipeline */}
            <Card className="card-neon border-emerald-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightning size={16} weight="fill" className="text-emerald-400" />
                  <h3 className="font-semibold text-sm">Phase-Shift Pipeline</h3>
                </div>
                <div className="space-y-2">
                  {pipelineSteps.map((step, i) => (
                    <PipelineNode key={step.title} step={step} index={i} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vault Snapshot */}
            <Card className="card-neon border-purple-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Folder size={16} weight="fill" className="text-purple-400" />
                  <h3 className="font-semibold text-sm">Vault Snapshot</h3>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  {vaultStats.map(stat => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-1"
                    >
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.detail}</p>
                    </div>
                  ))}
                </div>
                <Separator className="opacity-30" />
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                  <Warning size={14} className="mt-0.5 text-amber-400 flex-shrink-0" />
                  <span>FLAG_SECURE windows stay dark unless running a rooted bridge module.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'portal':
        return (
          <div className="space-y-4">
            <Card className="card-neon border-emerald-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">Portal Controls</h3>
                    <p className="text-xs text-muted-foreground">Overlay-first policy for Android 15+</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                  >
                    MediaProjection
                  </Badge>
                </div>
                <div className="grid gap-3 grid-cols-1">
                  {[
                    {
                      label: 'Stealth Mode',
                      desc: 'Hide notifications',
                      checked: stealthMode,
                      onChange: setStealthMode,
                      color: 'border-amber-500/20',
                    },
                    {
                      label: 'Dedup Guard',
                      desc: 'Similarity gate',
                      checked: dedupeGuard,
                      onChange: setDedupeGuard,
                      color: 'border-cyan-500/20',
                    },
                    {
                      label: 'Healer Pass',
                      desc: 'Local LLM cleanup',
                      checked: healerEnabled,
                      onChange: setHealerEnabled,
                      color: 'border-purple-500/20',
                    },
                  ].map(toggle => (
                    <div
                      key={toggle.label}
                      className={`flex items-center justify-between rounded-xl border ${toggle.color} bg-card/50 p-3`}
                    >
                      <div>
                        <p className="font-medium text-sm">{toggle.label}</p>
                        <p className="text-[10px] text-muted-foreground">{toggle.desc}</p>
                      </div>
                      <Switch checked={toggle.checked} onCheckedChange={toggle.onChange} />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Capture Mode</p>
                  <div className="flex flex-wrap gap-2">
                    {captureModes.map(mode => (
                      <Button
                        key={mode.key}
                        variant={captureMode === mode.key ? 'default' : 'outline'}
                        onClick={() => setCaptureMode(mode.key)}
                        size="sm"
                      >
                        <span className="mr-1">{mode.icon}</span>
                        {mode.label} ({mode.fps} FPS)
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator className="opacity-30" />
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Overlay Status
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Floating portal ready for tap-to-stream.
                    </p>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      Active
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      Capture Notes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Average output: {selectedFps} FPS, delta gate {selectedDelta}.
                    </p>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                      Rotation locked
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <CaptureFilters />
          </div>
        )

      case 'vault':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <Card className="card-neon border-purple-500/15 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Folder size={16} weight="fill" className="text-purple-400" />
                    <h3 className="font-semibold text-sm">Vault Policies</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Retention Window', value: '30 days encrypted', color: 'text-emerald-400' },
                      { label: 'Vector Index', value: 'HNSW cosine', color: 'text-cyan-400' },
                      { label: 'Zero-Knowledge', value: 'No raw frames', color: 'text-purple-400' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                      >
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <span className={`font-medium text-xs ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="opacity-30" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Index build</span>
                      <span className="text-emerald-400 font-medium">78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-neon border-cyan-500/15 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Share size={16} weight="fill" className="text-cyan-400" />
                    <h3 className="font-semibold text-sm">Sync Channels</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'WebSocket', value: 'Connected', color: 'text-emerald-400' },
                      { label: 'Redis Streams', value: '2.1k msgs/sec', color: 'text-cyan-400' },
                      { label: 'Edge Queue', value: '0 pending', color: 'text-purple-400' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                      >
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <span className={`font-medium text-xs ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="opacity-30" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2">
                    <LockOpen size={12} className="text-emerald-400" />
                    Vault encryption keys stay on device.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storage + export controls */}
            <StorageBar captureCount={captureLog.length} />
          </div>
        )

      case 'ops':
        return (
          <div className="space-y-4">
            <Card className="card-neon border-emerald-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Browser size={16} weight="fill" className="text-emerald-400" />
                  <h3 className="font-semibold text-sm">Service Health</h3>
                </div>
                <div className="space-y-2">
                  {serviceHealth.map((service, i) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-3 animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                    >
                      <div>
                        <p className="font-medium text-sm font-mono">{service.name}</p>
                        <p className="text-[10px] text-muted-foreground">{service.detail}</p>
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
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightning size={16} weight="fill" className="text-cyan-400" />
                  <h3 className="font-semibold text-sm">Quick Start</h3>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 font-mono text-xs text-emerald-400">
                  $ docker-compose up -d
                </div>
                <p className="text-xs text-muted-foreground">
                  Grant overlay + media projection permissions on-device.
                </p>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3 font-mono text-xs text-cyan-400">
                  $ ./ghostwriter portal --mode {selectedKey}
                </div>
              </CardContent>
            </Card>

            <Card className="card-neon border-purple-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share size={16} weight="fill" className="text-purple-400" />
                  <h3 className="font-semibold text-sm">Deployment Notes</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    { text: 'Postgres 17 + pgvector with HNSW indexing for semantic recall.', icon: '🗃️' },
                    { text: 'Redis Streams fan out updates to every connected portal.', icon: '📡' },
                    { text: 'Fallback to keyword search if embeddings are unavailable.', icon: '🔍' },
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-muted/10"
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

      case 'extractor':
        return (
          <div>
            <GodModeExtractor />
          </div>
        )

      case 'ios':
        return (
          <div>
            <IOSCapture
              showHelp={showCaptureHelp}
              onHelpDismiss={() => setShowCaptureHelp(false)}
            />
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

      {/* Floating Portal - can be popped out onto other windows */}
      <FloatingPortal
        isActive={portalActive}
        onToggle={handlePortalToggle}
        onOpenVault={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        isPoppedOut={isPoppedOut}
        onPopOut={popOut}
        onPopIn={popIn}
      />

      {/* Developer Drawer (Settings) */}
      <Sheet open={showDevDrawer} onOpenChange={setShowDevDrawer}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl overflow-y-auto"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <GearSix size={18} weight="fill" className="text-muted-foreground" />
              Developer Settings
            </SheetTitle>
            <SheetDescription>
              Pipeline diagnostics, vault stats, portal controls, and deployment tools.
            </SheetDescription>
          </SheetHeader>

          {/* Dev drawer tab navigation */}
          <div className="flex flex-wrap gap-1 mb-4 p-1 rounded-xl bg-muted/30 border border-border/30">
            {devNavItems.map(item => (
              <button
                key={item.key}
                onClick={() => setDevActiveTab(item.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  devActiveTab === item.key
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon size={13} weight={devActiveTab === item.key ? 'fill' : 'regular'} />
                {item.label}
              </button>
            ))}
          </div>

          {renderDevContent()}
        </SheetContent>
      </Sheet>

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

        {/* ── Header: 3-column minimal layout ── */}
        <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="grid grid-cols-3 items-center gap-2">
              {/* Left: Branding */}
              <div className="flex items-center">
                <LogoWithText size={isMobile ? 30 : 36} />
              </div>

              {/* Center: Ghost Pulse Indicator */}
              <div className="flex justify-center">
                <GhostPulseIndicator state={ghostPulse} />
              </div>

              {/* Right: Settings gear */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDevDrawer(true)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Open developer settings"
                >
                  <GearSix size={20} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-10 space-y-6">

          {/* 1. Primary Action Zone */}
          <div className="space-y-3">
            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop screenshot or recording here or click to browse"
              className={`rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
                ${
                  isDragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border/50 hover:border-primary/50 hover:bg-muted/20'
                }`}
              onDragOver={e => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                <UploadSimple
                  size={28}
                  className={isDragOver ? 'text-primary' : 'text-muted-foreground'}
                  weight="duotone"
                />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Drop Screenshot / Recording Here
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  or{' '}
                  <span className="underline underline-offset-2 text-primary/80 hover:text-primary">
                    Browse
                  </span>{' '}
                  to select a file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                onChange={e => handleDropzoneFiles(e.target.files)}
              />
            </div>

            {/* Always-On Screen Capture toggle */}
            <div className="flex items-center gap-3 px-1 py-2 rounded-xl border border-border/30 bg-card/30">
              <Switch
                checked={portalActive}
                onCheckedChange={handlePortalToggle}
                id="always-on-capture"
              />
              <label htmlFor="always-on-capture" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium">Always-On Screen Capture</p>
                <p className="text-[11px] text-muted-foreground">
                  {portalActive
                    ? 'Background portal is actively reading your screen'
                    : 'Background capture is paused'}
                </p>
              </label>
              {portalActive && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          {/* 2. Vault Feed */}
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vault by concept, source, or tag…"
                className="pl-9 bg-muted/30 border-border/50 focus:border-primary/50 h-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Feed header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Vault Feed</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {filteredEntries.length} entries
                </Badge>
              </div>
              {captureLog.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearCaptureEntries()}
                  className="text-muted-foreground text-xs h-7"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Manual entry quick-add */}
            <Input
              placeholder="Paste or type text to add to vault… (press Enter)"
              className="text-xs bg-muted/30 border-border/50 h-9"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget
                  const text = input.value.trim()
                  if (text) {
                    addCaptureEntry(text, { sourceApp: 'Manual' })
                    input.value = ''
                    toast.success('Text captured!')
                  }
                }
              }}
            />

            {/* Entries list */}
            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-muted-foreground/20 p-10 text-center">
                  <Ghost size={36} className="mx-auto mb-3 opacity-15" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'No matches found. Try a different search term.'
                      : portalActive
                        ? 'Listening for text… entries will appear here in real-time.'
                        : 'Enable Always-On Capture or drop a file above to start.'}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry, i) => {
                  const isEditing = editingId === entry.id
                  const displayText = getTextForEntry(entry.id, entry.content)
                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-border/50 bg-card/30 p-4 space-y-3 animate-fade-in-up"
                      style={{
                        animationDelay: `${Math.min(i, 5) * 60}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      {/* Card header: source + time */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {entry.sourceApp}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {entry.capturedAt}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                          {entry.confidence}%
                        </Badge>
                      </div>

                      {/* Editable text area */}
                      {isEditing ? (
                        <textarea
                          autoFocus
                          className="w-full rounded-xl border border-primary/40 bg-muted/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[80px]"
                          value={displayText}
                          onChange={e =>
                            setEditedTexts(prev => ({ ...prev, [entry.id]: e.target.value }))
                          }
                          onBlur={() => setEditingId(null)}
                        />
                      ) : (
                        <p className="text-sm text-foreground/90 leading-relaxed">{displayText}</p>
                      )}

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.tags.map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className={`text-[10px] ${
                                tag === 'sensitive'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : tag === 'redacted'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : ''
                              }`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Quick-action buttons: Copy · Edit · Source */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(displayText)
                            toast.success('Copied to clipboard')
                          }}
                        >
                          <Copy size={12} />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 text-[11px] gap-1 ${isEditing ? 'border-primary text-primary' : ''}`}
                          onClick={() => setEditingId(isEditing ? null : entry.id)}
                        >
                          {isEditing ? <Check size={12} /> : <PencilSimple size={12} />}
                          {isEditing ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] gap-1 text-muted-foreground"
                          onClick={() =>
                            toast(`Source: ${entry.sourceApp}`, {
                              description: `Captured at ${entry.capturedAt} · ${entry.confidence}% confidence`,
                            })
                          }
                        >
                          <Eye size={12} />
                          Source
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>

        {/* Footer - desktop only */}
        <footer className="hidden sm:block border-t border-border/30 mt-8 py-6 relative z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo size={24} animated={false} />
                <div className="text-xs text-muted-foreground">
                  GhostWriter <span className="opacity-40">|</span> Capture the thought, leave no
                  trace.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-400 border-purple-500/25 text-[10px]"
                >
                  Stealth Protocol
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive/80"
                  onClick={() => {
                    clearCaptureEntries()
                    toast.success('Vault cleared.')
                  }}
                >
                  <Warning size={14} className="mr-1" />
                  Clear Trace
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App
