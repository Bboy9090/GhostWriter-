# GhostWriter | The Enterprise-Grade Stealth Extraction Stack

GhostWriter is a world-class, real-time contextual data pipeline designed to portal text from a mobile screen directly into an AI-powered semantic vault. Built for the 2026 tech landscape, it leverages on-device NPUs for OCR and LLM healing, ensuring that what you see is what you remember, word for word and paragraph for paragraph.

## 🏗 System Architecture

GhostWriter follows a distributed intelligence model, prioritizing low-latency extraction and high-fidelity storage.

| Layer | Component | Technology | Role |
|---|---|---|---|
| Edge | Mobile Portal | Kotlin / MediaProjection | Real-time screen buffer capture (5-10 FPS). |
| Intelligence | The Healer | ML Kit + MediaPipe | On-device OCR and Gemma 2B text reconstruction. |
| Transport | Ghost-Stream | Go / WebSockets | Low-latency bi-directional data synchronization. |
| Storage | The Vault | Postgres + pgvector | Semantic and keyword-indexed permanent memory. |
| Search | The Oracle | Hybrid RRF Search | AI-driven concept-based retrieval. |

## 📂 Project Structure

```text
ghostwriter/
├── mobile-android/           # Kotlin/Jetpack Compose Portal
│   ├── features/portal/      # MediaProjection & Foreground Service
│   ├── features/ocr/         # ML Kit Text Recognition Engine
│   └── features/healer/      # MediaPipe/Gemma 2B Local Inference
├── backend-go/               # High-concurrency Go API
│   ├── internal/vault/       # pgvector & SQL Repository
│   ├── internal/stream/      # WebSocket & Redis Pub/Sub
│   └── cmd/api/              # Service Entry Point
└── infra/                    # Deployment & Orchestration
    ├── docker-compose.yml    # Full-stack Local Dev Environment
    └── k8s/                  # Kubernetes Production Manifests
```

Note: This repository currently focuses on the GhostWriter portal UI and product specification. The mobile and backend folders above describe the target stack layout. A starter docker-compose.yml is included at the repo root for local vault services.

## ⚡ Key Features

### 1. Visual Delta Deduplication

GhostWriter does not waste resources. It uses a Visual Delta Check to monitor screen movement. It only triggers the OCR engine when the screen layout changes by more than 2 percent, allowing for perfectly deduplicated captures during slow scrolls.

### 2. Semantic Memory Vault

Utilizing pgvector, the Vault stores data as high-dimensional vectors. This enables zero-keyword search.

Query: "That time I was looking at repair parts for a 2006 black MacBook."

Result: GhostWriter finds the specific forum post you scrolled past, even if the exact phrase "repair parts" was never captured, because the AI understands intent.

### 3. Hybrid RRF Search

The search engine merges BM25 lexical search (exact part numbers or names) with vector similarity (concepts and intent) using Reciprocal Rank Fusion, providing a single best list.

## 🔒 Security & Stealth Protocol

- Privacy First: Raw screen images are processed in RAM and discarded instantly. No screenshots are saved to the device gallery.
- On-Device Healing: Text cleanup happens locally on the phone NPU.
- Encrypted Sync: Data is transmitted via TLS-encrypted WebSockets to your private vault.
- Unchained Mode: Optional root/LSPosed module to strip FLAG_SECURE, allowing extraction from restricted apps.

## 🚀 Quick Start

### 1. Spin up the Vault

```bash
docker-compose up -d
```

This initializes the Postgres database with the pgvector extension and starts the Go ingestion API.

### 2. Initialize the Portal

1. Build the `mobile-android` project.
2. Grant System Alert Window (Overlay) and Media Projection permissions.
3. Tap the floating Ghost icon to open the portal.

### 3. Scroll & Sync

Open any app (browser, social media, PDF) and start scrolling. The text teleports into your Vault in real time.

Built for modders, makers, and reflectors. GhostWriter turns digital consumption into a permanent, searchable intelligence asset.

## OCR Test Harness

The repository includes a real OCR harness to validate captured text output against
ground truth from live device frames.

```bash
npm run ocr:test
```

Capture a real frame from a connected device:

```bash
npm run ocr:capture -- --id OCR-001 --name "Portal sample"
```

Populate the expected text file that was created, then re-run the harness.

For real-time OCR from a connected device:

```bash
npm run ocr:live -- --interval 750 --duration 30000 --output ./ocr-live-log.txt
```

To plug in another real OCR adapter, implement scripts/ocr-adapters/<name>.mjs and run:

```bash
node scripts/ocr-harness.mjs --adapter <name>
```
