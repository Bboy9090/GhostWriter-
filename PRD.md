# GhostWriter - Product Requirements Document

> **Capture the thought. Leave no trace.**

GhostWriter is a real-time screen text extraction system that silently streams what you see into a clean, searchable memory vault. It operates as a stealth overlay on Android, processes OCR locally, heals the output with on-device LLMs, and syncs it into a hybrid semantic search backend.

## 🎯 Vision

GhostWriter turns transient screen text into permanent, AI-searchable memory. The experience should feel like a portal: you scroll on any app and the text appears in your vault, fully formatted and deduplicated, without manual copy/paste or screen recording.

## ✨ Experience Qualities

1. **Stealth** - Captures without interrupting workflows; overlay-first, no saved screenshots.
2. **Accurate** - Paragraph-level fidelity with layout-aware OCR.
3. **Fast** - Low-latency capture with 3-10 FPS throttling.
4. **Secure** - Zero-knowledge pipeline with encrypted sync.
5. **Searchable** - Hybrid semantic + keyword retrieval across all captured text.

## 🚀 Core Features

### 1. Portal Overlay + MediaProjection
- **Floating control** that stays above other apps.
- **Foreground service** for consistent capture on Android 14/15+.
- **Overlay-first launch** to satisfy background capture restrictions.

### 2. Frame Intelligence + Deduplication
- Visual delta gating to avoid processing static frames.
- Levenshtein + SimHash on text blocks to prevent duplicates.
- Adaptive capture rate based on scroll velocity.

### 3. On-Device OCR
- Google ML Kit for fast text recognition.
- Preserves block geometry for layout-aware reconstruction.
- Runs entirely on the device NPU for privacy.

### 4. Healer Layer (LLM Cleanup)
- Local Gemma/Llama-style model repairs line breaks and typos.
- Periodic batch pass that converts raw OCR into readable paragraphs.

### 5. Semantic Memory Vault
- Go backend stores entries in Postgres + pgvector.
- Vector embeddings enable concept-based retrieval.
- WebSocket sync delivers near real-time updates.

### 6. Hybrid Search (RRF)
- BM25 handles precise keywords (part numbers, names).
- Vector similarity handles intent-based queries.
- RRF merges both into a single ranked list.

### 7. Security + Privacy
- No screenshots saved to disk.
- Device-only encryption keys for sync.
- Optional panic wipe to clear local cache.
- Optional root module to bypass FLAG_SECURE (advanced users only).

## 🎨 Design Direction

### Visual Language
- **Dark Mode First** with neon green accents.
- **Minimal Interface** that feels invisible until needed.
- **High Contrast** for quick glance readability.

### Typography
- **Primary**: Inter
- **Monospace**: JetBrains Mono

### Motion
- Subtle glow pulses on portal state changes.
- Minimal toast notifications for status.

## 📱 Platform Constraints

- **Android**: Supported via MediaProjection + overlay permission.
- **iOS**: Restricted due to sandbox limitations; only possible with Accessibility APIs.
- **FLAG_SECURE**: Protected windows remain black unless using a rooted bridge.

## 🛡️ Edge Cases

- Overlay permission denied or revoked.
- MediaProjection dialog canceled mid-session.
- Heavy scroll causing OCR lag or frame drops.
- Offline mode: queue sync and retry later.
- Rotation changes mid-capture.

## 📊 Success Metrics

- **Capture accuracy**: OCR word accuracy > 95 percent.
- **Latency**: < 100ms median from frame to vault entry.
- **Dedup effectiveness**: > 85 percent duplicate suppression.
- **Battery impact**: < 5 percent per 30 minutes of active capture.

## 🔮 Roadmap

### Phase 2: Advanced Healer
- Layout-aware paragraph restoration.
- Multi-language OCR packs.

### Phase 3: Cross-Device Vault
- Desktop sync with real-time highlights.
- Smart tags and auto-collections.

### Phase 4: Memory Intelligence
- Automatic summarization by session.
- Contextual search with semantic filters.

## 🏗️ Technical Architecture

### Mobile
- Kotlin + Jetpack Compose
- Foreground service + MediaProjection
- ML Kit OCR + MediaPipe LLM

### Backend
- Go API with WebSocket ingestion
- PostgreSQL 17 + pgvector
- Redis Streams for fanout

### Infra
- Docker Compose for local
- Kubernetes for scale

---

**GhostWriter** - *A stealth portal from screen to memory.* 👻
