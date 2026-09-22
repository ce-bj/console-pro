import type { RiskLevel, TenantListItem, ToolObservation, ToolType } from './types';
import { mockAgentListData, mockObservabilitySessions, mockTenantListData } from './data';

function weightedAverage(rows: TenantListItem[], field: keyof TenantListItem, denominator: keyof TenantListItem) {
  const totalWeight = rows.reduce((total, item) => total + Number(item[denominator]), 0);
  return totalWeight === 0 ? 0 : rows.reduce((total, item) => total + Number(item[field]) * Number(item[denominator]), 0) / totalWeight;
}

export function getPlatformCustomerOverview(tenants = mockTenantListData) {
  return {
    totalTenants: tenants.length,
    totalAgents: tenants.reduce((total, item) => total + item.agentCount, 0),
    totalSessions: tenants.reduce((total, item) => total + item.sessionCount, 0),
    totalTurns: tenants.reduce((total, item) => total + item.turnCount, 0),
    totalCost: tenants.reduce((total, item) => total + item.modelCost, 0),
    totalRisks: tenants.reduce((total, item) => total + item.riskCount, 0),
    riskTenantCount: tenants.filter((item) => item.status !== 'healthy').length,
    requestSuccessRate: 100 - weightedAverage(tenants, 'errorRate', 'turnCount'),
    satisfactionRate: weightedAverage(tenants, 'satisfactionRate', 'turnCount'),
    toolSuccessRate: weightedAverage(tenants, 'toolSuccessRate', 'turnCount'),
    ragHitRate: weightedAverage(tenants, 'ragHitRate', 'turnCount'),
    maxTenantP95Seconds: Math.max(...tenants.map((item) => item.p95ResponseDurationSec), 0),
  };
}

export interface CustomerPriority {
  tenant: TenantListItem;
  label: string;
  action: string;
  score: number;
}

export interface TenantInvocationSummary {
  tenantId: string;
  toolCallCount: number;
  toolCallRate: number;
  ragCallCount: number;
  ragCallRate: number;
}

export function getTenantInvocationSummaries() {
  const groups = new Map<string, typeof mockAgentListData>();
  mockAgentListData.forEach((agent) => groups.set(agent.tenantId, [...(groups.get(agent.tenantId) ?? []), agent]));
  return Array.from(groups.entries()).map(([tenantId, agents]): TenantInvocationSummary => {
    const turnCount = agents.reduce((total, agent) => total + agent.turnCount, 0);
    const toolCallCount = agents.reduce((total, agent) => total + agent.toolCallCount, 0);
    const ragCallCount = agents.reduce((total, agent) => total + agent.turnCount * agent.ragCallRate / 100, 0);
    return {
      tenantId,
      toolCallCount,
      toolCallRate: turnCount ? toolCallCount / turnCount * 100 : 0,
      ragCallCount,
      ragCallRate: turnCount ? ragCallCount / turnCount * 100 : 0,
    };
  });
}

export function getCustomerPriorities(tenants = mockTenantListData): CustomerPriority[] {
  return tenants.map((tenant) => {
    if (tenant.status === 'risk') return { tenant, label: '客户运行风险', action: '进入客户页定位高影响 Trace 与异常请求', score: 400 + tenant.riskCount };
    if (tenant.toolSuccessRate < 95) return { tenant, label: '工具执行异常', action: '进入客户页或 Tool 质量中心查看失败调用', score: 300 + tenant.riskCount };
    if (tenant.ragHitRate < 75) return { tenant, label: '知识检索命中偏低', action: '复核客户知识范围与检索证据', score: 200 + tenant.riskCount };
    if (tenant.satisfactionRate < 85) return { tenant, label: '回答质量需关注', action: '复盘客户低分和点踩风险样本', score: 100 + tenant.riskCount };
    return { tenant, label: '风险样本待复盘', action: '按风险数量进入客户页确认处理项', score: tenant.riskCount };
  }).sort((left, right) => right.score - left.score);
}

export interface ToolQualityAggregate {
  toolType: ToolType;
  agentCount: number;
  traceCount: number;
  callCount: number;
  successCount: number;
  successRate: number;
  avgCallsPerTrace: number;
  avgDurationMs: number;
  selectionScore: number | null;
  selectionCoverage: number;
  actionAlignmentScore: number | null;
  actionAlignmentCoverage: number;
  parameterAccuracyScore: number | null;
  parameterAccuracyCoverage: number;
}

export interface ToolQualityBreakdown extends ToolQualityAggregate {
  tenantId: string;
  siteId: string;
  agentId: string;
  toolName: string;
}

interface ToolScope {
  tenantId: string;
  siteId: string;
  agentId: string;
  traceId: string;
  tool: ToolObservation;
}

function toolScopes() {
  return mockObservabilitySessions.flatMap((session) => session.turns.flatMap((trace) => trace.toolObservations.map((tool) => ({
    tenantId: session.tenantId, siteId: session.siteId, agentId: session.agentId, traceId: trace.traceId, tool,
  }))));
}

