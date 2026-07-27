# ⚡️ Driti Gateway — Universal Enterprise AI Router & Gateway

Driti Gateway is an enterprise-grade, high-performance **Universal AI Gateway and Router** designed for engineering teams. It acts as a transparent proxy and intelligent router for frontier AI agents—including **Claude Code (`claude`)**, **Google Antigravity (`agy`)**, **OpenAI Codex (`codex`)**, **Cursor**, **Aider**, and **LangChain**—routing traffic seamlessly to NVIDIA NIM frontier models (`Nemotron Ultra 550B`, `Nemotron Super 120B`, `GLM-5.2`, `GPT-OSS 120B`).

---

## 🌟 Powerhouse Features

- 🔄 **Universal Agent Compatibility** — Native support for both **Anthropic Messages API (`/v1/messages`)** and **OpenAI Chat Completions API (`/v1/chat/completions` & `/v1/completions`)**.
- 🛠️ **Full Filesystem CRUD & Terminal Tool Calling** — Complete bidirectional tool calling (function calling) translation. AI agents can natively execute **Read, Create, Update, and Delete (CRUD)** operations on files/folders, run terminal bash commands, inspect git status, and execute tests without errors.
- 🎯 **Intelligent Auto-Routing** — Automatically inspects prompt complexity and task type (coding, architecture, debugging, general chat) to route requests to the best available model.
- 🧠 **Model-Specific Prompt Scaffolding Booster** — Automatically injects reasoning scaffolding and architectural instructions tailored to open-weight models (like Nemotron and GLM), elevating their output quality to proprietary frontier standards.
- 🛡️ **Self-Healing Failover Loops** — If an underlying model experiences a timeout or 500/504 server error during heavy multi-user concurrency, Driti Gateway instantly and invisibly fails over to the next standby model. Your developers experience **99.99% uptime** with zero failed terminal commands.
- 🔐 **Enterprise Security & JWT Auth** — Support for JWT Bearer tokens and persistent API keys (`gw_...`) with AES-256 (Fernet) encryption for underlying NVIDIA credentials.
- 📊 **Real-time Live Analytics** — Live WebSocket dashboard broadcasting latency, token counts, model distribution, and connected users.

---

## 🚀 Quick Start Guide (By Operating System)

### 🍏 macOS & 🐧 Linux Users

