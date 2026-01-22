import { useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { 
  Eye, Database, Lightning, Shield, MagnifyingGlass, 
  DeviceMobile, Cloud, Cpu, Brain, Lock
} from '@phosphor-icons/react'

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">👻</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GhostWriter</h1>
              <p className="text-sm text-gray-400">Your Digital Memory</p>
            </div>
          </div>
          <Badge variant="outline" className="text-purple-300 border-purple-500/50">
            v0.1.0 Alpha
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Portal Text from Any Screen
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            A world-class, real-time contextual data pipeline designed to capture text from 
            mobile screens and store it in an AI-powered semantic vault for instant retrieval.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <DeviceMobile className="mr-2" weight="bold" />
              Get Android App
            </Button>
            <Button size="lg" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-950">
              <Database className="mr-2" weight="bold" />
              Deploy Backend
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-black/40">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <Eye className="w-12 h-12 text-purple-400 mb-2" weight="duotone" />
                  <CardTitle>Capture Everything</CardTitle>
                  <CardDescription>
                    Real-time screen capture at 5-10 FPS with intelligent frame deduplication
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <Brain className="w-12 h-12 text-pink-400 mb-2" weight="duotone" />
                  <CardTitle>AI-Powered OCR</CardTitle>
                  <CardDescription>
                    On-device ML Kit + MediaPipe for perfect text reconstruction
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-black/40 border-cyan-500/30">
                <CardHeader>
                  <MagnifyingGlass className="w-12 h-12 text-cyan-400 mb-2" weight="duotone" />
                  <CardTitle>Semantic Search</CardTitle>
                  <CardDescription>
                    Find content by meaning, not keywords, using vector embeddings
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-2xl">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Mobile Portal Captures Screen</h4>
                    <p className="text-gray-400">
                      Android app uses MediaProjection to capture your screen at 5-10 FPS, 
                      only processing when content changes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">The Healer Extracts & Reconstructs</h4>
                    <p className="text-gray-400">
                      On-device OCR with ML Kit extracts text, then Gemma 2B LLM improves 
                      accuracy and adds context.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ghost-Stream Syncs to Vault</h4>
                    <p className="text-gray-400">
                      Low-latency WebSocket streams text to the Go backend, storing embeddings 
                      in Postgres with pgvector.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">The Oracle Finds Anything</h4>
                    <p className="text-gray-400">
                      Hybrid search combines BM25 keyword matching with semantic vector search 
                      for perfect retrieval.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card className="max-w-4xl mx-auto bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-2xl">System Architecture</CardTitle>
                <CardDescription>
                  Distributed intelligence model from edge to cloud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-5 gap-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/50 flex items-center justify-center">
                        <DeviceMobile className="w-8 h-8 text-purple-400" weight="duotone" />
                      </div>
                      <h4 className="font-semibold text-sm">Edge</h4>
                      <p className="text-xs text-gray-400">Mobile Portal</p>
                      <Badge variant="secondary" className="text-xs">Kotlin</Badge>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-pink-900/50 flex items-center justify-center">
                        <Brain className="w-8 h-8 text-pink-400" weight="duotone" />
                      </div>
                      <h4 className="font-semibold text-sm">Intelligence</h4>
                      <p className="text-xs text-gray-400">The Healer</p>
                      <Badge variant="secondary" className="text-xs">ML Kit</Badge>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-cyan-900/50 flex items-center justify-center">
                        <Lightning className="w-8 h-8 text-cyan-400" weight="duotone" />
                      </div>
                      <h4 className="font-semibold text-sm">Transport</h4>
                      <p className="text-xs text-gray-400">Ghost-Stream</p>
                      <Badge variant="secondary" className="text-xs">Go/WS</Badge>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-purple-900/50 flex items-center justify-center">
                        <Database className="w-8 h-8 text-purple-400" weight="duotone" />
                      </div>
                      <h4 className="font-semibold text-sm">Storage</h4>
                      <p className="text-xs text-gray-400">The Vault</p>
                      <Badge variant="secondary" className="text-xs">pgvector</Badge>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-pink-900/50 flex items-center justify-center">
                        <MagnifyingGlass className="w-8 h-8 text-pink-400" weight="duotone" />
                      </div>
                      <h4 className="font-semibold text-sm">Search</h4>
                      <p className="text-xs text-gray-400">The Oracle</p>
                      <Badge variant="secondary" className="text-xs">RRF</Badge>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="space-y-4">
                    <h4 className="font-semibold">Project Structure</h4>
                    <pre className="bg-black/60 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
{`ghostwriter/
├── mobile-android/           # Kotlin/Jetpack Compose Portal
│   ├── features/portal/      # Screen capture & Frame management
│   ├── features/ocr/         # ML Kit integration
│   └── features/healer/      # MediaPipe/Gemma 2B inference
├── backend-go/               # High-concurrency Go API
│   ├── internal/vault/       # pgvector & SQL logic
│   ├── internal/stream/      # WebSocket & Pub/Sub
│   └── cmd/api/              # Entry point
└── infra/                    # Deployment configs
    ├── docker-compose.yml    # Local environment
    └── k8s/                  # Production orchestration`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-purple-400" weight="duotone" />
                    Visual Delta Check
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    Only processes frames when screen layout changes by &gt;2%, 
                    ensuring smooth scrolling capture without repeating static content. 
                    Saves battery and prevents data bloat.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-pink-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-6 h-6 text-pink-400" weight="duotone" />
                    Semantic Vault
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    Text stored as high-dimensional vectors enables zero-keyword search. 
                    Find "how to fix that old black MacBook" even if those exact words 
                    were never captured.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MagnifyingGlass className="w-6 h-6 text-cyan-400" weight="duotone" />
                    Hybrid Retrieval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    Reciprocal Rank Fusion (RRF) merges BM25 exact matches with 
                    cosine similarity for abstract concepts. Best of both worlds.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" weight="duotone" />
                    On-Device AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">
                    OCR and LLM inference happen entirely on the NPU, leveraging 
                    2026 hardware for maximum performance. Your data stays local 
                    until ready for the vault.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-purple-500/30">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-10 h-10 text-purple-400" weight="duotone" />
                  <CardTitle className="text-2xl">Privacy-First Architecture</CardTitle>
                </div>
                <CardDescription>
                  Zero-knowledge storage with on-device processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Lock className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" weight="duotone" />
                    <div>
                      <h4 className="font-semibold mb-2">Zero-Knowledge Storage</h4>
                      <p className="text-gray-400">
                        The server never sees raw images, only processed text and embeddings. 
                        Your private screen content never leaves your device until it's 
                        transformed into searchable text.
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="flex items-start gap-4">
                    <Cpu className="w-6 h-6 text-pink-400 mt-1 flex-shrink-0" weight="duotone" />
                    <div>
                      <h4 className="font-semibold mb-2">On-Device Processing</h4>
                      <p className="text-gray-400">
                        OCR and LLM "Healing" happen entirely on the NPU, keeping your 
                        data off the public internet until you're ready to sync to your 
                        personal vault.
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" weight="duotone" />
                    <div>
                      <h4 className="font-semibold mb-2">Optional FLAG_SECURE Bypass</h4>
                      <p className="text-gray-400">
                        For power users, optional LSPosed hooks allow capture from 
                        protected windows, ensuring the portal is truly universal. 
                        Use responsibly and in accordance with local laws.
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-purple-500/20" />

                  <div className="flex items-start gap-4">
                    <Cloud className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" weight="duotone" />
                    <div>
                      <h4 className="font-semibold mb-2">Self-Hosted Option</h4>
                      <p className="text-gray-400">
                        Deploy your own vault with Docker or Kubernetes. Complete 
                        control over your data with no third-party access.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Getting Started */}
      <section className="border-t border-white/10 bg-black/20 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl font-bold">Ready to Build Your Digital Memory?</h3>
            <p className="text-gray-400 text-lg">
              Deploy the stack in minutes with Docker Compose
            </p>
            <div className="bg-black/60 p-6 rounded-lg text-left">
              <pre className="text-sm text-gray-300">
{`# Clone the repository
git clone https://github.com/Bboy9090/card-command-center.git
cd card-command-center

# Deploy the vault (Postgres + Go API)
docker-compose up -d

# Compile Android app
cd mobile-android
./gradlew assembleDebug

# Install and grant permissions
adb install app/build/outputs/apk/debug/app-debug.apk

# Start capturing your digital memory! 👻`}
              </pre>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                View Documentation
              </Button>
              <Button size="lg" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-950">
                GitHub Repository
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>GhostWriter - Built for 2026 hardware with NPU-accelerated inference</p>
          <p className="mt-2">Your digital memory, captured and searchable. 👻✨</p>
        </div>
      </footer>
    </div>
  )
}

export default App
