# Driti Gateway

An internal AI Gateway that acts as an **Anthropic-compatible proxy** for Claude Code,
routing every request to NVIDIA's NIM API.

## Architecture

```
driti-server/
├── backend/     # FastAPI + SQLAlchemy + SQLite
└── frontend/    # React + Vite + TypeScript + Tailwind CSS
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Default credentials: `admin` / `admin`

## Claude Code Integration

After logging in, navigate to **Claude Code** page to get your environment variables:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8000"
export ANTHROPIC_AUTH_TOKEN="<your-jwt-token>"
```

Then Claude Code will route all requests through this gateway to NVIDIA's API.

## Features

- 🔐 **JWT Authentication** — Admin-only access
- 🤖 **NVIDIA Integration** — Routes to NVIDIA NIM API
- 📊 **Dashboard** — Real-time stats via WebSockets
- 🎛️ **Model Management** — Enable/disable, set defaults, configure parameters
- 📝 **Request Logs** — Every request logged with tokens and latency
- 🏥 **Health Check** — Monitor gateway, database, and NVIDIA connectivity
- 🔑 **Encrypted Storage** — NVIDIA API key encrypted with AES-256 (Fernet)
- ⚡ **Streaming** — Full SSE streaming support for Claude Code

## API Compatibility

| Anthropic Endpoint | Driti Endpoint | Description |
|---|---|---|
| `POST /v1/messages` | `POST /v1/messages` | Chat completions (streaming + non-streaming) |
| `GET /v1/models` | `GET /v1/models` | List available models |
| `GET /health` | `GET /health` | Health check |

## Tech Stack

**Backend:** FastAPI · SQLAlchemy · Pydantic · Uvicorn · httpx · python-jose · passlib · cryptography

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion · Recharts · Radix UI

**Database:** SQLite (WAL mode)
