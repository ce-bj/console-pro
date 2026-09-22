# AGENTS.md

Guidance for Codex agents working in this repository.

## Project Overview

`console-crm` is an AI customer service and management-console project. It contains several related subprojects:

- `agent-backend/`: Python FastAPI backend for the AI customer-service agent. Uses AgentScope 2.0 and a dual-agent architecture.
- `prototype/`: React + Vite + TypeScript management-console prototype.
- `sale-demo/`: Visitor demo pages, operator test page, and tracking backend. Uses Node.js/Express plus static frontend pages.
- `agentscope/`: Local AgentScope source tree, installed into `agent-backend` in editable mode.
- `document/`, `data-analysis/`, `history/`: Product docs, analysis docs, and historical materials.

## Setup And Run

From the repository root:

```bash
bash start.sh
```

This starts the main services together. Use `Ctrl+C` to stop them.

Individual services:

```bash
# AI agent backend, port 8001
cd agent-backend
.venv/bin/python main.py

# Management console prototype, port 1234
cd prototype
npm run dev

# Visitor demo + tracking backend, ports 8002 and 8005
cd sale-demo
bash start.sh
```

First-time setup:

```bash
cd agent-backend
bash setup.sh

cd ../prototype
npm install

cd ../sale-demo
npm install
```

`agent-backend/.env` must contain `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL`.

## Useful Commands

```bash
# prototype
cd prototype
npm run build
npm run preview

# sale-demo
cd sale-demo
npm run dev
npm run server
npm run seed

# backend logs
cd agent-backend
tail -f logs/app.log
```

There are no dedicated lint/test commands configured for `agent-backend`, `prototype`, or `sale-demo` yet. For frontend changes, run `npm run build` in `prototype` when practical.

## Key URLs

- Visitor AI chat: `http://localhost:8002/chat`
- Operator test desk: `http://localhost:8002/operator-test`
- Management console prototype: `http://localhost:1234`
- Agent API docs: `http://localhost:8001/docs`
- Tracking demo: `http://localhost:8002/demo`

## Backend Notes

`agent-backend` uses a dual-agent flow:

- Main Agent: visitor-facing chat, RAG search, lead capture, confirm dialog, human handoff, SSE streaming.
- Analysis Agent: background demand classification, intent scoring, and operator reply suggestions.

The analysis agent must be initialized before the main agent because the main agent has a closure that references `session.analysis_agent`.

`agent-backend/analysis_config.json` is hot-reloaded mock configuration for the N3 agent configuration page. It controls:

- `demand_type`
- `intent_scoring`
- `lead_capture`

Special tool return prefixes are converted to SSE events by `agent_runner.py`:

- `__FORM__:{...}` -> `form_show`
- `__CONFIRM__:{...}` -> `confirm_show`
- `__HANDOFF__:{...}` -> `handoff`

## Prototype Notes

`prototype` is the React management console. It uses Vite, React 18, TypeScript, Tailwind, and shadcn-style UI components.

Important conventions:

- Mock data intended for future API replacement should be clearly separated.
- Future backend integration uses annotations:
  - `// DataSlot: ...`
  - `// ACTION: 描述 [METHOD] /api/path`
  - `// PAGINATION: page,pageSize`
- Keep endpoint/action naming stable when modifying pages used by prototype-to-production tooling.
- The knowledge base configuration module is under `prototype/src/pages/knowledge-config/`.

## Product Documentation Notes

Important product-analysis documents live under:

- `data-analysis/`
- `data-analysis/月度分析/`
- `document/knowledge-base/`

Recent related docs include:

- `data-analysis/月度分析/智能客服Pro月度总结与双看板埋点方案.md`
- `document/knowledge-base/知识库配置产品需求文档（PRD）.md`
- `document/knowledge-base/知识库项目对齐智能客服Pro数据看板差距分析.md`

When changing product docs, preserve the distinction between:

- Product/admin backend dashboards: product quality, AI quality, customer segmentation, sales enablement.
- Customer backend dashboards: one customer’s own usage effect, knowledge gaps, leads, and operational next steps.

### Product Plan Writing Style

For product plans, landing plans, PRDs, architecture proposals, and operational solution docs in this repository, use the style and depth of:

- `document/portal-ai-saas-落地路线图.md`
- `document/功能清单与技术选型.md`
- `document/langfuse-agent-observability-product-plan.md`

Default expectations:

- Start with product positioning and the problem being solved. Do not begin with a loose feature list.
- Explain why the capability is needed now, what breaks without it, and what changes after it is built.
- Include clear value framing for product, operations, customer support, sales, and engineering where relevant.
- Use decision tables with columns like `设计决策 / 为什么这样做 / 带来的价值`.
- Establish the current baseline before proposing changes: existing system state, reusable capabilities, and gaps.
- Include Mermaid diagrams when useful: architecture diagram, end-to-end flow, module relationship diagram, and feedback loop.
- For each module, describe positioning, page/menu location, target roles, core feature list, data source, and business value.
- Describe links to existing product areas such as N1 visitor insights, N2 agent desk, N3 agent config, N5 knowledge base, N7 lead pool, N10 conversion analytics, and N12 platform operations.
- Include metrics, data collection fields, permissions/privacy considerations, acceptance criteria, and phased rollout.
- Write in the tone of a product master document plus an executable delivery blueprint: structured, specific, and connected to business outcomes.
- Avoid shallow lists that only say what to build; explain why each part matters and how it closes the operating loop.

## Git And Editing

- Do not revert user changes unless explicitly asked.
- This repository may contain generated docs and prototype files; keep edits scoped.
- Prefer `rg` / `rg --files` for searching.
- Use `apply_patch` for manual file edits.
- Avoid touching `node_modules`, `.venv`, logs, and generated build artifacts.
