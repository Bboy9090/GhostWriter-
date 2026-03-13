#!/usr/bin/env bash
# GhostWriter one-click start: auto-create .env, start backend (Postgres, Redis, API), run frontend dev server.
# Usage: ./scripts/start.sh   or   npm run start

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()  { echo -e "${CYAN}[i]${NC} $1"; }

# 1. Ensure .env exists
if [ ! -f "$ROOT/.env" ]; then
  info "Creating .env from .env.example (first run)"
  if [ -f "$ROOT/.env.example" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    # Generate a random JWT_SECRET if placeholder
    if grep -q "change_me_32_char_minimum_secret_key" "$ROOT/.env" 2>/dev/null; then
      JWT=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64 2>/dev/null || echo "dev-secret-change-in-production-32chars")
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/change_me_32_char_minimum_secret_key/$JWT/" "$ROOT/.env"
      else
        sed -i "s/change_me_32_char_minimum_secret_key/$JWT/" "$ROOT/.env"
      fi
    fi
    log ".env created. (OPENAI_API_KEY optional for local run – embeddings disabled without it)"
  else
    err ".env.example not found"
  fi
else
  log ".env exists"
fi

# 2. Check Docker
if ! command -v docker &>/dev/null; then
  err "Docker not found. Install Docker Desktop: https://docker.com"
fi
DOCKER_COMPOSE=""
if docker compose version &>/dev/null; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  DOCKER_COMPOSE="docker-compose"
else
  err "Docker Compose not found. Install Docker Desktop."
fi

# 3. Start backend services only (Postgres, Redis, API)
info "Starting backend (Postgres, Redis, API)..."
$DOCKER_COMPOSE up -d vault-db ghost-stream ghost-api

# 4. Wait for API health
info "Waiting for API to be ready..."
MAX=30
for i in $(seq 1 $MAX); do
  if curl -sf http://localhost:8080/health &>/dev/null; then
    log "API is up"
    break
  fi
  if [ "$i" -eq $MAX ]; then
    warn "API not ready after ${MAX}s. Check: docker compose logs ghost-api"
  fi
  sleep 1
done

# 5. Install frontend deps
if [ ! -d "$ROOT/node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install
  log "Dependencies installed"
fi

# 6. Run frontend dev server
info "Starting frontend at http://localhost:5173"
log "Backend API: http://localhost:8080"
log "Press Ctrl+C to stop"
echo ""
npm run dev
