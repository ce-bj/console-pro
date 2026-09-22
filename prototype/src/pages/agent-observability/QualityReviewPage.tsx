import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  RISK_CONFIG, RISK_REVIEW_STATUS_CONFIG, RISK_SOURCE_CONFIG, TOOL_TYPE_CONFIG,
  getRiskTraceRows, mockTenantListData, mockTenantMonitoringData,
} from './data';
import {
  handleCreateFaqEntry, handleFetchRiskSamples, handleRecheckKnowledgeGap, handleSubmitQualityReview,
  handleUpdateRiskSampleStatus, handleUploadKnowledgeDocument,
} from './actions';
import {
  KnowledgeGapResolutionDialog, KnowledgeGapStatusBadge, MetricCard, QualityReviewDialog, feedbackBadge, percentText,
} from './shared';
import type {
  KnowledgeGapResolution, ObservabilityTrace, RiskLevel, RiskReviewStatus, RiskSourceSignal, TimeRange,
} from './types';
import { tracePathWithReturn } from './routes';

export default function QualityReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantId = '', agentId = '' } = useParams<{ tenantId: string; agentId: string }>();
  const [searchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState<TimeRange>((searchParams.get('timeRange') as TimeRange) || '7d');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | 'all'>((searchParams.get('riskLevel') as RiskLevel | 'all') || 'all');
  const [sourceSignal, setSourceSignal] = useState<RiskSourceSignal | 'all'>((searchParams.get('sourceSignal') as RiskSourceSignal | 'all') || 'all');
  const [reviewStatus, setReviewStatus] = useState<RiskReviewStatus | 'all'>((searchParams.get('reviewStatus') as RiskReviewStatus | 'all') || 'all');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [riskRows, setRiskRows] = useState(() => getRiskTraceRows());
  const [reviewTraceId, setReviewTraceId] = useState<string | null>(searchParams.get('traceId'));
  const [knowledgeGapTraceId, setKnowledgeGapTraceId] = useState<string | null>(null);
  const alertEventId = searchParams.get('alertEventId');
  const alertRuleId = searchParams.get('alertRuleId');

  const tenant = mockTenantMonitoringData.find((item) => item.tenantId === tenantId);
  const currentAgent = tenant?.agents.find((item) => item.agentId === agentId);
  const currentTenant = mockTenantListData.find((item) => item.tenantId === tenantId);
  const agentRows = riskRows.filter((item) => item.tenantId === tenantId && item.agentId === agentId);

  const filteredQueue = useMemo(() => agentRows.filter((item) => {
    const risk = item.trace.risk;
    const query = keyword.trim().toLowerCase();
    return (riskLevel === 'all' || risk.riskLevel === riskLevel)
      && (sourceSignal === 'all' || risk.sourceSignals.includes(sourceSignal))
      && (reviewStatus === 'all' || risk.reviewStatus === reviewStatus)
      && (!alertEventId || risk.matchedAlertEventIds.includes(alertEventId))
      && (!alertRuleId || risk.matchedAlertRuleIds.includes(alertRuleId))
      && (!searchParams.get('traceId') || item.trace.traceId === searchParams.get('traceId'))
      && (!query || [item.trace.input, risk.diagnosis, risk.issueType, item.trace.traceId]
        .some((value) => value.toLowerCase().includes(query)));
  }), [agentRows, alertEventId, alertRuleId, keyword, reviewStatus, riskLevel, searchParams, sourceSignal]);

  const qualityReturnParams = new URLSearchParams();
  if (alertEventId) qualityReturnParams.set('alertEventId', alertEventId);
  if (alertRuleId) qualityReturnParams.set('alertRuleId', alertRuleId);
  if (searchParams.get('traceId')) qualityReturnParams.set('traceId', searchParams.get('traceId') ?? '');
  if (riskLevel !== 'all') qualityReturnParams.set('riskLevel', riskLevel);
  if (sourceSignal !== 'all') qualityReturnParams.set('sourceSignal', sourceSignal);
  if (reviewStatus !== 'all') qualityReturnParams.set('reviewStatus', reviewStatus);
  if (keyword.trim()) qualityReturnParams.set('keyword', keyword.trim());
  const qualityReturnTo = `${location.pathname}${qualityReturnParams.size ? `?${qualityReturnParams.toString()}` : ''}`;
  const reviewTrace = agentRows.find((item) => item.trace.traceId === reviewTraceId)?.trace ?? null;
  const knowledgeGapTrace = agentRows.find((item) => item.trace.traceId === knowledgeGapTraceId)?.trace ?? null;
  const pendingCount = agentRows.filter((item) => item.trace.risk.reviewStatus === 'pending').length;
  const downvoteCount = agentRows.filter((item) => item.trace.risk.sourceSignals.includes('downvote')).length;
  const unansweredCount = agentRows.filter((item) => item.trace.risk.sourceSignals.includes('unanswered')).length;
  const averageQuality = filteredQueue.length === 0 ? 0 : filteredQueue.reduce((total, item) => total + item.trace.risk.score, 0) / filteredQueue.length;

  function fetchQueue(next: { riskLevel?: RiskLevel | 'all'; timeRange?: TimeRange; reviewStatus?: RiskReviewStatus | 'all' }) {
    handleFetchRiskSamples({ timeRange: next.timeRange ?? timeRange, tenantId, agentId, riskLevel: next.riskLevel ?? riskLevel, reviewStatus: next.reviewStatus ?? reviewStatus, alertEventId: alertEventId ?? undefined });
  }

  function updateRisk(traceId: string, updater: (trace: ObservabilityTrace) => ObservabilityTrace) {
    setRiskRows((current) => current.map((item) => item.trace.traceId === traceId ? { ...item, trace: updater(item.trace) as typeof item.trace } : item));
  }

  function markResolved(traceId: string) {
    handleUpdateRiskSampleStatus({ traceId, status: 'resolved' });
    updateRisk(traceId, (trace) => ({ ...trace, risk: trace.risk ? { ...trace.risk, reviewStatus: 'resolved', reviewedAt: '刚刚' } : undefined }));
  }

  function resolveKnowledgeGap(traceId: string, resolution: KnowledgeGapResolution) {
    if (resolution.status === 'uploaded' && resolution.method === 'faq') handleCreateFaqEntry({ traceId, agentId, question: resolution.faqQuestion ?? '', answer: resolution.faqAnswer ?? '' });
    if (resolution.status === 'uploaded' && resolution.method === 'document') handleUploadKnowledgeDocument({ traceId, agentId, fileName: resolution.uploadedFileName ?? '' });
    if (resolution.status === 'checking') handleRecheckKnowledgeGap({ traceId, agentId });
    updateRisk(traceId, (trace) => ({
      ...trace,
      risk: trace.risk ? {
        ...trace.risk,
        knowledgeGapResolution: resolution,
        reviewStatus: resolution.status === 'resolved' ? 'resolved' : trace.risk.reviewStatus,
        reviewedAt: resolution.status === 'resolved' ? '刚刚' : trace.risk.reviewedAt,
      } : undefined,
    }));
  }

  if (!currentAgent) return <div className="min-h-full bg-gray-50 p-6"><Card><CardContent className="pt-6">未找到 Agent：{agentId}</CardContent></Card></div>;

  return <div className="min-h-full space-y-5 bg-gray-50 p-6">
    <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-gray-900">{currentAgent.agentName} · 风险样本</h1><Badge className="border-gray-900 bg-gray-900 text-white">风险 Trace 筛选</Badge>{alertEventId && <Badge className="border-rose-100 bg-rose-50 text-rose-700">告警事件筛选</Badge>}</div><p className="mt-1 max-w-4xl text-sm text-gray-500">{currentTenant?.companyName} · 风险样本不是独立数据，而是从每轮 Trace 中筛出的未回答、点踩、低分、Tool/RAG 异常、超时和告警命中记录。</p></div><div className="flex items-center gap-2"><Select value={timeRange} onValueChange={(value) => { const next = value as TimeRange; setTimeRange(next); fetchQueue({ timeRange: next }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">今天</SelectItem><SelectItem value="7d">近 7 天</SelectItem><SelectItem value="30d">近 30 天</SelectItem></SelectContent></Select><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}`)}>返回 Agent</Button></div></div>

    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><MetricCard title="待处理 Trace" value={pendingCount} hint="尚未标记解决" tone="text-orange-600" /><MetricCard title="未回答 Trace" value={unansweredCount} hint="可快捷加入 FAQ" tone="text-amber-600" /><MetricCard title="点踩 Trace" value={downvoteCount} hint="用户明确不满意" tone="text-red-600" /><MetricCard title="当前平均质量分" value={percentText(averageQuality * 100)} hint="按当前风险筛选范围" /></div>

    <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-sm">风险 Trace</CardTitle><div className="mt-1 text-xs text-gray-400">分析、质检和解决状态都属于 Trace；此处仅提供便捷筛选和处理。</div></div><div className="flex flex-wrap items-center gap-2"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="问题 / 诊断 / Trace" className="h-8 w-48 bg-white text-xs" /><Select value={sourceSignal} onValueChange={(value) => setSourceSignal(value as RiskSourceSignal | 'all')}><SelectTrigger className="h-8 w-32 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部来源</SelectItem>{Object.entries(RISK_SOURCE_CONFIG).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={reviewStatus} onValueChange={(value) => { const next = value as RiskReviewStatus | 'all'; setReviewStatus(next); fetchQueue({ reviewStatus: next }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem>{Object.entries(RISK_REVIEW_STATUS_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select><Select value={riskLevel} onValueChange={(value) => { const next = value as RiskLevel | 'all'; setRiskLevel(next); fetchQueue({ riskLevel: next }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部风险</SelectItem><SelectItem value="critical">严重</SelectItem><SelectItem value="high">高</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="low">低</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>风险 / 状态</TableHead><TableHead>用户问题 / Trace</TableHead><TableHead>来源信号</TableHead><TableHead>诊断 / 关联</TableHead><TableHead>反馈</TableHead><TableHead>发生时间</TableHead><TableHead className="text-right">处理</TableHead></TableRow></TableHeader><TableBody>{filteredQueue.length === 0 ? <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-400">当前筛选条件下没有风险 Trace。</TableCell></TableRow> : filteredQueue.map((item) => { const risk = item.trace.risk; const relatedTools = item.trace.toolObservations.filter((tool) => risk.relatedToolObservationIds.includes(tool.observationId)); return <TableRow key={item.trace.traceId}><TableCell><Badge className={RISK_CONFIG[risk.riskLevel].cls}>{RISK_CONFIG[risk.riskLevel].label}</Badge><div className="mt-2"><Badge className={RISK_REVIEW_STATUS_CONFIG[risk.reviewStatus].cls}>{RISK_REVIEW_STATUS_CONFIG[risk.reviewStatus].label}</Badge></div>{risk.rootCause === 'knowledge_base' && <div className="mt-2"><KnowledgeGapStatusBadge status={risk.knowledgeGapResolution?.status ?? 'not_started'} /></div>}</TableCell><TableCell className="max-w-[280px]"><div className="line-clamp-2 font-medium text-gray-900">{item.trace.input}</div><button className="mt-1 font-mono text-[11px] text-blue-600 hover:underline" onClick={() => navigate(tracePathWithReturn({ tenantId, agentId, sessionId: item.sessionId, traceId: item.trace.traceId }, { returnTo: qualityReturnTo, returnLabel: '返回风险样本' }))}>{item.sessionId} · {item.trace.traceId}</button></TableCell><TableCell><div className="flex max-w-[220px] flex-wrap gap-1">{risk.sourceSignals.map((signal) => <Badge key={signal} className={signal === 'alert' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>{RISK_SOURCE_CONFIG[signal]}</Badge>)}</div></TableCell><TableCell className="max-w-[300px]"><div className="text-xs leading-5 text-gray-600">{risk.diagnosis}</div><div className="mt-2 flex flex-wrap gap-1">{relatedTools.map((tool) => <Badge key={tool.observationId} className={TOOL_TYPE_CONFIG[tool.toolType].cls}>{TOOL_TYPE_CONFIG[tool.toolType].label}</Badge>)}{risk.matchedAlertEventIds.length > 0 && <Badge className="border-rose-100 bg-rose-50 text-rose-700">告警 {risk.matchedAlertEventIds.length}</Badge>}</div></TableCell><TableCell>{feedbackBadge(item.trace.userFeedback)}</TableCell><TableCell><div>{item.trace.occurredAt}</div><div className="mt-1 text-xs text-gray-400">第 {item.trace.turnSeq} 轮</div></TableCell><TableCell className="text-right"><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="outline" onClick={() => setReviewTraceId(item.trace.traceId)}>人工质检</Button>{risk.rootCause === 'knowledge_base' && <Button size="sm" variant="outline" onClick={() => setKnowledgeGapTraceId(item.trace.traceId)}>加入知识库</Button>}{risk.reviewStatus === 'pending' && <Button size="sm" onClick={() => markResolved(item.trace.traceId)}>标记解决</Button>}</div></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>

    <QualityReviewDialog trace={reviewTrace} onClose={() => setReviewTraceId(null)} onSubmit={(form) => { handleSubmitQualityReview(form); updateRisk(form.traceId, (trace) => ({ ...trace, risk: trace.risk ? { ...trace.risk, reviewScore: form.score, reviewIssueType: form.issueType, rootCause: form.rootCause, reviewComment: form.comment, reviewedAt: '刚刚' } : undefined })); }} />
    <KnowledgeGapResolutionDialog trace={knowledgeGapTrace} onClose={() => setKnowledgeGapTraceId(null)} onResolve={resolveKnowledgeGap} />
  </div>;
}
