# GhostWriter Backend (Go)

Go-based backend for the GhostWriter application with WebSocket support, PostgreSQL + pgvector for semantic search, Redis messaging, and APNS integration.

## Features

1. **WebSocket Connection**: Real-time text syncing via WebSocket
2. **PostgreSQL + pgvector**: Vector embeddings for semantic search
3. **Redis Pub/Sub**: Broadcasting updates to connected clients
4. **REST API**: `/vault/search` endpoint for querying texts
5. **APNS Integration**: Push notifications to iOS devices

## Prerequisites

- Go 1.22+
- PostgreSQL 17+ with pgvector extension
- Redis 7+
- OpenAI API key (for embeddings)
- APNS certificates/keys (optional, for push notifications)

## Quick Start

### Using Docker Compose (Recommended)

From the repository root:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with pgvector
- Redis
- GhostWriter API server

### Manual Setup

1. **Install dependencies**:
```bash
cd backend-go
go mod download
```

2. **Configure environment**:
```bash
cp .env.template .env
# Edit .env with your configuration
```

3. **Run the server**:
```bash
go run cmd/server/main.go
```

## Configuration

Copy `.env.template` to `.env` and configure:

### Required Settings
- `DB_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings

### Optional Settings
- `APNS_AUTH_MODE`: APNS authentication mode (`certificate` or `token`)
- `APNS_KEY_PATH`: Path to APNS auth key (.p8 file)
- `APNS_KEY_ID`: APNS Key ID
- `APNS_TEAM_ID`: Apple Team ID
- `APNS_TOPIC`: App bundle identifier
- `APNS_PRODUCTION`: Use production APNS (`true` or `false`)

## API Endpoints

### Health Check
```
GET /health
```

### WebSocket Connection
```
GET /ws
```

WebSocket message format:
```json
{
  "type": "text_sync",
  "user_id": "uuid-here",
  "text_content": "extracted text here",
  "device_token": "apns-device-token",
  "timestamp": "2026-01-27T00:00:00Z"
}
```

### Search Vault
```
POST /vault/search
Content-Type: application/json

{
  "user_id": "uuid-here",
  "query": "search text",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "limit": 10
}
```

### Get Entries
```
GET /entries?user_id=uuid-here&limit=100
```

## Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE portal_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    text_content TEXT NOT NULL,
    embedding VECTOR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portal_entries_user_id ON portal_entries(user_id);
CREATE INDEX idx_portal_entries_created_at ON portal_entries(created_at);
CREATE INDEX idx_portal_entries_embedding ON portal_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Building for Production

```bash
# Build binary
go build -o server cmd/server/main.go

# Build Docker image
docker build -t ghostwriter-backend .
```

## Development

```bash
# Run with hot reload (requires air)
go install github.com/cosmtrek/air@latest
air

# Run tests
go test ./...

# Format code
go fmt ./...

# Run linter
golangci-lint run
```

## Architecture

```
backend-go/
├── cmd/
│   └── server/          # Main application entry point
├── internal/
│   ├── handlers/        # HTTP and WebSocket handlers
│   ├── models/          # Data models
│   ├── database/        # Database layer
│   ├── redis/           # Redis client
│   ├── apns/            # APNS integration
│   └── embeddings/      # OpenAI embeddings
├── pkg/                 # Public packages (if any)
├── Dockerfile           # Docker image definition
├── .env.template        # Environment variables template
└── go.mod              # Go module definition
```

## License

MIT
