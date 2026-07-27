#!/bin/bash
# Driti Gateway - Start both backend and frontend dev servers

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "🚀 Starting Driti Gateway Backend..."
cd "$ROOT/backend"

# Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env from .env.example"
fi

# Create / activate venv
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate

pip install -r requirements.txt -q

# Start backend in background
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:8000 (PID $BACKEND_PID)"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "🎨 Starting Driti Gateway Frontend..."
cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "📦 Installing npm packages..."
  npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173 (PID $FRONTEND_PID)"

# ── Info ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Driti Gateway is running!"
echo ""
echo "  Dashboard:    http://localhost:5173"
echo "  API Docs:     http://localhost:8000/docs"
echo "  Health:       http://localhost:8000/health"
echo ""
echo "  Default credentials: admin / admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to kill both processes on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
