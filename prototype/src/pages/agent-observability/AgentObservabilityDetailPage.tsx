import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AGENT_STATUS_CONFIG,
  mockAgentToolCapabilities,
  mockObservabilitySessions,
  mockTenantMonitoringData,
} from './data';
import { ObservabilityRetentionNotice, feedbackBadge, percentText, scoreText } from './shared';
import type { ObservationScore, ObservabilityTrace, ToolType, TimeRange } from './types';

type RagFilter = 'all' | 'called' | 'hit' | 'no_hit' | 'not_called';
type FeedbackFilter = 'all' | 'up' | 'down' | 'none';

function resolveTraceScore(trace: ObservabilityTrace): ObservationScore | undefined {
  return trace.scores.find((item) => item.code === 'task_success')
    ?? trace.scores.find((item) => item.scope === 'trace' && item.value !== null);
}

function sessionSummary(session: (typeof mockObservabilitySessions)[number]) {
  if (session.summary) return session.summary;
  const traces = [...session.turns].sort((a, b) => a.turnSeq - b.turnSeq);
  return `${traces[0]?.input ?? '—'} / ${traces.at(-1)?.output ?? '—'}`;
}

export default function AgentObservabilityDetailPage() {
  const { tenantId = '', agentId = '' } = useParams<{ tenantId: string; agentId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [toolType, setToolType] = useState<ToolType | 'all'>('all');
  const [ragStatus, setRagStatus] = useState<RagFilter>('all');
  const [feedback, setFeedback] = useState<FeedbackFilter>('all');
  const [keyword, setKeyword] = useState('');

  const tenant = mockTenantMonitoringData.find((item) => item.tenantId === tenantId);
  const agent = tenant?.agents.find((item) => item.agentId === agentId);
  const sessions = mockObservabilitySessions.filter((item) => item.tenantId === tenantId && item.agentId === agentId);
  const toolOptions = mockAgentToolCapabilities.filter((item) => item.agentId === agentId && item.enabled);

  useEffect(() => {
    const linkedSessionId = searchParams.get('sessionId');
    const linkedTraceId = searchParams.get('traceId');
    if (!linkedSessionId) return;
    const base = `/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/sessions/${linkedSessionId}`;
    navigate(linkedTraceId ? `${base}/traces/${linkedTraceId}` : base, { replace: true });
  }, [agentId, navigate, searchParams, tenantId]);

  const rows = useMemo(() => sessions.map((session) => {
    const traces = [...session.turns].sort((a, b) => a.turnSeq - b.turnSeq);
    const traceMatches = traces.map((trace) => {
      const selectedScore = resolveTraceScore(trace);
      const retriever = trace.retrieverObservations[0];
      const review = trace.userFeedback === 'down' || (selectedScore?.value ?? 1) < 0.7;
      const query = keyword.trim().toLowerCase();
      const delegatedNames = trace.toolObservations.flatMap((item) => [item.targetAgentName ?? '', item.toolName]);
      const keywordMatched = !query || [session.sessionId, session.userId, sessionSummary(session), trace.traceId, trace.input, trace.output, ...delegatedNames]
        .some((value) => value.toLowerCase().includes(query));
      const toolMatched = toolType === 'all' || trace.toolObservations.some((item) => item.toolType === toolType);
      const ragMatched = ragStatus === 'all'
        || (ragStatus === 'called' && retriever !== undefined)
        || (ragStatus === 'hit' && (retriever?.hitCount ?? 0) > 0)
        || (ragStatus === 'no_hit' && retriever?.hitCount === 0)
        || (ragStatus === 'not_called' && retriever === undefined);
      const feedbackMatched = feedback === 'all' || trace.userFeedback === feedback;
      return { trace, selectedScore, review, matched: keywordMatched && toolMatched && ragMatched && feedbackMatched };
    });
    const allTools = traces.flatMap((trace) => trace.toolObservations);
    const allRetrievers = traces.flatMap((trace) => trace.retrieverObservations);
    const qualityScores = traces
      .map((trace) => resolveTraceScore(trace)?.value)
      .filter((value): value is number => value !== null && value !== undefined);
    const feedbackTraces = traces.filter((trace) => trace.userFeedback !== 'none');
    return {
      session,
      matched: traceMatches.some((item) => item.matched),
      summary: sessionSummary(session),
      totalDurationMs: traces.reduce((total, trace) => total + trace.totalDurationMs, 0),
      averageQuality: qualityScores.length ? qualityScores.reduce((total, value) => total + value, 0) / qualityScores.length : null,
      reviewCount: traceMatches.filter((item) => item.review).length,
      toolCount: allTools.length,
      agentCallCount: allTools.filter((item) => item.toolType === 'agent_call').length,
      ragCallCount: allRetrievers.length,
      ragHitCount: allRetrievers.filter((item) => item.hitCount > 0).length,
      feedbackSummary: feedbackTraces.length === 0
        ? 'none' as const
        : traces.some((trace) => trace.userFeedback === 'down') ? 'down' as const : 'up' as const,
    };
  }).filter((row) => row.matched), [feedback, keyword, ragStatus, sessions, toolType]);

  if (!tenant || !agent) {
    return <div className="min-h-full bg-slate-50 p-6"><Card><CardContent className="py-10 text-center"><div className="text-sm font-medium text-slate-800">当前 Agent 尚未接入深度监测</div><Button className="mt-4" size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}`)}>返回客户监控</Button></CardContent></Card></div>;
  }

  return <div className="min-h-full bg-slate-50 p-6"><div className="mx-auto max-w-[1700px] space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold text-slate-950">{agent.agentName} · Session</h1><Badge className={AGENT_STATUS_CONFIG[agent.status].cls}>{AGENT_STATUS_CONFIG[agent.status].label}</Badge></div>
        <p className="mt-1 text-sm text-slate-500">{tenant.companyName} · 按 Session 查看会话质量、Tool、子 Agent、知识库调用和用户反馈。</p>
      </div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}`)}>返回客户</Button><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/quality-reviews`)}>会话质检</Button><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/alerts`)}>告警治理</Button></div>
    </header>

    <Card className="overflow-hidden"><CardContent className="grid grid-cols-2 p-0 md:grid-cols-5 xl:grid-cols-10">{[
      ['Session', agent.metrics.sessionCount.toLocaleString(), '会话总量'],
      ['Trace', agent.metrics.turnCount.toLocaleString(), '交互轮次'],
      ['请求成功率', percentText(agent.metrics.requestSuccessRate), `错误 ${percentText(agent.metrics.errorRate)}`],
      ['P95 响应', `${(agent.metrics.p95ResponseMs / 1000).toFixed(1)}s`, `首响 ${agent.metrics.firstResponseMs}ms`],
      ['用户满意率', percentText(agent.metrics.satisfactionRate), `覆盖 ${percentText(agent.metrics.feedbackCoverageRate)}`],
      ['任务达成', scoreText(agent.metrics.taskSuccessScore), `已评 ${agent.metrics.evaluatedTraceCount} 条`],
      ['事实正确', scoreText(agent.metrics.correctnessScore), `相关性 ${scoreText(agent.metrics.relevanceScore)}`],
      ['Tool 成功率', percentText(agent.metrics.toolSuccessRate), `${agent.metrics.toolCallCount.toLocaleString()} 次调用`],
      ['知识库命中率', agent.metrics.ragHitRate === null ? '—' : percentText(agent.metrics.ragHitRate), agent.metrics.ragCallRate === null ? '未使用' : `调用率 ${percentText(agent.metrics.ragCallRate)}`],
      ['风险 Trace', agent.metrics.riskTraceCount.toLocaleString(), '需要复盘'],
    ].map(([label, value, helper]) => <div key={label} className="border-b border-r border-slate-100 px-4 py-3 xl:border-b-0"><div className="text-[11px] text-slate-400">{label}</div><div className="mt-1 text-lg font-semibold text-slate-900">{value}</div><div className="mt-1 text-[11px] text-slate-400">{helper}</div></div>)}</CardContent></Card>

    <Card><CardHeader className="border-b border-slate-100 pb-3"><div><CardTitle className="text-base">质量与业务结果</CardTitle><p className="mt-1 text-xs text-slate-500">保留当前智能体的关键质量和业务指标，不展示版本、Prompt、模型或知识库配置信息。</p></div></CardHeader><CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{(agent.scorecard.kind === 'customer_service' ? [
      ['上下文记忆', scoreText(agent.scorecard.contextMemoryScore)],
      ['澄清质量', scoreText(agent.scorecard.clarificationQualityScore)],
      ['Tool 选择', scoreText(agent.scorecard.toolSelectionScore)],
      ['Tool 参数准确', scoreText(agent.scorecard.toolParameterAccuracyScore)],
      ['转人工合理性', scoreText(agent.scorecard.handoffReasonablenessScore)],
      ['留资触发合理性', scoreText(agent.scorecard.leadTriggerReasonablenessScore)],
      ['问题解决率', percentText(agent.scorecard.resolutionRate)],
      ['转人工率', percentText(agent.scorecard.handoffRate)],
      ['留资触发率', percentText(agent.scorecard.leadTriggerRate)],
      ['留资完成率', percentText(agent.scorecard.leadCompletionRate)],
    ] : [
      ['指令遵循', scoreText(agent.scorecard.instructionFollowingScore)],
      ['内容完整', scoreText(agent.scorecard.completenessScore)],
      ['风格一致', scoreText(agent.scorecard.styleAlignmentScore)],
      ['格式合规', scoreText(agent.scorecard.formatComplianceScore)],
      ['幻觉风险', scoreText(agent.scorecard.hallucinationRiskScore)],
      ['首稿采用率', percentText(agent.scorecard.firstDraftAdoptionRate)],
      ['平均修改次数', `${agent.scorecard.averageRevisionCount.toFixed(1)} 次`],
      ['人工修改幅度', percentText(agent.scorecard.humanEditMagnitude)],
      ['发布 / 转化率', percentText(agent.scorecard.publishOrConversionRate)],
    ]).map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"><div className="text-[11px] text-slate-400">{label}</div><div className="mt-1 text-base font-semibold text-slate-800">{value}</div></div>)}</CardContent></Card>

    <ObservabilityRetentionNotice />

    <Card><CardHeader className="border-b border-slate-100 pb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">Session 列表</CardTitle><p className="mt-1 text-xs text-slate-500">查看某个 Session 后进入每轮 Trace 明细，不在当前页面展开。</p></div><span className="text-xs text-slate-400">{rows.length} 个 Session</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">今天</SelectItem><SelectItem value="7d">近 7 天</SelectItem><SelectItem value="30d">近 30 天</SelectItem></SelectContent></Select><Select value={toolType} onValueChange={(value) => setToolType(value as ToolType | 'all')}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部 Tool</SelectItem>{toolOptions.map((item) => <SelectItem key={`${item.toolType}-${item.toolName}`} value={item.toolType}>{item.toolName}</SelectItem>)}</SelectContent></Select><Select value={ragStatus} onValueChange={(value) => setRagStatus(value as RagFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部知识库调用</SelectItem><SelectItem value="called">已调用</SelectItem><SelectItem value="hit">已命中</SelectItem><SelectItem value="no_hit">未命中</SelectItem><SelectItem value="not_called">未调用</SelectItem></SelectContent></Select><Select value={feedback} onValueChange={(value) => setFeedback(value as FeedbackFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部反馈</SelectItem><SelectItem value="up">点赞</SelectItem><SelectItem value="down">点踩</SelectItem><SelectItem value="none">未反馈</SelectItem></SelectContent></Select><Input className="h-8 bg-white text-xs" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Session / 用户 / 内容 / 子 Agent" /></div></CardHeader>
      <CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[1450px]"><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>创建时间</TableHead><TableHead>会话摘要</TableHead><TableHead>耗时</TableHead><TableHead>用户 ID</TableHead><TableHead>交互轮数</TableHead><TableHead>质量</TableHead><TableHead>Tool / 子 Agent</TableHead><TableHead>知识库</TableHead><TableHead>反馈</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{rows.length === 0 ? <TableRow><TableCell colSpan={11} className="py-12 text-center text-slate-400">当前筛选条件下没有 Session。</TableCell></TableRow> : rows.map((row) => <TableRow key={row.session.sessionId}><TableCell className="font-mono text-[11px] text-slate-700">{row.session.sessionId}</TableCell><TableCell className="whitespace-nowrap text-xs text-slate-600">{row.session.startedAt}</TableCell><TableCell className="max-w-[320px]"><div className="line-clamp-2 text-sm text-slate-800">{row.summary}</div></TableCell><TableCell className="whitespace-nowrap text-xs">{row.totalDurationMs.toLocaleString()}ms</TableCell><TableCell className="font-mono text-xs text-slate-600">{row.session.userId}</TableCell><TableCell>{row.session.turns.length} 轮</TableCell><TableCell><div className="font-semibold">{row.averageQuality === null ? '未评估' : scoreText(row.averageQuality)}</div><div className="mt-1 text-xs text-amber-700">{row.reviewCount} 条待复盘</div></TableCell><TableCell><div>{row.toolCount} 次调用</div><div className="mt-1 text-xs text-cyan-700">子 Agent {row.agentCallCount} 次</div></TableCell><TableCell><div>调用 {row.ragCallCount} 次</div><div className="mt-1 text-xs text-slate-500">命中 {row.ragHitCount} 次</div></TableCell><TableCell>{feedbackBadge(row.feedbackSummary)}</TableCell><TableCell className="sticky right-0 bg-white text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled title="暂未开放对话工作台跳转">跳转至对话</Button><Button size="sm" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/sessions/${row.session.sessionId}`)}>查看</Button></div></TableCell></TableRow>)}</TableBody></Table></div></CardContent>
    </Card>
  </div></div>;
}