function aggregateToolScopes(scopes: ToolScope[]): ToolQualityAggregate {
  const callCount = scopes.length;
  const values = (field: 'selectionScore' | 'actionAlignmentScore' | 'parameterAccuracyScore') => scopes.map((item) => item.tool[field]).filter((value): value is number => value !== null);
  const mean = (valuesToAverage: number[]) => valuesToAverage.length ? valuesToAverage.reduce((total, value) => total + value, 0) / valuesToAverage.length : null;
  const selection = values('selectionScore');
  const alignment = values('actionAlignmentScore');
  const parameter = values('parameterAccuracyScore');
  return {
    toolType: scopes[0].tool.toolType,
    agentCount: new Set(scopes.map((item) => item.agentId)).size,
    traceCount: new Set(scopes.map((item) => item.traceId)).size,
    callCount,
    successCount: scopes.filter((item) => item.tool.status === 'success').length,
    successRate: callCount ? scopes.filter((item) => item.tool.status === 'success').length / callCount * 100 : 0,
    avgCallsPerTrace: new Set(scopes.map((item) => item.traceId)).size ? callCount / new Set(scopes.map((item) => item.traceId)).size : 0,
    avgDurationMs: callCount ? scopes.reduce((total, item) => total + item.tool.durationMs, 0) / callCount : 0,
    selectionScore: mean(selection), selectionCoverage: selection.length,
    actionAlignmentScore: mean(alignment), actionAlignmentCoverage: alignment.length,
    parameterAccuracyScore: mean(parameter), parameterAccuracyCoverage: parameter.length,
  };
}

export function getToolQualityAggregates(toolType?: ToolType) {
  const scopes = toolScopes().filter((item) => !toolType || item.tool.toolType === toolType);
  const groups = new Map<ToolType, ToolScope[]>();
  scopes.forEach((item) => groups.set(item.tool.toolType, [...(groups.get(item.tool.toolType) ?? []), item]));
  return Array.from(groups.values()).map(aggregateToolScopes);
}

export function getToolQualityBreakdowns(toolType: ToolType): ToolQualityBreakdown[] {
  const groups = new Map<string, ToolScope[]>();
  toolScopes().filter((item) => item.tool.toolType === toolType).forEach((item) => {
    const key = `${item.tenantId}:${item.siteId}:${item.agentId}:${item.tool.toolName}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.values()).map((scopes) => ({ ...aggregateToolScopes(scopes), tenantId: scopes[0].tenantId, siteId: scopes[0].siteId, agentId: scopes[0].agentId, toolName: scopes[0].tool.toolName }));
}

export interface LowQualityToolCall {
  tenantId: string;
  siteId: string;
  agentId: string;
  sessionId: string;
  traceId: string;
  traceInput: string;
  tool: ToolObservation;
  severity: RiskLevel;
  criterion: string;
  evidence: string;
  nextAction: string;
}

export function getLowQualityToolCalls(toolType: ToolType): LowQualityToolCall[] {
  return mockObservabilitySessions.flatMap((session) => session.turns.flatMap((trace) => trace.toolObservations.flatMap((tool) => {
    if (tool.toolType !== toolType) return [];
    const relatedRisk = trace.risk?.relatedToolObservationIds.includes(tool.observationId) && (trace.risk.rootCause === 'tool' || trace.risk.sourceSignals.includes('tool_failure') || trace.risk.sourceSignals.includes('timeout')) ? trace.risk : undefined;
    const lowScore = tool.parameterAccuracyScore !== null && tool.parameterAccuracyScore < 0.8
      ? { criterion: '参数准确度低于阈值', evidence: `参数准确 ${tool.parameterAccuracyScore.toFixed(2)} < 0.80`, action: '检查参数映射、必填字段与 schema 校验' }
      : tool.actionAlignmentScore !== null && tool.actionAlignmentScore < 0.8
        ? { criterion: '动作对齐低于阈值', evidence: `动作对齐 ${tool.actionAlignmentScore.toFixed(2)} < 0.80`, action: '复核 Tool 编排与业务动作选择' }
        : tool.selectionScore !== null && tool.selectionScore < 0.8
          ? { criterion: 'Tool 选择低于阈值', evidence: `Tool 选择 ${tool.selectionScore.toFixed(2)} < 0.80`, action: '复核触发条件与路由策略' }
          : undefined;
    const issue = tool.status === 'timeout'
      ? { criterion: '调用超时', evidence: tool.error ?? `${tool.durationMs}ms 未完成`, action: '排查依赖服务超时并配置重试或降级' }
      : tool.status === 'error'
        ? { criterion: '调用失败', evidence: tool.error ?? tool.outputSummary, action: '排查 Tool 服务、参数和错误处理' }
        : lowScore ?? (relatedRisk ? { criterion: '关联 Tool 风险', evidence: relatedRisk.diagnosis, action: relatedRisk.expectedBehavior } : undefined);
    if (!issue) return [];
    return [{ tenantId: session.tenantId, siteId: session.siteId, agentId: session.agentId, sessionId: session.sessionId, traceId: trace.traceId, traceInput: trace.input, tool, severity: relatedRisk?.riskLevel ?? (tool.status === 'success' ? 'medium' : 'high'), criterion: issue.criterion, evidence: issue.evidence, nextAction: issue.action }];
  })));
}
