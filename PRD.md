# GhostWriter - Product Requirements Document

> **Portal text from any mobile screen into an AI-powered semantic vault.**

GhostWriter is a world-class, real-time contextual data pipeline designed to capture text from mobile screens and store it in a searchable semantic vault for future retrieval.

## 🎯 Vision

GhostWriter creates a **universal memory system** - capturing everything you see on your mobile screen and making it instantly searchable through AI-powered semantic understanding. Never lose important information you scrolled past again.

## ✨ Experience Qualities

1. **Universal** - Captures text from any app, any screen, anywhere on your device.
2. **Intelligent** - On-device OCR and LLM text reconstruction for perfect accuracy.
3. **Private** - Zero-knowledge storage, on-device processing keeps data secure.
4. **Searchable** - AI-powered semantic search finds content by meaning, not just keywords.
5. **Real-time** - Low-latency streaming ensures your vault is always up-to-date.

## 🏗 System Architecture Overview

GhostWriter is built on a distributed intelligence model, moving from high-speed local capture to long-term cloud-native memory.

| Layer | Component | Technology | Role |
|---|---|---|---|
| Edge | Mobile Portal | Kotlin / MediaProjection | Real-time buffer capture at 5-10 FPS. |
| Intelligence | The Healer | ML Kit + MediaPipe | On-device OCR and LLM text reconstruction. |
| Transport | Ghost-Stream | Go / WebSockets | Low-latency bi-directional data sync. |
| Storage | The Vault | Postgres + pgvector | Semantic and keyword-indexed permanent storage. |
| Search | The Oracle | Hybrid RRF Search | AI-driven "meaning-based" retrieval. |

## 🚀 Core Features

### 1. Mobile Portal (Screen Capture)
- **Real-time Capture**: Continuous screen capture at 5-10 FPS
- **Visual Delta Check**: Only processes frames when layout changes by >2%
- **Battery Optimization**: Smart frame skipping to preserve battery life
- **Universal Compatibility**: Works with any app, including protected content (with optional FLAG_SECURE bypass)

### 2. The Healer (Text Reconstruction)
- **On-Device OCR**: ML Kit for fast, accurate text extraction
- **LLM Enhancement**: MediaPipe/Gemma 2B for text reconstruction and context understanding
- **NPU Acceleration**: Leverages dedicated neural processing for maximum performance
- **Privacy First**: All processing happens on-device before cloud sync

### 3. Ghost-Stream (Data Transport)
- **WebSocket Communication**: Low-latency bi-directional streaming
- **Optimistic Updates**: Immediate local confirmation with background sync
- **Offline Support**: Queue changes when offline, sync when connected
- **Compression**: Efficient data transfer to minimize bandwidth

### 4. The Vault (Storage)
- **Vector Embeddings**: High-dimensional semantic representations via pgvector
- **Dual Indexing**: Both keyword-based (BM25) and semantic (cosine similarity) search
- **Scalable Storage**: Postgres-backed for reliability and performance
- **Version History**: Track changes over time

### 5. The Oracle (Search)
- **Zero-Keyword Search**: Find content by meaning, not exact matches
- **Hybrid Retrieval**: Reciprocal Rank Fusion (RRF) combines BM25 and semantic search
- **Context Awareness**: Understands intent behind queries
- **Real-time Results**: Instant search across all captured content

## 🔒 Security & Privacy

### Zero-Knowledge Architecture
- Server never sees raw images, only processed text and embeddings
- End-to-end encryption for data in transit
- Optional local-only mode for maximum privacy

### On-Device Processing
- OCR and LLM inference happen entirely on NPU
- Data stays on device until explicitly synced
- User controls what gets uploaded to vault

### Optional Enhancements
- FLAG_SECURE Bypass: LSPosed hooks for universal capture capability
- Secure Element Storage: Hardware-backed key storage for enterprise deployments
- Audit Logs: Track all data access for compliance

## 🎨 Design Direction

### Visual Language
- **Minimal & Fast**: Focus on speed and efficiency
- **Dark Mode Native**: Optimized for OLED displays
- **Transparency**: Clear indication of capture status
- **Ghost UI**: Subtle overlay that stays out of the way

### Color Palette
- **Primary**: Ghost White `oklch(0.98 0.01 270)`
- **Accent**: Ethereal Purple `oklch(0.70 0.18 290)`
- **Active**: Bright Cyan `oklch(0.75 0.20 200)`
- **Background**: Deep Black `oklch(0.15 0.01 270)`

## 📱 Mobile Implementation

### Android Portal
- MediaProjection API for screen capture
- Foreground service for continuous operation
- Notification controls for quick access
- Gesture shortcuts for manual capture

### Capture Modes
- **Always-On**: Continuous capture with smart filtering
- **Manual**: User-triggered capture of current screen
- **Smart**: AI-detected important screens only
- **Scheduled**: Capture during specific time windows

## 🛠 Project Structure

```
ghostwriter/
├── mobile-android/           # Kotlin/Jetpack Compose Portal
│   ├── features/portal/      # Screen capture & Frame management
│   ├── features/ocr/         # ML Kit integration
│   └── features/healer/      # MediaPipe/Gemma 2B local inference
├── backend-go/               # High-concurrency Go API
│   ├── internal/vault/       # pgvector & SQL logic
│   ├── internal/stream/      # WebSocket & Pub/Sub management
│   └── cmd/api/              # Entry point
└── infra/                    # Deployment configurations
    ├── docker-compose.yml    # Full-stack local environment
    └── k8s/                  # Production orchestration
```

## 🚀 Execution Guide

1. **Deploy the Vault**: `docker-compose up -d` to spin up Postgres and the Go API
2. **Initialize the Portal**: Compile the Android app and grant permissions
3. **Start Scrolling**: Activate GhostWriter overlay and watch your vault populate

## 🔮 Future Features (Roadmap)

### Phase 2: Enhanced Intelligence
- Multi-modal capture (screenshots + voice)
- Automatic tagging and categorization
- Smart summaries of captured content
- Cross-reference detection

### Phase 3: Advanced Search
- Natural language queries
- Temporal search (find what I saw "last Tuesday")
- Visual similarity search
- Context-aware suggestions

### Phase 4: Multi-Platform
- iOS support
- Desktop capture clients
- Browser extension for web capture
- API for third-party integrations

### Phase 5: Team Features
- Shared vaults for collaboration
- Permission management
- Team search and discovery
- Export and compliance tools

## 📊 Success Metrics

- **Capture Rate**: Frames processed per second
- **Accuracy**: OCR quality and text reconstruction
- **Latency**: Time from capture to searchable
- **Search Quality**: Relevance of search results
- **Battery Impact**: Power consumption per hour

## 🏗️ Technical Stack

### Mobile (Android)
- Kotlin with Jetpack Compose
- MediaProjection API
- ML Kit for OCR
- MediaPipe/Gemma 2B for inference

### Backend (Go)
- Go 1.21+ for high-concurrency
- WebSocket for real-time streaming
- Postgres 16+ with pgvector extension
- Redis for caching and pub/sub

### Infrastructure
- Docker for local development
- Kubernetes for production
- Cloud-native scaling
- Monitoring and observability

---

**GhostWriter** - *Your digital memory, captured and searchable.* 👻✨
