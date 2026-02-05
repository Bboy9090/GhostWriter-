# GhostWriter Complete Setup Guide

This guide will help you set up the complete GhostWriter stack: Backend (Go), Frontend (Web), and iOS App.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [iOS App Setup](#ios-app-setup)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker & Docker Compose** (for backend services)
- **Node.js 20+** and npm (for frontend)
- **Go 1.22+** (for backend development)
- **Xcode 15+** (for iOS app)
- **PostgreSQL 17+** with pgvector (via Docker)
- **Redis 7+** (via Docker)

### Optional

- **OpenAI API Key** (for semantic search embeddings)
- **Apple Developer Account** (for push notifications)

## Backend Setup

### Method 1: Docker Compose (Recommended)

This starts PostgreSQL, Redis, and the Go API all together.

1. **Navigate to the repository root**:
   ```bash
   cd /path/to/GhostWriter-
   ```

2. **Configure environment variables**:
   ```bash
   cd backend-go
   cp .env.template .env
   ```

   Edit `.env` and add your configuration:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `APNS_*`: Apple Push Notification credentials (optional)

3. **Start all services**:
   ```bash
   cd ..
   docker compose up -d
   ```

4. **Check logs**:
   ```bash
   docker compose logs -f ghost-api
   ```

5. **Verify services are running**:
   ```bash
   # Check health endpoint
   curl http://localhost:8080/health
   
   # Should return: {"status":"healthy","timestamp":"...","service":"ghostwriter-api"}
   ```

### Method 2: Manual Setup (Development)

If you want to run the backend without Docker:

1. **Install and start PostgreSQL with pgvector**:
   ```bash
   # Install PostgreSQL 17
   # Then install pgvector extension
   psql -U postgres -c "CREATE EXTENSION vector;"
   ```

2. **Install and start Redis**:
   ```bash
   redis-server
   ```

3. **Build and run the Go backend**:
   ```bash
   cd backend-go
   
   # Install dependencies
   go mod download
   
   # Configure environment
   cp .env.template .env
   # Edit .env with your settings
   
   # Build
   go build -o server ./cmd/server
   
   # Run
   ./server
   ```

The API will be available at `http://localhost:8080`.

### Backend API Endpoints

- `GET /health` - Health check
- `GET /ws` - WebSocket connection for real-time sync
- `POST /vault/search` - Semantic search endpoint
- `GET /entries?user_id=<uuid>&limit=100` - Get user entries

### Database Schema

The backend automatically creates the following schema on startup:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE portal_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    text_content TEXT NOT NULL,
    embedding VECTOR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_portal_entries_user_id ON portal_entries(user_id);
CREATE INDEX idx_portal_entries_created_at ON portal_entries(created_at);
CREATE INDEX idx_portal_entries_embedding ON portal_entries 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Frontend Setup

The frontend is a React/TypeScript web application.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access the app**:
   - Local: `http://localhost:5173`
   - Network (for mobile testing): `http://YOUR_IP:5173`

4. **For mobile testing**:
   ```bash
   npm run dev:host
   ```
   Then access from your mobile device using your computer's IP address.

## iOS App Setup

### Prerequisites

- macOS with Xcode 15+
- iOS 17+ device or simulator
- Apple Developer account (for push notifications)

### Setup Steps

1. **Open Xcode**:
   - Create a new iOS App project
   - Choose SwiftUI as the interface
   - Choose Swift as the language

2. **Add Swift files**:
   Copy all `.swift` files from `ios-native/` to your Xcode project:
   - GhostWriterApp.swift
   - EnhancedContentView.swift (set as main view)
   - ContentView.swift
   - VaultView.swift
   - WebSocketClient.swift
   - APIClient.swift
   - PushNotificationManager.swift
   - ExportView.swift
   - ViewModel.swift
   - Models.swift
   - OCRService.swift
   - TextPipeline.swift
   - VideoFrameExtractor.swift
   - ShareSheet.swift

3. **Configure capabilities**:
   - In Xcode, go to Signing & Capabilities
   - Add Push Notifications
   - Add Background Modes → Remote notifications
   - Add iCloud → iCloud Documents

4. **Update Info.plist**:
   Add these keys:
   ```xml
   <key>NSPhotoLibraryUsageDescription</key>
   <string>We need access to your photos to extract text from screenshots</string>
   <key>NSUserNotificationsUsageDescription</key>
   <string>We'll notify you when text processing is complete</string>
   ```

5. **Configure backend URL**:
   In the app's Settings tab, update the server URL to point to your backend:
   - Local: `ws://localhost:8080/ws`
   - Network: `ws://YOUR_COMPUTER_IP:8080/ws`
   - Production: `wss://your-server.com/ws`

6. **Build and run**:
   - Select your device/simulator
   - Click Run (⌘R)

### Push Notifications Setup (Optional)

To enable push notifications:

1. **Generate APNS credentials**:
   - Go to Apple Developer Portal
   - Create an APNS key or certificate
   - Download the .p8 key file

2. **Configure backend**:
   In `backend-go/.env`, add:
   ```
   APNS_AUTH_MODE=token
   APNS_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
   APNS_KEY_ID=XXXXXXXXXX
   APNS_TEAM_ID=XXXXXXXXXX
   APNS_TOPIC=com.yourcompany.ghostwriter
   APNS_PRODUCTION=false
   ```

3. **Restart backend**:
   ```bash
   docker compose restart ghost-api
   ```

## Testing the Integration

### 1. Test Backend Health

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T00:00:00Z",
  "service": "ghostwriter-api"
}
```

### 2. Test WebSocket Connection

You can use a WebSocket client or the iOS app to test:

```javascript
// JavaScript example
const ws = new WebSocket('ws://localhost:8080/ws');

