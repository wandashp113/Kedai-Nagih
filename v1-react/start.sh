#!/bin/bash
BOT_DIR="$(cd "$(dirname "$0")/../bot" && pwd)"
REACT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/tmp/node-v22.0.0-linux-x64/bin:$PATH"

echo "╔══════════════════════════════════════╗"
echo "║   🚀 KEDAI NAGIH - REACT FOCUS      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Start API server (dibutuhkan oleh React)
echo "[1/2] 🌐 Menjalankan API server..."
cd "$BOT_DIR"
node api.js &
API_PID=$!
sleep 2

# Start React
echo "[2/2] ⚛️  Menjalankan React dev server..."
cd "$REACT_DIR"
npx vite --host 0.0.0.0 &
REACT_PID=$!

echo ""
echo "✅ Berjalan!"
echo "   ⚛️  React:  http://localhost:5173"
echo "   🌐 API:    http://localhost:3456"
echo ""
echo "   Tekan Ctrl+C untuk berhenti"

trap "kill $API_PID $REACT_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
