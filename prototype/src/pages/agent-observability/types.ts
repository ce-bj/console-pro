export type TimeRange = 'today' | '7d' | '30d';
export type TenantStatus = 'healthy' | 'warning' | 'risk';
export type TenantInvocationType = 'tool' | 'rag';
export type TenantListSortKey = 'priority' | 'companyName' | 'sessionCount' | 'requestSuccessRate' | 'p95ResponseDurationSec' | 'satisfactionRate' | 'toolSuccessRate' | 'ragHitRate' | 'riskCount' | 'lastActiveAt';
export type SortDirection = 'asc' | 'desc';
export type PortalStatus = 'online' | 'paused' | 'risk';
export type AgentStatus = 'healthy' | 'warning' | 'risk';
export type ToolType = 'rag_search' | 'request_handoff' | 'lead_capture_form' | 'crm_write' | 'create_ticket' | 'agent_call';
export type TurnStatus = 'success' | 'warning' | 'error';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type EvalStatus = 'passed' | 'blocked' | 'running';
export type AlertStatus = 'enabled' | 'disabled';
export type AlertScope = 'platform' | 'tenant' | 'agent' | 'tool';
export type RootCause = 'knowledge_base' | 'prompt' | 'model' | 'tool' | 'business_config' | 'operator';
export type RiskSourceSignal = 'unanswered' | 'downvote' | 'low_score' | 'tool_failure' | 'rag_no_hit' | 'timeout' | 'alert' | 'manual';
export type RiskReviewStatus = 'pending' | 'resolved';
export type AlertEventStatus = 'open' | 'acknowledged' | 'recovered';

export interface PlatformAgentStats {
  totalTenants: number;
  totalPortalSites: number;
  totalAgents: number;
  totalSessionCount: number;
  totalTurnCount: number;
  avgResponseDurationSec: number;
  avgFirstResponseMs: number;
  avgModelTimeToFirstTokenMs: number;
  avgSatisfactionRate: number;
  feedbackCoverageRate: number;
  avgToolSuccessRate: number;
  errorRate: number;
  p95ResponseDurationSec: number;
  modelCost: number;
  riskTenantCount: number;
  riskSampleCount: number;
  totalToolCallCount: number;
  avgToolCallsPerTurn: number;
  avgToolLatencyMs: number;
}

export interface TenantListItem {
  tenantId: string;
  companyName: string;
  industry: string;
  plan: string;
  status: TenantStatus;
  portalSiteCount: number;
  agentCount: number;
  sessionCount: number;
  turnCount: number;
  avgRounds: number;
  avgResponseDurationSec: number;
  firstResponseMs: number;
  errorRate: number;
  p95ResponseDurationSec: number;
  modelCost: number;
  satisfactionRate: number;
  toolSuccessRate: number;
  ragHitRate: number;
  riskCount: number;
  lastActiveAt: string;
}

export interface PortalSiteItem {
  tenantId: string;
  siteId: string;
  siteName: string;
  domain: string;
  language: string;
  region: string;
  status: PortalStatus;
  agentCount: number;
  turnCount: number;
  satisfactionRate: number;
  ragHitRate: number;
  toolSuccessRate: number;
}

export interface AgentListItem {
  tenantId: string;
  siteId: string;
  agentId: string;
  agentName: string;
  agentType: string;
  status: AgentStatus;
  model: string;
  kbVersion: string;
  sessionCount: number;
  turnCount: number;
  avgRounds: number;
  avgResponseDurationSec: number;
  firstResponseMs: number;
  modelTimeToFirstTokenMs: number;
  errorRate: number;
  p95ResponseDurationSec: number;
  modelCost: number;
  satisfactionRate: number;
  thumbsUp: number;
  thumbsDown: number;
  toolCallCount: number;
  toolSuccessRate: number;
  ragCallRate: number;
  ragHitRate: number;
  leadTriggerRate: number;
  leadCompletionRate: number;
  handoffRate: number;
  riskCount: number;
  lastActiveAt: string;
}

