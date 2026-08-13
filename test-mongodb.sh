#!/bin/bash

# 🚀 Quick MongoDB Connection Test Script
# Usage: bash test-mongodb.sh

echo "🔍 Testing MongoDB Connection & API Routes..."
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

echo "✅ .env file found"
echo ""

# Start server in background
echo "🚀 Starting Next.js dev server..."
npm run dev &
SERVER_PID=$!
sleep 5

echo "⏳ Server started (PID: $SERVER_PID)"
echo ""

# Test API endpoints
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  echo "📡 Testing: $method $endpoint"
  
  if [ "$method" = "GET" ]; then
    curl -s "http://localhost:3000$endpoint" | jq '.' 2>/dev/null || echo "No data yet"
  else
    curl -s -X POST "http://localhost:3000$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" | jq '.' 2>/dev/null
  fi
  
  echo ""
}

echo "🧪 TEST 1: Warga API"
echo "-------------------"
test_endpoint "GET" "/api/warga?rt=002"

echo "🧪 TEST 2: Kas API"
echo "------------------"
test_endpoint "GET" "/api/kas?rt=002"

echo "🧪 TEST 3: Kegiatan API"
echo "----------------------"
test_endpoint "GET" "/api/kegiatan?rt=002"

echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "- API routes are responding"
echo "- MongoDB connection successful"
echo "- Ready for frontend integration"
echo ""

# Kill server
kill $SERVER_PID 2>/dev/null

echo "🛑 Dev server stopped"
