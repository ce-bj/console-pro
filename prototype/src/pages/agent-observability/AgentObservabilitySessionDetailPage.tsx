import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockObservabilitySessions, mockTenantMonitoringData } from './data';
import { ObservabilityRetentionNotice, feedbackBadge, scoreText } from './shared';
import { tracePathWithReturn } from './routes';
import type { ObservationScore, ObservabilityTrace, ToolType } from './types';

type TraceStatusFilter = 'all' | 'completed' | 'error' | 'timeout' | 'review';
type QualityFilter = 'all' | 'high' | 'medium' | 'low' | 'not_evaluated';
type RagFilter = 'all' | 'hit' | 'no_hit' | 'not_called' | 'failed';
type FeedbackFilter = 'all' | 'up' | 'down' | 'none';

function resolveScore(trace: ObservabilityTrace, scoreCode: string): ObservationScore | undefined {
  return trace.scores.find((item) => item.code === scoreCode);
}

function statusBadge(trace: ObservabilityTrace) {
  const taskScore = resolveScore(trace, 'task_success')?.value;
  if (trace.status === 'error') return <Badge className="border-rose-100 bg-rose-50 text-rose-700">异常</Badge>;
  if (trace.status === 'timeout') return <Badge className="border-amber-100 bg-amber-50 text-amber-700">超时</Badge>;
  if (trace.userFeedback === 'down' || (taskScore ?? 1) < 0.7) return <Badge className="border-amber-100 bg-amber-50 text-amber-700">待复盘</Badge>;
  return <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">成功</Badge>;
}

