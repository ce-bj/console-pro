import type {
  AgentStatus, AlertEventStatus, AlertStatus, Environment, EvalStatus, KnowledgeQualityItem, QualityReviewInput,
  AlertScope, RiskLevel, RiskReviewStatus, ReleaseGateStatus, TenantInvocationType, TenantListSortKey, TenantStatus, TimeRange, ToolType, TurnStatus,
  SortDirection,
} from './types';

// ACTION: 获取平台智能体运营总览 [GET] /api/platform/agent-observability/overview
export function handleFetchPlatformAgentOverview(params: { timeRange: TimeRange }) {
  console.log('fetch platform agent overview', params);
}

// ACTION: 获取公司租户列表 [GET] /api/platform/agent-observability/tenants
export function handleFetchTenantList(params: {
  timeRange: TimeRange;
  keyword?: string;
  statuses?: TenantStatus[];
  industries?: string[];
  invocationTypes?: TenantInvocationType[];
  toolProblemOnly?: boolean;
  sortBy?: TenantListSortKey;
  sortDir?: SortDirection;
}) {
  console.log('fetch tenant list', params);
}

// ACTION: 获取公司租户详情 [GET] /api/platform/agent-observability/tenants/{tenantId}
export function handleFetchTenantDetail(tenantId: string) {
  console.log('fetch tenant detail', tenantId);
}

// ACTION: 获取租户门户网站列表 [GET] /api/platform/agent-observability/tenants/{tenantId}/portal-sites
export function handleFetchTenantPortalSites(params: { tenantId: string }) {
  console.log('fetch tenant portal sites', params);
}

// ACTION: 更新智能体运营门户网站范围 [PATCH] /api/platform/agent-observability/tenants/{tenantId}/portal-scope
export function handleChangePortalScope(params: { tenantId: string; siteIds: string[] }) {
  console.log('change portal scope', params);
}

// ACTION: 获取门户网站下智能体列表 [GET] /api/platform/agent-observability/agents
export function handleFetchAgentList(params: { timeRange: TimeRange; tenantId?: string; siteIds?: string[]; status: AgentStatus | 'all'; keyword?: string }) {
  console.log('fetch agent list', params);
}

// ACTION: 获取单个智能体运行详情 [GET] /api/platform/agent-observability/agents/{agentId}
export function handleFetchAgentDetail(agentId: string) {
  console.log('fetch agent detail', agentId);
}

// ACTION: 获取 Tool Observation 加权指标、评分覆盖率与低质量调用证据 [GET] /api/platform/agent-observability/tools
export function handleFetchToolMetrics(params: { timeRange: TimeRange; tenantId?: string; siteIds?: string[]; agentId?: string; toolType?: ToolType | 'all' }) {
  console.log('fetch tool metrics', params);
}

// ACTION: 筛选带直接证据的风险 Trace / Tool 调用 [GET] /api/platform/agent-observability/traces
export function handleFetchRiskSamples(params: { timeRange: TimeRange; tenantId?: string; siteIds?: string[]; agentId?: string; riskLevel: RiskLevel | 'all'; reviewStatus?: RiskReviewStatus | 'all'; alertEventId?: string }) {
  console.log('fetch risk traces', params);
}

// ACTION: 更新 Trace 风险解决状态 [PATCH] /api/platform/agent-observability/traces/{traceId}/risk
export function handleUpdateRiskSampleStatus(params: { traceId: string; status: RiskReviewStatus }) {
  console.log('update trace risk status', params);
}

// ACTION: 获取会话质检轮次 [GET] /api/platform/agent-observability/conversation-turns
export function handleFetchConversationTurns(params: { timeRange: TimeRange; tenantId?: string; siteIds?: string[]; agentId?: string; status: TurnStatus | 'all' }) {
  console.log('fetch conversation turns', params);
}

// ACTION: 提交会话人工质检 [POST] /api/platform/agent-observability/quality-reviews
export function handleSubmitQualityReview(form: QualityReviewInput) {
  console.log('submit quality review', form);
}

// ACTION: 将会话轮次加入评估集 [POST] /api/platform/agent-observability/datasets/items
export function handleAddTurnToDataset(turnId: string) {
  console.log('add turn to dataset', turnId);
}

// ACTION: 获取 RAG 调用质量数据 [GET] /api/platform/agent-observability/rag-quality
export function handleFetchKnowledgeQuality(params: { timeRange: TimeRange; tenantId?: string; siteIds?: string[]; agentId?: string; status: KnowledgeQualityItem['status'] | 'all' }) {
  console.log('fetch rag quality', params);
}

// ACTION: 创建知识缺口补录任务 [POST] /api/platform/agent-observability/knowledge-tasks
export function handleCreateKnowledgeTask(gapId: string) {
  console.log('create knowledge task', gapId);
}

// ACTION: 获取评估运行列表 [GET] /api/platform/agent-observability/evaluation-runs
export function handleFetchEvalRuns(params: { tenantId?: string; siteIds?: string[]; agentId?: string; status: EvalStatus | 'all' }) {
  console.log('fetch eval runs', params);
}

// ACTION: 获取评价配置 [GET] /api/platform/agent-observability/evaluator-configs
export function handleFetchEvaluatorConfig(params: { tenantId?: string; siteIds?: string[]; agentId?: string }) {
  console.log('fetch evaluator configs', params);
}

// ACTION: 运行评估集回放 [POST] /api/platform/agent-observability/evaluation-runs
export function handleRunEvaluation(params: { dataset: string; targetVersion: string; agentId?: string }) {
  console.log('run evaluation', params);
}

