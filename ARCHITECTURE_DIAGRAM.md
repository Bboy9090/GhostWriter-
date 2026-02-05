# GhostWriter System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          iOS App (Swift)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Vision     │  │   WebSocket  │  │  Push Notifications   │  │
│  │     OCR      │  │    Client    │  │     (APNS)            │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  API Client  │  │  VaultView   │  │  ExportView           │  │
│  │   (REST)     │  │   (UI)       │  │  (iCloud/Files)       │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ WebSocket + REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Go Backend (Fiber)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  WebSocket   │  │  REST API    │  │    APNS Client        │  │
│  │   Handler    │  │  Handlers    │  │  (Push Notifs)        │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Embeddings  │  │   Database   │  │    Redis Client       │  │
│  │   Service    │  │    Layer     │  │    (Pub/Sub)          │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                   │
        ┌───────────┴─────────┐        │
        │                     │        │
        ▼                     ▼        ▼
┌───────────────┐  ┌────────────────────┐  ┌──────────────┐
│  PostgreSQL   │  │  OpenAI Embeddings │  │    Redis     │
│  + pgvector   │  │        API         │  │   (Cache)    │
└───────────────┘  └────────────────────┘  └──────────────┘
```

## Data Flow

### 1. Text Capture Flow

```
iOS Device
    │
    │ 1. User captures screenshot/video
    │
    ▼
Vision OCR
    │
    │ 2. Extract text on-device
    │
    ▼
WebSocket Client
    │
    │ 3. Send via WebSocket
    │    {type: "text_sync", user_id: "...", text_content: "..."}
    │
    ▼
Backend WebSocket Handler
    │
    │ 4. Receive and parse
    │
    ├─────────────────────────┐
    │                         │
    ▼                         ▼
OpenAI API              Redis Pub/Sub
    │                         │
    │ 5. Generate             │ 7. Broadcast
    │    embedding             │    update
    │    (512D vector)         │
    ▼                         │
Database Layer               │
    │                         │
    │ 6. Store entry           │
    │    + embedding           │
    │                         │
    ▼                         ▼
PostgreSQL              Connected Clients
    │
    │ 8. Indexed for
    │    vector search
    │
    ▼
APNS
    │
    │ 9. Push notification
    │    to iOS device
    │
    ▼
iOS Device (notification)
```

### 2. Search Flow

```
iOS Device
    │
    │ 1. User enters search query
    │
    ▼
API Client
    │
    │ 2. POST /vault/search
    │    {user_id: "...", query: "..."}
    │
    ▼
Backend REST Handler
    │
    │ 3. Receive query
    │
    ▼
Embeddings Service
    │
    │ 4. Generate query embedding
    │
    ▼
Database Layer
    │
    │ 5. Vector similarity search
    │    SELECT *, cosine_similarity(embedding, $1) AS similarity
    │    WHERE user_id = $2
    │    ORDER BY similarity DESC
    │
    ▼
PostgreSQL + pgvector
    │
    │ 6. Return ranked results
    │
    ▼
Backend REST Handler
    │
    │ 7. Format response
    │
    ▼
API Client
    │
    │ 8. Display results
    │
    ▼