export interface ToolMetricItem {
  tenantId: string;
  siteId: string;
  agentId: string;
  toolType: ToolType;
  toolName: string;
  callCount: number;
  avgCallsPerTurn: number;
  successRate: number;
  avgLatencyMs: number;
  correctnessScore: number;
  argsQualityScore: number;
  businessMetric: string;
}

export interface ConversationTurn {
  tenantId: string;
  siteId: string;
  agentId: string;
  turnId: string;
  sessionId: string;
  turnSeq?: number;
  occurredAt?: string;
  userInput: string;
  agentReply: string;
  demandType: string;
  ragCalled: boolean;
  ragHitCount: number;
  toolCount: number;
  firstResponseMs: number;
  totalDurationMs?: number;
  modelTtftMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  userFeedback: 'up' | 'down' | 'none';
  status: TurnStatus;
  traceUrl: string;
  overallQualityScore: number;
  rootCause?: RootCause;
}

export interface KnowledgeQualityItem {
  tenantId: string;
  siteId: string;
  agentId: string;
  id: string;
  query: string;
  category: string;
  ragCalledWhenNeeded: boolean;
  queryQuality: number;
  hitCount: number;
  topDoc: string | null;
  chunkId: string | null;
  groundedness: number;
  kbVersion: string;
  status: 'gap' | 'low_relevance' | 'healthy';
  affectedTurns: number;
}

export interface EvalRun {
  tenantId: string;
  siteId: string;
  agentId: string;
  runId: string;
  name: string;
  dataset: string;
  targetVersion: string;
  status: EvalStatus;
  contextRelevance: number;
  conciseness: number;
  groundedness: number;
  toolCorrectness: number;
  overallScore: number;
  failedSamples: number;
  startedAt: string;
}

export interface EvaluatorConfigItem {
  tenantId: string;
  siteId: string;
  agentId: string;
  id: string;
  name: string;
  scope: string;
  trigger: string;
  threshold: number;
  status: 'enabled' | 'disabled';
}

export interface AlertRule {
  tenantId: string;
  siteId: string;
  agentId: string;
  id: string;
  name: string;
  metricName: string;
  threshold: string;
  scope: AlertScope;
  scopeLabel: string;
  window: string;
  condition: string;
  notificationTarget: string;
  recoveryCondition: string;
  status: AlertStatus;
  owner: string;
  lastTriggeredAt: string | null;
}

export interface AlertEvent {
  eventId: string;
  ruleId: string;
  tenantId: string;
  siteId: string;
  agentId: string;
  toolType?: ToolType;
  metricName: string;
  observedValue: string;
  threshold: string;
  window: string;
  scopeLabel: string;
  status: AlertEventStatus;
  summary: string;
  notificationTarget: string;
  matchedTraceIds: string[];
  triggeredAt: string;
  acknowledgedAt?: string;
  recoveredAt?: string;
}

export interface QualityReviewInput {
  traceId: string;
  score: number;
  issueType: string;
  rootCause: RootCause;
  comment: string;
}

// Customer monitoring uses a small shared runtime contract plus scorecards that
// are intentionally different for customer service and content operations.
export type AgentKind = 'customer_service' | 'operations_assistant';
export type Environment = 'production' | 'staging';
export type ReleaseGateStatus = 'passed' | 'blocked' | 'running';

export interface ReleaseGateCriterion {
  key: string;
  label: string;
  baseline: number | null;
  target: number | null;
  thresholdLabel: string;
  status: 'passed' | 'blocked' | 'not_applicable';
  reason?: string;
}

export interface ReleaseGate {
  status: ReleaseGateStatus;
  baselineVersion: string;
  targetVersion: string;
  sampleCount: number;
  severeFailureCount: number;
  conclusion: string;
  criteria: ReleaseGateCriterion[];
}