// ACTION: 获取告警规则列表 [GET] /api/platform/agent-observability/alert-rules
export function handleFetchAlertRules(params: { tenantId?: string; siteIds?: string[]; agentId?: string; status: AlertStatus | 'all'; scope?: AlertScope | 'all' }) {
  console.log('fetch alert rules', params);
}

// ACTION: 切换告警规则状态 [PATCH] /api/platform/agent-observability/alert-rules/{id}
export function handleToggleAlertRule(id: string) {
  console.log('toggle alert rule', id);
}

// ACTION: 新建或更新告警规则 [POST|PUT] /api/platform/agent-observability/alert-rules
export function handleSaveAlertRule(params: { id?: string; agentId: string; name: string; metricName: string; scope: AlertScope; threshold: string }) {
  console.log('save alert rule', params);
}

// ACTION: 获取告警事件 [GET] /api/platform/agent-observability/alert-events
export function handleFetchAlertEvents(params: { tenantId: string; agentId: string; status?: AlertEventStatus | 'all' }) {
  console.log('fetch alert events', params);
}

// ACTION: 确认或恢复告警事件 [PATCH] /api/platform/agent-observability/alert-events/{eventId}
export function handleUpdateAlertEvent(params: { eventId: string; status: Extract<AlertEventStatus, 'acknowledged' | 'recovered'> }) {
  console.log('update alert event', params);
}

// ACTION: 获取客户级智能体监控详情 [GET] /api/platform/agent-observability/tenants/{tenantId}/monitoring
export function handleFetchTenantObservability(params: { tenantId: string; timeRange: TimeRange; environment: Environment }) {
  console.log('fetch tenant observability', params);
}

// ACTION: 获取当前客户带风险分析的 Trace [GET] /api/platform/agent-observability/traces
export function handleFetchTenantRiskTraces(params: { tenantId: string; timeRange: TimeRange; agentId?: string; riskLevel?: RiskLevel }) {
  console.log('fetch tenant risk traces', params);
}

// ACTION: 获取当前客户的版本回归 [GET] /api/platform/agent-observability/evaluation-runs
export function handleFetchTenantEvaluationRuns(params: { tenantId: string; agentId?: string; status?: ReleaseGateStatus }) {
  console.log('fetch tenant evaluation runs', params);
}

// ACTION: 将风险 Trace 加入评估集 [POST] /api/platform/agent-observability/datasets/items
export function handleAddTraceToDataset(params: { traceId: string; agentId: string }) {
  console.log('add trace to dataset', params);
}

// ACTION: 运行目标版本回归 [POST] /api/platform/agent-observability/evaluation-runs
export function handleRunRegression(params: { tenantId: string; agentId: string; targetVersion: string }) {
  console.log('run regression', params);
}

// ACTION: 上传知识库补充文档 [POST] /api/knowledge-config/assets/upload
export function handleUploadKnowledgeDocument(params: { traceId: string; agentId: string; fileName: string }) {
  console.log('upload knowledge document', params);
}

// ACTION: 创建 FAQ 条目 [POST] /api/knowledge-config/catalog/faq
export function handleCreateFaqEntry(params: { traceId: string; agentId: string; question: string; answer: string }) {
  console.log('create faq entry', params);
}

// ACTION: 复检知识缺口是否解决 [POST] /api/platform/agent-observability/traces/{traceId}/recheck-knowledge-gap
export function handleRecheckKnowledgeGap(params: { traceId: string; agentId: string }) {
  console.log('recheck knowledge gap', params);
}

interface AgentEvidenceScope {
  tenantId: string;
  siteId: string;
  agentId: string;
  timeRange: TimeRange;
  environment: Environment;
}

// ACTION: 获取指标定义、聚合值与计算口径 [GET] /api/platform/agent-observability/agents/{agentId}/metrics/{metricCode}
export function handleFetchAgentMetricDetail(params: AgentEvidenceScope & { metricCode: string }) {
  console.log('fetch agent metric detail', params);
}

// ACTION: 获取构成指标的历史会话 [GET] /api/platform/agent-observability/agents/{agentId}/metrics/{metricCode}/conversations
// PAGINATION: page,pageSize
export function handleFetchMetricConversations(params: AgentEvidenceScope & { metricCode: string; page: number; pageSize: number }) {
  console.log('fetch metric conversations', params);
}

// ACTION: 获取 Session、Trace 与 Observation 技术证据 [GET] /api/platform/agent-observability/sessions/{sessionId}
export function handleFetchConversationEvidence(params: Pick<AgentEvidenceScope, 'tenantId' | 'siteId' | 'agentId'> & { sessionId: string }) {
  console.log('fetch conversation evidence', params);
}

// ACTION: 获取 Agent 可用工具清单 [GET] /api/platform/agent-observability/agents/{agentId}/available-tools
export function handleFetchAvailableTools(params: AgentEvidenceScope) {
  console.log('fetch available tools', params);
}

// ACTION: 获取 Tool Observation 明细 [GET] /api/platform/agent-observability/tool-observations
export function handleFetchToolObservations(params: AgentEvidenceScope & { toolType?: ToolType | 'all' }) {
  console.log('fetch tool observations', params);
}

// ACTION: 获取 Retriever Observation 明细 [GET] /api/platform/agent-observability/retriever-observations
export function handleFetchRetrieverObservations(params: AgentEvidenceScope & { status?: 'hit' | 'no_hit' | 'low_relevance' | 'all' }) {
  console.log('fetch retriever observations', params);
}
