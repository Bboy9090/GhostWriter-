import { useMemo, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Logo, LogoWithText } from './components/Logo'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'
import { Switch } from './components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Toaster } from './components/ui/sonner'
import { IOSCapture } from './components/IOSCapture'
import { FloatingPortal } from './components/FloatingPortal'
import { GodModeExtractor } from './components/GodModeExtractor'
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
  Folder
} from '@phosphor-icons/react'

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
    status: 'live'
  },
  {
    title: 'OCR Extraction',
    description: 'On-device ML Kit recognition with block geometry retention.',
    metric: '41ms p95',
    status: 'live'
  },
  {
    title: 'Dedup Gatekeeper',
    description: 'Levenshtein + SimHash over the last five blocks.',
    metric: '89% similarity cutoff',
    status: 'live'
  },
  {
    title: 'Healer Pass',
    description: 'Local LLM cleanup restores paragraphs and fixes line breaks.',
    metric: 'Gemma 2B',
    status: 'warming'
  },
  {
    title: 'Vault Sync',
    description: 'WebSocket stream into pgvector with RRF hybrid search.',
    metric: '32ms round-trip',
    status: 'live'
  }
]

const captureFeed: CaptureEntry[] = [
  {
    id: 'cap-1',
    sourceApp: 'Chrome',
    content: 'MediaProjection must start after overlay is visible on Android 15.',
    confidence: 97,
    tags: ['portal', 'permissions'],
    capturedAt: '09:42 AM'
  },
  {
    id: 'cap-2',
    sourceApp: 'PDF Reader',
    content: 'Dedup gate ignored 4 repeated paragraphs during slow scroll.',
    confidence: 94,
    tags: ['dedupe', 'scroll'],
    capturedAt: '09:44 AM'
  },
  {
    id: 'cap-3',
    sourceApp: 'Instagram',
    content: 'Healer reconstructed the paragraph and removed line breaks.',
    confidence: 91,
    tags: ['healer', 'formatting'],
    capturedAt: '09:45 AM'
  },
  {
    id: 'cap-4',
    sourceApp: 'Docs',
    content: 'Portal captured block geometry for layout-aware syncing.',
    confidence: 96,
    tags: ['layout', 'blocks'],
    capturedAt: '09:47 AM'
  },
  {
    id: 'cap-5',
    sourceApp: 'News',
    content: 'Vault indexed the entry with vector embeddings in 28ms.',
    confidence: 93,
    tags: ['vault', 'pgvector'],
    capturedAt: '09:49 AM'
  }
]

const featureHighlights = [
  {
    title: 'Stealth Overlay',
    description: 'Floating portal UI stays above other apps without recording.',
    tag: 'Portal UI'
  },
  {
    title: 'On-Device Healer',
    description: 'Gemma-class LLM cleanup keeps paragraphs intact and readable.',
    tag: 'Healer'
  },
  {
    title: 'Hybrid Search',
    description: 'RRF merges keyword and vector search into one ranking.',
    tag: 'Oracle'
  },
  {
    title: 'Zero-Knowledge Vault',
    description: 'Raw frames never leave the device. Only healed text syncs.',
    tag: 'Security'
  }
]

const vaultStats = [
  { label: 'Vault Entries', value: '128,440', detail: '+1,482 today' },
  { label: 'Dedup Rate', value: '92.4%', detail: 'scroll-safe' },
  { label: 'OCR Latency', value: '41ms', detail: 'p95 on-device' },
  { label: 'Sync Lag', value: '28ms', detail: 'websocket' }
]

const serviceHealth: ServiceStatus[] = [
  { name: 'ghost-api', status: 'healthy', detail: 'p95 33ms' },
  { name: 'vault-db', status: 'healthy', detail: 'pgvector hnsw ready' },
  { name: 'ghost-stream', status: 'healthy', detail: 'redis fanout ok' },
  { name: 'embedding', status: 'degraded', detail: 'fallback to keywords' }
]

