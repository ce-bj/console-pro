# console-crm · 中台控制台原型

基于 PM 原型方案生成的可交互前端原型，聚焦两大模块：**知识库配置** 与 **智能体运营**。

## 技术栈

- **框架**：Vite + React 18 + TypeScript
- **样式**：Tailwind CSS + shadcn/ui
- **路由**：React Router v6
- **图标**：lucide-react
- **组件库**：@radix-ui（Dialog / Select / Tabs 等）

## 本地启动

### 环境要求

- Node.js 18 或更高版本（推荐使用当前 LTS 版本）
- npm 9 或更高版本

### 启动步骤

解压/克隆本目录后，在项目根目录执行：

```bash
# 1. 安装依赖（首次启动或依赖变更后执行）
npm install
# 若存在 package-lock.json，也可用 npm ci 安装锁定版本

# 2. 启动开发服务器
npm run dev
```

启动后浏览器会自动打开；如未自动打开，请访问 [http://localhost:1234](http://localhost:1234)。

### 构建与预览

```bash
# 生成可部署的静态文件到 dist/
npm run build

# 本地预览构建结果
npm run preview
```

> `node_modules/`、`dist/`、本地环境变量和编辑器配置已被 `.gitignore` 排除，不会包含在 Git 提交或源码打包中。

## 在哪里看：知识库配置 / 智能体运营

打开控制台后，左侧导航按访客旅程的"链路环节"分组。

### 知识库配置（面向网站运营的知识库管理后台）

左侧导航「② 主动对话」分组 → **知识库配置（全门户）**，路由前缀 `/knowledge-config`：

| 路由 | 页面 |
|------|------|
| `/knowledge-config` | 概览看板 |
| `/knowledge-config/sections` | 知识板块（6类能力总览·只读） |
| `/knowledge-config/catalog` | 知识资产目录 |
| `/knowledge-config/metadata` | 元数据 / 数据源管理 |
| `/knowledge-config/retrieval` | 问答测试（RAGFlow 式对话） |
| `/knowledge-config/sync` | 同步状态 |
| `/knowledge-config/quality` | 质量与运营 |

三层模型：**知识资产 → 数据源**（运营可增删改，归属一个板块）**→ 知识板块**（内置 6 类，决定处理方式）。

### 智能体运营（N13，面向平台运营的可观测与质量治理后台）

左侧导航「⑧ 平台运营」分组 → **N13 智能体运营**，路由前缀 `/platform/agent-observability`：

| 路由 | 页面 |
|------|------|
| `/platform/agent-observability` | 多租户 / 多智能体总览 |
| `/platform/agent-observability/tools` | 工具质量中心 |
| `/platform/agent-observability/tenants/:tenantId` | 租户详情 |
| `.../agents/:agentId/sessions/:sessionId` | 会话详情 |
| `.../sessions/:sessionId/traces/:traceId` | Trace 详情 |
| `.../agents/:agentId/quality-reviews` | 质量评审 |
| `.../agents/:agentId/alerts` | 告警治理 |

> 其余 N1/N2/N6-N12 等页面仍在原型中可访问（访客洞察、线索池、客户 360、对话工作台等），但不是本次说明的重点，直接从左侧导航进入即可。

## 相关文件结构

```
prototype/
├── src/
│   ├── App.tsx                            # 分组左导航 + React Router 路由入口
│   ├── pages/
│   │   ├── knowledge-config/               # 知识库配置后台（二级左侧栏 + 嵌套路由）
│   │   │   ├── data.ts                      #   共享类型 + 全部 mock（DataSlot 集中）
│   │   │   ├── shared.tsx                   #   共享 UI 片段（SectionTag/StatusBadge/KpiCard…）
│   │   │   ├── KnowledgeConfigLayout.tsx    #   模块外壳 + 二级左侧栏 + <Outlet/>
│   │   │   ├── OverviewPage.tsx             #   概览看板
│   │   │   ├── SectionsPage.tsx             #   知识板块（只读）
│   │   │   ├── SectionDetailPage.tsx        #   板块详情
│   │   │   ├── CatalogPage.tsx              #   知识资产目录
│   │   │   ├── AssetDetailPage.tsx          #   知识详情
│   │   │   ├── MetadataPage.tsx             #   数据源/元数据管理
│   │   │   ├── RetrievalPage.tsx            #   问答测试
│   │   │   ├── SyncPage.tsx                 #   同步状态
│   │   │   └── QualityPage.tsx              #   质量与运营
│   │   └── agent-observability/            # N13 智能体运营（可观测性 + 质量治理）
│   │       ├── AgentObservabilityPage.tsx        #   多租户/多智能体总览
│   │       ├── AgentObservabilityOverviewPage.tsx
│   │       ├── AgentObservabilityDetailPage.tsx
│   │       ├── AgentObservabilitySessionDetailPage.tsx
│   │       ├── AgentObservabilityTraceDetailPage.tsx
│   │       ├── ToolQualityCenterPage.tsx         #   工具质量中心
│   │       ├── ToolObservabilityDetailPage.tsx
│   │       ├── TenantObservabilityPage.tsx
│   │       ├── QualityReviewPage.tsx             #   质量评审
│   │       ├── AlertGovernancePage.tsx           #   告警治理
│   │       └── data.ts / types.ts / actions.ts / shared.tsx / routes.ts / observabilitySelectors.ts
│   └── components/ui/                     # shadcn/ui 基础组件
├── vite.config.ts                         # 端口 1234
├── tailwind.config.js
└── package.json
```

## DataSlot / ActionSlot 约定（供后续接后端）

每个页面遵循统一注释约定，便于后续按文档接入真实接口：

- `// DataSlot: 描述` — 标注 mock 数据块，替换为接口返回
- `// ACTION: 描述 [METHOD] /api/path` — 标注操作及其目标接口
- `// PAGINATION: page,pageSize` — 标注需分页的列表

> 原型为纯前端 mock，数据均为硬编码示例；文档为权威源，后续按文档替换 DataSlot/ActionSlot 接入后端。

## 设计规范

- 延续现有控制台风格：左导航 + 顶 Tab + 卡片表单
- 主色：蓝色（`#2563eb`）
- 字体：系统 sans-serif
- 间距：Tailwind 标准 spacing scale
- 组件优先使用 shadcn/ui，避免自行实现基础组件