iOS Device (VaultView)
```

## Component Details

### Backend Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **WebSocket Handler** | Fiber + WebSocket | Real-time text syncing |
| **REST API** | Fiber | Vault search and entry retrieval |
| **Database Layer** | PostgreSQL + pgvector | Vector storage and similarity search |
| **Embeddings Service** | OpenAI API | Text-to-vector conversion (512D) |
| **Redis Client** | Redis Pub/Sub | Broadcasting updates to clients |
| **APNS Client** | apns2 library | Push notifications to iOS |

### iOS Components

| Component | Framework | Purpose |
|-----------|-----------|---------|
| **Vision OCR** | Vision | On-device text extraction |
| **WebSocket Client** | URLSession | Real-time backend communication |
| **API Client** | URLSession | REST API requests |
| **VaultView** | SwiftUI | Browse and search vault entries |
| **ExportView** | UIKit + SwiftUI | Export to iCloud/Files |
| **PushNotificationManager** | UserNotifications | Handle push notifications |

### Infrastructure

| Service | Technology | Purpose |
|---------|-----------|---------|
| **PostgreSQL** | pgvector/pgvector:pg17 | Vector database |
| **Redis** | redis:7-alpine | Pub/Sub messaging |
| **Backend API** | Go + Docker | Application server |

## Database Schema

```sql
CREATE TABLE portal_entries (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL,
    text_content    TEXT NOT NULL,
    embedding       VECTOR(512),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_portal_entries_user_id ON portal_entries(user_id);
CREATE INDEX idx_portal_entries_created_at ON portal_entries(created_at);
CREATE INDEX idx_portal_entries_embedding ON portal_entries 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## API Specification

### WebSocket API

**Endpoint:** `ws://localhost:8080/ws`

**Client → Server Message:**
```json
{
  "type": "text_sync",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "text_content": "Extracted text from OCR",
  "device_token": "apns-device-token-here",
  "timestamp": "2026-01-27T12:00:00Z"
}
```

**Server → Client Response:**
```json
{
  "status": "received",
  "timestamp": "2026-01-27T12:00:01Z"
}
```

### REST API

#### Health Check
```
GET /health
Response: {"status":"healthy","timestamp":"...","service":"ghostwriter-api"}
```

#### Search Vault
```
POST /vault/search
Content-Type: application/json

Request:
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "query": "machine learning concepts",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "limit": 10
}

Response:
{
  "results": [
    {
      "id": 1,
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "text_content": "...",
      "created_at": "2026-01-27T12:00:00Z",
      "similarity": 0.95
    }
  ],
  "count": 1,
  "query": "machine learning concepts"
}
```

#### Get Entries
```
GET /entries?user_id=550e8400-e29b-41d4-a716-446655440000&limit=100

Response:
{
  "entries": [...],
  "count": 50
}
```

## Security

### Backend
- ✅ No authentication required (add JWT for production)
- ✅ CORS enabled for cross-origin requests
- ✅ Environment-based configuration
- ✅ Secure WebSocket (use wss:// in production)

### iOS
- ✅ On-device OCR (no raw images sent)
- ✅ HTTPS/WSS for production
- ✅ Push notification encryption
- ✅ Keychain for sensitive data (implement as needed)

### Database
- ✅ Connection pooling
- ✅ Prepared statements (SQL injection prevention)
- ✅ User ID-based isolation
- ✅ Indexed queries for performance

## Deployment

### Development
```bash
# Backend
docker compose up -d

# Frontend
npm run dev:host

# iOS
Open in Xcode and run
```

### Production
```bash
# Backend (Docker)
docker build -t ghostwriter-backend:latest backend-go/
docker push your-registry/ghostwriter-backend:latest

# Frontend (Vercel)
npm run build
vercel deploy --prod

# iOS (App Store)
Archive in Xcode → Submit to App Store Connect
```

## Monitoring

### Backend Metrics
- WebSocket connections
- Request latency
- Database query performance
- Redis pub/sub throughput
- OpenAI API usage

### iOS Metrics
- OCR success rate
- WebSocket connection stability
- Search query performance
- Notification delivery rate

## Scalability

### Horizontal Scaling
- ✅ Stateless backend (multiple instances)
- ✅ Redis for inter-instance communication
- ✅ PostgreSQL connection pooling
- ✅ Load balancer for WebSocket

### Performance Optimization
- ✅ Vector index (ivfflat) for fast similarity search
- ✅ Database indexes on frequently queried fields
- ✅ Async processing for embeddings
- ✅ Redis caching for frequently accessed data

## Future Enhancements

1. **Authentication**: JWT-based auth
2. **Rate Limiting**: Protect API endpoints
3. **Monitoring**: Prometheus + Grafana
4. **Logging**: Structured logging with ELK stack
5. **Testing**: Unit and integration tests
6. **Android App**: Kotlin implementation
7. **Web App**: React-based vault access
8. **Multi-language**: Support for non-English text
9. **Advanced Search**: Filters, date ranges, tags
10. **Collaboration**: Shared vaults, teams
