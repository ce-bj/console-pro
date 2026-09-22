# sale-demo · Anvil 销售演示套件

访客侧演示套件，包含 AI 对话页、N2 坐席工作台测试页和行为埋点演示，配套一个轻量 Node.js 后端用于埋点事件收集。

## 快速启动

```bash
cd sale-demo
bash start.sh
# 或
npm start
```

| 页面 | 地址 | 说明 |
|------|------|------|
| AI 对话（访客侧） | http://localhost:8002/chat.html | 流式对话 + 思考过程 + 工具卡片 + 留资表单 |
| N2 坐席工作台 | http://localhost:8002/operator-test.html | 接管 / 坐席发消息 / 分析面板 / 回复建议 |
| N2 坐席 Mock 演示 | http://localhost:8002/operator-test-demo.html | 页面内置 Mock 会话，无需连接真实会话数据 |
| 行为埋点演示 | http://localhost:8002/demo.html | 集成 portal-tracker SDK |

除 Mock 演示页外，涉及真实 AI 对话和坐席联调的页面需要先启动 `agent-backend`（端口 8001）。

首次安装：

```bash
npm install
cp .env.example .env
```

仅查看 `operator-test-demo.html` 的 Mock 数据时，无需填写 `.env` 中的外部服务密钥。

## 目录结构

```
sale-demo/
├── server/
│   └── index.js               # 埋点收集后端（Express，端口 8005）
├── public/
│   ├── chat.html              # 访客 AI 对话页
│   ├── operator-test.html     # N2 坐席工作台测试页
│   ├── chat-test.html         # 简化版对话测试页
│   ├── demo.html              # 行为埋点演示页（集成 tracker + widget）
│   ├── index.html             # 设计画板入口（三方向对比）
│   ├── tracker/
│   │   └── portal-tracker.js  # 行为埋点 SDK
│   ├── widget/
│   │   └── chat-widget.js     # AI 对话 Widget（浮层按钮版）
│   └── debug/
│       └── debug-panel.js     # 埋点调试面板
├── demo/                      # Demo 展示组件（JSX）
├── start.sh                   # 一键启动（释放端口 → 后端 → 前端）
└── package.json
```

## chat.html — 访客 AI 对话页

直连 `agent-backend:8001`，完整复现 AI 对话体验：

- **SSE 流式响应**：回复逐字渲染，带 `▋` 光标动效
- **思考过程块**：模型 extended thinking 时展示可折叠的紫色思考块
- **工具调用卡片**：绿色卡片显示工具名 / 参数 / 结果（可展开）
- **留资表单**：inline 表单，字段从 `analysis_config.json` 动态读取
- **确认弹框**：多选项引导卡，访客选择后以用户消息形式呈现
- **人工转接**：AI 调用 `request_human_handoff` 后自动切换到人工模式，顶部出现黄色横幅
- **身份模拟**：支持 `sessionStorage` 注入 `pt_simulate_identity`（anonymous / same_ip / lead / member）

## operator-test.html — N2 坐席工作台

对应产品原型 N2 对话工作台，用于测试人工接管全流程：

**三栏布局：**
- 左：活跃会话列表（显示需求类型 + 意向分，2s 轮询）
- 中：对话记录（AI 回合含思考块 + 工具卡片 + 特殊事件，坐席可发消息）
- 右：AI 副驾面板（需求类型 / 意向等级 / 意向分 / 回复建议）

**操作流程：**
1. 在 chat.html 开始一段对话
2. 在 operator-test.html 选择该会话
3. 点击「接管」→ AI 停止回复，分析 Agent 自动生成 3 条回复建议
4. 点击建议项可填入输入框，修改后发送
5. 点击「交还 AI」→ 注入人工期间对话历史，AI 恢复

**AI 副驾数据来源：**  
分析 Agent 在每条用户消息后异步运行，结果写入 `session.analysis` 和 `session.suggested_replies`，坐席工作台 2s 轮询获取最新数据。

## 埋点 SDK（portal-tracker.js）

自动采集四类事件，上报到 `http://localhost:8005/webhook/track`：

| 事件类型 | 触发时机 | 关键字段 |
|---------|---------|---------|
| `page_view` | 页面加载完成 | `load_time_ms`, `viewport` |
| `scroll_depth` | 滚动到 25/50/75/100% | `depth_percent` |
| `click` | 点击 `<a>`, `<button>`, `[data-cta]` | `element_text`, `is_cta` |
| `page_leave` | 页面关闭/跳转 | `dwell_time_ms`, `max_scroll_percent` |

Visitor ID 存入 `localStorage`（`pt_visitor_id`），Session ID 存入 `sessionStorage`（`pt_session_id`）。

## 后端 API（端口 8005）

轻量埋点收集服务，不参与 AI 对话（AI 对话直连 agent-backend:8001）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/webhook/track` | 接收埋点事件 |
| GET  | `/api/events` | 查看最近事件（默认 20 条） |
| GET  | `/api/page-metrics` | 页面指标（跳出率 / 加载耗时 / 滚动深度） |
| GET  | `/api/visitor/:id` | 访客画像 |
| POST | `/api/crm/lead` | 线索写入（供 widget 调用） |

## 与 agent-backend 的关系

```
chat.html / operator-test.html
  ↓ POST /api/chat/{sid} (SSE)
  ↓ GET  /api/sessions/{sid}/...
agent-backend:8001

portal-tracker.js / chat-widget.js
  ↓ POST /webhook/track
  ↓ POST /api/crm/lead
sale-demo server:8005
```

两个后端完全独立，共享同一个 `pt_visitor_id`（localStorage）用于访客身份联通。
