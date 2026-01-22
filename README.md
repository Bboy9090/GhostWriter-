GhostWriter | The Enterprise-Grade Stealth Extraction Stack
This documentation outlines the architecture for GhostWriter, a world-class, real-time contextual data pipeline designed to "portal" text from a mobile screen directly into an AI-powered semantic vault.
🏗 System Architecture Overview
GhostWriter is built on a distributed intelligence model, moving from high-speed local capture to long-term cloud-native memory.
| Layer | Component | Technology | Role |
|---|---|---|---|
| Edge | Mobile Portal | Kotlin / MediaProjection | Real-time buffer capture at 5-10 FPS. |
| Intelligence | The Healer | ML Kit + MediaPipe | On-device OCR and LLM text reconstruction. |
| Transport | Ghost-Stream | Go / WebSockets | Low-latency bi-directional data sync. |
| Storage | The Vault | Postgres + pgvector | Semantic and keyword-indexed permanent storage. |
| Search | The Oracle | Hybrid RRF Search | AI-driven "meaning-based" retrieval. |
🛠 Project Structure (The File Tree)
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

⚡ Core Logic: The "Phase-Shift" Pipeline
1. Frame Intelligence (Deduplication)
To save battery and prevent data bloat, GhostWriter uses a Visual Delta Check. It only processes frames when the screen layout changes by >2%, ensuring scrolling is captured smoothly without repeating static content.
2. The Semantic Vault (pgvector)
Text is stored as high-dimensional vectors. This allows for Zero-Keyword Search.
> Example: Searching for "How to fix that old black MacBook" will find the text you scrolled past on a forum, even if the word "fix" was never explicitly captured, because the AI understands the intent.
> 
3. Hybrid Retrieval
The system uses Reciprocal Rank Fusion (RRF) to merge:
 * BM25: For exact matches (Part numbers, specific names).
 * Cosine Similarity: For abstract concepts (Memories, ideas, general context).
🔒 Security & Privacy (The Stealth Protocol)
 * Zero-Knowledge Storage: The server never sees raw images; it only receives processed text and embeddings.
 * On-Device Processing: The OCR and LLM "Healing" happen entirely on the NPU, keeping your data off the public internet until it’s ready for the vault.
 * FLAG_SECURE Bypass: (Optional / Modded) Utilizes LSPosed hooks to allow extraction from protected windows, ensuring the portal is truly universal.
🚀 Execution Guide
 * Deploy the Vault: docker-compose up -d to spin up Postgres and the Go API.
 * Initialize the Portal: Compile the Android app and grant System Alert Window and Media Projection permissions.
 * Start Scrolling: Open any app, activate the GhostWriter overlay, and watch your digital memory populate in real-time.
> Note: This stack is built for maximum performance on 2026 hardware, leveraging NPU-accelerated inference and high-speed vector indexing.
> 
