# console-crm

智能客服 + 中台管理系统。包含 AI 客服 Agent 后端、访客对话页、N2 坐席工作台、中台控制台原型四个子项目。

---

## 目录

- [系统架构](#系统架构)
- [前置依赖](#前置依赖)
- [安装步骤](#安装步骤)
- [配置 .env](#配置-env)
- [启动服务](#启动服务)
- [端口与访问地址](#端口与访问地址)
- [sale-demo Mock 数据模式](#sale-demo-mock-数据模式)
- [各页面功能说明](#各页面功能说明)
- [API 速查](#api-速查)
- [目录结构](#目录结构)

---

## 系统架构

```
访客浏览器
  └─ chat.html (8002)           ← 访客 AI 对话页（SSE 流式）
       │  POST /api/chat/{sid}
       ▼
  agent-backend (8001)          ← FastAPI + AgentScope 2.0 双 Agent
       ├── 主 Agent              与访客实时对话，工具调用，SSE 推流
       └── 分析 Agent            后台异步：需求识别 / 回复建议

坐席浏览器
  └─ operator-test.html (8002)  ← N2 坐席工作台（接管 / 回复建议）
       │  GET /api/sessions / POST handoff
       ▼
  agent-backend (8001)

中台浏览器
  └─ prototype (1234)           ← N1–N11 中台控制台原型（React）

埋点后端
  └─ sale-demo server (8005)    ← 行为事件收集（Node.js / Express）
```

---

## 前置依赖

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Python | 3.11+ | agent-backend 运行环境 |
| Node.js | 18+ | prototype / sale-demo |
| npm | 9+ | 随 Node.js 附带 |
| AgentScope | 2.0+ | 安装脚本优先使用本地源码，否则安装 PyPI 版本 |

### AgentScope 依赖

`agent-backend/setup.sh` 会优先使用仓库同级的 `agentscope/` 本地源码；如果新克隆的仓库中没有该目录，则自动安装 `agentscope>=2.0.0` 的 PyPI 版本。

---

## 安装步骤

### 0. 克隆项目

```bash
git clone https://github.com/ce-bj/console-pro.git
cd console-pro
```

### 1. agent-backend（Python）

```bash
cd agent-backend

# 一键创建虚拟环境 + 安装依赖 + 安装 agentscope 源码
bash setup.sh
```

`setup.sh` 做了什么：
- `python3 -m venv .venv` — 创建虚拟环境
- `pip install -r requirements.txt` — 安装 FastAPI / uvicorn 等依赖
- 优先从 `../agentscope` 安装本地源码；目录不存在时安装 PyPI 版本
- 复制 `.env.example` → `.env`（如 `.env` 不存在）

### 2. sale-demo（Node.js）

```bash
cd ../sale-demo
npm install
cp .env.example .env
```

需要使用 LLM 代理、AgentScope 或 TwentyCRM 联调时，再在 `sale-demo/.env` 中填写对应地址和密钥。只查看 Mock 页面时不需要填写。

### 3. prototype（Node.js）

```bash
cd ../prototype
npm install
```

---

## 配置 .env

编辑 `agent-backend/.env`（`bash setup.sh` 后自动生成，基于 `.env.example`）：

```env
# ── LLM 配置（任意 OpenAI 兼容接口）────────────────────────────
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.vveai.com/v1   # 或 DashScope / 本地代理
LLM_MODEL=gpt-5.5               # 或 qwen3-235b-a22b 等

# ── 服务端口（一般无需改动）────────────────────────────────────
AGENT_PORT=8001

# ── 数据库（可选，用于线索落库）────────────────────────────────
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=anvil_demo
# DB_USER=your_user
# DB_PASSWORD=your_pass
```

**兼容接口示例：**

| 平台 | LLM_BASE_URL | 推荐 LLM_MODEL |
|------|-------------|---------------|
| vveai（代理） | `https://api.vveai.com/v1` | `gpt-4.1-mini` |
| 阿里云 DashScope | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3-235b-a22b` |
| 本地 Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` |

---

## 启动服务

### 一键启动（推荐）

在 `console-crm` 根目录执行：

```bash
bash start.sh
```

脚本依次启动全部 4 个服务，实时显示状态。按 **Ctrl+C** 停止所有服务。

### 单独启动各服务

**agent-backend：**

```bash
cd agent-backend
.venv/bin/python main.py
# → http://localhost:8001
```

**prototype：**

```bash
cd prototype
npm run dev
# → http://localhost:1234
```

**sale-demo（访客页 + 坐席工作台 + 埋点后端）：**

```bash
cd sale-demo
bash start.sh
# → http://localhost:8002 / http://localhost:8005
```

---

## 端口与访问地址

| 端口 | 服务 | 地址 |
|------|------|------|
| **8001** | agent-backend（AI Agent API） | http://localhost:8001 |
| **8002** | sale-demo 前端（静态页） | http://localhost:8002 |
| **8005** | sale-demo 后端（埋点 API） | http://localhost:8005 |
| **1234** | prototype（中台控制台原型） | http://localhost:1234 |

**直接访问的页面：**

| 页面 | 地址 | 说明 |
|------|------|------|
| 访客 AI 对话 | http://localhost:8002/chat | 主要演示入口 |
| N2 坐席工作台 | http://localhost:8002/operator-test | 人工接管 / 回复建议 |
| N2 坐席 Mock 演示 | http://localhost:8002/operator-test-demo.html | 使用页面内置 Mock 数据，无需创建真实会话 |
| 中台控制台 | http://localhost:1234 | N1–N11 全链路页面 |
| 行为埋点演示 | http://localhost:8002/demo | portal-tracker SDK 演示 |
| API 文档 | http://localhost:8001/docs | FastAPI 自动生成（Swagger） |

---

## sale-demo Mock 数据模式

需要直接查看内置 Mock 数据时，先启动 `sale-demo` 静态服务：

```bash
cd sale-demo
npm install
npm run dev
```

然后访问：

```text
http://localhost:8002/operator-test-demo.html
```

`operator-test-demo.html` 使用页面内置的模拟会话、售前阶段、对话证据和推荐回复，不依赖真实会话数据。需要联调 `agent-backend` 时，改用 `operator-test.html`。

---

## 各页面功能说明

### 访客 AI 对话页

**http://localhost:8002/chat**

访客侧核心体验页，直连 agent-backend SSE 接口：

- **流式回复** — 逐字渲染，带 `▋` 光标动效
- **扩展思考** — Agent 思考过程可折叠展示（紫色思考块）
- **工具调用卡片** — 绿色卡片显示工具名 / 参数 / 结果（可展开）
- **渐进式留资表单** — 对话内嵌表单，字段从 `analysis_config.json` 动态读取，提交后存为线索
- **追问确认弹框（confirm_dialog）** — 意图不明时推送多选项卡，选择后以用户消息形式进入 Agent 上下文
- **转人工** — Agent 调用 handoff 工具后，页面顶部出现黄色横幅，切换为人工轮询模式

### N2 坐席工作台

**http://localhost:8002/operator-test**

模拟 N2 在线会话页，供坐席测试人工接管全流程：

- **会话列表** — 左侧实时轮询所有活跃会话，显示访客状态 / 需求类型 / 意向分
- **人工接管** — 点击「接管」→ AI 停止自动回复，右侧面板加载回复建议
- **回复建议** — 分析 Agent 自动生成 3 条建议（解答型 / 引导型），点击一键填入输入框
- **刷新建议** — 点击 ↻ 按钮重新生成一组建议
- **归还 AI** — 点击「交还 AI」后 AI 恢复接管，坐席输入框禁用
- **对话历史富显示** — 完整回放，含 thinking 过程 / tool_calls 详情（可展开）

### 中台控制台原型

**http://localhost:1234**

N1–N11 全链路可交互原型：

| 页面 | 路径 | 说明 |
|------|------|------|
| N1 访客洞察 | `/` | 访客行为分析 |
| N6 客户 360° | `/n6` | 客户详情与跟进 |
| N7 线索池 | `/n7` | 留资线索管理，字段与 N3 留资配置同源 |
| N8 工单工作台 | `/n8` | 工单处理流程 |
| N10 转化看板 | `/n10` | 漏斗分析（访客→留资→线索→客户） |

### 行为埋点演示

**http://localhost:8002/demo.html**

集成 `portal-tracker` SDK，演示 PV / 点击 / 停留时长等事件采集，上报至 http://localhost:8005。

---

## API 速查

完整 Swagger 文档：**http://localhost:8001/docs**

### 会话管理

```
POST /api/sessions                          创建会话 → {session_id}
GET  /api/sessions                          列出所有活跃会话（坐席工作台轮询）
GET  /api/sessions/{sid}                    查询会话状态
```

### 对话（SSE 流式）

```
POST /api/chat/{sid}   body: {"message": "你好"}
```

SSE 事件类型：

| 事件 | 说明 |
|------|------|
| `timing_start` | 每轮首 token 前发出，用于响应时间计算 |
| `thinking_delta` | Agent 扩展思考流 |
| `text_delta` | 回复正文流 |
| `tool_start` / `tool_result` | 工具调用过程 |
| `form_show` | 触发留资表单（含字段配置） |
| `confirm_show` | 触发追问确认弹框 |
| `handoff` | AI 发起转人工 |
| `lead_captured` | 访客成功留资 |
| `done` | 本轮结束 |

### 人工接管

```
POST /api/sessions/{sid}/handoff                  坐席接管，暂停 AI，触发生成建议
POST /api/sessions/{sid}/ai_resume                归还 AI，注入人工期间对话历史
POST /api/sessions/{sid}/operator_message         坐席发送消息  body: {"content": "..."}
GET  /api/sessions/{sid}/messages?after={idx}     用户侧轮询坐席消息
```

### 分析与建议

```
GET  /api/sessions/{sid}/analysis                 需求类型 + 意向打分
GET  /api/sessions/{sid}/reply-suggestions        坐席回复建议（人工接管期间）
POST /api/sessions/{sid}/reply-suggestions/refresh  重新生成建议
GET  /api/sessions/{sid}/turns?after={seq}        对话回合富数据（含 thinking / tool_calls）
```

### 对话埋点统计

```
GET  /api/sessions/{sid}/analytics
```

返回示例：

```json
{
  "session_id": "abc123",
  "turns_count": 5,
  "first_token_ms_list": [1200, 980, 1450, 870, 1100],
  "first_token_ms_avg": 1120,
  "session_duration_ms": 342000
}
```

### 线索 & 健康检查

```
GET  /api/leads          所有已留资线索
GET  /health             {status: "ok", sessions: N}
```

---

## 运行时配置热更新

`agent-backend/analysis_config.json` 是 mock N3 智能体配置页的数据源，**修改后立即生效，无需重启**：

| 配置节 | 对应功能 | 说明 |
|--------|---------|------|
| `demand_type` | 需求类型识别 | 分类标签列表 / preset 或 llm 模式 |
| `intent_scoring` | 意向打分 | 评分维度权重 / 阈值 |
| `lead_capture` | 渐进式留资 | 表单字段、required、crm_field 映射 |

---

## 目录结构

```
console-crm/
├── start.sh                       一键启动全部服务（按 Ctrl+C 停止）
├── README.md                      本文件
│
├── agent-backend/                 AI 客服 Agent（Python / FastAPI + AgentScope 2.0）
│   ├── main.py                    FastAPI 路由入口（所有 /api/* 接口）
│   ├── agent_runner.py            双 Agent 协作层 + SSE 流处理
│   ├── session_store.py           内存会话存储（Session / ChatMessage / turn_log）
│   ├── config.py                  从 .env 读取配置
│   ├── log_config.py              日志（rotating 10MB × 5 份）
│   ├── analysis_config.json       运行时配置（热更新，无需重启）
│   ├── setup.sh                   首次安装脚本（venv + pip + agentscope）
│   ├── requirements.txt           Python 依赖列表
│   ├── .env.example               环境变量模板（复制为 .env 后填写）
│   ├── agents/
│   │   ├── main_agent.py          主 Agent（面向访客，ReAct 工具调用）
│   │   └── analysis_agent.py      分析 Agent（后台异步：识别 / 打分 / 建议）
│   ├── tools/
│   │   ├── rag_search.py          知识库检索
│   │   ├── lead_capture.py        渐进式留资表单
│   │   ├── confirm_dialog.py      追问确认弹框
│   │   ├── human_handoff.py       转人工
│   │   ├── classify_demand.py     需求类型识别（分析 Agent）
│   │   ├── score_intent.py        意向打分（分析 Agent）
│   │   └── suggest_replies.py     坐席回复建议
│   ├── skills/                    LocalSkillLoader 技能（每目录含 SKILL.md）
│   ├── knowledge/                 RAG 知识库（products.md / pricing.md）
│   └── logs/                      运行日志（.gitignore 已排除）
│
├── sale-demo/                     访客演示套件（Node.js + 静态页）
│   ├── server/index.js            埋点收集后端（Express，端口 8005）
│   ├── public/
│   │   ├── chat.html              访客 AI 对话页 ← 主演示入口
│   │   ├── operator-test.html     N2 坐席工作台
│   │   ├── demo.html              行为埋点演示
│   │   ├── tracker/               portal-tracker 埋点 SDK
│   │   └── widget/                AI 对话浮层组件
│   ├── start.sh                   启动脚本（端口 8002 + 8005）
│   └── package.json
│
├── prototype/                     中台控制台原型（Vite + React + TypeScript）
│   ├── src/pages/                 N1 / N6 / N7 / N8 / N10 页面组件
│   └── package.json
│
└── document/                      产品文档
    ├── 功能清单与技术选型.md         功能优先级 + 技术选型（含测试指标）
    ├── portal-ai-saas-落地路线图.md  产品主文档（架构 / 页面 / 分期路线图）
    ├── 第一期研发需求边界.md          研发交付边界（功能规格 / 测试用例 / 验收指标）
    └── 数据埋点方案.md
```

---

## 常见问题

**Q: agent-backend 报 `ModuleNotFoundError: No module named 'agentscope'`**

确认 agentscope 源码在 `console-crm` 的父级目录，然后重新运行 `bash setup.sh`。

**Q: chat.html 提示"无法连接到 agent-backend"**

确认 agent-backend 已在端口 8001 启动，查看 `agent-backend/logs/app.log`。

**Q: 回复很慢或超时**

检查 `.env` 中的 `LLM_BASE_URL` 和 `LLM_API_KEY`，确认所选模型支持该接口格式。

**Q: prototype 页面空白**

执行 `cd prototype && npm install`，依赖未安装时 Vite dev server 会静默失败。
