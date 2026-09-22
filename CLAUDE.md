# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

console-crm is an AI customer service platform with a management console. It consists of four sub-projects:

1. **agent-backend** — AI customer service agent backend (Python/FastAPI + AgentScope 2.0)
2. **sale-demo** — Visitor demo pages and tracking backend (Node.js + static pages)
3. **prototype** — Management console prototype (React + Vite + TypeScript)
4. **agentscope** — AgentScope framework source code (included locally, installed in editable mode)

## Quick Start

### First-time Setup

```bash
# 1. agent-backend setup
cd agent-backend
bash setup.sh  # Creates venv, installs deps, copies .env.example → .env
# Edit .env and set LLM_API_KEY, LLM_BASE_URL, LLM_MODEL

# 2. sale-demo setup
cd ../sale-demo
npm install

# 3. prototype setup
cd ../prototype
npm install
```

### Starting Services

**All services at once (recommended):**
```bash
bash start.sh  # Starts all 4 services, Ctrl+C to stop all
```

**Individual services:**
```bash
# agent-backend (port 8001)
cd agent-backend
.venv/bin/python main.py

# prototype (port 1234)
cd prototype
npm run dev

# sale-demo (ports 8002 + 8005)
cd sale-demo
bash start.sh
```

### Key Access Points

- Visitor AI chat: http://localhost:8002/chat (main demo entry)
- Agent desk (N2): http://localhost:8002/operator-test
- Management console: http://localhost:1234
- Agent API docs: http://localhost:8001/docs

## Architecture

### agent-backend: Dual-Agent Collaboration

The backend uses a **dual-agent architecture** where two agents work in parallel:

1. **Main Agent** (Anvil助手) — Faces visitors, handles real-time dialogue
   - Tools: RAG search, progressive lead capture, confirm dialog, human handoff
   - Skills: product-qa, progressive-lead, human-handoff, intent-analysis
   - SSE streaming to frontend

2. **Analysis Agent** — Runs asynchronously in background after each turn
   - Tools: classify_demand, score_intent, suggest_replies
   - Skills: demand-classify, intent-scoring
   - Provides demand classification, intent scoring, and operator reply suggestions

**Critical initialization order:**
```python
# agent_runner.py
analysis_ag = AnalysisAgent(session)       # 1. Start analysis agent FIRST
session.analysis_agent = analysis_ag
session.analysis_task = asyncio.create_task(analysis_ag.run_loop())
create_main_agent(session)                 # 2. Main agent second (closure references analysis_agent)
```

The main agent's `analyze_visitor_intent` tool is a closure that references `session.analysis_agent`, so the analysis agent must be initialized before the main agent.

### Runtime Configuration Hot-Reload

**agent-backend/analysis_config.json** is the mock data source for the N3 agent configuration page. Changes take effect immediately without restart:

- `demand_type` → Need type classification
- `intent_scoring` → Intent scoring dimensions/weights/thresholds
- `lead_capture` → Progressive lead form fields

This file will eventually be replaced by reading from the N3 configuration API.

### SSE Event Flow

Main agent tools can return special prefixes that `agent_runner.py` converts to typed SSE events:

- `__FORM__:{...}` → `form_show` event (triggers lead capture form)
- `__CONFIRM__:{...}` → `confirm_show` event (triggers confirmation dialog)
- `__HANDOFF__:{...}` → `handoff` event (triggers human handoff)

### prototype: N-Series Pages Architecture

The React prototype implements N1–N11 management console pages. Pages are grouped by visitor journey stages in the left navigation.

**Knowledge Base Configuration Module** (`/knowledge-config/*`):
- Nested routes with secondary left sidebar
- **3-tier model**: Knowledge Asset → Data Source → Knowledge Section
- All mock data centralized in `data.ts` with `DataSlot` and `ActionSlot` comments for backend integration
- Follows RAGFlow-style management UX for knowledge base operations

**N3 Agent Config ↔ agent-backend linkage:**

N3 configuration page mock data maps directly to `agent-backend/analysis_config.json`:
- N3 "Need Type Classification" → `analysis_config.json` → `demand_type`
- N3 "Intent Scoring" → `analysis_config.json` → `intent_scoring`
- N3 "Progressive Lead Capture" → `analysis_config.json` → `lead_capture`

### Knowledge Base Files

There are two knowledge-related directories:

