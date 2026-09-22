import type {
  AgentListItem, AgentStatus, AlertEvent, AlertRule, AlertStatus, EvalRun, EvalStatus,
  EvaluatorConfigItem, KnowledgeQualityItem, PlatformAgentStats, PortalSiteItem, PortalStatus,
  RiskLevel, RootCause, TenantListItem, TenantStatus, ToolMetricItem,
  ToolType, TurnStatus, ConversationTurn, EvaluationMetricGroup, TenantMonitoringItem,
  TenantEvaluationRun, AgentToolCapability, MetricContribution,
  MetricDefinition, MetricValueSnapshot, ObservabilitySession, ObservabilityTrace,
} from './types';

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; cls: string }> = {
  healthy: { label: '健康', cls: 'bg-green-50 text-green-600 border-green-100' },
  warning: { label: '观察', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  risk: { label: '风险', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export const PORTAL_STATUS_CONFIG: Record<PortalStatus, { label: string; cls: string }> = {
  online: { label: '在线', cls: 'bg-green-50 text-green-600 border-green-100' },
  paused: { label: '暂停', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  risk: { label: '风险', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export const AGENT_STATUS_CONFIG: Record<AgentStatus, { label: string; cls: string }> = {
  healthy: { label: '健康', cls: 'bg-green-50 text-green-600 border-green-100' },
  warning: { label: '观察', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  risk: { label: '风险', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export const TOOL_TYPE_CONFIG: Record<ToolType, { label: string; cls: string }> = {
  rag_search: { label: 'RAG 检索', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  request_handoff: { label: '转人工', cls: 'bg-purple-50 text-purple-600 border-purple-100' },
  lead_capture_form: { label: '留资表单', cls: 'bg-green-50 text-green-600 border-green-100' },
  crm_write: { label: 'CRM 写入', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  create_ticket: { label: '创建工单', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  agent_call: { label: '调用子 Agent', cls: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
};

export const RISK_SOURCE_CONFIG = {
  unanswered: '未回答',
  downvote: '点踩',
  low_score: '低分',
  tool_failure: 'Tool 失败',
  rag_no_hit: 'RAG no-hit',
  timeout: '超时',
  alert: '告警命中',
  manual: '人工发现',
} as const;

export const RISK_REVIEW_STATUS_CONFIG = {
  pending: { label: '待处理', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  resolved: { label: '已解决', cls: 'bg-green-50 text-green-700 border-green-100' },
} as const;

export const ALERT_EVENT_STATUS_CONFIG = {
  open: { label: '待处理', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  acknowledged: { label: '已确认', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  recovered: { label: '已恢复', cls: 'bg-green-50 text-green-700 border-green-100' },
} as const;

export const RISK_CONFIG: Record<RiskLevel, { label: string; cls: string }> = {
  critical: { label: '严重', cls: 'bg-red-50 text-red-600 border-red-100' },
  high: { label: '高', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
  medium: { label: '中', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  low: { label: '低', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const TURN_STATUS_CONFIG: Record<TurnStatus, { label: string; cls: string }> = {
  success: { label: '正常', cls: 'bg-green-50 text-green-600 border-green-100' },
  warning: { label: '待复盘', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  error: { label: '异常', cls: 'bg-red-50 text-red-600 border-red-100' },
};

export const EVAL_STATUS_CONFIG: Record<EvalStatus, { label: string; cls: string }> = {
  passed: { label: '通过', cls: 'bg-green-50 text-green-600 border-green-100' },
  blocked: { label: '阻塞', cls: 'bg-red-50 text-red-600 border-red-100' },
  running: { label: '运行中', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
};

export const ALERT_STATUS_CONFIG: Record<AlertStatus, { label: string; cls: string }> = {
  enabled: { label: '启用', cls: 'bg-green-50 text-green-600 border-green-100' },
  disabled: { label: '停用', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const ROOT_CAUSE_LABEL: Record<RootCause, string> = {
  knowledge_base: '知识库',
  prompt: 'Prompt',
  model: '模型',
  tool: '工具',
  business_config: '业务配置',
  operator: '坐席',
};

export const PLATFORM_PATH = [
  { title: '产品后台全局', desc: '全部公司租户、门户网站、Agent 与 Tool 横向质量' },
  { title: '租户详情', desc: '某公司下多个门户网站和各自 Agent 的质量总览' },
  { title: '门户网站范围', desc: '像知识库 Metadata 一样按门户网站切换和过滤' },
  { title: 'Agent / Tool 下钻', desc: '查看对话质检、RAG、工具、评估与风险样本' },
] as const;

export const mockPlatformAgentStatsInfo: PlatformAgentStats = {
  totalTenants: 18,
  totalPortalSites: 46,
  totalAgents: 73,
  totalSessionCount: 22680,
  totalTurnCount: 128640,
  avgResponseDurationSec: 48,
  avgFirstResponseMs: 812,
  avgModelTimeToFirstTokenMs: 586,
  avgSatisfactionRate: 87.4,
  feedbackCoverageRate: 15.6,
  avgToolSuccessRate: 97.6,
  errorRate: 1.8,
  p95ResponseDurationSec: 86,
  modelCost: 28640,
  riskTenantCount: 3,
  riskSampleCount: 116,
  totalToolCallCount: 176320,
  avgToolCallsPerTurn: 1.37,
  avgToolLatencyMs: 384,
};

export const mockTenantListData: TenantListItem[] = [
  { tenantId: 'tenant_anvil', companyName: 'Anvil 科技', industry: '制造 / B2B', plan: 'Enterprise', status: 'warning', portalSiteCount: 3, agentCount: 2, sessionCount: 2466, turnCount: 11502, avgRounds: 4.7, avgResponseDurationSec: 7, firstResponseMs: 730, errorRate: 1.0, p95ResponseDurationSec: 13, modelCost: 3454, satisfactionRate: 91.7, toolSuccessRate: 98.5, ragHitRate: 87.1, riskCount: 25, lastActiveAt: '2026-07-27 10:06' },
  { tenantId: 'tenant_export', companyName: '远航跨境', industry: '跨境电商', plan: 'Pro', status: 'warning', portalSiteCount: 4, agentCount: 8, sessionCount: 5940, turnCount: 42180, avgRounds: 7.1, avgResponseDurationSec: 56, firstResponseMs: 940, errorRate: 2.4, p95ResponseDurationSec: 91, modelCost: 10860, satisfactionRate: 84.3, toolSuccessRate: 96.8, ragHitRate: 79.5, riskCount: 38, lastActiveAt: '2026-07-09 15:28' },
  { tenantId: 'tenant_med', companyName: '瑞和医疗', industry: '医疗服务', plan: 'Enterprise', status: 'risk', portalSiteCount: 2, agentCount: 5, sessionCount: 1380, turnCount: 11620, avgRounds: 8.4, avgResponseDurationSec: 71, firstResponseMs: 1260, errorRate: 5.1, p95ResponseDurationSec: 142, modelCost: 4420, satisfactionRate: 76.8, toolSuccessRate: 93.2, ragHitRate: 68.2, riskCount: 57, lastActiveAt: '2026-07-09 14:50' },
  { tenantId: 'tenant_edu', companyName: '北辰教育', industry: '教育培训', plan: 'Pro', status: 'healthy', portalSiteCount: 2, agentCount: 4, sessionCount: 3960, turnCount: 19420, avgRounds: 4.9, avgResponseDurationSec: 37, firstResponseMs: 720, errorRate: 1.1, p95ResponseDurationSec: 54, modelCost: 7040, satisfactionRate: 89.7, toolSuccessRate: 98.1, ragHitRate: 88.7, riskCount: 9, lastActiveAt: '2026-07-09 15:33' },
];

export const mockPortalSiteListData: PortalSiteItem[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', siteName: '中文官网', domain: 'www.anvil.com', language: '中文', region: '中国', status: 'online', agentCount: 2, turnCount: 11502, satisfactionRate: 88.5, ragHitRate: 87.1, toolSuccessRate: 97.6 },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_en', siteName: '英文官网', domain: 'www.anvil.com/en', language: 'English', region: '北美', status: 'online', agentCount: 2, turnCount: 10420, satisfactionRate: 90.1, ragHitRate: 85.6, toolSuccessRate: 97.9 },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_fr', siteName: '法文站', domain: 'www.anvil.com/fr', language: 'Français', region: '欧洲', status: 'paused', agentCount: 1, turnCount: 5380, satisfactionRate: 87.6, ragHitRate: 83.1, toolSuccessRate: 97.5 },
  { tenantId: 'tenant_export', siteId: 'site_export_us', siteName: '美国独立站', domain: 'store.yuanhang.com/us', language: 'English', region: '北美', status: 'online', agentCount: 3, turnCount: 18360, satisfactionRate: 83.2, ragHitRate: 80.4, toolSuccessRate: 96.2 },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', siteName: '欧洲商城', domain: 'store.yuanhang.com/eu', language: 'English', region: '欧洲', status: 'risk', agentCount: 3, turnCount: 15740, satisfactionRate: 78.9, ragHitRate: 73.6, toolSuccessRate: 94.8 },
  { tenantId: 'tenant_export', siteId: 'site_export_jp', siteName: '日本站', domain: 'store.yuanhang.com/jp', language: '日本語', region: '日本', status: 'online', agentCount: 2, turnCount: 8080, satisfactionRate: 88.1, ragHitRate: 84.2, toolSuccessRate: 97.3 },
  { tenantId: 'tenant_med', siteId: 'site_med_main', siteName: '医疗服务站', domain: 'www.ruihe-med.com', language: '中文', region: '中国', status: 'risk', agentCount: 3, turnCount: 7420, satisfactionRate: 75.4, ragHitRate: 67.1, toolSuccessRate: 92.4 },
  { tenantId: 'tenant_med', siteId: 'site_med_member', siteName: '会员服务站', domain: 'member.ruihe-med.com', language: '中文', region: '中国', status: 'online', agentCount: 2, turnCount: 4200, satisfactionRate: 79.1, ragHitRate: 70.4, toolSuccessRate: 94.6 },
  { tenantId: 'tenant_edu', siteId: 'site_edu_main', siteName: '招生官网', domain: 'www.beichen-edu.com', language: '中文', region: '中国', status: 'online', agentCount: 2, turnCount: 11420, satisfactionRate: 90.3, ragHitRate: 89.4, toolSuccessRate: 98.6 },
  { tenantId: 'tenant_edu', siteId: 'site_edu_en', siteName: '国际课程站', domain: 'intl.beichen-edu.com', language: 'English', region: '海外', status: 'online', agentCount: 2, turnCount: 8000, satisfactionRate: 88.8, ragHitRate: 87.8, toolSuccessRate: 97.6 },
];

export const mockAgentListData: AgentListItem[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', agentName: '智能客服 Pro', agentType: '智能客服', status: 'healthy', model: 'qwen3-235b-a22b', kbVersion: 'kb_20260726_cn', sessionCount: 1842, turnCount: 10316, avgRounds: 5.6, avgResponseDurationSec: 5, firstResponseMs: 618, modelTimeToFirstTokenMs: 446, errorRate: 0.8, p95ResponseDurationSec: 5, modelCost: 2168, satisfactionRate: 92.6, thumbsUp: 1128, thumbsDown: 90, toolCallCount: 16742, toolSuccessRate: 98.7, ragCallRate: 76.4, ragHitRate: 88.9, leadTriggerRate: 16.8, leadCompletionRate: 33.4, handoffRate: 8.1, riskCount: 7, lastActiveAt: '2026-07-27 10:04' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_ops', agentName: '运营助手', agentType: '内容创建 Agent', status: 'warning', model: 'qwen3-max', kbVersion: 'kb_brand_20260724', sessionCount: 624, turnCount: 1186, avgRounds: 1.9, avgResponseDurationSec: 9, firstResponseMs: 842, modelTimeToFirstTokenMs: 610, errorRate: 2.2, p95ResponseDurationSec: 13, modelCost: 1286, satisfactionRate: 84.1, thumbsUp: 268, thumbsDown: 51, toolCallCount: 1526, toolSuccessRate: 96.4, ragCallRate: 32.8, ragHitRate: 85.2, leadTriggerRate: 0, leadCompletionRate: 0, handoffRate: 0, riskCount: 18, lastActiveAt: '2026-07-27 10:06' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', agentName: '方案顾问 Agent', agentType: '专业子 Agent', status: 'healthy', model: 'qwen3-max', kbVersion: 'kb_solution_20260725', sessionCount: 286, turnCount: 342, avgRounds: 1.2, avgResponseDurationSec: 1, firstResponseMs: 410, modelTimeToFirstTokenMs: 302, errorRate: 0.6, p95ResponseDurationSec: 2, modelCost: 486, satisfactionRate: 90.8, thumbsUp: 22, thumbsDown: 2, toolCallCount: 0, toolSuccessRate: 100, ragCallRate: 0, ragHitRate: 0, leadTriggerRate: 0, leadCompletionRate: 0, handoffRate: 0, riskCount: 2, lastActiveAt: '2026-07-27 10:05' },
  { tenantId: 'tenant_export', siteId: 'site_export_us', agentId: 'agent_export_sales_us', agentName: '询盘转化 Agent', agentType: '对话 Agent', status: 'warning', model: 'qwen3-max', kbVersion: 'kb_20260707_us', sessionCount: 1158, turnCount: 8340, avgRounds: 7.2, avgResponseDurationSec: 61, firstResponseMs: 960, modelTimeToFirstTokenMs: 691, errorRate: 1.9, p95ResponseDurationSec: 96, modelCost: 3120, satisfactionRate: 83.4, thumbsUp: 702, thumbsDown: 151, toolCallCount: 14860, toolSuccessRate: 96.1, ragCallRate: 81.3, ragHitRate: 80.2, leadTriggerRate: 19.8, leadCompletionRate: 24.7, handoffRate: 13.8, riskCount: 20, lastActiveAt: '2026-07-09 15:28' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', agentName: 'EU 客服 Agent', agentType: '对话 Agent', status: 'risk', model: 'qwen3-max', kbVersion: 'kb_20260706_eu', sessionCount: 756, turnCount: 6120, avgRounds: 8.1, avgResponseDurationSec: 76, firstResponseMs: 1320, modelTimeToFirstTokenMs: 950, errorRate: 4.8, p95ResponseDurationSec: 138, modelCost: 2970, satisfactionRate: 77.9, thumbsUp: 421, thumbsDown: 182, toolCallCount: 11240, toolSuccessRate: 94.5, ragCallRate: 84.1, ragHitRate: 72.3, leadTriggerRate: 21.6, leadCompletionRate: 18.9, handoffRate: 19.4, riskCount: 36, lastActiveAt: '2026-07-09 15:12' },
  { tenantId: 'tenant_export', siteId: 'site_export_jp', agentId: 'agent_export_jp', agentName: '日本站咨询 Agent', agentType: '对话 Agent', status: 'healthy', model: 'qwen3-235b-a22b', kbVersion: 'kb_20260708_jp', sessionCount: 735, turnCount: 3820, avgRounds: 5.2, avgResponseDurationSec: 44, firstResponseMs: 780, modelTimeToFirstTokenMs: 561, errorRate: 0.8, p95ResponseDurationSec: 68, modelCost: 1680, satisfactionRate: 88.1, thumbsUp: 344, thumbsDown: 39, toolCallCount: 6020, toolSuccessRate: 97.3, ragCallRate: 68.5, ragHitRate: 84.2, leadTriggerRate: 14.6, leadCompletionRate: 28.2, handoffRate: 9.1, riskCount: 7, lastActiveAt: '2026-07-09 15:10' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', agentName: '医疗分诊 Agent', agentType: '对话 Agent', status: 'risk', model: 'qwen3-235b-a22b', kbVersion: 'kb_20260701_med', sessionCount: 320, turnCount: 2940, avgRounds: 9.2, avgResponseDurationSec: 84, firstResponseMs: 1440, modelTimeToFirstTokenMs: 1036, errorRate: 5.6, p95ResponseDurationSec: 154, modelCost: 2540, satisfactionRate: 73.6, thumbsUp: 188, thumbsDown: 96, toolCallCount: 5820, toolSuccessRate: 91.8, ragCallRate: 86.4, ragHitRate: 65.8, leadTriggerRate: 18.8, leadCompletionRate: 16.2, handoffRate: 24.1, riskCount: 31, lastActiveAt: '2026-07-09 14:50' },
  { tenantId: 'tenant_med', siteId: 'site_med_member', agentId: 'agent_med_member', agentName: '会员服务 Agent', agentType: '对话 Agent', status: 'warning', model: 'qwen3-max', kbVersion: 'kb_20260703_member', sessionCount: 321, turnCount: 2180, avgRounds: 6.8, avgResponseDurationSec: 58, firstResponseMs: 980, modelTimeToFirstTokenMs: 705, errorRate: 2.7, p95ResponseDurationSec: 103, modelCost: 1880, satisfactionRate: 80.4, thumbsUp: 205, thumbsDown: 48, toolCallCount: 3540, toolSuccessRate: 95.1, ragCallRate: 62.2, ragHitRate: 73.5, leadTriggerRate: 0, leadCompletionRate: 0, handoffRate: 17.8, riskCount: 12, lastActiveAt: '2026-07-09 14:37' },
  { tenantId: 'tenant_edu', siteId: 'site_edu_main', agentId: 'agent_edu_admission', agentName: '招生咨询 Agent', agentType: '对话 Agent', status: 'healthy', model: 'qwen3-max', kbVersion: 'kb_20260709_edu', sessionCount: 1129, turnCount: 5420, avgRounds: 4.8, avgResponseDurationSec: 36, firstResponseMs: 690, modelTimeToFirstTokenMs: 496, errorRate: 0.7, p95ResponseDurationSec: 51, modelCost: 2190, satisfactionRate: 90.5, thumbsUp: 620, thumbsDown: 53, toolCallCount: 7420, toolSuccessRate: 98.6, ragCallRate: 65.4, ragHitRate: 89.4, leadTriggerRate: 17.4, leadCompletionRate: 35.4, handoffRate: 7.9, riskCount: 5, lastActiveAt: '2026-07-09 15:33' },
];

export const mockToolMetricsData: ToolMetricItem[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolType: 'rag_search', toolName: '知识库检索', callCount: 4216, avgCallsPerTurn: 0.74, successRate: 99.1, avgLatencyMs: 420, correctnessScore: 0.88, argsQualityScore: 0.91, businessMetric: 'RAG 调用率 74.2% / 命中率 89.1%' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolType: 'request_handoff', toolName: '转人工', callCount: 477, avgCallsPerTurn: 0.08, successRate: 98.5, avgLatencyMs: 180, correctnessScore: 0.84, argsQualityScore: 0.89, businessMetric: '转人工率 8.4%' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolType: 'lead_capture_form', toolName: '留资表单', callCount: 920, avgCallsPerTurn: 0.16, successRate: 97.9, avgLatencyMs: 210, correctnessScore: 0.86, argsQualityScore: 0.83, businessMetric: '触发率 16.2% / 完成率 32.6%' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', toolType: 'rag_search', toolName: '商品知识检索', callCount: 5146, avgCallsPerTurn: 0.84, successRate: 96.2, avgLatencyMs: 780, correctnessScore: 0.68, argsQualityScore: 0.64, businessMetric: 'RAG 调用率 84.1% / 命中率 72.3%' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', toolType: 'lead_capture_form', toolName: '询盘表单', callCount: 1220, avgCallsPerTurn: 0.2, successRate: 92.8, avgLatencyMs: 260, correctnessScore: 0.66, argsQualityScore: 0.71, businessMetric: '触发率 21.6% / 完成率 18.9%' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', toolType: 'request_handoff', toolName: '分诊转人工', callCount: 708, avgCallsPerTurn: 0.24, successRate: 91.6, avgLatencyMs: 340, correctnessScore: 0.61, argsQualityScore: 0.78, businessMetric: '转人工率 24.1%' },
  { tenantId: 'tenant_edu', siteId: 'site_edu_main', agentId: 'agent_edu_admission', toolType: 'crm_write', toolName: '线索写入 CRM', callCount: 880, avgCallsPerTurn: 0.16, successRate: 98.4, avgLatencyMs: 310, correctnessScore: 0.91, argsQualityScore: 0.95, businessMetric: '线索写入成功率 98.4%' },
];

export const mockConversationTurnsData: ConversationTurn[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', turnId: 'trace_anvil_9281', sessionId: 'session_8ab3f921', turnSeq: 1, occurredAt: '2026-07-27 09:42', userInput: '企业版价格是多少？支持私有化部署吗？', agentReply: '企业版适合较大团队使用，价格会根据部署方式和使用量评估。', demandType: '价格咨询', ragCalled: false, ragHitCount: 0, toolCount: 0, firstResponseMs: 620, totalDurationMs: 4680, modelTtftMs: 438, inputTokens: 824, outputTokens: 186, cost: 0.19, userFeedback: 'down', status: 'warning', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_anvil_9281', overallQualityScore: 0.54, rootCause: 'prompt' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', turnId: 'trace_anvil_9304', sessionId: 'session_8ab3f921', turnSeq: 2, occurredAt: '2026-07-27 09:45', userInput: '那可以安排顾问给我一份方案吗？', agentReply: '可以，我先确认您的公司规模与期望部署时间，再安排顾问跟进。', demandType: '留资咨询', ragCalled: false, ragHitCount: 0, toolCount: 1, firstResponseMs: 548, totalDurationMs: 3280, modelTtftMs: 401, inputTokens: 612, outputTokens: 128, cost: 0.14, userFeedback: 'up', status: 'success', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_anvil_9304', overallQualityScore: 0.91 },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', turnId: 'trace_anvil_9340', sessionId: 'session_41ef901a', turnSeq: 1, occurredAt: '2026-07-27 10:03', userInput: '知识库支持哪些文档格式？', agentReply: '支持 PDF、Word、Markdown、网页和常见文本格式，并会切分为可检索的知识片段。', demandType: '产品能力', ragCalled: true, ragHitCount: 3, toolCount: 1, firstResponseMs: 584, totalDurationMs: 3970, modelTtftMs: 416, inputTokens: 720, outputTokens: 164, cost: 0.17, userFeedback: 'up', status: 'success', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_anvil_9340', overallQualityScore: 0.94 },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', turnId: 'trace_anvil_9362', sessionId: 'session_c2817be0', turnSeq: 1, occurredAt: '2026-07-27 10:16', userInput: '你们是否支持飞书私有化部署？', agentReply: '我暂未检索到与飞书私有化部署直接相关的资料，建议由顾问进一步确认。', demandType: '集成咨询', ragCalled: true, ragHitCount: 0, toolCount: 2, firstResponseMs: 702, totalDurationMs: 6120, modelTtftMs: 503, inputTokens: 906, outputTokens: 143, cost: 0.22, userFeedback: 'none', status: 'warning', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_anvil_9362', overallQualityScore: 0.72, rootCause: 'knowledge_base' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', turnId: 'trace_anvil_9388', sessionId: 'session_aa312fd4', turnSeq: 1, occurredAt: '2026-07-27 10:31', userInput: '把我的需求提交给销售：200 人团队，8 月上线。', agentReply: '提交过程中出现超时，我已保留当前需求，您也可以稍后重试或转人工。', demandType: '销售线索', ragCalled: false, ragHitCount: 0, toolCount: 1, firstResponseMs: 790, totalDurationMs: 9200, modelTtftMs: 522, inputTokens: 784, outputTokens: 132, cost: 0.18, userFeedback: 'down', status: 'error', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_anvil_9388', overallQualityScore: 0.48, rootCause: 'tool' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', turnId: 'turn_2026', sessionId: '72ee9b31', userInput: '欧盟站退货政策是什么？', agentReply: '您可以在收货后 30 天内申请退货。', demandType: '售后政策', ragCalled: true, ragHitCount: 1, toolCount: 2, firstResponseMs: 1180, userFeedback: 'down', status: 'error', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_2026', overallQualityScore: 0.41, rootCause: 'knowledge_base' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', turnId: 'turn_3027', sessionId: '61ad8c2f', userInput: '这个症状是不是需要马上手术？', agentReply: '我无法直接判断是否需要手术，建议您立即联系医生或转人工咨询。', demandType: '医疗风险咨询', ragCalled: true, ragHitCount: 2, toolCount: 2, firstResponseMs: 1410, userFeedback: 'none', status: 'warning', traceUrl: 'http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/trace_3027', overallQualityScore: 0.62, rootCause: 'tool' },
];

// DataSlot: Agent 可用工具清单，与实际 Tool Observation 分离。
export const mockAgentToolCapabilities: AgentToolCapability[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', enabled: true, description: '检索当前站点与客户范围内的产品、价格和部署知识。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolName: '转人工', toolType: 'request_handoff', version: 'handoff-v4', enabled: true, description: '在高风险、无法确认或客户主动要求时发起人工接续。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolName: '留资表单', toolType: 'lead_capture_form', version: 'lead-form-v8', enabled: true, description: '客户表达明确意向后收集公司规模、联系方式和上线时间。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolName: 'CRM 写入', toolType: 'crm_write', version: 'crm-write-v3', enabled: true, description: '将确认后的客户需求写入 CRM 线索池。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolName: '方案顾问 Agent', toolType: 'agent_call', version: 'agent_solution_v1.2.0', enabled: true, description: '将复杂部署与方案设计任务委派给专业子 Agent。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', enabled: true, description: '检索部署架构、资源规格、实施周期和安全规范。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', enabled: true, description: '为待确认的架构、安全和实施问题创建方案工单。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', toolName: '安全评审 Agent', toolType: 'agent_call', version: 'security-review-v1', enabled: true, description: '将安全、合规和容灾问题委派给安全评审子 Agent。' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', toolName: '转方案顾问', toolType: 'request_handoff', version: 'handoff-v4', enabled: true, description: '无法确认或执行异常时创建人工方案接续。' },
];

const anvilVersions = { agent: 'agent_v3.8.2', baselineAgent: 'agent_v3.7.6', prompt: 'prompt_cs_v12', model: 'qwen3-235b-a22b', toolset: 'toolset_cs_v8', knowledgeBase: 'kb_20260726_cn' };
const specialistVersions = { agent: 'agent_solution_v1.2.0', baselineAgent: 'agent_solution_v1.1.4', prompt: 'prompt_solution_v5', model: 'qwen3-max', toolset: 'toolset_solution_v3', knowledgeBase: 'kb_solution_20260725' };
const traceUrl = (traceId: string) => `http://172.25.171.180:3001/project/cmqt6lurb0006pf08lzsznwyx/traces/${traceId}`;

// DataSlot: Session → Trace → Generation / Tool / Retriever / Score 技术证据。
export const mockObservabilitySessions: ObservabilitySession[] = [
  {
    sessionId: 'session_8ab3f921', userId: 'usr_482091', summary: '企业版价格、私有化部署、顾问方案与异常处理', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', environment: 'production', startedAt: '2026-07-27 09:42', completedAt: '2026-07-27 09:55', status: 'error',
    turns: [
      { traceId: 'trace_anvil_9281', turnSeq: 1, loopCount: 3, occurredAt: '2026-07-27 09:42', input: '企业版价格是多少？支持私有化部署吗？', output: '企业版支持私有化部署，标准服务包含部署实施、知识迁移和上线支持；具体价格需要结合团队规模和部署范围评估。', status: 'completed', firstResponseMs: 620, totalDurationMs: 4680, userFeedback: 'up', traceUrl: traceUrl('trace_anvil_9281'), versions: anvilVersions, generation: { observationId: 'gen_9281', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 438, durationMs: 2810, inputTokens: 824, outputTokens: 206, cost: 0.21 }, toolObservations: [
        { observationId: 'tool_9281_rag', traceId: 'trace_anvil_9281', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=企业版价格 私有化部署 标准服务范围', outputSummary: '命中价格说明、私有化部署范围和实施服务 3 类知识片段', status: 'success', durationMs: 438, selectionScore: 0.97, actionAlignmentScore: 0.95, successScore: 1, parameterAccuracyScore: 0.96 },
        { observationId: 'agent_call_9281', traceId: 'trace_anvil_9281', toolName: '方案顾问 Agent', toolType: 'agent_call', version: specialistVersions.agent, inputSummary: '生成企业版私有化部署方案摘要', outputSummary: '返回部署范围、实施阶段和待确认项', status: 'success', durationMs: 920, selectionScore: 0.95, actionAlignmentScore: 0.96, successScore: 0.94, parameterAccuracyScore: 0.92, targetAgentId: 'agent_anvil_solution', targetAgentName: '方案顾问 Agent', childSessionId: 'session_solution_1001', childTraceId: 'trace_solution_1001' },
      ], retrieverObservations: [
        { observationId: 'retriever_9281', traceId: 'trace_anvil_9281', query: '企业版价格 私有化部署 标准服务范围', topK: 5, filters: { product: 'enterprise', deployment: 'private' }, kbVersion: 'kb_internal', hitCount: 3, hits: [{ docId: 'enterprise-pricing.md', chunkId: 'chunk_08', score: 0.95, title: '企业版计价说明' }, { docId: 'private-deployment.md', chunkId: 'chunk_03', score: 0.93, title: '私有化部署服务范围' }, { docId: 'implementation-service.md', chunkId: 'chunk_11', score: 0.88, title: '实施服务清单' }], queryQualityScore: 0.96, contextRelevanceScore: 0.94, groundednessScore: 0.92 },
      ], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.94, scope: 'trace', reason: '完整回答企业版和私有化部署范围，并保留客户化报价边界。', rawScore: 4.8, scoreRange: '1-5' },
        { code: 'correctness', name: 'Correctness', value: 0.93, scope: 'trace', reason: '服务范围与知识库内容一致。' },
        { code: 'relevance', name: 'Relevance', value: 0.96, scope: 'trace', reason: '回答直接覆盖价格和部署问题。' },
        { code: 'query_quality', name: 'Query Quality', value: 0.96, scope: 'retriever_observation', reason: '检索 Query 包含产品、部署方式和服务范围。' },
        { code: 'context_relevance', name: 'Context Relevance', value: 0.94, scope: 'retriever_observation', reason: '命中内容直接对应用户问题。' },
        { code: 'groundedness', name: 'Groundedness', value: 0.92, scope: 'trace', reason: '回答中的主要结论均可由命中片段支持。' },
        { code: 'tool_selection', name: 'Tool Selection', value: 0.96, scope: 'tool_observation', reason: '正确选择知识库和方案顾问子 Agent。' },
        { code: 'tool_success', name: 'Tool Success', value: 0.97, scope: 'tool_observation', reason: '知识库和子 Agent 调用均成功。' },
      ] },
      { traceId: 'trace_anvil_9304', turnSeq: 2, loopCount: 3, occurredAt: '2026-07-27 09:45', input: '可以安排顾问给我一份方案吗？我们有 200 人，计划 8 月上线。', output: '已展示联系信息表单，同时创建方案咨询工单并写入 CRM，顾问会按高优先级跟进。', status: 'completed', firstResponseMs: 548, totalDurationMs: 3280, userFeedback: 'up', traceUrl: traceUrl('trace_anvil_9304'), versions: anvilVersions, generation: { observationId: 'gen_9304', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 401, durationMs: 1910, inputTokens: 712, outputTokens: 148, cost: 0.16 }, toolObservations: [
        { observationId: 'tool_9304_lead', traceId: 'trace_anvil_9304', toolName: '留资表单', toolType: 'lead_capture_form', version: 'lead-form-v8', inputSummary: 'fields=联系人,电话,公司规模,上线时间', outputSummary: '表单展示成功，客户已提交', status: 'success', durationMs: 206, selectionScore: 0.96, actionAlignmentScore: 0.95, successScore: 1, parameterAccuracyScore: 0.98 },
        { observationId: 'tool_9304_ticket', traceId: 'trace_anvil_9304', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'priority=high; category=私有化方案; teamSize=200', outputSummary: '工单 TK-20260727-018 创建成功', status: 'success', durationMs: 328, selectionScore: 0.94, actionAlignmentScore: 0.96, successScore: 1, parameterAccuracyScore: 0.97 },
        { observationId: 'tool_9304_crm', traceId: 'trace_anvil_9304', toolName: 'CRM 写入', toolType: 'crm_write', version: 'crm-write-v3', inputSummary: 'teamSize=200; goLive=2026-08; ticketId=TK-20260727-018', outputSummary: '销售线索写入成功', status: 'success', durationMs: 244, selectionScore: 0.93, actionAlignmentScore: 0.95, successScore: 1, parameterAccuracyScore: 0.98 },
      ], retrieverObservations: [], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.97, scope: 'trace', reason: '留资、工单和 CRM 三个业务动作均完成。' },
        { code: 'context_memory', name: 'Context Memory', value: 0.95, scope: 'trace', reason: '正确继承上一轮的企业版和私有化部署上下文。' },
        { code: 'lead_trigger_reasonableness', name: 'Lead Trigger Reasonableness', value: 0.97, scope: 'trace', reason: '客户明确要求顾问方案后触发留资。' },
        { code: 'action_alignment', name: 'Action Alignment', value: 0.96, scope: 'tool_observation', reason: 'Tool 执行顺序符合先收集信息、再建工单和写 CRM 的流程。' },
        { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', value: 0.98, scope: 'tool_observation', reason: '团队规模、上线时间和工单参数完整。' },
      ] },
      { traceId: 'trace_anvil_9312', turnSeq: 3, loopCount: 3, occurredAt: '2026-07-27 09:48', input: '飞书私有化一体机有标准报价吗？', output: '当前知识库没有找到对应标准报价，我已转交顾问确认，避免给出不准确价格。', status: 'completed', firstResponseMs: 702, totalDurationMs: 4120, userFeedback: 'none', traceUrl: traceUrl('trace_anvil_9312'), versions: anvilVersions, generation: { observationId: 'gen_9312', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 503, durationMs: 2320, inputTokens: 806, outputTokens: 123, cost: 0.18 }, toolObservations: [
        { observationId: 'tool_9312_rag', traceId: 'trace_anvil_9312', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=飞书私有化一体机 标准报价', outputSummary: '未命中知识片段', status: 'success', durationMs: 492, selectionScore: 0.95, actionAlignmentScore: 0.92, successScore: 1, parameterAccuracyScore: 0.96 },
        { observationId: 'tool_9312_handoff', traceId: 'trace_anvil_9312', toolName: '转人工', toolType: 'request_handoff', version: 'handoff-v4', inputSummary: 'reason=知识缺口; queue=solution_sales', outputSummary: '人工接续请求创建成功', status: 'success', durationMs: 188, selectionScore: 0.96, actionAlignmentScore: 0.97, successScore: 1, parameterAccuracyScore: 0.94 },
      ], retrieverObservations: [
        { observationId: 'retriever_9312', traceId: 'trace_anvil_9312', query: '飞书私有化一体机 标准报价', topK: 5, filters: { integration: 'feishu', deployment: 'private' }, kbVersion: 'kb_internal', hitCount: 0, hits: [], queryQualityScore: 0.88, contextRelevanceScore: null, groundednessScore: null },
      ], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.78, scope: 'trace', reason: '未直接回答报价，但正确说明知识缺口并安排人工确认。' },
        { code: 'query_quality', name: 'Query Quality', value: 0.88, scope: 'retriever_observation', reason: 'Query 明确包含集成方式、部署方式和报价主题。' },
        { code: 'groundedness', name: 'Groundedness', value: null, scope: 'trace', reason: 'RAG no-hit，没有可用证据，不评估事实依据。' },
        { code: 'handoff_reasonableness', name: 'Handoff Reasonableness', value: 0.96, scope: 'trace', reason: '报价无法确认时及时转人工。' },
      ] },
      { traceId: 'trace_anvil_9320', turnSeq: 4, loopCount: 4, occurredAt: '2026-07-27 09:51', input: '再帮我创建一张高优先级工单，确认是否默认支持跨地域自动容灾。', output: '工单创建失败；检索到的内容仅说明双机高可用，不能证明默认支持跨地域自动容灾。', status: 'error', firstResponseMs: 760, totalDurationMs: 5380, userFeedback: 'down', traceUrl: traceUrl('trace_anvil_9320'), versions: anvilVersions, generation: { observationId: 'gen_9320', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 512, durationMs: 2480, inputTokens: 884, outputTokens: 142, cost: 0.2 }, toolObservations: [
        { observationId: 'tool_9320_ticket', traceId: 'trace_anvil_9320', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'category=容灾能力确认; priority 缺失', outputSummary: '工单创建失败', status: 'error', error: 'VALIDATION_ERROR: priority is required', durationMs: 286, selectionScore: 0.9, actionAlignmentScore: 0.78, successScore: 0, parameterAccuracyScore: 0.42 },
        { observationId: 'tool_9320_rag', traceId: 'trace_anvil_9320', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=跨地域自动容灾 默认能力', outputSummary: '命中 2 条弱相关内容', status: 'success', durationMs: 446, selectionScore: 0.96, actionAlignmentScore: 0.72, successScore: 0.62, parameterAccuracyScore: 0.91 },
      ], retrieverObservations: [
        { observationId: 'retriever_9320', traceId: 'trace_anvil_9320', query: '私有化部署 跨地域自动容灾 默认能力', topK: 5, filters: { product: 'private-deployment' }, kbVersion: 'kb_internal', hitCount: 2, hits: [{ docId: 'backup-policy.md', chunkId: 'chunk_06', score: 0.58, title: '数据备份策略' }, { docId: 'ha-deployment.md', chunkId: 'chunk_02', score: 0.52, title: '双机高可用部署' }], queryQualityScore: 0.91, contextRelevanceScore: 0.44, groundednessScore: 0.55 },
      ], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.46, scope: 'trace', reason: '工单未创建，且检索证据不足以确认目标能力。' },
        { code: 'correctness', name: 'Correctness', value: 0.72, scope: 'trace', reason: '没有把高可用错误表述为跨地域自动容灾。' },
        { code: 'context_relevance', name: 'Context Relevance', value: 0.44, scope: 'retriever_observation', reason: '命中内容只涉及备份和高可用，与跨地域自动容灾不完全相关。' },
        { code: 'groundedness', name: 'Groundedness', value: 0.55, scope: 'trace', reason: '只能支持部分结论，不能确认默认容灾能力。' },
        { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', value: 0.42, scope: 'tool_observation', reason: '工单缺少必填优先级。' },
        { code: 'tool_success', name: 'Tool Success', value: 0.31, scope: 'tool_observation', reason: '工单失败，知识库仅部分达到目标。' },
      ], risk: { riskLevel: 'critical', issueType: '工单失败 / 检索依据不足', diagnosis: '工单缺少必填优先级而创建失败，检索内容只能支持双机高可用，无法证明跨地域自动容灾。', scoreName: 'Task Success', score: 0.46, customerImpact: '客户无法获得容灾能力确认，且人工跟进工单未建立。', expectedBehavior: '补齐工单优先级，并在证据不足时明确能力边界和人工确认路径。', sourceSignals: ['downvote', 'low_score', 'tool_failure'], relatedToolObservationIds: ['tool_9320_ticket', 'tool_9320_rag'], matchedAlertRuleIds: [], matchedAlertEventIds: [], reviewStatus: 'pending', rootCause: 'tool' } },
      { traceId: 'trace_anvil_9331', turnSeq: 5, loopCount: 3, occurredAt: '2026-07-27 09:54', input: '那把刚才的需求重新写入 CRM，并查询标准实施周期。', output: 'CRM 写入和知识库查询均超时，我已保留需求，建议稍后重试或由顾问人工处理。', status: 'timeout', firstResponseMs: 810, totalDurationMs: 9200, userFeedback: 'down', traceUrl: traceUrl('trace_anvil_9331'), versions: anvilVersions, generation: { observationId: 'gen_9331', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 522, durationMs: 2240, inputTokens: 812, outputTokens: 126, cost: 0.19 }, toolObservations: [
        { observationId: 'tool_9331_crm', traceId: 'trace_anvil_9331', toolName: 'CRM 写入', toolType: 'crm_write', version: 'crm-write-v3', inputSummary: 'teamSize=200; goLive=2026-08; retry=true', outputSummary: '请求超时，写入状态未知', status: 'timeout', error: 'CRM_GATEWAY_TIMEOUT after 5000ms', durationMs: 5000, selectionScore: 0.94, actionAlignmentScore: 0.86, successScore: 0, parameterAccuracyScore: 0.92 },
        { observationId: 'tool_9331_rag', traceId: 'trace_anvil_9331', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=私有化部署 标准实施周期', outputSummary: '请求超过 5000ms 未返回', status: 'timeout', error: 'RETRIEVAL_TIMEOUT', durationMs: 5000, selectionScore: 0.97, actionAlignmentScore: 0.9, successScore: 0, parameterAccuracyScore: 0.95 },
      ], retrieverObservations: [], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.38, scope: 'trace', reason: 'CRM 写入和实施周期查询均未完成。' },
        { code: 'tool_selection', name: 'Tool Selection', value: 0.95, scope: 'tool_observation', reason: '选择的 Tool 与用户目标一致。' },
        { code: 'tool_success', name: 'Tool Success', value: 0, scope: 'tool_observation', reason: '两个 Tool 均超时。' },
        { code: 'groundedness', name: 'Groundedness', value: null, scope: 'trace', reason: '知识库调用超时，没有 Retriever Observation，不评估事实依据。' },
      ], risk: { riskLevel: 'critical', issueType: 'CRM 与知识库超时', diagnosis: 'CRM 写入和知识库检索均超时，本轮两个业务目标都未完成。', scoreName: 'Task Success', score: 0.38, customerImpact: '销售线索状态不确定，客户无法获得实施周期。', expectedBehavior: '自动重试或转人工，并明确告知 CRM 写入结果和后续处理方式。', sourceSignals: ['downvote', 'low_score', 'tool_failure', 'timeout', 'alert'], relatedToolObservationIds: ['tool_9331_crm', 'tool_9331_rag'], matchedAlertRuleIds: [], matchedAlertEventIds: [], reviewStatus: 'pending', rootCause: 'tool' } },
    ],
  },
  {
    sessionId: 'session_41ef901a', userId: 'usr_710334', summary: '咨询知识库支持的文档格式与解析能力', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', environment: 'production', startedAt: '2026-07-27 10:03', completedAt: '2026-07-27 10:04', status: 'completed',
    turns: [{ traceId: 'trace_anvil_9340', turnSeq: 1, loopCount: 2, occurredAt: '2026-07-27 10:03', input: '知识库支持哪些文档格式？', output: '支持 PDF、Word、Markdown、网页和常见文本格式，并会切分为可检索的知识片段。', status: 'completed', firstResponseMs: 584, totalDurationMs: 3970, userFeedback: 'up', traceUrl: traceUrl('trace_anvil_9340'), versions: anvilVersions, generation: { observationId: 'gen_9340', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 416, durationMs: 2780, inputTokens: 720, outputTokens: 164, cost: 0.17 }, toolObservations: [
      { observationId: 'tool_9340', traceId: 'trace_anvil_9340', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=知识库支持的文档格式; siteId=site_anvil_cn', outputSummary: '命中 3 个知识片段', status: 'success', durationMs: 438, selectionScore: 0.96, actionAlignmentScore: 0.95, successScore: 1, parameterAccuracyScore: 0.97 },
    ], retrieverObservations: [
      { observationId: 'retriever_9340', traceId: 'trace_anvil_9340', query: '知识库支持的文档格式与解析方式', topK: 5, filters: { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn' }, kbVersion: 'kb_20260726_cn', hitCount: 3, hits: [{ docId: 'kb_formats', chunkId: 'chunk_04', score: 0.93, title: '知识库支持格式' }, { docId: 'kb_ingestion', chunkId: 'chunk_11', score: 0.86, title: '文档解析与切分' }], queryQualityScore: 0.94, contextRelevanceScore: 0.92, groundednessScore: 0.95 },
    ], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.96, scope: 'trace', reason: '完整回答格式与处理方式。' },
      { code: 'context_relevance', name: 'Context Relevance', value: 0.92, scope: 'trace', reason: '命中内容直接覆盖问题。' },
      { code: 'groundedness', name: 'Groundedness', value: 0.95, scope: 'trace', reason: '最终回答可由命中片段逐项支持。' },
    ] }],
  },
  {
    sessionId: 'session_c2817be0', userId: 'usr_365820', summary: '飞书私有化部署能力确认与人工接续', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', environment: 'production', startedAt: '2026-07-27 10:16', completedAt: '2026-07-27 10:17', status: 'completed',
    turns: [{ traceId: 'trace_anvil_9362', turnSeq: 1, loopCount: 3, occurredAt: '2026-07-27 10:16', input: '你们是否支持飞书私有化部署？', output: '我暂未检索到与飞书私有化部署直接相关的资料，建议由顾问进一步确认。', status: 'completed', firstResponseMs: 702, totalDurationMs: 6120, userFeedback: 'none', traceUrl: traceUrl('trace_anvil_9362'), versions: anvilVersions, generation: { observationId: 'gen_9362', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 503, durationMs: 3220, inputTokens: 906, outputTokens: 143, cost: 0.22 }, toolObservations: [
      { observationId: 'tool_9362_rag', traceId: 'trace_anvil_9362', toolName: '知识库检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=飞书私有化部署; tenant/site filters', outputSummary: '未命中', status: 'success', durationMs: 492, selectionScore: 0.93, actionAlignmentScore: 0.9, successScore: 1, parameterAccuracyScore: 0.95 },
      { observationId: 'tool_9362_handoff', traceId: 'trace_anvil_9362', toolName: '转人工', toolType: 'request_handoff', version: 'handoff-v4', inputSummary: 'reason=知识缺口; 保留会话摘要', outputSummary: '创建顾问接续请求', status: 'success', durationMs: 188, selectionScore: 0.92, actionAlignmentScore: 0.91, successScore: 1, parameterAccuracyScore: 0.9 },
    ], retrieverObservations: [
      { observationId: 'retriever_9362', traceId: 'trace_anvil_9362', query: '飞书 私有化 部署 集成', topK: 5, filters: { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn' }, kbVersion: 'kb_20260726_cn', hitCount: 0, hits: [], queryQualityScore: 0.82, contextRelevanceScore: null, groundednessScore: null },
    ], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.76, scope: 'trace', reason: '未能直接回答，但正确说明知识缺口并引导人工确认。' },
      { code: 'groundedness', name: 'Groundedness', value: null, scope: 'trace', reason: 'RAG no-hit，不评估 Groundedness。' },
      { code: 'handoff_reasonableness', name: 'Handoff Reasonableness', value: 0.91, scope: 'trace', reason: '无法确认的集成问题及时转人工。' },
    ], risk: { riskLevel: 'high', issueType: '未回答 / 知识缺口', diagnosis: 'RAG 未命中飞书私有化部署资料，本轮无法给出确定答案。', scoreName: 'Task Success', score: 0.76, customerImpact: '客户需要等待人工确认，延长咨询路径。', expectedBehavior: '补充飞书私有化集成 FAQ，命中后直接回答支持范围与限制。', sourceSignals: ['unanswered', 'rag_no_hit'], relatedToolObservationIds: ['tool_9362_rag', 'tool_9362_handoff'], matchedAlertRuleIds: [], matchedAlertEventIds: [], reviewStatus: 'pending', rootCause: 'knowledge_base' } }],
  },
  {
    sessionId: 'session_aa312fd4', userId: 'usr_918447', summary: '提交 200 人团队销售线索时 CRM 写入超时', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', environment: 'production', startedAt: '2026-07-27 10:31', completedAt: '2026-07-27 10:32', status: 'timeout',
    turns: [{ traceId: 'trace_anvil_9388', turnSeq: 1, loopCount: 4, occurredAt: '2026-07-27 10:31', input: '把我的需求提交给销售：200 人团队，8 月上线。', output: '提交过程中出现超时，我已保留当前需求，您也可以稍后重试或转人工。', status: 'timeout', firstResponseMs: 790, totalDurationMs: 9200, userFeedback: 'down', traceUrl: traceUrl('trace_anvil_9388'), versions: anvilVersions, generation: { observationId: 'gen_9388', model: anvilVersions.model, promptVersion: anvilVersions.prompt, status: 'success', firstTokenMs: 522, durationMs: 2840, inputTokens: 784, outputTokens: 132, cost: 0.18 }, toolObservations: [
      { observationId: 'tool_9388', traceId: 'trace_anvil_9388', toolName: 'CRM 写入', toolType: 'crm_write', version: 'crm-write-v3', inputSummary: 'teamSize=200; goLive=2026-08; contact 缺失', outputSummary: '请求超时，未确认写入结果', status: 'timeout', error: 'CRM gateway timeout after 6000ms', durationMs: 6000, selectionScore: 0.88, actionAlignmentScore: 0.84, successScore: 0, parameterAccuracyScore: 0.62 },
    ], retrieverObservations: [], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.42, scope: 'trace', reason: '销售需求未成功写入 CRM。' },
      { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', value: 0.62, scope: 'tool_observation', reason: '缺少联系人字段且没有在调用前补充澄清。' },
    ], risk: { riskLevel: 'critical', issueType: 'CRM Tool 超时', diagnosis: 'CRM 写入超时且参数缺少联系人，销售线索未确认写入。', scoreName: 'Task Success', score: 0.42, customerImpact: '销售线索可能丢失，客户需要重复提交。', expectedBehavior: '调用前补齐联系人，超时后自动重试或转人工并确认线索状态。', sourceSignals: ['downvote', 'low_score', 'tool_failure', 'timeout', 'alert'], relatedToolObservationIds: ['tool_9388'], matchedAlertRuleIds: ['alert_crm_timeout'], matchedAlertEventIds: ['event_crm_timeout_0727'], reviewStatus: 'pending', rootCause: 'tool' } }],
  },
  {
    sessionId: 'session_solution_1001', userId: 'agent_parent_9304', summary: '生成 200 人团队私有化部署方案框架', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', environment: 'production', startedAt: '2026-07-27 09:45', completedAt: '2026-07-27 09:46', status: 'completed',
    turns: [{ traceId: 'trace_solution_1001', turnSeq: 1, loopCount: 2, occurredAt: '2026-07-27 09:45', input: '根据 200 人团队和 8 月上线目标生成私有化部署方案框架。', output: '建议采用单租户私有化部署，分为需求澄清、环境准备、集成联调、知识迁移和灰度上线五个阶段。', status: 'completed', firstResponseMs: 410, totalDurationMs: 2310, userFeedback: 'none', traceUrl: traceUrl('trace_solution_1001'), versions: specialistVersions, generation: { observationId: 'gen_solution_1001', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 302, durationMs: 780, inputTokens: 1140, outputTokens: 386, cost: 0.31 }, toolObservations: [
      { observationId: 'tool_solution_1001_rag', traceId: 'trace_solution_1001', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=200人团队 私有化部署 实施阶段 资源规格', outputSummary: '命中容量规划、部署架构和实施阶段文档', status: 'success', durationMs: 446, selectionScore: 0.98, actionAlignmentScore: 0.96, successScore: 1, parameterAccuracyScore: 0.97 },
      { observationId: 'tool_solution_1001_ticket', traceId: 'trace_solution_1001', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'priority=medium; category=部署方案确认; teamSize=200', outputSummary: '工单 TK-SOL-100 创建成功', status: 'success', durationMs: 312, selectionScore: 0.94, actionAlignmentScore: 0.95, successScore: 1, parameterAccuracyScore: 0.96 },
    ], retrieverObservations: [
      { observationId: 'retriever_solution_1001', traceId: 'trace_solution_1001', query: '200人团队 私有化部署 实施阶段 资源规格', topK: 5, filters: { solutionType: 'private-deployment', scale: '200-users' }, kbVersion: 'kb_solution_internal', hitCount: 3, hits: [{ docId: 'capacity-planning.md', chunkId: 'chunk_08', score: 0.95, title: '200-500 用户容量规划' }, { docId: 'implementation-guide.md', chunkId: 'chunk_03', score: 0.93, title: '标准实施阶段' }, { docId: 'private-architecture.md', chunkId: 'chunk_05', score: 0.9, title: '私有化参考架构' }], queryQualityScore: 0.96, contextRelevanceScore: 0.94, groundednessScore: 0.93 },
    ], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.94, scope: 'trace', reason: '输出覆盖部署架构、实施阶段和待确认项。' },
      { code: 'correctness', name: 'Correctness', value: 0.91, scope: 'trace', reason: '方案内容与当前产品私有化能力一致。' },
      { code: 'instruction_following', name: 'Instruction Following', value: 0.95, scope: 'trace', reason: '严格按照团队规模和上线时间输出方案框架。' },
      { code: 'completeness', name: 'Completeness', value: 0.92, scope: 'trace', reason: '覆盖架构、阶段、资源和待确认项。' },
      { code: 'format_compliance', name: 'Format Compliance', value: 0.96, scope: 'trace', reason: '方案结构清晰，符合标准模板。' },
    ] }],
  },
  {
    sessionId: 'session_solution_1002', userId: 'usr_solution_arch', summary: '检索高可用规格并输出完整部署拓扑', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', environment: 'production', startedAt: '2026-07-27 10:05', completedAt: '2026-07-27 10:08', status: 'completed',
    turns: [
      { traceId: 'trace_solution_1002_1', turnSeq: 1, loopCount: 3, occurredAt: '2026-07-27 10:05', input: '请给出 200 人团队的高可用部署规格和网络拓扑。', output: '建议采用双应用节点、双数据库节点和独立向量库，入口通过负载均衡接入，并划分业务区、数据区和运维区。', status: 'completed', firstResponseMs: 430, totalDurationMs: 2680, userFeedback: 'up', traceUrl: traceUrl('trace_solution_1002_1'), versions: specialistVersions, generation: { observationId: 'gen_solution_1002_1', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 316, durationMs: 1680, inputTokens: 1280, outputTokens: 420, cost: 0.34 }, toolObservations: [
        { observationId: 'tool_solution_1002_rag', traceId: 'trace_solution_1002_1', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=200人 高可用 部署规格 网络拓扑', outputSummary: '命中容量规划、高可用架构和网络分区文档', status: 'success', durationMs: 462, selectionScore: 0.98, actionAlignmentScore: 0.97, successScore: 1, parameterAccuracyScore: 0.97 },
      ], retrieverObservations: [
        { observationId: 'retriever_solution_1002', traceId: 'trace_solution_1002_1', query: '200人团队 高可用 节点规格 网络分区', topK: 5, filters: { solutionType: 'private-deployment', scale: '200-users' }, kbVersion: 'kb_solution_internal', hitCount: 4, hits: [{ docId: 'capacity-planning.md', chunkId: 'chunk_08', score: 0.96, title: '200-500 用户容量规划' }, { docId: 'ha-architecture.md', chunkId: 'chunk_04', score: 0.94, title: '高可用参考架构' }, { docId: 'network-zones.md', chunkId: 'chunk_06', score: 0.9, title: '私有化网络分区' }], queryQualityScore: 0.97, contextRelevanceScore: 0.95, groundednessScore: 0.94 },
      ], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.96, scope: 'trace', reason: '完整给出规格、拓扑和网络分区。' },
        { code: 'instruction_following', name: 'Instruction Following', value: 0.97, scope: 'trace', reason: '围绕 200 人规模生成方案。' },
        { code: 'completeness', name: 'Completeness', value: 0.95, scope: 'trace', reason: '资源、拓扑和网络均覆盖。' },
        { code: 'groundedness', name: 'Groundedness', value: 0.94, scope: 'trace', reason: '结论由容量与架构文档支撑。' },
      ] },
      { traceId: 'trace_solution_1002_2', turnSeq: 2, loopCount: 2, occurredAt: '2026-07-27 10:07', input: '把待确认的防火墙端口创建成方案工单。', output: '已创建方案工单 TK-SOL-102，等待网络团队确认端口清单。', status: 'completed', firstResponseMs: 390, totalDurationMs: 1420, userFeedback: 'up', traceUrl: traceUrl('trace_solution_1002_2'), versions: specialistVersions, generation: { observationId: 'gen_solution_1002_2', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 286, durationMs: 820, inputTokens: 640, outputTokens: 118, cost: 0.13 }, toolObservations: [
        { observationId: 'tool_solution_1002_ticket', traceId: 'trace_solution_1002_2', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'priority=medium; category=网络端口确认; owner=网络团队', outputSummary: '工单 TK-SOL-102 创建成功', status: 'success', durationMs: 318, selectionScore: 0.97, actionAlignmentScore: 0.98, successScore: 1, parameterAccuracyScore: 0.98 },
      ], retrieverObservations: [], scores: [
        { code: 'task_success', name: 'Task Success', value: 0.98, scope: 'trace', reason: '工单创建成功并返回编号。' },
        { code: 'tool_success', name: 'Tool Success', value: 1, scope: 'tool_observation', reason: '创建方案工单成功。' },
        { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', value: 0.98, scope: 'tool_observation', reason: '优先级、分类和负责人完整。' },
      ] },
    ],
  },
  {
    sessionId: 'session_solution_1003', userId: 'usr_solution_gap', summary: '跨地域容灾知识缺口与人工接续', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', environment: 'production', startedAt: '2026-07-27 10:20', completedAt: '2026-07-27 10:22', status: 'completed',
    turns: [{ traceId: 'trace_solution_1003', turnSeq: 1, loopCount: 3, occurredAt: '2026-07-27 10:20', input: '当前标准方案是否默认包含跨地域自动容灾？', output: '当前知识中没有找到“默认包含跨地域自动容灾”的明确依据，建议由架构顾问确认后再写入方案。', status: 'completed', firstResponseMs: 520, totalDurationMs: 3440, userFeedback: 'none', traceUrl: traceUrl('trace_solution_1003'), versions: specialistVersions, generation: { observationId: 'gen_solution_1003', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 360, durationMs: 1860, inputTokens: 760, outputTokens: 136, cost: 0.17 }, toolObservations: [
      { observationId: 'tool_solution_1003_rag', traceId: 'trace_solution_1003', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=跨地域自动容灾 默认方案', outputSummary: '未命中明确依据', status: 'success', durationMs: 478, selectionScore: 0.97, actionAlignmentScore: 0.92, successScore: 1, parameterAccuracyScore: 0.96 },
      { observationId: 'tool_solution_1003_handoff', traceId: 'trace_solution_1003', toolName: '转方案顾问', toolType: 'request_handoff', version: 'handoff-v4', inputSummary: 'reason=架构能力边界不明确; queue=architecture_review', outputSummary: '方案顾问接续请求创建成功', status: 'success', durationMs: 184, selectionScore: 0.96, actionAlignmentScore: 0.97, successScore: 1, parameterAccuracyScore: 0.95 },
    ], retrieverObservations: [
      { observationId: 'retriever_solution_1003', traceId: 'trace_solution_1003', query: '跨地域自动容灾 标准方案 默认能力', topK: 5, filters: { solutionType: 'private-deployment' }, kbVersion: 'kb_solution_internal', hitCount: 0, hits: [], queryQualityScore: 0.9, contextRelevanceScore: null, groundednessScore: null },
    ], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.8, scope: 'trace', reason: '未直接确认能力，但正确识别知识缺口并安排人工确认。' },
      { code: 'groundedness', name: 'Groundedness', value: null, scope: 'trace', reason: '知识库 no-hit，不评估素材有据。' },
      { code: 'low_hallucination_risk', name: 'Low Hallucination Risk', value: 0.96, scope: 'trace', reason: '没有在缺少依据时宣称默认支持。' },
    ] }],
  },
  {
    sessionId: 'session_solution_1004', userId: 'usr_solution_risk', summary: '安全方案证据不足且子 Agent 调用失败', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', environment: 'production', startedAt: '2026-07-27 10:35', completedAt: '2026-07-27 10:37', status: 'error',
    turns: [{ traceId: 'trace_solution_1004', turnSeq: 1, loopCount: 4, occurredAt: '2026-07-27 10:35', input: '请确认方案是否满足等保三级，并创建安全评审工单。', output: '检索到的内容只覆盖部分安全控制，安全评审 Agent 当前不可用，且工单缺少必填优先级，未能完成评审。', status: 'error', firstResponseMs: 680, totalDurationMs: 4860, userFeedback: 'down', traceUrl: traceUrl('trace_solution_1004'), versions: specialistVersions, generation: { observationId: 'gen_solution_1004', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 458, durationMs: 2280, inputTokens: 920, outputTokens: 174, cost: 0.22 }, toolObservations: [
      { observationId: 'tool_solution_1004_rag', traceId: 'trace_solution_1004', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=等保三级 私有化 安全控制', outputSummary: '命中 2 条部分相关内容', status: 'success', durationMs: 526, selectionScore: 0.97, actionAlignmentScore: 0.76, successScore: 0.68, parameterAccuracyScore: 0.95 },
      { observationId: 'tool_solution_1004_agent', traceId: 'trace_solution_1004', toolName: '安全评审 Agent', toolType: 'agent_call', version: 'security-review-v1', inputSummary: '评估当前部署方案的等保三级覆盖情况', outputSummary: '子 Agent 无可用执行槽位', status: 'error', error: 'CHILD_AGENT_UNAVAILABLE', durationMs: 810, selectionScore: 0.95, actionAlignmentScore: 0.92, successScore: 0, parameterAccuracyScore: 0.94, targetAgentName: '安全评审 Agent' },
      { observationId: 'tool_solution_1004_ticket', traceId: 'trace_solution_1004', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'category=安全评审; priority 缺失', outputSummary: '工单创建失败', status: 'error', error: 'VALIDATION_ERROR: priority is required', durationMs: 274, selectionScore: 0.9, actionAlignmentScore: 0.82, successScore: 0, parameterAccuracyScore: 0.4 },
    ], retrieverObservations: [
      { observationId: 'retriever_solution_1004', traceId: 'trace_solution_1004', query: '等保三级 私有化部署 安全控制项', topK: 5, filters: { compliance: 'MLPS-3' }, kbVersion: 'kb_solution_internal', hitCount: 2, hits: [{ docId: 'security-baseline.md', chunkId: 'chunk_05', score: 0.72, title: '私有化安全基线' }, { docId: 'audit-guide.md', chunkId: 'chunk_02', score: 0.6, title: '审计日志配置' }], queryQualityScore: 0.93, contextRelevanceScore: 0.58, groundednessScore: 0.54 },
    ], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.32, scope: 'trace', reason: '安全评审和工单创建均未完成。' },
      { code: 'correctness', name: 'Correctness', value: 0.7, scope: 'trace', reason: '正确说明只能确认部分控制项。' },
      { code: 'context_relevance', name: 'Context Relevance', value: 0.58, scope: 'retriever_observation', reason: '命中内容只能覆盖部分等保要求。' },
      { code: 'groundedness', name: 'Groundedness', value: 0.54, scope: 'trace', reason: '证据不足以支持完整合规结论。' },
      { code: 'tool_success', name: 'Tool Success', value: 0.23, scope: 'tool_observation', reason: '检索部分成功，子 Agent 和工单失败。' },
      { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', value: 0.4, scope: 'tool_observation', reason: '工单缺少必填优先级。' },
    ], risk: { riskLevel: 'critical', issueType: '安全评审失败 / 证据不足', diagnosis: '安全证据只能覆盖部分控制项，子 Agent 不可用，安全评审工单也因缺少优先级创建失败。', scoreName: 'Task Success', score: 0.32, customerImpact: '客户无法确认等保三级覆盖范围，方案评审被阻塞。', expectedBehavior: '补齐工单参数，在子 Agent 不可用时转人工安全评审，并明确未覆盖的控制项。', sourceSignals: ['downvote', 'low_score', 'tool_failure', 'alert'], relatedToolObservationIds: ['tool_solution_1004_rag', 'tool_solution_1004_agent', 'tool_solution_1004_ticket'], matchedAlertRuleIds: [], matchedAlertEventIds: [], reviewStatus: 'pending', rootCause: 'tool' } }],
  },
  {
    sessionId: 'session_solution_1005', userId: 'usr_solution_timeout', summary: '实施周期检索与方案工单同时超时', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', environment: 'production', startedAt: '2026-07-27 10:50', completedAt: '2026-07-27 10:52', status: 'timeout',
    turns: [{ traceId: 'trace_solution_1005', turnSeq: 1, loopCount: 3, occurredAt: '2026-07-27 10:50', input: '请查询标准实施周期，并创建项目启动工单。', output: '知识库查询和工单服务均超时，暂时无法确认周期或创建启动工单。', status: 'timeout', firstResponseMs: 820, totalDurationMs: 9100, userFeedback: 'down', traceUrl: traceUrl('trace_solution_1005'), versions: specialistVersions, generation: { observationId: 'gen_solution_1005', model: specialistVersions.model, promptVersion: specialistVersions.prompt, status: 'success', firstTokenMs: 532, durationMs: 2140, inputTokens: 780, outputTokens: 118, cost: 0.18 }, toolObservations: [
      { observationId: 'tool_solution_1005_rag', traceId: 'trace_solution_1005', toolName: '方案知识检索', toolType: 'rag_search', version: 'rag-search-v6', inputSummary: 'query=私有化部署 标准实施周期', outputSummary: '请求超过 5000ms 未返回', status: 'timeout', error: 'RETRIEVAL_TIMEOUT', durationMs: 5000, selectionScore: 0.98, actionAlignmentScore: 0.9, successScore: 0, parameterAccuracyScore: 0.96 },
      { observationId: 'tool_solution_1005_ticket', traceId: 'trace_solution_1005', toolName: '创建方案工单', toolType: 'create_ticket', version: 'ticket-v2', inputSummary: 'priority=high; category=项目启动', outputSummary: '工单服务请求超时', status: 'timeout', error: 'TICKET_SERVICE_TIMEOUT', durationMs: 5000, selectionScore: 0.95, actionAlignmentScore: 0.91, successScore: 0, parameterAccuracyScore: 0.97 },
    ], retrieverObservations: [], scores: [
      { code: 'task_success', name: 'Task Success', value: 0.28, scope: 'trace', reason: '两个目标均因超时未完成。' },
      { code: 'tool_selection', name: 'Tool Selection', value: 0.96, scope: 'tool_observation', reason: '选择知识库和工单 Tool 符合任务。' },
      { code: 'tool_success', name: 'Tool Success', value: 0, scope: 'tool_observation', reason: '两个 Tool 均超时。' },
      { code: 'groundedness', name: 'Groundedness', value: null, scope: 'trace', reason: '知识库查询超时，没有证据，不评估素材有据。' },
    ], risk: { riskLevel: 'high', issueType: '检索与工单超时', diagnosis: '知识库查询和项目启动工单同时超时，两个目标均未完成。', scoreName: 'Task Success', score: 0.28, customerImpact: '实施周期无法确认，项目启动流程未建立。', expectedBehavior: '超时后自动重试或转人工，并保存工单草稿以避免重复输入。', sourceSignals: ['downvote', 'low_score', 'tool_failure', 'timeout'], relatedToolObservationIds: ['tool_solution_1005_rag', 'tool_solution_1005_ticket'], matchedAlertRuleIds: [], matchedAlertEventIds: [], reviewStatus: 'pending', rootCause: 'tool' } }],
  },
];

// DataSlot: 指标定义及计算口径。
export const AGENT_METRIC_DEFINITIONS: MetricDefinition[] = [
  { code: 'session_count', name: 'Sessions', nameZh: '会话数', category: 'runtime', scope: 'agent', unit: 'count', direction: 'neutral', description: '统计周期内至少包含一个用户轮次的会话数量。', formula: '去重 sessionId 数量', caveats: ['多轮会话只计算一次。'] },
  { code: 'trace_count', name: 'Traces / Turns', nameZh: 'Trace / 轮次数', category: 'runtime', scope: 'agent', unit: 'count', direction: 'neutral', description: '每个用户轮次创建一个 agent-turn Trace。', formula: '符合范围条件的 Trace 数量', caveats: ['使用 sessionId + turnSeq 关联和排序。'] },
  { code: 'avg_turns_per_session', name: 'Average Turns', nameZh: '平均轮次', category: 'runtime', scope: 'agent', unit: 'count', direction: 'neutral', description: '每个会话平均包含的用户轮次数。', formula: 'Trace 数 / Session 数', numeratorLabel: 'Trace 数', denominatorLabel: 'Session 数', caveats: ['空会话不进入分母。'] },
  { code: 'request_success_rate', name: 'Request Success Rate', nameZh: '请求成功率', category: 'runtime', scope: 'trace', unit: 'percent', direction: 'higher_better', description: '请求是否完成运行流程。', formula: '成功 Trace / 已结束 Trace', numeratorLabel: '成功 Trace', denominatorLabel: '已结束 Trace', caveats: ['仅表示执行完成，不等于回答正确或业务成功。'] },
  { code: 'error_rate', name: 'Error Rate', nameZh: '错误率', category: 'runtime', scope: 'trace', unit: 'percent', direction: 'lower_better', description: '发生运行错误的 Trace 占比。', formula: '错误 Trace / 全部已结束 Trace', caveats: ['业务低分但技术完成的 Trace 不计为运行错误。'] },
  { code: 'timeout_rate', name: 'Timeout Rate', nameZh: '超时率', category: 'runtime', scope: 'trace', unit: 'percent', direction: 'lower_better', description: '达到运行或 Tool 超时条件的 Trace 占比。', formula: '超时 Trace / 全部已结束 Trace', caveats: ['Tool timeout 会同时进入对应 Tool 明细。'] },
  { code: 'first_response_ms', name: 'First Visible Response', nameZh: '首次可见回复', category: 'latency', scope: 'trace', unit: 'milliseconds', direction: 'lower_better', description: '用户发送消息到看到首段回复的端到端时延。', formula: '首个可见输出时间 - 用户请求接收时间', caveats: ['不能使用模型 TTFT 替代。'] },
  { code: 'p95_response_ms', name: 'P95 Response', nameZh: 'P95 响应时延', category: 'latency', scope: 'trace', unit: 'milliseconds', direction: 'lower_better', description: '95% 已结束 Trace 的端到端响应时延不超过该值。', formula: '已结束 Trace 总时延的 P95 分位数', caveats: ['需要展示统计周期和样本量。'] },
  { code: 'model_ttft_ms', name: 'Model TTFT', nameZh: '模型首 Token', category: 'latency', scope: 'generation', unit: 'milliseconds', direction: 'lower_better', description: '模型 Generation 从请求到首 Token 的时延。', formula: '模型首 Token 时间 - Generation 开始时间', caveats: ['仅为模型技术指标，不代表用户首次可见回复。'] },
  { code: 'total_tokens', name: 'Total Tokens', nameZh: 'Token 总量', category: 'cost', scope: 'generation', unit: 'tokens', direction: 'neutral', description: '统计周期内输入与输出 Token 总量。', formula: '输入 Token + 输出 Token', caveats: ['按模型实际计费口径记录。'] },
  { code: 'total_cost', name: 'Total Cost', nameZh: '模型总成本', category: 'cost', scope: 'generation', unit: 'currency', direction: 'lower_better', description: '统计周期内模型调用成本。', formula: '各 Generation 成本之和', caveats: ['不含外部 Tool 商业费用。'] },
  { code: 'satisfaction_rate', name: 'Satisfaction Rate', nameZh: '满意率', category: 'feedback', scope: 'trace', unit: 'percent', direction: 'higher_better', description: '有明确反馈的 Trace 中点赞所占比例。', formula: '点赞数 /（点赞数 + 点踩数）', numeratorLabel: '点赞数', denominatorLabel: '点赞 + 点踩', caveats: ['必须同时展示反馈覆盖率，避免稀疏反馈造成偏差。'] },
  { code: 'feedback_coverage_rate', name: 'Feedback Coverage', nameZh: '反馈覆盖率', category: 'feedback', scope: 'trace', unit: 'percent', direction: 'neutral', description: '已完成 Trace 中获得用户反馈的比例。', formula: '有反馈 Trace / 已完成 Trace', numeratorLabel: '有反馈 Trace', denominatorLabel: '已完成 Trace', caveats: ['错误或取消且未完成的 Trace 不进入分母。'] },
  { code: 'task_success', name: 'Task Success', nameZh: '任务达成', category: 'quality', scope: 'trace', unit: 'score', direction: 'higher_better', description: '是否完成客户真实目标。', formula: 'OpenJudge 评分归一化至 0–1', caveats: ['1–5 分使用 (rawScore - 1) / 4；执行完成不等于任务达成。'] },
  { code: 'correctness', name: 'Correctness', nameZh: '事实正确', category: 'quality', scope: 'trace', unit: 'score', direction: 'higher_better', description: '回答中的事实和结论是否正确。', formula: 'Judge/规则评分归一化至 0–1', caveats: ['保留 rawScore、rubricVersion、judgeModel 和 reason。'] },
  { code: 'relevance', name: 'Relevance', nameZh: '回答相关', category: 'quality', scope: 'trace', unit: 'score', direction: 'higher_better', description: '回答是否围绕当前问题。', formula: '有效评价 Trace 分数均值', caveats: [] },
  { code: 'tool_call_count', name: 'Tool Calls', nameZh: 'Tool 调用数', category: 'tool', scope: 'tool_observation', unit: 'count', direction: 'neutral', description: '实际发生的 Tool Observation 数量。', formula: 'Tool Observation 计数', caveats: ['可用 Tool 数与实际调用数必须分开。'] },
  { code: 'tool_success_rate', name: 'Tool Success Rate', nameZh: 'Tool 成功率', category: 'tool', scope: 'tool_observation', unit: 'percent', direction: 'higher_better', description: 'Tool 执行成功的比例。', formula: '成功 Tool Observation / 已结束 Tool Observation', caveats: ['未调用不能自动视为失败，应另由 Tool Selection 判断。'] },
  { code: 'tool_selection', name: 'Tool Selection', nameZh: 'Tool 选择', category: 'tool', scope: 'trace', unit: 'score', direction: 'higher_better', description: '是否在正确时机选择正确 Tool。', formula: 'Trace 级评估分数均值', caveats: ['应调用但未调用也进入评估。'] },
  { code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', nameZh: 'Tool 参数准确率', category: 'tool', scope: 'tool_observation', unit: 'score', direction: 'higher_better', description: 'Tool 参数是否完整、准确并符合 schema。', formula: 'Tool Observation 级参数评分均值', caveats: ['仅在发生 Tool 调用后评估。'] },
  { code: 'rag_call_rate', name: 'RAG Call Rate', nameZh: 'RAG 调用率', category: 'rag', scope: 'trace', unit: 'percent', direction: 'neutral', description: '符合统计条件的 Trace 中发生 Retriever Observation 的比例。', formula: '包含 Retriever Observation 的 Trace / 合格 Trace', caveats: ['调用率高低需结合场景，不是越高越好。'] },
  { code: 'rag_hit_rate', name: 'RAG Hit Rate', nameZh: 'RAG 命中率', category: 'rag', scope: 'retriever_observation', unit: 'percent', direction: 'higher_better', description: '发生检索的 Observation 中至少命中一个知识片段的比例。', formula: 'hitCount > 0 的 Retriever Observation / 全部 Retriever Observation', caveats: ['命中不代表上下文相关或回答正确。'] },
  { code: 'rag_query_quality', name: 'Query Quality', nameZh: '检索问题质量', category: 'rag', scope: 'retriever_observation', unit: 'score', direction: 'higher_better', description: '检索 query 是否准确表达用户目标和约束。', formula: 'Retriever Observation 级评分均值', caveats: ['RAG no-hit 时优先评估该指标。'] },
  { code: 'context_relevance', name: 'Context Relevance', nameZh: '上下文相关性', category: 'rag', scope: 'trace', unit: 'score', direction: 'higher_better', description: '命中的知识上下文是否能回答用户问题。', formula: 'RAG hit Trace 的相关性均值', caveats: ['no-hit 不进入该指标分母。'] },
  { code: 'groundedness', name: 'Groundedness', nameZh: '回答忠实度', category: 'rag', scope: 'trace', unit: 'score', direction: 'higher_better', description: '最终回答是否由命中的知识证据支持。', formula: 'RAG hit Trace 的 Groundedness 均值', caveats: ['RAG no-hit 时显示未评估，不记为 0。'] },
];

export const mockAgentMetricSnapshots: MetricValueSnapshot[] = [
  { metricCode: 'session_count', value: 1842, sampleCount: 1842, status: 'healthy' },
  { metricCode: 'trace_count', value: 10316, sampleCount: 10316, status: 'healthy' },
  { metricCode: 'avg_turns_per_session', value: 5.6, numerator: 10316, denominator: 1842, status: 'healthy' },
  { metricCode: 'request_success_rate', value: 99.2, numerator: 10233, denominator: 10316, thresholdLabel: '≥ 98%', status: 'healthy' },
  { metricCode: 'error_rate', value: 0.8, numerator: 83, denominator: 10316, thresholdLabel: '< 2%', status: 'healthy' },
  { metricCode: 'timeout_rate', value: 0.3, numerator: 31, denominator: 10316, thresholdLabel: '< 1%', status: 'healthy' },
  { metricCode: 'first_response_ms', value: 618, sampleCount: 10316, thresholdLabel: '< 1000ms', status: 'healthy' },
  { metricCode: 'p95_response_ms', value: 5280, sampleCount: 10316, thresholdLabel: '≤ 6912ms', status: 'healthy' },
  { metricCode: 'model_ttft_ms', value: 446, sampleCount: 10316, status: 'healthy' },
  { metricCode: 'total_tokens', value: 16428000, sampleCount: 10316, status: 'healthy' },
  { metricCode: 'total_cost', value: 2168, sampleCount: 10316, status: 'healthy' },
  { metricCode: 'satisfaction_rate', value: 92.6, numerator: 1128, denominator: 1218, coverageRate: 11.8, thresholdLabel: '≥ 85%', status: 'healthy' },
  { metricCode: 'feedback_coverage_rate', value: 11.8, numerator: 1218, denominator: 10316, thresholdLabel: '≥ 10%', status: 'healthy' },
  { metricCode: 'task_success', value: 0.89, sampleCount: 1240, coverageRate: 12, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'correctness', value: 0.91, sampleCount: 1240, coverageRate: 12, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'relevance', value: 0.93, sampleCount: 1240, coverageRate: 12, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'tool_call_count', value: 16742, sampleCount: 10316, status: 'healthy' },
  { metricCode: 'tool_success_rate', value: 98.7, numerator: 16524, denominator: 16742, thresholdLabel: '≥ 97%', status: 'healthy' },
  { metricCode: 'tool_selection', value: 0.9, sampleCount: 1450, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'tool_parameter_accuracy', value: 0.92, sampleCount: 16742, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'rag_call_rate', value: 76.4, numerator: 7882, denominator: 10316, status: 'healthy' },
  { metricCode: 'rag_hit_rate', value: 88.9, numerator: 7006, denominator: 7882, thresholdLabel: '≥ 85%', status: 'healthy' },
  { metricCode: 'rag_query_quality', value: 0.88, sampleCount: 7882, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'context_relevance', value: 0.87, sampleCount: 7006, thresholdLabel: '≥ 0.80', status: 'healthy' },
  { metricCode: 'groundedness', value: 0.9, sampleCount: 7006, thresholdLabel: '≥ 0.80', status: 'healthy' },
];

const contributionMetrics = ['request_success_rate', 'error_rate', 'timeout_rate', 'first_response_ms', 'p95_response_ms', 'model_ttft_ms', 'satisfaction_rate', 'feedback_coverage_rate', 'task_success', 'correctness', 'relevance', 'tool_call_count', 'tool_success_rate', 'tool_selection', 'tool_parameter_accuracy', 'rag_call_rate', 'rag_hit_rate', 'rag_query_quality', 'context_relevance', 'groundedness'];
export const mockMetricContributions: MetricContribution[] = mockObservabilitySessions.flatMap((session) => session.turns.flatMap((trace) => contributionMetrics.map((metricCode) => {
  const score = trace.scores.find((item) => item.code === metricCode)?.value ?? null;
  const retriever = trace.retrieverObservations[0];
  const tool = trace.toolObservations[0];
  const values: Record<string, number | null> = {
    request_success_rate: trace.status === 'completed' ? 1 : 0,
    error_rate: trace.status === 'error' ? 1 : 0,
    timeout_rate: trace.status === 'timeout' ? 1 : 0,
    first_response_ms: trace.firstResponseMs,
    p95_response_ms: trace.totalDurationMs,
    model_ttft_ms: trace.generation.firstTokenMs,
    satisfaction_rate: trace.userFeedback === 'up' ? 1 : trace.userFeedback === 'down' ? 0 : null,
    feedback_coverage_rate: trace.userFeedback === 'none' ? 0 : 1,
    task_success: trace.scores.find((item) => item.code === 'task_success')?.value ?? null,
    correctness: trace.scores.find((item) => item.code === 'correctness')?.value ?? trace.scores.find((item) => item.code === 'task_success')?.value ?? null,
    relevance: trace.scores.find((item) => item.code === 'relevance')?.value ?? trace.scores.find((item) => item.code === 'task_success')?.value ?? null,
    tool_call_count: trace.toolObservations.length,
    tool_success_rate: trace.toolObservations.length ? (trace.toolObservations.every((item) => item.status === 'success') ? 1 : 0) : null,
    tool_selection: score ?? tool?.selectionScore ?? null,
    tool_parameter_accuracy: tool?.parameterAccuracyScore ?? null,
    rag_call_rate: trace.retrieverObservations.length ? 1 : 0,
    rag_hit_rate: retriever ? (retriever.hitCount > 0 ? 1 : 0) : null,
    rag_query_quality: retriever?.queryQualityScore ?? null,
    context_relevance: retriever?.contextRelevanceScore ?? null,
    groundedness: retriever?.groundednessScore ?? trace.scores.find((item) => item.code === 'groundedness')?.value ?? null,
  };
  const value = values[metricCode];
  const noRetriever = ['rag_hit_rate', 'rag_query_quality', 'context_relevance', 'groundedness'].includes(metricCode) && !retriever;
  const noHitGroundedness = metricCode === 'groundedness' && retriever?.hitCount === 0;
  const noFeedback = metricCode === 'satisfaction_rate' && trace.userFeedback === 'none';
  return { metricCode, tenantId: session.tenantId, siteId: session.siteId, agentId: session.agentId, sessionId: session.sessionId, traceId: trace.traceId, turnSeq: trace.turnSeq, occurredAt: trace.occurredAt, contributionValue: value, contributionLabel: value === null ? '未评估' : metricCode.includes('rate') ? `${(value * 100).toFixed(0)}%` : value.toFixed(2), included: !(noRetriever || noHitGroundedness || noFeedback), exclusionReason: noRetriever ? '该 Trace 未发生 Retriever Observation' : noHitGroundedness ? 'RAG no-hit，不评估 Groundedness' : noFeedback ? '用户未提交反馈' : undefined };
})));

export const mockKnowledgeQualityData: KnowledgeQualityItem[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', id: 'rag_private_deploy', query: '私有化部署价格包含哪些服务？', category: '价格 / 部署', ragCalledWhenNeeded: false, queryQuality: 0.38, hitCount: 0, topDoc: null, chunkId: null, groundedness: 0.42, kbVersion: 'kb_20260709_cn', status: 'gap', affectedTurns: 18 },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', id: 'rag_return_policy_eu', query: 'EU return policy', category: '售后政策', ragCalledWhenNeeded: true, queryQuality: 0.61, hitCount: 1, topDoc: 'return-policy-us.md', chunkId: 'chunk_18', groundedness: 0.44, kbVersion: 'kb_20260706_eu', status: 'low_relevance', affectedTurns: 22 },
  { tenantId: 'tenant_edu', siteId: 'site_edu_main', agentId: 'agent_edu_admission', id: 'rag_course_price', query: '高中课程怎么收费？', category: '课程价格', ragCalledWhenNeeded: true, queryQuality: 0.9, hitCount: 3, topDoc: 'tuition.md', chunkId: 'chunk_03', groundedness: 0.91, kbVersion: 'kb_20260709_edu', status: 'healthy', affectedTurns: 31 },
];

export const mockEvalRunsData: EvalRun[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', runId: 'run_20260709_01', name: '智能客服 Pro RAG 回归', dataset: 'rag-quality-v1', targetVersion: 'prompt_v12 / kb_20260709_cn', status: 'passed', contextRelevance: 0.9, conciseness: 0.86, groundedness: 0.91, toolCorrectness: 0.88, overallScore: 0.90, failedSamples: 2, startedAt: '2026-07-09 13:30' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', runId: 'run_20260709_02', name: '欧洲商城售后政策回归', dataset: 'rag-quality-v1', targetVersion: 'prompt_v8 / kb_20260706_eu', status: 'blocked', contextRelevance: 0.74, conciseness: 0.82, groundedness: 0.58, toolCorrectness: 0.64, overallScore: 0.70, failedSamples: 12, startedAt: '2026-07-09 12:10' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', runId: 'run_20260709_03', name: '医疗风险转人工回归', dataset: 'tool-quality-v1', targetVersion: 'handoff_rule_v4', status: 'running', contextRelevance: 0.7, conciseness: 0.76, groundedness: 0.69, toolCorrectness: 0.61, overallScore: 0.69, failedSamples: 0, startedAt: '2026-07-09 15:40' },
];

export const mockEvaluatorConfigData: EvaluatorConfigItem[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', id: 'eval_groundedness', name: '回答依据完整性', scope: '知识库问答', trigger: '命中知识后', threshold: 0.8, status: 'enabled' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', id: 'eval_tool_correctness', name: '工具调用正确性', scope: '全部工具', trigger: '每次工具调用', threshold: 0.8, status: 'enabled' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', id: 'eval_rag_query', name: '检索问题改写质量', scope: '知识库检索', trigger: '差评后抽检', threshold: 0.75, status: 'enabled' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', id: 'eval_handoff', name: '转人工时机', scope: '高风险咨询', trigger: '转人工或漏转人工', threshold: 0.85, status: 'disabled' },
];

export const mockAlertRulesData: AlertRule[] = [
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', id: 'alert_first_response', name: '端到端首字响应 P95 升高', metricName: '端到端首字响应', threshold: '> 1200ms', scope: 'agent', scopeLabel: '智能客服PRO', window: '最近 10 分钟', condition: '连续 2 个窗口超阈值', notificationTarget: '研发', recoveryCondition: '< 1000ms，连续 2 个窗口', status: 'enabled', owner: '研发', lastTriggeredAt: '2026-07-27 10:18' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', id: 'alert_crm_timeout', name: 'CRM 写入失败或超时', metricName: 'CRM Tool 成功率', threshold: '< 95%', scope: 'tool', scopeLabel: 'CRM 写入', window: '最近 30 分钟', condition: '失败样本不少于 1 条', notificationTarget: '研发 / 销售运营', recoveryCondition: '连续 2 个窗口无失败', status: 'enabled', owner: '研发', lastTriggeredAt: '2026-07-27 10:31' },
  { tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_ops', id: 'alert_style_alignment', name: '品牌风格评分下降', metricName: 'Style Alignment', threshold: '< 0.75', scope: 'agent', scopeLabel: '运营助手', window: '最近 1 小时', condition: '有效评价样本不少于 10 条', notificationTarget: '增长运营', recoveryCondition: '>= 0.82，持续 1 小时', status: 'enabled', owner: '增长运营', lastTriggeredAt: '2026-07-27 09:20' },
  { tenantId: 'tenant_export', siteId: 'site_export_eu', agentId: 'agent_export_cs_eu', id: 'alert_groundedness', name: '回答忠实度下降', metricName: '回答忠实度', threshold: '< 0.7', scope: 'tool', scopeLabel: 'RAG 检索', window: '最近 1 小时', condition: '有效评价样本不少于 20 条', notificationTarget: '知识运营', recoveryCondition: '>= 0.8，持续 1 小时', status: 'enabled', owner: '知识运营', lastTriggeredAt: '2026-07-09 14:24' },
  { tenantId: 'tenant_med', siteId: 'site_med_main', agentId: 'agent_med_triage', id: 'alert_handoff', name: '高风险问题未转人工', metricName: '转人工时机', threshold: '< 0.8', scope: 'tenant', scopeLabel: '瑞和医疗', window: '自然日', condition: '高风险样本不少于 10 条', notificationTarget: '产品 / 合规', recoveryCondition: '>= 0.85，连续 1 个自然日', status: 'enabled', owner: '产品/合规', lastTriggeredAt: '2026-07-09 14:31' },
];

export const mockAlertEventsData: AlertEvent[] = [
  { eventId: 'event_crm_timeout_0727', ruleId: 'alert_crm_timeout', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', toolType: 'crm_write', metricName: 'CRM Tool 成功率', observedValue: '0%', threshold: '< 95%', window: '2026-07-27 10:00–10:30', scopeLabel: 'CRM 写入', status: 'open', summary: 'CRM 写入出现超时，销售线索未确认入库。', notificationTarget: '研发 / 销售运营', matchedTraceIds: ['trace_anvil_9388'], triggeredAt: '2026-07-27 10:31' },
  { eventId: 'event_style_0727', ruleId: 'alert_style_alignment', tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_ops', metricName: 'Style Alignment', observedValue: '0.51', threshold: '< 0.75', window: '2026-07-27 09:00–10:00', scopeLabel: '运营助手', status: 'acknowledged', summary: '制造业营销内容偏离企业品牌语气。', notificationTarget: '增长运营', matchedTraceIds: ['trace_anvil_9266'], triggeredAt: '2026-07-27 09:20', acknowledgedAt: '2026-07-27 09:32' },
];

export const RELEASE_GATE_CONFIG = {
  passed: { label: '可发布', cls: 'bg-green-50 text-green-600 border-green-100' },
  blocked: { label: '阻塞发布', cls: 'bg-red-50 text-red-600 border-red-100' },
  running: { label: '评估中', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
} as const;

// DataSlot: 质量评分目录。每个指标都有稳定 code、英文名、中文名和所属分类。
export const AGENT_EVALUATION_GROUPS: EvaluationMetricGroup[] = [
  {
    id: 'common-quality', code: 'COMMON_QUALITY', name: 'Common Quality', nameZh: '通用质量', appliesTo: 'all',
    metrics: [
      { id: 'task_success', code: 'task_success', name: 'Task Success', nameZh: '任务达成', description: '是否完成客户或用户的实际目标。' },
      { id: 'correctness', code: 'correctness', name: 'Correctness', nameZh: '事实正确', description: '回答、内容或执行结果是否正确。' },
      { id: 'relevance', code: 'relevance', name: 'Relevance', nameZh: '回答相关', description: '是否围绕当前问题或任务要求作答。' },
    ],
  },
  {
    id: 'tool-rag-quality', code: 'TOOL_RAG_QUALITY', name: 'Tool and Retrieval Quality', nameZh: '工具与检索质量', appliesTo: 'all',
    metrics: [
      { id: 'query_quality', code: 'query_quality', name: 'Query Quality', nameZh: '检索问题质量', description: '检索 Query 是否准确表达用户问题与关键约束。' },
      { id: 'context_relevance', code: 'context_relevance', name: 'Context Relevance', nameZh: '检索内容相关', description: '命中的知识片段是否与当前问题直接相关。' },
      { id: 'action_alignment', code: 'action_alignment', name: 'Action Alignment', nameZh: '执行动作对齐', description: 'Tool 执行动作是否符合当前业务目标。' },
      { id: 'tool_success', code: 'tool_success', name: 'Tool Success', nameZh: '工具执行成功', description: 'Tool 是否完成预期执行结果。' },
    ],
  },
  {
    id: 'customer-service-understanding', code: 'SERVICE_UNDERSTANDING', name: 'Service Understanding', nameZh: '服务理解', appliesTo: 'customer_service',
    metrics: [
      { id: 'context_memory', code: 'context_memory', name: 'Context Memory', nameZh: '上下文记忆', description: '是否记住并正确使用客户前序关键信息。' },
      { id: 'clarification_quality', code: 'clarification_quality', name: 'Clarification Quality', nameZh: '澄清质量', description: '信息不足时是否先澄清，而不是直接下结论。' },
    ],
  },
  {
    id: 'customer-service-assurance', code: 'SERVICE_ASSURANCE', name: 'Service Assurance', nameZh: '服务保障', appliesTo: 'customer_service',
    metrics: [
      { id: 'groundedness', code: 'groundedness', name: 'Groundedness', nameZh: '事实依据', description: '最终回答是否由检索到的知识或事实支撑。' },
      { id: 'tool_selection', code: 'tool_selection', name: 'Tool Selection', nameZh: '服务动作选择', description: '是否选择了正确的服务能力和处理动作。' },
      { id: 'tool_parameter_accuracy', code: 'tool_parameter_accuracy', name: 'Tool Parameter Accuracy', nameZh: '服务信息准确', description: '工具调用中的客户信息和业务参数是否准确完整。' },
      { id: 'handoff_reasonableness', code: 'handoff_reasonableness', name: 'Handoff Reasonableness', nameZh: '转人工合理性', description: '是否在高风险或无法确认时及时转人工。' },
      { id: 'lead_trigger_reasonableness', code: 'lead_trigger_reasonableness', name: 'Lead Trigger Reasonableness', nameZh: '留资触发合理性', description: '是否在客户表达明确意向后再请求留资。' },
    ],
  },
  {
    id: 'operations-content-quality', code: 'CONTENT_QUALITY', name: 'Content Quality', nameZh: '内容质量', appliesTo: 'operations_assistant',
    metrics: [
      { id: 'instruction_following', code: 'instruction_following', name: 'Instruction Following', nameZh: '指令遵循', description: '是否遵循任务要求、约束和输出范围。' },
      { id: 'completeness', code: 'completeness', name: 'Completeness', nameZh: '内容完整', description: '是否覆盖任务要求中的所有关键内容。' },
      { id: 'style_alignment', code: 'style_alignment', name: 'Style Alignment', nameZh: '品牌风格一致', description: '是否符合客户当前的品牌规范和表达风格。' },
    ],
  },
  {
    id: 'operations-content-assurance', code: 'CONTENT_ASSURANCE', name: 'Content Assurance', nameZh: '内容保障', appliesTo: 'operations_assistant',
    metrics: [
      { id: 'format_compliance', code: 'format_compliance', name: 'Format Compliance', nameZh: '格式合规', description: '输出结构、字段、字数和模板是否符合要求。' },
      { id: 'groundedness', code: 'groundedness', name: 'Groundedness', nameZh: '素材有据', description: '内容是否由提供的素材或知识支撑。' },
      { id: 'low_hallucination_risk', code: 'low_hallucination_risk', name: 'Low Hallucination Risk', nameZh: '低幻觉风险', description: '内容中是否避免出现没有事实依据的声明。' },
    ],
  },
];

// DataSlot: 客户级智能体监测详情，当前深度接入智能客服PRO与运营助手。
export const mockTenantMonitoringData: TenantMonitoringItem[] = [
  {
    tenantId: 'tenant_anvil',
    companyName: 'Anvil 科技',
    industry: '制造 / B2B',
    plan: 'Enterprise',
    customerOwner: '客户成功部 · 林岚',
    monitoredSince: '2026-05-12',
    langfuseProject: 'anvil-production',
    agents: [
      {
        tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_cs_cn', agentName: '智能客服PRO', agentTypeLabel: '智能客服', kind: 'customer_service', status: 'healthy', owner: 'AI 产品组', environment: 'production',
        versions: { agent: 'agent_v3.8.2', baselineAgent: 'agent_v3.7.6', prompt: 'prompt_cs_v12', model: 'qwen3-235b-a22b', toolset: 'toolset_cs_v8', knowledgeBase: 'kb_20260726_cn' },
        metrics: { sessionCount: 1842, turnCount: 10316, averageTurnsPerSession: 5.6, requestSuccessRate: 99.2, errorRate: 0.8, timeoutRate: 0.3, firstResponseMs: 618, averageResponseMs: 4180, p95ResponseMs: 5280, modelTtftMs: 446, inputTokens: 12486000, outputTokens: 3942000, totalCost: 2168, costPerRequest: 0.21, satisfactionRate: 92.6, thumbsUpCount: 1128, thumbsDownCount: 90, feedbackTraceCount: 1218, completedTraceCount: 10316, feedbackCoverageRate: 11.8, taskSuccessScore: 0.89, correctnessScore: 0.91, relevanceScore: 0.93, availableToolCount: 4, calledToolCount: 4, toolCallCount: 16742, toolFailureCount: 218, toolSuccessRate: 98.7, ragCallCount: 7882, ragHitObservationCount: 7006, averageRagHitCount: 2.7, ragNoHitCount: 876, ragQueryQualityScore: 0.88, contextRelevanceScore: 0.87, ragCallRate: 76.4, ragHitRate: 88.9, groundednessScore: 0.90, evaluatedTraceCount: 1240, evaluationCoverageRate: 12.0, riskTraceCount: 7 },
        scorecard: { kind: 'customer_service', contextMemoryScore: 0.87, clarificationQualityScore: 0.89, toolSelectionScore: 0.90, toolParameterAccuracyScore: 0.92, handoffReasonablenessScore: 0.88, leadTriggerReasonablenessScore: 0.86, resolutionRate: 78.4, handoffRate: 8.1, leadTriggerRate: 16.8, leadCompletionRate: 33.4 },
        releaseGate: { status: 'passed', baselineVersion: 'agent_v3.7.6', targetVersion: 'agent_v3.8.2', sampleCount: 186, severeFailureCount: 1, conclusion: '核心评分高于基线，性能与成本均在发布门槛内。', criteria: [
          { key: 'groundedness', label: '事实回答有依据', baseline: 0.86, target: 0.90, thresholdLabel: '≥ 0.80，且不下降', status: 'passed' },
          { key: 'tool', label: '服务动作正确', baseline: 0.86, target: 0.90, thresholdLabel: '≥ 0.80，且不下降', status: 'passed' },
          { key: 'p95', label: '客户等待时长', baseline: 5760, target: 5280, thresholdLabel: '不高于基线 120%', status: 'passed' },
          { key: 'severe', label: '重大客户风险', baseline: 1, target: 1, thresholdLabel: '不得增加', status: 'passed' },
        ] },
      },
      {
        tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_solution', agentName: '方案顾问 Agent', agentTypeLabel: '专业子 Agent', kind: 'operations_assistant', status: 'healthy', owner: '解决方案组', environment: 'production',
        versions: specialistVersions,
        metrics: { sessionCount: 286, turnCount: 342, averageTurnsPerSession: 1.2, requestSuccessRate: 99.4, errorRate: 0.6, timeoutRate: 0.1, firstResponseMs: 410, averageResponseMs: 920, p95ResponseMs: 1840, modelTtftMs: 302, inputTokens: 1680000, outputTokens: 624000, totalCost: 486, costPerRequest: 1.42, satisfactionRate: 90.8, feedbackCoverageRate: 8.2, taskSuccessScore: 0.92, correctnessScore: 0.91, relevanceScore: 0.94, availableToolCount: 0, calledToolCount: 0, toolCallCount: 0, toolSuccessRate: 100, ragCallRate: null, ragHitRate: null, groundednessScore: null, evaluatedTraceCount: 186, evaluationCoverageRate: 54.4, riskTraceCount: 2 },
        scorecard: { kind: 'operations_assistant', instructionFollowingScore: 0.94, completenessScore: 0.92, styleAlignmentScore: 0.88, formatComplianceScore: 0.96, hallucinationRiskScore: 0.06, firstDraftAdoptionRate: 82, averageRevisionCount: 0.6, humanEditMagnitude: 12, publishOrConversionRate: 74 },
        releaseGate: { status: 'passed', baselineVersion: specialistVersions.baselineAgent, targetVersion: specialistVersions.agent, sampleCount: 96, severeFailureCount: 0, conclusion: '方案完整性与事实正确性达标，可供主 Agent 调用。', criteria: [
          { key: 'task_success', label: 'Task Success', baseline: 0.89, target: 0.92, thresholdLabel: '≥ 0.85', status: 'passed' },
          { key: 'correctness', label: 'Correctness', baseline: 0.88, target: 0.91, thresholdLabel: '≥ 0.85', status: 'passed' },
        ] },
      },
      {
        tenantId: 'tenant_anvil', siteId: 'site_anvil_cn', agentId: 'agent_anvil_ops', agentName: '运营助手', agentTypeLabel: '内容创建 Agent', kind: 'operations_assistant', status: 'warning', owner: '增长运营组', environment: 'production',
        versions: { agent: 'agent_v1.6.0', baselineAgent: 'agent_v1.5.3', prompt: 'prompt_ops_v9', model: 'qwen3-max', toolset: 'toolset_ops_v5', knowledgeBase: 'kb_brand_20260724' },
        metrics: { sessionCount: 624, turnCount: 1186, requestSuccessRate: 97.8, errorRate: 2.2, firstResponseMs: 842, p95ResponseMs: 12640, inputTokens: 4820000, outputTokens: 2860000, totalCost: 1286, costPerRequest: 1.08, satisfactionRate: 84.1, feedbackCoverageRate: 26.9, taskSuccessScore: 0.78, correctnessScore: 0.76, relevanceScore: 0.88, toolCallCount: 1526, toolSuccessRate: 96.4, ragCallRate: 32.8, ragHitRate: 85.2, groundednessScore: 0.79, evaluatedTraceCount: 386, evaluationCoverageRate: 32.5, riskTraceCount: 18 },
        scorecard: { kind: 'operations_assistant', instructionFollowingScore: 0.86, completenessScore: 0.81, styleAlignmentScore: 0.74, formatComplianceScore: 0.96, hallucinationRiskScore: 0.21, firstDraftAdoptionRate: 62.0, averageRevisionCount: 1.8, humanEditMagnitude: 28.0, publishOrConversionRate: 47.0 },
        releaseGate: { status: 'blocked', baselineVersion: 'agent_v1.5.3', targetVersion: 'agent_v1.6.0', sampleCount: 120, severeFailureCount: 4, conclusion: '品牌风格与事实正确性下降，且严重失败增加，暂不允许发布。', criteria: [
          { key: 'correctness', label: 'Correctness', baseline: 0.82, target: 0.76, thresholdLabel: '不得低于基线', status: 'blocked', reason: '下降 0.06' },
          { key: 'style', label: 'Style Alignment', baseline: 0.83, target: 0.74, thresholdLabel: '≥ 0.80，且不下降', status: 'blocked', reason: '低于门槛且下降' },
          { key: 'format', label: 'Format Compliance', baseline: 0.94, target: 0.96, thresholdLabel: '≥ 0.90', status: 'passed' },
          { key: 'severe', label: '严重失败', baseline: 1, target: 4, thresholdLabel: '不得增加', status: 'blocked', reason: '增加 3 条' },
        ] },
      },
    ],
  },
  { tenantId: 'tenant_export', companyName: '远航跨境', industry: '跨境电商', plan: 'Pro', customerOwner: '客户成功部 · 赵星', monitoredSince: '2026-04-18', langfuseProject: 'yuanhang-production', agents: [] },
  { tenantId: 'tenant_med', companyName: '瑞和医疗', industry: '医疗服务', plan: 'Enterprise', customerOwner: '客户成功部 · 陈晨', monitoredSince: '2026-06-01', langfuseProject: 'ruihe-production', agents: [] },
  { tenantId: 'tenant_edu', companyName: '北辰教育', industry: '教育培训', plan: 'Pro', customerOwner: '客户成功部 · 徐星', monitoredSince: '2026-03-22', langfuseProject: 'beichen-production', agents: [] },
];

export interface RiskTraceRow {
  tenantId: string;
  siteId: string;
  agentId: string;
  sessionId: string;
  sessionStartedAt: string;
  trace: ObservabilityTrace & { risk: NonNullable<ObservabilityTrace['risk']> };
}

// DataSlot: 风险样本是带风险分析的 Trace 筛选视图，不维护第二份问题样本数据。
export function getRiskTraceRows(): RiskTraceRow[] {
  return mockObservabilitySessions.flatMap((session) => session.turns
    .filter((trace): trace is ObservabilityTrace & { risk: NonNullable<ObservabilityTrace['risk']> } => Boolean(trace.risk))
    .map((trace) => ({ tenantId: session.tenantId, siteId: session.siteId, agentId: session.agentId, sessionId: session.sessionId, sessionStartedAt: session.startedAt, trace })));
}

export const mockTenantEvaluationRunsData: TenantEvaluationRun[] = [
  { runId: 'run_cs_20260727', tenantId: 'tenant_anvil', agentId: 'agent_anvil_cs_cn', agentName: '智能客服PRO', datasetName: 'anvil-cs-regression-v4', baselineVersion: 'agent_v3.7.6', targetVersion: 'agent_v3.8.2', status: 'passed', sampleCount: 186, severeFailureCount: 1, conclusion: '质量提升且性能、成本未突破门槛。', startedAt: '2026-07-27 07:30' },
  { runId: 'run_ops_20260727', tenantId: 'tenant_anvil', agentId: 'agent_anvil_ops', agentName: '运营助手', datasetName: 'anvil-ops-content-v3', baselineVersion: 'agent_v1.5.3', targetVersion: 'agent_v1.6.0', status: 'blocked', sampleCount: 120, severeFailureCount: 4, conclusion: '品牌风格与事实正确性下降，暂不允许发布。', startedAt: '2026-07-27 08:10' },
  { runId: 'run_ops_fix_20260727', tenantId: 'tenant_anvil', agentId: 'agent_anvil_ops', agentName: '运营助手', datasetName: 'anvil-ops-hotfix-v1', baselineVersion: 'agent_v1.6.0', targetVersion: 'prompt_ops_v10-rc1', status: 'running', sampleCount: 120, severeFailureCount: 0, conclusion: '正在验证品牌规则与数值校验修复。', startedAt: '2026-07-27 10:02' },
];