export interface SharedAgentMetrics {
  sessionCount: number;
  turnCount: number;
  averageTurnsPerSession?: number;
  requestSuccessRate: number;
  errorRate: number;
  timeoutRate?: number;
  firstResponseMs: number;
  averageResponseMs?: number;
  p95ResponseMs: number;
  modelTtftMs?: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  costPerRequest: number;
  satisfactionRate: number;
  thumbsUpCount?: number;
  thumbsDownCount?: number;
  feedbackTraceCount?: number;
  completedTraceCount?: number;
  feedbackCoverageRate: number;
  taskSuccessScore: number;
  correctnessScore: number;
  relevanceScore: number;
  availableToolCount?: number;
  calledToolCount?: number;
  toolCallCount: number;
  toolFailureCount?: number;
  toolSuccessRate: number;
  ragCallCount?: number;
  ragHitObservationCount?: number;
  averageRagHitCount?: number;
  ragNoHitCount?: number;
  ragQueryQualityScore?: number | null;
  contextRelevanceScore?: number | null;
  ragCallRate: number | null;
  ragHitRate: number | null;
  groundednessScore: number | null;
  evaluatedTraceCount: number;
  evaluationCoverageRate: number;
  riskTraceCount: number;
}

export interface CustomerServiceScorecard {
  kind: 'customer_service';
  contextMemoryScore: number;
  clarificationQualityScore: number;
  toolSelectionScore: number;
  toolParameterAccuracyScore: number;
  handoffReasonablenessScore: number;
  leadTriggerReasonablenessScore: number;
  resolutionRate: number;
  handoffRate: number;
  leadTriggerRate: number;
  leadCompletionRate: number;
}

export interface OperationsAssistantScorecard {
  kind: 'operations_assistant';
  instructionFollowingScore: number;
  completenessScore: number;
  styleAlignmentScore: number;
  formatComplianceScore: number;
  hallucinationRiskScore: number;
  firstDraftAdoptionRate: number;
  averageRevisionCount: number;
  humanEditMagnitude: number;
  publishOrConversionRate: number;
}

export interface EvaluationMetricDescriptor {
  id: string;
  code: string;
  name: string;
  nameZh: string;
  description: string;
}

export interface EvaluationMetricGroup {
  id: string;
  code: string;
  name: string;
  nameZh: string;
  appliesTo: 'all' | AgentKind;
  metrics: EvaluationMetricDescriptor[];
}

export interface AgentMonitoringRecord {
  tenantId: string;
  siteId: string;
  agentId: string;
  agentName: string;
  agentTypeLabel: string;
  kind: AgentKind;
  status: AgentStatus;
  owner: string;
  environment: Environment;
  versions: {
    agent: string;
    baselineAgent: string;
    prompt: string;
    model: string;
    toolset: string;
    knowledgeBase: string | null;
  };
  metrics: SharedAgentMetrics;
  scorecard: CustomerServiceScorecard | OperationsAssistantScorecard;
  releaseGate: ReleaseGate;
}

export interface TenantMonitoringItem {
  tenantId: string;
  companyName: string;
  industry: string;
  plan: string;
  customerOwner: string;
  monitoredSince: string;
  langfuseProject: string;
  agents: AgentMonitoringRecord[];
}

export type MetricCategory = 'runtime' | 'latency' | 'cost' | 'feedback' | 'quality' | 'tool' | 'rag' | 'business' | 'gate';
export type MetricScope = 'platform' | 'tenant' | 'agent' | 'trace' | 'generation' | 'tool_observation' | 'retriever_observation';
export type MetricDirection = 'higher_better' | 'lower_better' | 'neutral';
export type MetricStatus = 'healthy' | 'warning' | 'risk' | 'not_evaluated';

export interface MetricDefinition {
  code: string;
  name: string;
  nameZh: string;
  category: MetricCategory;
  scope: MetricScope;
  unit: 'count' | 'percent' | 'milliseconds' | 'seconds' | 'score' | 'tokens' | 'currency';
  direction: MetricDirection;
  description: string;
  formula: string;
  numeratorLabel?: string;
  denominatorLabel?: string;
  caveats: string[];
}

export interface MetricValueSnapshot {
  metricCode: string;
  value: number | null;
  numerator?: number;
  denominator?: number;
  sampleCount?: number;
  coverageRate?: number;
  thresholdLabel?: string;
  status: MetricStatus;
}

export interface MetricContribution {
  metricCode: string;
  tenantId: string;
  siteId: string;
  agentId: string;
  sessionId: string;
  traceId: string;
  turnSeq: number;
  occurredAt: string;
  contributionValue: number | null;
  contributionLabel: string;
  included: boolean;
  exclusionReason?: string;
}

