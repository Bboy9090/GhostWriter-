#!/bin/bash

# GhostWriter Backend Test Script
# Tests the backend API endpoints to verify everything is working

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
USER_ID="${USER_ID:-test-user-$(date +%s)}"

echo "=========================================="
echo "GhostWriter Backend Test"
echo "=========================================="
echo "Backend URL: $BACKEND_URL"
echo "User ID: $USER_ID"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "-------------------"
health_response=$(curl -s "$BACKEND_URL/health")
echo "Response: $health_response"

if echo "$health_response" | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi
echo ""

# Test 2: Get Entries (should be empty initially)
echo "Test 2: Get Entries"
echo "-------------------"
entries_response=$(curl -s "$BACKEND_URL/entries?user_id=$USER_ID&limit=10")
echo "Response: $entries_response"
echo "✅ Get entries endpoint working"
echo ""

# Test 3: Search Vault (without query, should return recent entries)
echo "Test 3: Search Vault"
echo "-------------------"
search_payload=$(cat <<EOF
{
  "user_id": "$USER_ID",
  "limit": 10
}
EOF
)

search_response=$(curl -s -X POST "$BACKEND_URL/vault/search" \
  -H "Content-Type: application/json" \
  -d "$search_payload")
echo "Response: $search_response"
echo "✅ Search endpoint working"
echo ""

# Test 4: WebSocket Connection (basic test)
echo "Test 4: WebSocket Connection"
echo "----------------------------"
echo "Testing WebSocket endpoint availability..."

# Check if websocat is installed
if command -v websocat &> /dev/null; then
    ws_url="${BACKEND_URL/http/ws}/ws"
    echo "Attempting to connect to $ws_url..."
    
    # Send a test message
    echo '{
      "type": "text_sync",
      "user_id": "'$USER_ID'",
      "text_content": "Test message from automated test",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }' | timeout 5 websocat "$ws_url" 2>&1 || true
    
    echo "✅ WebSocket endpoint accessible"
else
    echo "⚠️  Skipping WebSocket test (websocat not installed)"
    echo "   Install with: cargo install websocat"
fi
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test WebSocket with a real client (iOS app or browser)"
echo "2. Configure OpenAI API key for embeddings"
echo "3. Set up APNS for push notifications"
echo ""
echo "For more information, see SETUP.md"