const captureModes = [
  { key: 'quality', label: 'Quality', fps: 3, delta: '1.5%' },
  { key: 'balanced', label: 'Balanced', fps: 5, delta: '2.0%' },
  { key: 'turbo', label: 'Turbo', fps: 10, delta: '3.5%' }
]

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [portalActive, setPortalActive] = useState(true)
  const [vaultUnlocked, setVaultUnlocked] = useState(true)
  const [stealthMode, setStealthMode] = useState(true)
  const [dedupeGuard, setDedupeGuard] = useState(true)
  const [healerEnabled, setHealerEnabled] = useState(true)
  const [captureMode, setCaptureMode] = useState('balanced')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return captureFeed
    }

    return captureFeed.filter(entry =>
      entry.content.toLowerCase().includes(query) ||
      entry.sourceApp.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [searchQuery])

  const selectedCaptureMode = captureModes.find(mode => mode.key === captureMode) ?? captureModes[1]

  const togglePortal = () => {
    setPortalActive((prev) => {
      const next = !prev
      toast.success(next ? 'Portal opened. Streaming live frames.' : 'Portal closed. Capture paused.')
      return next
    })
  }

  const handlePortalToggle = (active: boolean) => {
    setPortalActive(active)
  }

  const toggleVault = () => {
    setVaultUnlocked((prev) => {
      const next = !prev
      toast.success(next ? 'Vault unlocked for sync.' : 'Vault locked. Sync paused.')
      return next
    })
  }

  return (
    <>
      <Toaster />
      <SpeedInsights />

      {/* Floating Portal Toggle */}
      <FloatingPortal
        isActive={portalActive}
        onToggle={handlePortalToggle}
        onOpenVault={() => {
          setActiveTab('vault')
          // Scroll to top smoothly
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <LogoWithText size={38} />

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={portalActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                  {portalActive ? 'Portal Live' : 'Portal Idle'}
                </Badge>
                <Badge variant="secondary">Frame Delta {selectedCaptureMode.delta}</Badge>
                <Badge variant="outline">OCR p95 41ms</Badge>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                  {vaultUnlocked ? <LockOpen size={16} /> : <Lock size={16} />}
                  <span className="text-xs font-medium">
                    {vaultUnlocked ? 'Vault Unlocked' : 'Vault Locked'}
                  </span>
                </div>

                <Button size="sm" onClick={togglePortal}>
                  <Lightning size={16} className="mr-1" />
                  {portalActive ? 'Close Portal' : 'Open Portal'}
                </Button>
                <Button size="sm" variant="outline" onClick={toggleVault}>
                  {vaultUnlocked ? 'Lock Vault' : 'Unlock Vault'}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-emerald-500/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Logo size={44} animated={false} />
                  <div>
                    <p className="text-sm text-muted-foreground">GhostWriter Portal</p>
                    <h1 className="text-2xl font-semibold">Screen Text Extraction Command Center</h1>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  GhostWriter captures screen text in real time, heals it on-device, and syncs a clean,
                  searchable memory vault with hybrid semantic retrieval.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">On-device OCR</Badge>
                  <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30">LLM Healer</Badge>
                  <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30">Hybrid Search</Badge>
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">Stealth Overlay</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Live Capture</p>
                    <h2 className="text-lg font-semibold">Portal Telemetry</h2>
                  </div>
                  <Badge variant="secondary">5 FPS</Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Frame delta gate</span>
                      <span>2.1%</span>
                    </div>
                    <Progress value={72} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>OCR queue</span>
                      <span>1.2 frames</span>
                    </div>
                    <Progress value={38} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Dedup hit rate</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="mt-2" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkle size={14} />
                  Healer batch runs every 10 seconds.
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full max-w-4xl grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
              <TabsTrigger value="extractor" className="gap-1.5">
                <Sparkle size={16} />
                God Mode
              </TabsTrigger>
              <TabsTrigger value="vault">Vault</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="ios" className="gap-1.5">
                <DeviceMobile size={16} />
                iOS
              </TabsTrigger>
              <TabsTrigger value="ops">Ops</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {featureHighlights.map(feature => (
                  <Card key={feature.title} className="card-hover">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <Badge variant="secondary">{feature.tag}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightning size={18} />
                      <h3 className="font-semibold">Phase-Shift Pipeline</h3>
                    </div>
                    <div className="space-y-3">
                      {pipelineSteps.map(step => (
                        <div key={step.title} className="flex gap-4">
                          <Badge
                            variant="outline"
                            className={step.status === 'live' ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-300'}
                          >
                            {step.status.toUpperCase()}
                          </Badge>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{step.title}</p>
                              <span className="text-xs text-muted-foreground">{step.metric}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Folder size={18} />
                      <h3 className="font-semibold">Vault Snapshot</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {vaultStats.map(stat => (
                        <div key={stat.label} className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-semibold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.detail}</p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Warning size={16} className="mt-0.5" />
                      FLAG_SECURE windows stay dark unless running a rooted bridge module.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="portal" className="mt-6 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Portal Controls</h3>
                      <p className="text-sm text-muted-foreground">Overlay-first policy for Android 15+</p>
                    </div>
                    <Badge variant="secondary">MediaProjection</Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Stealth Mode</p>
                        <p className="text-xs text-muted-foreground">Hide notifications</p>
                      </div>
                      <Switch checked={stealthMode} onCheckedChange={setStealthMode} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Dedup Guard</p>
                        <p className="text-xs text-muted-foreground">Similarity gate</p>
                      </div>
                      <Switch checked={dedupeGuard} onCheckedChange={setDedupeGuard} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">Healer Pass</p>
                        <p className="text-xs text-muted-foreground">Local LLM cleanup</p>
                      </div>
                      <Switch checked={healerEnabled} onCheckedChange={setHealerEnabled} />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Capture Mode</p>
                    <div className="flex flex-wrap gap-2">
                      {captureModes.map(mode => (
                        <Button
                          key={mode.key}
                          variant={captureMode === mode.key ? 'default' : 'outline'}
                          onClick={() => setCaptureMode(mode.key)}
                          size="sm"
                        >
                          {mode.label} ({mode.fps} FPS)
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-medium">Overlay Status</p>
                      <p className="text-xs text-muted-foreground">Floating portal ready for tap-to-stream.</p>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active</Badge>
                    </div>
                    <div className="rounded-lg border p-4 space-y-2">
                      <p className="text-sm font-medium">Capture Notes</p>
                      <p className="text-xs text-muted-foreground">
                        Average output: {selectedCaptureMode.fps} FPS, delta gate {selectedCaptureMode.delta}.
                      </p>
                      <Badge variant="outline">Rotation locked</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="extractor" className="mt-6 space-y-6">
              <GodModeExtractor />
            </TabsContent>

            <TabsContent value="vault" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Folder size={18} />
                      <h3 className="font-semibold">Vault Policies</h3>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Retention Window</span>
                        <span className="text-foreground">30 days encrypted</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vector Index</span>
                        <span className="text-foreground">HNSW cosine</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Zero-Knowledge</span>
                        <span className="text-foreground">No raw frames</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Index build</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Share size={18} />
                      <h3 className="font-semibold">Sync Channels</h3>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>WebSocket</span>
                        <span className="text-foreground">Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Redis Streams</span>
                        <span className="text-foreground">2.1k msgs/sec</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Edge Queue</span>
                        <span className="text-foreground">0 pending</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LockOpen size={14} />
                      Vault encryption keys stay on device.
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera size={18} />
                    <h3 className="font-semibold">Recent Capture Feed</h3>
                  </div>
                  <div className="space-y-3">
                    {captureFeed.map(entry => (
                      <div key={entry.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{entry.sourceApp}</Badge>
                            <span className="text-xs text-muted-foreground">{entry.capturedAt}</span>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                            {entry.confidence}% confident
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="mt-6 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MagnifyingGlass size={18} />
                    <h3 className="font-semibold">Semantic Vault Search</h3>
                  </div>
                  <div className="relative">
                    <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by concept, source, or tag..."
                      className="pl-10"
                    />
                  </div>
                  <div className="grid gap-3">
                    {filteredEntries.map(entry => (
                      <div key={entry.id} className="rounded-lg border p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{entry.sourceApp}</Badge>
                            <span className="text-xs text-muted-foreground">{entry.capturedAt}</span>
                          </div>
                          <Badge variant="secondary">{entry.confidence}% match</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {filteredEntries.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No matches yet. Try a broader concept or remove filters.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ios" className="mt-6 space-y-6">
              <IOSCapture />
            </TabsContent>

            <TabsContent value="ops" className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Browser size={18} />
                      <h3 className="font-semibold">Service Health</h3>
                    </div>
                    <div className="space-y-3">
                      {serviceHealth.map(service => (
                        <div key={service.name} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.detail}</p>
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
                            {service.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lightning size={18} />
                      <h3 className="font-semibold">Quick Start</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                        docker-compose up -d
                      </div>
                      <p className="text-muted-foreground">Grant overlay + media projection permissions on-device.</p>
                      <div className="rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                        ./ghostwriter portal --mode {selectedCaptureMode.key}
                      </div>
                      <p className="text-muted-foreground">Scroll in any app and watch the vault fill in real time.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Share size={18} />
                    <h3 className="font-semibold">Deployment Notes</h3>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Postgres 17 + pgvector with HNSW indexing for semantic recall.</li>
                    <li>Redis Streams fan out updates to every connected portal.</li>
                    <li>Fallback to keyword search if embeddings are unavailable.</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <footer className="border-t mt-12 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Logo size={28} animated={false} />
                <div className="text-sm text-muted-foreground">
                  GhostWriter • Capture the thought, leave no trace.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary">Stealth Protocol</Badge>
                <Button variant="ghost" size="sm">
                  <Browser size={16} className="mr-1" />
                  Overlay Guide
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Warning size={16} className="mr-1" />
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
