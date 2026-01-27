<div align="center">

# 👻 GhostWriter

**The Enterprise-Grade Stealth Extraction Stack**

[![CI](https://github.com/your-username/GhostWriter-/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/GhostWriter-/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple)](https://vitejs.dev/)

*World-class, real-time contextual data pipeline designed to portal text from mobile screens directly into an AI-powered semantic vault.*

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

GhostWriter is a cutting-edge solution for extracting and storing text from mobile screens with enterprise-grade precision. Built for the 2026 tech landscape, it leverages on-device NPUs for OCR and LLM healing, ensuring that what you see is what you remember, word for word and paragraph for paragraph.

### Why GhostWriter?

- 🔒 **Privacy First**: All processing happens on-device; raw images never leave your device
- ⚡ **Real-time**: Low-latency extraction with visual delta deduplication
- 🧠 **AI-Powered**: Semantic search with zero-keyword queries
- 📱 **Cross-Platform**: Web, iOS, and Android support
- 🏗️ **Enterprise Ready**: Production-grade architecture and tooling

## 🏗 System Architecture

GhostWriter follows a distributed intelligence model, prioritizing low-latency extraction and high-fidelity storage.

| Layer | Component | Technology | Role |
|-------|-----------|------------|------|
| **Edge** | Mobile Portal | Kotlin / MediaProjection | Real-time screen buffer capture (5-10 FPS) |
| **Intelligence** | The Healer | ML Kit + MediaPipe | On-device OCR and Gemma 2B text reconstruction |
| **Transport** | Ghost-Stream | Go / WebSockets | Low-latency bi-directional data synchronization |
| **Storage** | The Vault | Postgres + pgvector | Semantic and keyword-indexed permanent memory |
| **Search** | The Oracle | Hybrid RRF Search | AI-driven concept-based retrieval |

> **Note**: This repository currently focuses on the GhostWriter portal UI and product specification. The mobile and backend folders describe the target stack layout. A starter `docker-compose.yml` is included at the repo root for local vault services.

## ⚡ Key Features

### 1. Visual Delta Deduplication

GhostWriter does not waste resources. It uses a Visual Delta Check to monitor screen movement. It only triggers the OCR engine when the screen layout changes by more than 2 percent, allowing for perfectly deduplicated captures during slow scrolls.

### 2. Semantic Memory Vault

Utilizing pgvector, the Vault stores data as high-dimensional vectors. This enables zero-keyword search.

**Example Query**: *"That time I was looking at repair parts for a 2006 black MacBook."*

**Result**: GhostWriter finds the specific forum post you scrolled past, even if the exact phrase "repair parts" was never captured, because the AI understands intent.

### 3. Hybrid RRF Search

The search engine merges BM25 lexical search (exact part numbers or names) with vector similarity (concepts and intent) using Reciprocal Rank Fusion, providing a single best list.

### 4. Cross-Platform Support

- **Web**: Progressive Web App (PWA) with offline support
- **iOS**: Native SwiftUI app with Vision OCR
- **Android**: Kotlin/Jetpack Compose (planned)

## 🔒 Security & Stealth Protocol

- **Privacy First**: Raw screen images are processed in RAM and discarded instantly. No screenshots are saved to the device gallery.
- **On-Device Healing**: Text cleanup happens locally on the phone NPU.
- **Encrypted Sync**: Data is transmitted via TLS-encrypted WebSockets to your private vault.
- **Unchained Mode**: Optional root/LSPosed module to strip FLAG_SECURE, allowing extraction from restricted apps.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for vault services)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/GhostWriter-.git
   cd GhostWriter-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Spin up the Vault** (optional, for full-stack testing):
   ```bash
   docker-compose up -d
   ```

## 🔧 Backend Setup (Go + PostgreSQL + Redis)

The GhostWriter backend provides WebSocket-based real-time syncing, semantic search, and push notifications.

### Quick Start with Docker Compose

```bash
# Start all services (PostgreSQL + Redis + Go API)
docker-compose up -d

# View logs
docker-compose logs -f ghost-api

# Stop services
docker-compose down
```

### Configuration

1. **Copy environment template**:
   ```bash
   cd backend-go
   cp .env.template .env
   ```

2. **Configure `.env` file**:
   - `OPENAI_API_KEY`: Your OpenAI API key for embeddings
   - `APNS_*`: Apple Push Notification Service credentials (optional)

3. **API will be available at**: `http://localhost:8080`

### API Endpoints

- `GET /health` - Health check
- `GET /ws` - WebSocket connection for real-time sync
- `POST /vault/search` - Semantic search with vector similarity
- `GET /entries` - Get recent entries for a user

📖 **Full backend documentation**: See `backend-go/README.md`

### 🖥️ Automatic Screen Capture Setup

GhostWriter supports automatic screen capture on **all platforms**:

#### Quick Start - Auto-Detect Platform
```bash
# Automatically detects and starts capture for your platform
npm run capture:all

# Continuous watch mode
npm run capture:all -- --watch
```

#### Platform-Specific Commands

**Windows/Mac/Linux Desktop:**
```bash
npm run ocr:desktop          # One-time capture
npm run ocr:desktop:watch    # Continuous capture
```

**Android (via ADB):**
```bash
# Connect device via USB, then:
npm run ocr:live -- --interval 750
```

**iOS:**
- Use the web UI to upload screenshots
- See `scripts/PLATFORM_SETUP.md` for details

📖 **Full setup guide:** See `scripts/PLATFORM_SETUP.md` for detailed platform-specific instructions.

### Development

```bash
# Start dev server
npm run dev

# Start dev server with network access (for mobile testing)
npm run dev:host

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

## 📱 Mobile Setup

### iPhone - Floating Portal

The floating portal works perfectly on iPhone! Just:

1. **Start the server**:
   ```bash
   npm run dev:host
   ```

2. **On iPhone Safari**: Open `http://YOUR_IP:5173`

3. **Add to Home Screen**: Tap Share → Add to Home Screen

4. **Use the Portal**:
   - Floating ghost logo appears on screen
   - **Tap** to toggle capture on/off
   - **Drag** to move anywhere
   - Green dot = active, Gray dot = paused

📖 **Full iPhone guide**: See `IPHONE_PORTAL_SETUP.md`

### Option A: Local Network (Fastest)

1. Run the app on your computer:
   ```bash
   npm run dev:host
   ```

2. Find your local IP (example: `192.168.1.42`)

3. On your iPhone, open:
   ```
   http://192.168.1.42:5173
   ```

4. Tap **Share → Add to Home Screen** for a full-screen app experience

### Option B: Cloud Deploy (Vercel)

GhostWriter is optimized for **Vercel** deployment:

1. **Connect Repository**: Import your GitHub repo to Vercel
2. **Auto-Configure**: Vercel auto-detects `vercel.json`
3. **Set Environment Variables**: Add `VITE_API_URL` and others
4. **Deploy**: Click deploy and you're live!

📖 **Full deployment guide**: See `DEPLOYMENT.md`

**Other Platforms**: Also works on Netlify, Render, Railway, or any static host.

## 📂 Project Structure

```
GhostWriter-/
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── ...            # Feature components
│   ├── lib/               # Utilities and helpers
│   ├── hooks/             # Custom React hooks
│   └── styles/            # Global styles
├── scripts/               # Build and utility scripts
│   └── ocr-adapters/      # OCR adapter implementations
├── ios-native/            # Native iOS Swift code
├── tests/                 # Test files
├── public/                # Static assets
└── .github/               # GitHub workflows and templates
```

## 🧪 OCR Test Harness

The repository includes a comprehensive OCR harness to validate captured text output against ground truth from live device frames.

### Basic Testing

```bash
# Run OCR tests
npm run ocr:test

# Test with specific adapter
npm run ocr:test:adapter -- --adapter tesseract
```

### Capture Workflow

```bash
# Capture a frame from connected device
npm run ocr:capture -- --id OCR-001 --name "Portal sample"

# Real-time OCR from connected device
npm run ocr:live -- --interval 750 --duration 30000 --output ./ocr-live-log.txt
```

### Advanced Options

- `--delta` - Motion threshold (default: 0.012)
- `--sample` - Pixel step for motion sampling (default: 12)
- `--dedupe` - Similarity threshold for duplicate suppression (default: 0.88)
- `--min-chars` - Minimum characters to log (default: 20)
- `--window` - Recent entries considered for dedupe (default: 5)
- `--region` - Crop region as x,y,width,height (optional)
- `--json` - Emit structured JSON logs

### WebSocket Streaming

For real-time vault sync:

```bash
npm run ocr:live -- \
  --ws ws://localhost:8080/portal/sync \
  --token YOUR_TOKEN \
  --device device-001 \
  --source "Chrome Browser"
```

### Custom OCR Adapters

To plug in another OCR adapter, implement `scripts/ocr-adapters/<name>.mjs` and run:

```bash
node scripts/ocr-harness.mjs --adapter <name>
```

## 📱 Native iOS (SwiftUI + Vision OCR)

The native iOS app provides a complete mobile experience with on-device OCR, real-time sync, and semantic search.

### Features

- **OCR Screen Capture**: Extract text from screenshots and screen recordings
- **WebSocket Sync**: Real-time syncing with backend server
- **Push Notifications**: Get notified when text processing completes
- **Semantic Search**: Search your vault by meaning, not just keywords
- **Export Options**: Save to iCloud Drive, Files app, or share with other apps

### Quick Start

1. Open `ios-native/` in Xcode
2. Configure your backend URL in Settings
3. Build and run on your iPhone
4. Grant camera and notification permissions
5. Start capturing text!

📖 **Full iOS guide**: See `ios-native/README.md`

### iOS App Workflow

1. **Capture**: Take screenshots or screen recordings of content
2. **Extract**: Upload to app and run Vision OCR
3. **Sync**: Text automatically syncs to backend via WebSocket
4. **Search**: Use semantic search to find text by meaning
5. **Export**: Save to iCloud, Files, or share with other apps

### Configuration

In the Settings tab:
- **User ID**: Auto-generated unique identifier
- **Server URL**: Backend WebSocket endpoint (default: `ws://localhost:8080/ws`)
- **Push Notifications**: Enable to receive processing updates

### Pro Tips

- ✅ Use EXIF auto-sort to keep screenshots in the exact order you captured them
- ✅ If a recording is long, increase frame interval to reduce processing time
- ✅ Add a session name so the exported note is easy to find later
- ✅ Enable noise filtering to drop UI chrome like "Regenerate response"
- ✅ If your thread includes speaker labels, enable role normalization
- ✅ Markdown output adds headings and bold speaker labels
- ✅ JSON output is ready to sync into your vault
- ✅ Share uses the iOS share sheet for Notes or Files
- ✅ Chunking helps split giant threads into bite-sized shares
- ✅ Use Image Enhance + Contrast to boost OCR on low-contrast screenshots
- ✅ Connect to backend to enable semantic search across all captures

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute to GhostWriter
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Security Policy](SECURITY.md) - Security reporting
- [Product Requirements](PRD.md) - Product specification
- [OCR Test Cases](OCR_TEST_CASES.md) - OCR testing documentation
- [iOS Native README](ios-native/README.md) - iOS development guide

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built for modders, makers, and reflectors. GhostWriter turns digital consumption into a permanent, searchable intelligence asset.

---

<div align="center">

**Made with ❤️ by the GhostWriter team**

[Report Bug](https://github.com/your-username/GhostWriter-/issues) • [Request Feature](https://github.com/your-username/GhostWriter-/issues) • [Documentation](https://github.com/your-username/GhostWriter-/wiki)

</div>
