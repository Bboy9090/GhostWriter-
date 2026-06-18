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
  PuzzlePiece,
} from '@phosphor-icons/react'
import { useIsMobile } from './hooks/use-mobile'
import { usePopoutPortal } from './hooks/use-popout-portal'
import { useCaptureLog } from './hooks/use-capture-log'
import {
  clearCaptureEntries,
  addCaptureEntry,
  getStorageStats,
  downloadCaptures,
  getMaxEntries,
  setMaxEntries,
} from './lib/capture-store'
import { recognizeImageFile } from './lib/ocr-browser'
import { isCloudVaultConfigured, searchCloudVault, type CloudVaultSearchHit } from './lib/vault-api'

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
  status: 'healthy' | 'degraded' | 'offline' | 'idle'
  detail: string
}

const pipelineSteps: PipelineStep[] = [
  {
    title: 'Capture Buffer',
    description:
      'Browser uploads and iOS lab use Tesseract; native capture uses platform OCR where wired.',
    metric: 'Configurable',
    status: 'live',
    icon: '📡',
    color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30',
  },
  {
    title: 'OCR Extraction',
    description:
      'Tesseract.js in the web app with contrast/grayscale preprocessing and line healing.',
    metric: 'Device-dependent',
    status: 'live',
    icon: '🔍',
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  },
  {
    title: 'Dedup Gatekeeper',
    description: 'Jaccard token overlap on a sliding window of recent captures (filters panel).',
    metric: 'Default 85% cutoff',
    status: 'live',
    icon: '🛡️',
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  },
  {
    title: 'Healer Pass',
    description: 'Rule-based line-break healing after OCR (hyphen joins, paragraph gaps).',
    metric: 'On by default',
    status: 'warming',
    icon: '🧠',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  },
  {
    title: 'Vault Sync',
    description: 'Local vault in this UI; optional Go API + pgvector/Mongo + Redis when deployed.',
    metric: 'Env-driven',
    status: 'live',
    icon: '🗄️',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  },
]

function buildVaultStats(
  entryCount: number,
  maxEntries: number
): Array<{
  label: string
  value: string
  detail: string
  color: string
}> {
  const pct = maxEntries > 0 ? Math.round((entryCount / maxEntries) * 100) : 0
  return [
    {
      label: 'Local entries',
      value: entryCount.toLocaleString(),
      detail: `cap at ${maxEntries.toLocaleString()}`,
      color: 'text-emerald-400',
    },
    {
      label: 'Storage use',
      value: `${pct}%`,
      detail: 'localStorage capture log',
      color: 'text-cyan-400',
    },
    {
      label: 'Cloud vault',
      value: isCloudVaultConfigured() ? 'Linked' : 'Not linked',
      detail: isCloudVaultConfigured()
        ? 'Semantic search uses your API'
        : 'Set VITE_API_URL + VITE_GHOSTWRITER_USER_ID',
      color: isCloudVaultConfigured() ? 'text-purple-400' : 'text-muted-foreground',
    },
    {
      label: 'Embeddings',
      value: isCloudVaultConfigured() ? 'Server-side' : 'N/A',
      detail: 'OpenAI on the Go API when deployed',
      color: 'text-amber-400',
    },
  ]
}

function buildServiceHealth(): ServiceStatus[] {
  const api = isCloudVaultConfigured()
  return [
    {
      name: 'ghost-api',
      status: api ? 'healthy' : 'offline',
      detail: api ? 'Search endpoint configured' : 'Not configured for this build',
    },
    {
      name: 'vault-db',
      status: api ? 'healthy' : 'idle',
      detail: api ? 'PostgreSQL or MongoDB (server)' : 'Local vault only in browser',
    },
    {
      name: 'ghost-stream',
      status: api ? 'healthy' : 'idle',
      detail: api ? 'Redis pub/sub when server runs' : 'WebSocket ingest is server-only',
    },
    {
      name: 'embedding',
      status: api ? 'healthy' : 'offline',
      detail: api ? 'text-embedding-3-small (512d)' : 'Set API URL + user id to enable',
    },
  ]
}