1. **agent-backend/knowledge/** — RAG knowledge base documents (products.md, pricing.md) used by the RAG search tool
2. **knowledge-base/** (root) — New/untracked directory (purpose TBD)

## Development Commands

### agent-backend (Python)

```bash
cd agent-backend

# Run backend
.venv/bin/python main.py

# Check logs
tail -f logs/app.log

# If you modify agentscope source
pip install -e ../agentscope
```

**No linters/tests configured yet.** AgentScope follows strict standards (see agentscope/.github/copilot-instructions.md for code review rules).

### prototype (React)

```bash
cd prototype

# Dev server (port 1234)
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

**No linters/tests configured yet.** Uses Vite + React 18 + TypeScript + Tailwind + shadcn/ui.

### sale-demo (Node.js)

```bash
cd sale-demo

# Start both frontend (8002) and backend (8005)
bash start.sh

# Or separately
npm run dev      # Frontend only (port 8002)
npm run server   # Backend only (port 8005)
```

**No linters/tests configured yet.**

## Code Conventions

### agent-backend (Python)

Follow AgentScope strict code review standards:

**[MUST] Lazy Loading:**
- Third-party libraries not in `pyproject.toml` dependencies must be imported at point of use
- Base class imports use factory pattern: `def get_xxx_cls() -> "MyClass"`

**[MUST] Encapsulation:**
- All Python files under `src/agentscope` named with `_` prefix, exposure controlled via `__init__.py`
- Internal-only classes/functions must be named with `_` prefix

**[MUST] Documentation:**
- All classes/methods must have complete docstrings in English
- Follow Google-style docstring format with reStructuredText syntax for special content

**[MUST] Pre-commit:**
- Strict review; modify code rather than skip checks
- File-level check skipping prohibited
- Only allowed skip: agent system prompts (to avoid `\n` formatting issues)

**[MUST] Git commits:**
- Follow Conventional Commits: `feat(scope): description`
- Prefixes: feat/fix/docs/ci/refactor/test

### prototype (React/TypeScript)

**DataSlot/ActionSlot convention:**
- `// DataSlot: 描述` — Marks mock data blocks to replace with API responses
- `// ACTION: 描述 [METHOD] /api/path` — Marks operations and their target endpoints
- `// PAGINATION: page,pageSize` — Marks lists needing pagination

All pages follow this annotation pattern for future backend integration.

**Shared data structure:**
- `knowledge-config/data.ts` — Centralized types and mock data for the entire knowledge config module
- `knowledge-config/shared.tsx` — Shared UI components (SectionTag, StatusBadge, KpiCard, etc.)

## Environment Variables

### agent-backend/.env

```env
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.example.com/v1  # OpenAI-compatible endpoint
LLM_MODEL=gpt-4.1-mini                   # Or qwen3-235b-a22b, etc.
AGENT_PORT=8001

# Optional database (for lead storage)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=anvil_demo
# DB_USER=...
# DB_PASSWORD=...
```

Supports any OpenAI-compatible API: vveai (proxy), Alibaba DashScope, local Ollama, etc.

## Common Tasks

### Modifying Agent Behavior

1. **Change system prompt/tools** — Edit `agents/main_agent.py` or `agents/analysis_agent.py`
2. **Add/modify tools** — Create/edit files in `tools/` directory
3. **Add/modify skills** — Each skill is a subdirectory in `skills/` with a `SKILL.md` file
4. **Change runtime config** — Edit `analysis_config.json` (hot-reload, no restart needed)

### Adding New Pages to prototype

1. Create new page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item to the appropriate journey stage group in `App.tsx`
4. Use DataSlot/ActionSlot comments for future backend integration

### Testing the Full Flow

1. Start all services: `bash start.sh`
2. Open visitor chat: http://localhost:8002/chat
3. Send messages to trigger agent responses
4. Open agent desk: http://localhost:8002/operator-test
5. Click "接管" (handoff) to test human takeover
6. View analysis results and reply suggestions
7. Check agent logs: `agent-backend/logs/app.log`

## Port Assignments

- **8001** — agent-backend (FastAPI)
- **1234** — prototype (Vite dev server)
- **8002** — sale-demo frontend (static pages)
- **8005** — sale-demo backend (tracking API)

## Troubleshooting

**agent-backend won't start:**
- Check `.env` has valid `LLM_API_KEY` and `LLM_BASE_URL`
- Verify agentscope installed: `pip list | grep agentscope`
- Check logs: `agent-backend/logs/app.log`

**chat.html shows "无法连接到 agent-backend":**
- Verify agent-backend running on port 8001: `lsof -ti tcp:8001`
- Check browser console for CORS errors

**Slow/timeout responses:**
- Verify LLM endpoint is accessible
- Check `LLM_BASE_URL` and `LLM_MODEL` are correct for your provider

**prototype blank page:**
- Run `npm install` in prototype directory
- Check console: `npm run dev` should show Vite dev server starting
