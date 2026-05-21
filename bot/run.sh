#!/bin/bash
export PATH="/tmp/node-v22.0.0-linux-x64/bin:$PATH"
cd "$(dirname "$0")"

case "${1:-all}" in
  api)
    echo "🚀 Menjalankan API server..."
    node api.js
    ;;
  bot)
    echo "🤖 Menjalankan WhatsApp bot..."
    node bot.js
    ;;
  all)
    echo "🚀 Menjalankan API server + Bot WhatsApp..."
    node api.js &
    API_PID=$!
    sleep 2
    node bot.js
    kill $API_PID 2>/dev/null
    ;;
  *)
    echo "Usage: ./run.sh [api|bot|all]"
    exit 1
    ;;
esac
