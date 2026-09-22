# agent-backend

基于 **AgentScope 2.0 + FastAPI** 的 AI 客服后端。采用双 Agent 协作架构：主 Agent 负责与访客对话，分析 Agent 在后台异步运行，负责需求识别、意向打分和生成坐席回复建议。

## 架构概览

```
访客消息
  ↓
agent_runner.py (orchestrator)
  ├── 主 Agent（Anvil助手）                 ← 面向访客，实时回复
  │     ├── tools/rag_search.py             知识库检索
  │     ├── tools/web_search.py             网络搜索
  │     ├── tools/lead_capture.py           渐进式留资表单
  │     ├── tools/confirm_dialog.py         确认选项弹框
  │     ├── tools/human_handoff.py          转人工
  │     ├── analyze_visitor_intent (closure) 触发分析 Agent
  │     └── skills/ (LocalSkillLoader)      产品问答 / 留资 / 转接技能
  │
  └── 分析 Agent（后台异步）                ← 每轮消息后触发
        ├── tools/classify_demand.py        需求类型识别
        ├── tools/score_intent.py           意向打分
        ├── tools/suggest_replies.py        坐席回复建议
        └── skills/ (LocalSkillLoader)      demand-classify / intent-scoring 技能

运行时配置：analysis_config.json           ← mock N3 智能体配置，无需重启即生效
```

## 快速启动

```bash
cd agent-backend

# 首次运行：创建虚拟环境并安装依赖
bash setup.sh

# 启动服务
.venv/bin/python main.py
# → http://localhost:8001
```

## 环境配置（.env）

```env
LLM_API_KEY=sk-...
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1  # 或任意 OpenAI 兼容代理
LLM_MODEL=qwen3-235b-a22b
AGENT_PORT=8001
```

支持阿里云 DashScope（qwen 系列）或任意 OpenAI 兼容接口。

## API 接口

### 会话管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sessions` | 创建会话（visitor_id / user_type / member_id） |
| GET  | `/api/sessions/{sid}` | 查询会话状态 |
| GET  | `/api/sessions` | 列出所有活跃会话（坐席工作台用） |

### 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat/{sid}` | AI 对话，SSE 流式响应 |
| POST | `/api/sessions/{sid}/operator_message` | 坐席发送消息 |

**SSE 事件类型：**

| 事件 | 说明 |
|------|------|
| `thinking_delta` / `thinking_end` | 扩展思考过程流 |
| `text_delta` / `text_end` | 回复正文流 |
| `tool_start` / `tool_args` / `tool_result` | 工具调用过程 |
| `form_show` | 触发留资表单（含字段配置） |
| `confirm_show` | 触发确认选项弹框 |
| `handoff` | AI 发起转人工 |
| `lead_captured` | 访客提交联系信息 |
| `done` | 本轮结束 |

### 人工接管

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sessions/{sid}/handoff` | 坐席接管，暂停 AI 回复，触发生成回复建议 |
| POST | `/api/sessions/{sid}/ai_resume` | 归还 AI，注入人工期间对话历史 |

### 分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/sessions/{sid}/analysis` | 最新分析结果（需求类型 + 意向打分） |
| GET  | `/api/sessions/{sid}/reply-suggestions` | 坐席回复建议（人工接管期间） |
| POST | `/api/sessions/{sid}/reply-suggestions/refresh` | 手动重新生成回复建议 |

### 历史回放（坐席面板用）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/sessions/{sid}/messages?after={idx}` | 轮询消息（坐席消息 + 人工期间用户消息） |
| GET  | `/api/sessions/{sid}/turns?after={seq}` | AI 对话回合完整数据（含 thinking / tool_calls） |

## 目录结构

```
agent-backend/
├── main.py                    # FastAPI 路由入口
├── agent_runner.py            # 双 Agent 协作层：启动顺序、SSE 流转换、turn_log 记录
├── session_store.py           # 内存会话存储（ChatMessage / Session / turn_log）
├── config.py                  # 从 .env 读取配置（LLM_API_KEY / MODEL / PORT）
├── log_config.py              # 日志配置（rotating file handler）
├── analysis_config.json       # 运行时配置（mock N3 智能体配置，热更新无需重启）
│
├── agents/
│   ├── main_agent.py          # 主 Agent：系统提示、Middleware、Toolkit 组装
│   └── analysis_agent.py      # 分析 Agent：后台异步循环，分析 + 建议生成
│
├── tools/
│   ├── rag_search.py          # 知识库检索（knowledge/ 目录全文匹配）
│   ├── web_search.py          # 网络搜索（占位，可接 Serper/Tavily）
│   ├── lead_capture.py        # 留资表单（字段从 analysis_config.json 读取）
│   ├── confirm_dialog.py      # 确认选项弹框（→ __CONFIRM__:{} 前缀）
│   ├── human_handoff.py       # 转人工（→ __HANDOFF__:{} 前缀）
│   ├── classify_demand.py     # 需求类型识别（分析 Agent 调用）
│   ├── score_intent.py        # 意向打分（分析 Agent 调用）
│   └── suggest_replies.py     # 坐席回复建议（人工接管时调用）
│
├── skills/                    # LocalSkillLoader 技能目录（每个子目录含 SKILL.md）
│   ├── product-qa/            # 产品问答
│   ├── progressive-lead/      # 渐进式留资策略
│   ├── human-handoff/         # 转人工策略
│   ├── intent-analysis/       # 意向分析联动
│   ├── demand-classify/       # 需求类型识别（分析 Agent 专用）
│   └── intent-scoring/        # 意向打分（分析 Agent 专用）
│
├── knowledge/                 # RAG 知识库文档
│   ├── products.md            # 产品功能说明
│   └── pricing.md             # 定价方案
│
├── logs/                      # 运行日志（自动轮转 10MB × 5 份）
└── .env                       # LLM & 端口配置（不入库）
```

## analysis_config.json（运行时配置）

mock N3 智能体配置页的数据，**修改后立即生效，无需重启**。包含三个部分：

| 节 | 对应 N3 配置项 | 说明 |
|----|----------------|------|
| `demand_type` | 技能设置 · 需求类型识别 | 分类标签列表 / preset or llm 模式 |
| `intent_scoring` | 意向与情绪 · 意向打分 | 评分维度权重 / 阈值 / llm hint |
| `lead_capture` | 技能设置 · 渐进式留资 | 表单字段、required、crm_field 映射 |

后续对接 prototype 真实数据时，只需将此文件替换为从 N3 配置接口读取的结果。

## 特殊工具返回格式

主 Agent 的某些工具返回带前缀的字符串，`agent_runner.py` 识别后转换为对应 SSE 事件：

| 前缀 | SSE 事件 | 说明 |
|------|----------|------|
| `__FORM__:{…}` | `form_show` | 触发留资表单 |
| `__CONFIRM__:{…}` | `confirm_show` | 触发确认弹框 |
| `__HANDOFF__:{…}` | `handoff` | 触发人工转接 |

## 双 Agent 启动顺序

分析 Agent 必须先于主 Agent 初始化，因为主 Agent 的 `analyze_visitor_intent` 工具是 closure，引用 `session.analysis_agent`：

```python
# agent_runner.py
analysis_ag = AnalysisAgent(session)       # 1. 先启动分析 Agent
session.analysis_agent = analysis_ag
session.analysis_task = asyncio.create_task(analysis_ag.run_loop())
create_main_agent(session)                 # 2. 再创建主 Agent（toolkit closure 引用 analysis_agent）
```