export interface AgentToolCapability {
  tenantId: string;
  siteId: string;
  agentId: string;
  toolName: string;
  toolType: ToolType;
  version: string;
  enabled: boolean;
  description: string;
}

export interface ObservationScore {
  code: string;
  name: string;
  value: number | null;
  scope: MetricScope;
  reason: string;
  rawScore?: number | boolean;
  scoreRange?: string;
  graderVersion?: string;
  rubricVersion?: string;
  judgeModel?: string;
}

export interface GenerationObservation {
  observationId: string;
  model: string;
  promptVersion: string;
  status: 'success' | 'error' | 'timeout';
  firstTokenMs: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface ToolObservation {
  observationId: string;
  traceId: string;
  toolName: string;
  toolType: ToolType;
  version: string;
  inputSummary: string;
  outputSummary: string;
  status: 'success' | 'error' | 'timeout';
  error?: string;
  durationMs: number;
  selectionScore: number | null;
  actionAlignmentScore: number | null;
  successScore: number | null;
  parameterAccuracyScore: number | null;
  targetAgentId?: string;
  targetAgentName?: string;
  childSessionId?: string;
  childTraceId?: string;
}

export interface RetrieverHit {
  docId: string;
  chunkId: string;
  score: number;
  title: string;
}

export interface RetrieverObservation {
  observationId: string;
  traceId: string;
  query: string;
  topK: number;
  filters: Record<string, string>;
  kbVersion: string;
  hitCount: number;
  hits: RetrieverHit[];
  queryQualityScore: number | null;
  contextRelevanceScore: number | null;
  groundednessScore: number | null;
}

export type KnowledgeGapResolutionStatus = 'not_started' | 'uploaded' | 'checking' | 'resolved' | 'unresolved';
export type KnowledgeGapResolutionMethod = 'faq' | 'document';

export interface KnowledgeGapResolution {
  status: KnowledgeGapResolutionStatus;
  method?: KnowledgeGapResolutionMethod;
  uploadedFileName?: string;
  faqQuestion?: string;
  faqAnswer?: string;
  uploadedAt?: string;
  recheckedAt?: string;
  recheckSummary?: string;
  recheckGroundednessScore?: number | null;
}

export interface TraceRiskAnalysis {
  riskLevel: RiskLevel;
  issueType: string;
  diagnosis: string;
  scoreName: string;
  score: number;
  customerImpact: string;
  expectedBehavior: string;
  sourceSignals: RiskSourceSignal[];
  relatedToolObservationIds: string[];
  matchedAlertRuleIds: string[];
  matchedAlertEventIds: string[];
  reviewStatus: RiskReviewStatus;
  reviewedAt?: string;
  reviewScore?: number;
  reviewIssueType?: string;
  reviewComment?: string;
  rootCause?: RootCause;
  knowledgeGapResolution?: KnowledgeGapResolution;
}

export interface ObservabilityTrace {
  traceId: string;
  turnSeq: number;
  loopCount: number;
  occurredAt: string;
  input: string;
  output: string;
  status: 'completed' | 'error' | 'timeout';
  firstResponseMs: number;
  totalDurationMs: number;
  userFeedback: 'up' | 'down' | 'none';
  traceUrl: string;
  versions: AgentMonitoringRecord['versions'];
  generation: GenerationObservation;
  toolObservations: ToolObservation[];
  retrieverObservations: RetrieverObservation[];
  scores: ObservationScore[];
  risk?: TraceRiskAnalysis;
}

export interface ObservabilitySession {
  sessionId: string;
  userId: string;
  summary?: string;
  tenantId: string;
  siteId: string;
  agentId: string;
  environment: Environment;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'error' | 'timeout';
  turns: ObservabilityTrace[];
}

export interface TenantEvaluationRun {
  runId: string;
  tenantId: string;
  agentId: string;
  agentName: string;
  datasetName: string;
  baselineVersion: string;
  targetVersion: string;
  status: ReleaseGateStatus;
  sampleCount: number;
  severeFailureCount: number;
  conclusion: string;
  startedAt: string;
}