ws.onopen = () => {
  console.log('Connected');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'text_sync',
    user_id: 'test-user-123',
    text_content: 'Hello from WebSocket!',
    timestamp: new Date().toISOString()
  }));
};

ws.onmessage = (event) => {
  console.log('Response:', event.data);
};
```

### 3. Test Semantic Search

First, insert some data via WebSocket, then search:

```bash
curl -X POST http://localhost:8080/vault/search \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "query": "Hello",
    "limit": 10
  }'
```

### 4. Test iOS App

1. Open the iOS app
2. Go to Settings tab
3. Enter your backend URL
4. Connect to WebSocket
5. Go to Capture tab
6. Upload screenshots or recordings
7. Run OCR
8. Check Vault tab to see synced entries

## Troubleshooting

### Backend Issues

**Problem**: Backend fails to start
- Check if PostgreSQL is running: `docker compose ps`
- Check logs: `docker compose logs ghost-api`
- Verify database connection string in `.env`

**Problem**: Embeddings not generated
- Check if `OPENAI_API_KEY` is set in `.env`
- Verify API key is valid
- Check logs for API errors

### iOS App Issues

**Problem**: Cannot connect to backend
- Verify backend is running: `curl http://YOUR_IP:8080/health`
- Check firewall settings
- Use correct URL format: `ws://` not `http://`

**Problem**: Push notifications not working
- Verify APNS is configured in backend
- Check device token is registered
- Ensure app has notification permissions

**Problem**: OCR not working
- Grant photo library permissions
- Check iOS version (requires iOS 17+)
- Verify Vision framework is available

### Network Issues

**Problem**: Mobile device can't access backend
- Ensure both devices are on same network
- Check firewall rules
- Use `npm run dev:host` for frontend
- Use computer's IP address, not `localhost`

### Database Issues

**Problem**: pgvector extension not found
- Ensure using `pgvector/pgvector:pg17` Docker image
- Check extension is created: `docker compose exec vault-db psql -U bobby_admin -d ghostwriter_vault -c "SELECT * FROM pg_extension;"`

## Production Deployment

### Backend

1. **Build Docker image**:
   ```bash
   cd backend-go
   docker build -t ghostwriter-backend:latest .
   ```

2. **Deploy to your preferred platform**:
   - Kubernetes
   - Docker Swarm
   - Cloud providers (AWS ECS, Google Cloud Run, etc.)

3. **Use production environment variables**:
   - Set `APNS_PRODUCTION=true`
   - Use secure database credentials
   - Enable TLS for WebSocket (`wss://`)

### Frontend

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy to static hosting**:
   - Vercel (recommended)
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

### iOS App

1. **Configure for production**:
   - Update server URL to production endpoint
   - Use production APNS certificates

2. **Build for TestFlight/App Store**:
   - Archive in Xcode
   - Submit to App Store Connect

## Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/Bboy9090/GhostWriter-/issues)
- Documentation: Check `README.md`, `backend-go/README.md`, `ios-native/README.md`

## License

MIT License - see LICENSE file for details.