export default function AgentObservabilitySessionDetailPage() {
  const { tenantId = '', agentId = '', sessionId = '' } = useParams<{ tenantId: string; agentId: string; sessionId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TraceStatusFilter>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [toolFilter, setToolFilter] = useState<ToolType | 'all'>('all');
  const [ragFilter, setRagFilter] = useState<RagFilter>('all');
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all');
  const [keyword, setKeyword] = useState('');
  const tenant = mockTenantMonitoringData.find((item) => item.tenantId === tenantId);
  const agent = tenant?.agents.find((item) => item.agentId === agentId);
  const session = mockObservabilitySessions.find((item) => item.tenantId === tenantId && item.agentId === agentId && item.sessionId === sessionId);

  if (!tenant || !agent || !session) {
    return <div className="min-h-full bg-slate-50 p-6"><Card><CardContent className="py-10 text-center"><div className="text-sm font-medium text-slate-800">未找到该 Session</div><Button className="mt-4" size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}`)}>返回 Session 列表</Button></CardContent></Card></div>;
  }

  const traces = [...session.turns].sort((a, b) => a.turnSeq - b.turnSeq);
  const taskScores = traces.map((trace) => resolveScore(trace, 'task_success')?.value).filter((value): value is number => value !== null && value !== undefined);
  const quality = taskScores.length ? taskScores.reduce((total, value) => total + value, 0) / taskScores.length : null;
  const tools = traces.flatMap((trace) => trace.toolObservations);
  const retrievers = traces.flatMap((trace) => trace.retrieverObservations);
  const totalDuration = traces.reduce((total, trace) => total + trace.totalDurationMs, 0);
  const summary = session.summary ?? `${traces[0]?.input ?? '—'} / ${traces.at(-1)?.output ?? '—'}`;
  const sessionFeedback = traces.some((trace) => trace.userFeedback === 'down') ? 'down' : traces.some((trace) => trace.userFeedback === 'up') ? 'up' : 'none';
  const toolOptions = Array.from(new Map(traces.flatMap((trace) => trace.toolObservations).map((tool) => [tool.toolType, tool.toolName])).entries());
  const filteredTraces = traces.filter((trace) => {
    const score = resolveScore(trace, 'task_success') ?? trace.scores.find((item) => item.scope === 'trace' && item.value !== null);
    const review = trace.userFeedback === 'down' || (score?.value ?? 1) < 0.7;
    const ragTools = trace.toolObservations.filter((item) => item.toolType === 'rag_search');
    const hasRagFailure = ragTools.some((item) => item.status === 'error' || item.status === 'timeout');
    const retrievers = trace.retrieverObservations;
    const statusMatched = statusFilter === 'all' || statusFilter === trace.status || (statusFilter === 'review' && review);
    const qualityMatched = qualityFilter === 'all'
      || (qualityFilter === 'not_evaluated' && score?.value == null)
      || (qualityFilter === 'high' && (score?.value ?? -1) >= 0.85)
      || (qualityFilter === 'medium' && (score?.value ?? -1) >= 0.7 && (score?.value ?? -1) < 0.85)
      || (qualityFilter === 'low' && score?.value != null && score.value < 0.7);
    const toolMatched = toolFilter === 'all' || trace.toolObservations.some((item) => item.toolType === toolFilter);
    const ragMatched = ragFilter === 'all'
      || (ragFilter === 'failed' && hasRagFailure)
      || (ragFilter === 'hit' && retrievers.some((item) => item.hitCount > 0))
      || (ragFilter === 'no_hit' && retrievers.some((item) => item.hitCount === 0))
      || (ragFilter === 'not_called' && retrievers.length === 0 && ragTools.length === 0);
    const feedbackMatched = feedbackFilter === 'all' || trace.userFeedback === feedbackFilter;
    const query = keyword.trim().toLowerCase();
    const keywordMatched = !query || [trace.traceId, trace.input, trace.output, ...trace.toolObservations.map((item) => item.targetAgentName ?? item.toolName)]
      .some((value) => value.toLowerCase().includes(query));
    return statusMatched && qualityMatched && toolMatched && ragMatched && feedbackMatched && keywordMatched;
  });

  return <div className="min-h-full bg-slate-50 p-6"><div className="mx-auto max-w-[1900px] space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs text-slate-400"><button className="hover:text-blue-600" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}`)}>{tenant.companyName}</button><span className="px-2">/</span><button className="hover:text-blue-600" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}`)}>{agent.agentName} Session</button><span className="px-2">/</span><span>{session.sessionId}</span></div><h1 className="mt-2 text-xl font-semibold text-slate-950">Session 详情</h1><p className="mt-1 text-sm text-slate-500">按对话轮次查看 Trace 的状态、评分、循环、Tool、子 Agent 和知识库证据。</p></div><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}`)}>返回 Session 列表</Button></header>

    <ObservabilityRetentionNotice />

    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Session 信息</CardTitle></CardHeader><CardContent className="grid gap-x-6 gap-y-4 text-xs sm:grid-cols-2 lg:grid-cols-5"><div><span className="block text-slate-400">Session ID</span><strong className="mt-1 block break-all font-mono text-slate-700">{session.sessionId}</strong></div><div><span className="block text-slate-400">创建时间</span><strong className="mt-1 block text-slate-700">{session.startedAt}</strong></div><div><span className="block text-slate-400">完成时间</span><strong className="mt-1 block text-slate-700">{session.completedAt ?? '进行中'}</strong></div><div><span className="block text-slate-400">用户 ID</span><strong className="mt-1 block font-mono text-slate-700">{session.userId}</strong></div><div><span className="block text-slate-400">交互轮数</span><strong className="mt-1 block text-slate-700">{traces.length} 轮</strong></div><div className="sm:col-span-2"><span className="block text-slate-400">会话摘要</span><strong className="mt-1 block leading-5 text-slate-700">{summary}</strong></div><div><span className="block text-slate-400">总耗时</span><strong className="mt-1 block text-slate-700">{totalDuration.toLocaleString()}ms</strong></div><div><span className="block text-slate-400">聚合质量</span><strong className="mt-1 block text-slate-700">{quality === null ? '未评估' : scoreText(quality)}</strong></div><div><span className="block text-slate-400">反馈</span><div className="mt-1">{feedbackBadge(sessionFeedback)}</div></div><div><span className="block text-slate-400">Tool / 子 Agent</span><strong className="mt-1 block text-slate-700">{tools.length} 次 / {tools.filter((item) => item.toolType === 'agent_call').length} 次</strong></div><div><span className="block text-slate-400">知识库</span><strong className="mt-1 block text-slate-700">调用 {retrievers.length} 次 · 命中 {retrievers.filter((item) => item.hitCount > 0).length} 次</strong></div></CardContent></Card>

    <Card><CardHeader className="border-b border-slate-100 pb-4"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">每轮 Trace</CardTitle><p className="mt-1 text-xs text-slate-500">筛选项与当前 Trace 表字段对应；细分评分项请进入 Trace 详情查看。</p></div><span className="text-xs text-slate-400">{filteredTraces.length} / {traces.length} 轮</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"><Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TraceStatusFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="completed">成功</SelectItem><SelectItem value="error">异常</SelectItem><SelectItem value="timeout">超时</SelectItem><SelectItem value="review">待复盘</SelectItem></SelectContent></Select><Select value={qualityFilter} onValueChange={(value) => setQualityFilter(value as QualityFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部综合评分</SelectItem><SelectItem value="high">高分（≥0.85）</SelectItem><SelectItem value="medium">中分（0.70–0.84）</SelectItem><SelectItem value="low">低分（&lt;0.70）</SelectItem><SelectItem value="not_evaluated">未评估</SelectItem></SelectContent></Select><Select value={toolFilter} onValueChange={(value) => setToolFilter(value as ToolType | 'all')}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部 Tool</SelectItem>{toolOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={ragFilter} onValueChange={(value) => setRagFilter(value as RagFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部知识库状态</SelectItem><SelectItem value="hit">已命中</SelectItem><SelectItem value="no_hit">未命中</SelectItem><SelectItem value="failed">调用失败 / 超时</SelectItem><SelectItem value="not_called">未调用</SelectItem></SelectContent></Select><Select value={feedbackFilter} onValueChange={(value) => setFeedbackFilter(value as FeedbackFilter)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部反馈</SelectItem><SelectItem value="up">点赞</SelectItem><SelectItem value="down">点踩</SelectItem><SelectItem value="none">未反馈</SelectItem></SelectContent></Select><Input className="h-8 bg-white text-xs" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Trace ID / 对话 / Tool / 子 Agent" /></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-max"><TableHeader><TableRow><TableHead className="min-w-[140px]">时间</TableHead><TableHead className="min-w-[150px]">Trace ID</TableHead><TableHead className="min-w-[360px]">对话</TableHead><TableHead>状态</TableHead><TableHead>综合评分</TableHead><TableHead>循环次数</TableHead><TableHead className="min-w-[220px]">Tool</TableHead><TableHead>知识库</TableHead><TableHead>耗时</TableHead><TableHead>反馈</TableHead><TableHead className="sticky right-0 bg-slate-50 text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredTraces.length === 0 ? <TableRow><TableCell colSpan={11} className="py-10 text-center text-slate-400">当前筛选条件下没有 Trace。</TableCell></TableRow> : filteredTraces.map((trace) => { const primaryScore = resolveScore(trace, 'task_success') ?? trace.scores[0]; const retriever = trace.retrieverObservations[0]; return <TableRow key={trace.traceId}><TableCell className="whitespace-nowrap text-xs text-slate-600">{trace.occurredAt}<div className="mt-1 text-slate-400">第 {trace.turnSeq} 轮</div></TableCell><TableCell className="font-mono text-[11px] text-slate-600">{trace.traceId}</TableCell><TableCell className="max-w-[420px]"><div className="line-clamp-2 text-sm text-slate-900">用户：{trace.input}</div><div className="mt-1 line-clamp-2 text-xs text-slate-500">Agent：{trace.output}</div></TableCell><TableCell>{statusBadge(trace)}</TableCell><TableCell className="font-semibold">{primaryScore?.value == null ? '未评估' : scoreText(primaryScore.value)}</TableCell><TableCell>{trace.loopCount} 次</TableCell><TableCell><div className="flex max-w-[260px] flex-wrap gap-1">{trace.toolObservations.length === 0 ? <Badge className="border-slate-200 bg-slate-100 text-slate-600">未调用</Badge> : trace.toolObservations.map((tool) => <Badge key={tool.observationId} className={tool.toolType === 'agent_call' ? 'border-cyan-100 bg-cyan-50 text-cyan-700' : tool.status === 'success' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-rose-100 bg-rose-50 text-rose-700'}>{tool.toolType === 'agent_call' ? `子 Agent：${tool.targetAgentName ?? tool.toolName}` : tool.toolName}</Badge>)}</div></TableCell><TableCell>{!retriever ? '未调用' : retriever.hitCount === 0 ? <span className="text-amber-700">未命中</span> : `命中 ${retriever.hitCount}`}</TableCell><TableCell className="whitespace-nowrap text-xs">{trace.totalDurationMs.toLocaleString()}ms</TableCell><TableCell>{feedbackBadge(trace.userFeedback)}</TableCell><TableCell className="sticky right-0 bg-white text-right"><Button size="sm" onClick={() => navigate(tracePathWithReturn({ tenantId, agentId, sessionId, traceId: trace.traceId }, { returnTo: `/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/sessions/${sessionId}`, returnLabel: '返回 Session' }))}>查看</Button></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
  </div></div>;
}
