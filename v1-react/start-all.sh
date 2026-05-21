#!/bin/bash
# Jalankan semua service: API server + Bot WhatsApp + React dev server
BOT_DIR="$(cd "$(dirname "$0")/../bot" && pwd)"
REACT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/tmp/node-v22.0.0-linux-x64/bin:$PATH"

echo "╔══════════════════════════════════════╗"
echo "║   🚀 KEDAI NAGIH - START ALL        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Start API server
echo "[1/3] 🌐 Menjalankan API server..."
cd "$BOT_DIR"
node api.js &
API_PID=$!
sleep 2

# Start WhatsApp bot
echo "[2/3] 🤖 Menjalankan WhatsApp bot..."
node bot.js &
BOT_PID=$!

# Start React dev server
echo "[3/3] ⚛️  Menjalankan React dev server..."
cd "$REACT_DIR"
npx vite --host 0.0.0.0 &
REACT_PID=$!

echo ""
echo "✅ Semua service berjalan!"
echo "   🌐 API:        http://localhost:3456"
echo "   ⚛️  React:     http://localhost:5173"
echo "   🤖 WhatsApp:   Scan QR code di terminal"
echo ""
echo "   Tekan Ctrl+C untuk menghentikan semua service"

trap "kill $API_PID $BOT_PID $REACT_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