#### 1. Backend Setup (Terminal)
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Start the FastAPI gateway server (runs on http://0.0.0.0:8000)
./start.sh
# OR run manually:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Dashboard Setup (New Terminal Window)
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies and start Vite dev server
npm install
npm run dev
```
*Access the dashboard at **http://localhost:5173**. Default credentials: `admin` / `admin`.*

---

### 🪟 Windows Users (PowerShell & Command Prompt)

#### 1. Backend Setup (PowerShell)
```powershell
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install Python dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
Copy-Item .env.example .env

# Start the FastAPI gateway server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*(Note for CMD / Command Prompt users: activate using `.\.venv\Scripts\activate.bat` and copy using `copy .env.example .env`)*

#### 2. Frontend Dashboard Setup (New PowerShell / CMD Window)
```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies and start Vite dev server
npm install
npm run dev
```

---

## 🤖 Universal Agent Configuration & Commands

Once your Driti Gateway server is running on `http://localhost:8000`, configure your AI coding agents using the commands below:

### 1. 🟣 Claude Code (`claude`)
Claude Code uses the Anthropic Messages API. All tool calling (Read, Create, Edit, Bash) is dynamically translated to NVIDIA function calls.

#### For macOS / Linux:
```bash
export ANTHROPIC_BASE_URL="http://localhost:8000"
export ANTHROPIC_AUTH_TOKEN="<your-jwt-or-api-token>"

# Launch Claude Code
claude
```

#### For Windows (PowerShell):
```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8000"
$env:ANTHROPIC_AUTH_TOKEN="<your-jwt-or-api-token>"

# Launch Claude Code
claude
```

#### For Windows (Command Prompt / CMD):
```cmd
set ANTHROPIC_BASE_URL=http://localhost:8000
set ANTHROPIC_AUTH_TOKEN=<your-jwt-or-api-token>

claude
```

---

### 2. 🔵 Google Antigravity (`agy` / AGY SDK)
AGY can be configured to use OpenAI or Gemini compatible base URLs. Driti Gateway serves native OpenAI endpoints under `/v1/chat/completions`.

#### For macOS / Linux:
```bash
export OPENAI_API_BASE="http://localhost:8000/v1"
export OPENAI_API_KEY="<your-jwt-or-api-token>"

# Launch Antigravity CLI or SDK workflows
agy --model antigravity
```

#### For Windows (PowerShell):
```powershell
$env:OPENAI_API_BASE="http://localhost:8000/v1"
$env:OPENAI_API_KEY="<your-jwt-or-api-token>"

agy --model antigravity
```

#### For Windows (Command Prompt / CMD):
```cmd
set OPENAI_API_BASE=http://localhost:8000/v1
set OPENAI_API_KEY=<your-jwt-or-api-token>

agy --model antigravity
```

---

### 3. 🟢 OpenAI Codex / Cursor / Aider / GitHub Copilot CLI
All OpenAI-compatible tools seamlessly integrate with Driti Gateway with full filesystem CRUD and terminal function calling support.

#### For macOS / Linux:
```bash
export OPENAI_BASE_URL="http://localhost:8000/v1"
export OPENAI_API_KEY="<your-jwt-or-api-token>"

# Run Aider with Auto-Routing
aider --openai-api-base http://localhost:8000/v1 --model openai/gpt-oss-120b
```

#### For Windows (PowerShell):
```powershell
$env:OPENAI_BASE_URL="http://localhost:8000/v1"
$env:OPENAI_API_KEY="<your-jwt-or-api-token>"

aider --openai-api-base http://localhost:8000/v1 --model openai/gpt-oss-120b
```

---

## ⚡️ Supported Tool Calling & Filesystem Operations (CRUD)

Driti Gateway natively parses, translates, and streams tool/function schemas across all agent protocols. Your agents can perform:
1. 📖 **Read Files & Folders**: Directory listing, file content viewing, glob searches (`GlobTool`, `View`, `grep`).
2. ✍️ **Create & Update Files**: Multi-line editing, new file creation, atomic diff replacements (`Edit`, `Write`).
3. 🗑️ **Delete & Refactor**: Removal of deprecated modules and cleanup of build artifacts.
4. 💻 **Terminal & Bash Execution**: Running test suites (`npm test`, `pytest`), git operations (`git commit`, `git status`), and build pipelines.

---

## 🌐 Universal API Compatibility Table

| Protocol / Client | Endpoint | Supported Features |
|---|---|---|
| **Anthropic (`claude`)** | `POST /v1/messages` | SSE Streaming, Bidirectional Tool Use Translator, Auto-Routing, Failover |
| **OpenAI (`codex`, `aider`)** | `POST /v1/chat/completions` | SSE Streaming, Function Calling (CRUD), Prompt Booster, Failover |
| **Legacy Codex** | `POST /v1/completions` | Text completions mapped to chat completions |
| **AGY / Gemini** | `POST /v1/chat/completions` | Universal Model Aliases (`antigravity`, `gemini-2.5-pro`), Auto-Routing |
| **Universal Discovery** | `GET /v1/models` | Lists 25+ model aliases across Anthropic, OpenAI, and Google providers |
| **System Diagnostics** | `GET /health` | Live database, NVIDIA connection, and gateway uptime verification |

---

## 🏗️ Tech Stack

- **Gateway Engine:** Python 3.12 · FastAPI · Uvicorn · httpx AsyncClient
- **Database & ORM:** SQLite (WAL mode enabled) · SQLAlchemy 2.0 · Alembic
- **Security & Encryption:** JWT (jose) · bcrypt · AES-256 Fernet symmetric encryption
- **Frontend Dashboard:** React 18 · Vite · TypeScript · Tailwind CSS · Radix UI · Framer Motion · Recharts