function StorageBar({ captureCount }: { captureCount: number }) {
  const stats = useMemo(() => {
    void captureCount
    return getStorageStats()
  }, [captureCount])
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
  /** Floating portal widget emphasis only (not screen capture — web app has no OS capture). */
  const [portalWidgetActive, setPortalWidgetActive] = useState(true)
  const [vaultUnlocked, setVaultUnlocked] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDevDrawer, setShowDevDrawer] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
  const [ghostPulse, setGhostPulse] = useState<GhostPulseState>('idle')
  const [isDragOver, setIsDragOver] = useState(false)
  const [devActiveTab, setDevActiveTab] = useState('pipeline')
  const [ocrBusy, setOcrBusy] = useState(false)
  const [cloudSearchBusy, setCloudSearchBusy] = useState(false)
  const [cloudHits, setCloudHits] = useState<CloudVaultSearchHit[]>([])
  const [cloudSearchError, setCloudSearchError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  // Popout portal hook - allows the portal to float over other windows/apps
  const handlePopoutToggle = useCallback(() => {
    setPortalWidgetActive(prev => !prev)
  }, [])
  const handlePopoutOpenVault = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const handlePopoutToggleVault = useCallback(() => {
    setVaultUnlocked(prev => !prev)
  }, [])

  const { isPoppedOut, popOut, popIn } = usePopoutPortal({
    state: {
      isActive: portalWidgetActive,
      vaultUnlocked,
    },
    onToggle: handlePopoutToggle,
    onOpenVault: handlePopoutOpenVault,
    onToggleVault: handlePopoutToggleVault,
  })

  // Live capture log — shared with popout portal via BroadcastChannel
  const captureLog = useCaptureLog()

  const vaultStatsSnapshot = useMemo(
    () => buildVaultStats(captureLog.length, getMaxEntries()),
    [captureLog.length]
  )
  const serviceHealthSnapshot = useMemo(() => buildServiceHealth(), [])

  const prevCaptureCount = useRef(captureLog.length)
  useEffect((): void | (() => void) => {
    if (captureLog.length > prevCaptureCount.current) {
      queueMicrotask(() => setGhostPulse('saved'))
      const savedTimer = setTimeout(() => setGhostPulse('idle'), 1500)
      prevCaptureCount.current = captureLog.length
      return () => clearTimeout(savedTimer)
    }
  }, [captureLog.length])

  // Local vault search (substring match on content, source, tags)
  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const allEntries = captureLog.map(e => ({
      id: e.id,
      sourceApp: e.sourceApp,
      content: e.content,
      confidence: e.confidence,
      tags: e.tags,
      capturedAt: e.capturedAt,
    }))
    if (!query) return allEntries
    return allEntries.filter(
      entry =>
        entry.content.toLowerCase().includes(query) ||
        entry.sourceApp.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [searchQuery, captureLog])

  const cloudSearchGen = useRef(0)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!isCloudVaultConfigured() || !q) {
      setCloudHits([])
      setCloudSearchError(null)
      setCloudSearchBusy(false)
      return
    }
    const gen = ++cloudSearchGen.current
    const timer = window.setTimeout(() => {
      void (async () => {
        setCloudSearchBusy(true)
        setCloudSearchError(null)
        try {
          const hits = await searchCloudVault(q)
          if (gen === cloudSearchGen.current) {
            setCloudHits(hits)
          }
        } catch (err) {
          if (gen === cloudSearchGen.current) {
            setCloudHits([])
            setCloudSearchError(err instanceof Error ? err.message : 'Cloud search failed')
          }
        } finally {
          if (gen === cloudSearchGen.current) {
            setCloudSearchBusy(false)
          }
        }
      })()
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handlePortalToggle = (active: boolean) => {
    setPortalWidgetActive(active)
  }

  const handleDropzoneFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please drop an image or video file.')
      return
    }
    if (file.type.startsWith('video/')) {
      toast.message('Video OCR runs in the iOS Upload lab', {
        description:
          'Open Dev → iOS Upload, drop your clip there for frame sampling and stitching. This drop zone is optimized for screenshots.',
      })
      return
    }

    void (async () => {
      setOcrBusy(true)
      toast.message(`Reading text from ${file.name}…`, { duration: 4000 })
      try {
        const { text, confidence } = await recognizeImageFile(file)
        if (!text.trim()) {
          toast.error(
            'No text found in that image. Try a clearer screenshot or the iOS Upload lab.'
          )
          return
        }
        const confPct =
          confidence != null && Number.isFinite(confidence)
            ? Math.round(Math.min(100, confidence))
            : 85
        addCaptureEntry(text, {
          sourceApp: 'Screenshot',
          confidence: confPct,
          tags: ['ocr', file.name.slice(0, 40)],
        })
        toast.success('Screenshot text added to your vault')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'OCR failed for this file.')
      } finally {
        setOcrBusy(false)
      }
    })()
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
                  <h3 className="font-semibold text-sm">Vault status</h3>
                </div>
                {[
                  {
                    label: 'Local vault entries',
                    value: String(captureLog.length),
                    progress: Math.min(100, Math.max(5, captureLog.length)),
                    color: 'text-emerald-400',
                  },
                  {
                    label: 'Cloud vault search',
                    value: isCloudVaultConfigured() ? 'enabled' : 'not configured',
                    progress: isCloudVaultConfigured() ? 80 : 12,
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
                  Line-break healing runs on OCR output (shared with iOS Upload lab).
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
                  {vaultStatsSnapshot.map(stat => (
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
            <Card className="card-neon border-cyan-500/20 overflow-hidden bg-gradient-to-br from-cyan-500/5 to-emerald-500/5">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-500/15 p-2.5">
                    <PuzzlePiece size={24} weight="fill" className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">
                      Get the Browser Extension
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Capture without focus switching. Portal stays in a side panel while you scroll
                      the page – no more clicking back and forth.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700"
                        onClick={() =>
                          window.open(
                            'https://github.com/Bboy9090/GhostWriter-/tree/main#-browser-extension-side-panel',
                            '_blank',
                            'noopener'
                          )
                        }
                      >
                        <PuzzlePiece size={16} weight="fill" className="mr-1.5" />
                        Get extension
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            'https://github.com/Bboy9090/GhostWriter-/blob/main/extension/README.md',
                            '_blank',
                            'noopener'
                          )
                        }
                      >
                        Install steps
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Chrome/Edge: chrome://extensions → Developer mode → Load unpacked → select{' '}
                      <code className="bg-muted px-1 rounded text-[10px]">extension</code> folder
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-neon border-emerald-500/15 overflow-hidden">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm">Portal (this web app)</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    The floating widget only changes appearance. Real text comes from paste,
                    screenshot OCR on the main page, the browser extension, or the iOS Upload lab
                    below. Native screen capture belongs in the mobile app or OS integration, not
                    here.
                  </p>
                </div>
                <Separator className="opacity-30" />
                <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground space-y-2">
                  <p>
                    <span className="font-medium text-foreground">
                      Noise, dedup, sensitive text:
                    </span>{' '}
                    adjust in Capture Filters on this tab — those settings are real and persist in
                    the browser.
                  </p>
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
                      {
                        label: 'Local vault',
                        value: 'Browser localStorage',
                        color: 'text-emerald-400',
                      },
                      {
                        label: 'Server vault',
                        value: isCloudVaultConfigured()
                          ? 'pgvector or Mongo + embeddings'
                          : 'optional (env)',
                        color: 'text-cyan-400',
                      },
                      {
                        label: 'Sensitive text',
                        value: 'Filtered in Capture Filters',
                        color: 'text-purple-400',
                      },
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
                  <p className="text-[11px] text-muted-foreground">
                    Semantic search in the main vault UI calls your API when{' '}
                    <span className="font-mono text-[10px]">VITE_API_URL</span> and{' '}
                    <span className="font-mono text-[10px]">VITE_GHOSTWRITER_USER_ID</span> are set.
                  </p>
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
                      {
                        label: 'WebSocket ingest',
                        value: isCloudVaultConfigured()
                          ? 'Server /ws (when running)'
                          : 'Not used by SPA',
                        color: isCloudVaultConfigured()
                          ? 'text-emerald-400'
                          : 'text-muted-foreground',
                      },
                      {
                        label: 'Redis fanout',
                        value: isCloudVaultConfigured() ? 'backend-go + Redis' : 'N/A',
                        color: isCloudVaultConfigured() ? 'text-cyan-400' : 'text-muted-foreground',
                      },
                      {
                        label: 'Spark KV queue',
                        value: 'Separate card sync path',
                        color: 'text-purple-400',
                      },
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
                  {serviceHealthSnapshot.map((service, i) => (
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
                              : service.status === 'idle'
                                ? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }
                      >
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                            service.status === 'healthy'
                              ? 'bg-emerald-400'
                              : service.status === 'degraded'
                                ? 'bg-amber-400'
                                : service.status === 'idle'
                                  ? 'bg-zinc-400'
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
                  For device screen capture, use the GhostWriter mobile app or platform-specific
                  tooling; this SPA does not access MediaProjection or desktop capture APIs.
                </p>
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
        isActive={portalWidgetActive}
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
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
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
          {/* Extension CTA – visible on main page */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <PuzzlePiece size={20} weight="fill" className="text-cyan-400" />
              <span className="text-sm font-medium">No focus switching?</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Get the browser extension – portal stays in side panel while you scroll
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 shrink-0"
              onClick={() =>
                window.open(
                  'https://github.com/Bboy9090/GhostWriter-/blob/main/extension/README.md',
                  '_blank',
                  'noopener'
                )
              }
            >
              Get extension
            </Button>
          </div>

          {/* 1. Primary Action Zone */}
          <div className="space-y-3">
            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              aria-busy={ocrBusy}
              aria-label="Drop screenshot here or click to browse; use iOS Upload lab for video OCR"
              className={`rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
                ${
                  ocrBusy
                    ? 'border-muted cursor-wait opacity-80'
                    : isDragOver
                      ? 'border-primary bg-primary/5 scale-[1.01] cursor-pointer'
                      : 'border-border/50 hover:border-primary/50 hover:bg-muted/20 cursor-pointer'
                }`}
              onDragOver={e => {
                e.preventDefault()
                if (!ocrBusy) setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!ocrBusy) fileInputRef.current?.click()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!ocrBusy) fileInputRef.current?.click()
                }
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
                  {ocrBusy ? 'Reading text from image…' : 'Drop a screenshot here'}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {ocrBusy
                    ? 'Tesseract runs in your browser; nothing leaves your device until you sync.'
                    : 'Video? Use Dev → iOS Upload for frame OCR. Or '}
                  {!ocrBusy && (
                    <>
                      <span className="underline underline-offset-2 text-primary/80 hover:text-primary">
                        browse
                      </span>{' '}
                      for an image
                    </>
                  )}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                disabled={ocrBusy}
                onChange={e => handleDropzoneFiles(e.target.files)}
              />
            </div>

            {/* Always-On Screen Capture toggle */}
            <div className="flex items-center gap-3 px-1 py-2 rounded-xl border border-border/30 bg-card/30">
              <Switch
                checked={portalWidgetActive}
                onCheckedChange={handlePortalToggle}
                id="floating-portal-widget"
              />
              <label htmlFor="floating-portal-widget" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium">Floating portal widget</p>
                <p className="text-[11px] text-muted-foreground">
                  {portalWidgetActive
                    ? 'Shows the draggable portal control. This does not capture your screen in the browser.'
                    : 'Widget minimized to inactive styling. Add text via paste, screenshot drop, extension, or iOS Upload.'}
                </p>
              </label>
              {portalWidgetActive && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                  On
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
                placeholder={
                  isCloudVaultConfigured()
                    ? 'Search local vault + cloud (semantic)…'
                    : 'Search local vault (text, source, tags)…'
                }
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

            {isCloudVaultConfigured() && searchQuery.trim() && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Cloud vault
                  </p>
                  {cloudSearchBusy && (
                    <span className="text-[10px] text-muted-foreground">Searching…</span>
                  )}
                </div>
                {cloudSearchError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">{cloudSearchError}</p>
                )}
                {!cloudSearchBusy && !cloudSearchError && cloudHits.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No server-side matches for this query.
                  </p>
                )}
                {cloudHits.length > 0 && (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {cloudHits.map(hit => (
                      <li
                        key={hit.id}
                        className="rounded-lg border border-border/30 bg-card/40 p-2 text-xs"
                      >
                        <div className="flex justify-between gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px]">
                            #{hit.id}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {(hit.similarity * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <p className="text-foreground/90 line-clamp-4 leading-relaxed">
                          {hit.text_content}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] mt-1 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(hit.text_content)
                            toast.success('Cloud result copied')
                          }}
                        >
                          <Copy size={12} className="mr-1" />
                          Copy
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
                      : 'Drop a screenshot, paste text below, or use the extension / iOS Upload lab.'}
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
