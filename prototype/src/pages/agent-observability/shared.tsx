import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AGENT_EVALUATION_GROUPS, RELEASE_GATE_CONFIG, ROOT_CAUSE_LABEL,
} from './data';
import type {
  AgentMonitoringRecord, ConversationTurn, KnowledgeGapResolution, KnowledgeGapResolutionMethod, MetricContribution,
  MetricDefinition, MetricStatus, MetricValueSnapshot, ObservabilitySession, ObservabilityTrace, PortalSiteItem,
  QualityReviewInput, ReleaseGateStatus, RootCause,
} from './types';

export function percentText(value: number) {
  return `${value.toFixed(1)}%`;
}

export function scoreText(value: number) {
  return value.toFixed(2);
}

export function metricTone(value: number, goodAtLeast: number) {
  if (value >= goodAtLeast) return 'text-green-600';
  if (value >= goodAtLeast - 10) return 'text-amber-600';
  return 'text-red-600';
}

export function average(items: number[]) {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + item, 0) / items.length;
}

export function sum(items: number[]) {
  return items.reduce((total, item) => total + item, 0);
}

export function feedbackBadge(value: ConversationTurn['userFeedback']) {
  if (value === 'up') return <Badge className="bg-green-50 text-green-600 border-green-100">点赞</Badge>;
  if (value === 'down') return <Badge className="bg-red-50 text-red-600 border-red-100">点踩</Badge>;
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">未反馈</Badge>;
}

export function ragBadge(value: boolean) {
  return value
    ? <Badge className="bg-blue-50 text-blue-600 border-blue-100">已调用</Badge>
    : <Badge className="bg-gray-100 text-gray-600 border-gray-200">未调用</Badge>;
}

export function MetricCard({ title, value, hint, tone }: {
  title: string;
  value: string | number;
  hint?: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-gray-400">{title}</div>
        <div className={`mt-1 text-2xl font-semibold ${tone ?? 'text-gray-900'}`}>{value}</div>
        {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function ScoreMeter({ label, value, target = 0.8, hint }: {
  label: string;
  value: number | null;
  target?: number;
  hint?: string;
}) {
  const score = value ?? 0;
  const state = value === null ? '未接入' : score >= target ? '达标' : score >= target - 0.08 ? '关注' : '未达标';
  const tone = value === null ? 'bg-slate-200' : score >= target ? 'bg-emerald-500' : score >= target - 0.08 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">{value === null ? '—' : scoreText(value)} · {state}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${label} ${value === null ? '未接入' : `${scoreText(value)}，目标 ${scoreText(target)}`}`} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value ?? undefined}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(score * 100, 100))}%` }} />
      </div>
      {hint && <div className="mt-1 text-[11px] text-slate-400">{hint}</div>}
    </div>
  );
}

export function ReleaseGateBadge({ status }: { status: ReleaseGateStatus }) {
  const config = RELEASE_GATE_CONFIG[status];
  return <Badge className={config.cls}>{config.label}</Badge>;
}

function evaluationMetricValue(agent: AgentMonitoringRecord, metricId: string) {
  const { metrics, scorecard } = agent;
  const common: Record<string, number | null> = {
    task_success: metrics.taskSuccessScore,
    correctness: metrics.correctnessScore,
    relevance: metrics.relevanceScore,
    groundedness: metrics.groundednessScore,
  };
  if (metricId in common) return common[metricId];
  if (scorecard.kind === 'customer_service') {
    const values: Record<string, number> = {
      context_memory: scorecard.contextMemoryScore,
      clarification_quality: scorecard.clarificationQualityScore,
      tool_selection: scorecard.toolSelectionScore,
      tool_parameter_accuracy: scorecard.toolParameterAccuracyScore,
      handoff_reasonableness: scorecard.handoffReasonablenessScore,
      lead_trigger_reasonableness: scorecard.leadTriggerReasonablenessScore,
    };
    return values[metricId] ?? null;
  }
  const values: Record<string, number> = {
    instruction_following: scorecard.instructionFollowingScore,
    completeness: scorecard.completenessScore,
    style_alignment: scorecard.styleAlignmentScore,
    format_compliance: scorecard.formatComplianceScore,
    low_hallucination_risk: 1 - scorecard.hallucinationRiskScore,
  };
  return values[metricId] ?? null;
}

export function EvaluationScoreGroups({ agent, compact = false }: { agent: AgentMonitoringRecord; compact?: boolean }) {
  const groups = AGENT_EVALUATION_GROUPS.filter((group) => group.appliesTo === 'all' || group.appliesTo === agent.kind);
  return (
    <div className={`grid gap-4 ${compact ? '' : 'xl:grid-cols-2'}`}>
      {groups.map((group) => (
        <Card key={group.id} className="border-slate-200 shadow-none">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div><div className="text-sm font-semibold text-slate-900">{group.name}</div><div className="mt-0.5 text-xs text-slate-500">{group.nameZh}</div></div>
              <Badge className="border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-500">{group.code}</Badge>
            </div>
            <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {group.metrics.map((metric) => <ScoreMeter key={metric.id} label={`${metric.name} · ${metric.nameZh}`} value={evaluationMetricValue(agent, metric.id)} hint={`${metric.code} · ${metric.description}`} />)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export interface MetricTableRowModel {
  metricCode: string;
  label: string;
  englishName?: string;
  value: string;
  helper?: string;
  sampleOrCoverage?: string;
  threshold?: string;
  status?: MetricStatus;
}

function MetricStatusBadge({ status }: { status?: MetricStatus }) {
  if (!status) return null;
  const config = status === 'healthy'
    ? { label: '健康', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
    : status === 'warning'
      ? { label: '关注', cls: 'bg-amber-50 text-amber-700 border-amber-100' }
      : status === 'risk'
        ? { label: '风险', cls: 'bg-rose-50 text-rose-700 border-rose-100' }
        : { label: '未评估', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <Badge className={config.cls}>{config.label}</Badge>;
}

export function MetricTable({ title, description, rows, onOpenMetric }: {
  title: string;
  description?: string;
  rows: MetricTableRowModel[];
  onOpenMetric: (metricCode: string) => void;
}) {
  return <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader className="border-b border-slate-100 pb-3"><CardTitle className="text-sm">{title}</CardTitle>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>指标</TableHead><TableHead>当前值</TableHead><TableHead>样本 / 覆盖</TableHead><TableHead>阈值</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.metricCode}><TableCell><div className="font-medium text-slate-900">{row.label}</div>{row.englishName && <div className="mt-1 text-xs text-slate-400">{row.englishName} · <span className="font-mono">{row.metricCode}</span></div>}{row.helper && <div className="mt-1 max-w-[440px] text-xs leading-5 text-slate-500">{row.helper}</div>}</TableCell><TableCell className="font-semibold text-slate-900">{row.value}</TableCell><TableCell className="text-xs text-slate-500">{row.sampleOrCoverage ?? '—'}</TableCell><TableCell className="text-xs text-slate-500">{row.threshold ?? '—'}</TableCell><TableCell><MetricStatusBadge status={row.status} /></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => onOpenMetric(row.metricCode)}>口径与明细</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
}

export function EvaluationMetricTable({ agent, onOpenMetric }: { agent: AgentMonitoringRecord; onOpenMetric: (metricCode: string) => void }) {
  const groups = AGENT_EVALUATION_GROUPS.filter((group) => group.appliesTo === 'all' || group.appliesTo === agent.kind);
  return <div className="space-y-4">{groups.map((group) => <MetricTable key={group.id} title={`${group.nameZh} · ${group.name}`} description={`${group.code} · 评分统一归一化至 0–1，并保留原始分数、评分器和理由。`} rows={group.metrics.map((metric) => { const value = evaluationMetricValue(agent, metric.id); const scope = metric.id === 'tool_parameter_accuracy' ? 'Tool Observation' : metric.id === 'groundedness' ? 'Trace / Retriever evidence' : 'Trace'; return { metricCode: metric.code, label: metric.nameZh, englishName: metric.name, value: value === null ? '未评估' : scoreText(value), helper: `${metric.description} · 挂载：${scope}`, sampleOrCoverage: `${agent.metrics.evaluatedTraceCount.toLocaleString()} 条 · 覆盖 ${percentText(agent.metrics.evaluationCoverageRate)}`, threshold: '≥ 0.80', status: value === null ? 'not_evaluated' : value >= 0.8 ? 'healthy' : value >= 0.72 ? 'warning' : 'risk' }; })} onOpenMetric={onOpenMetric} />)}</div>;
}

function formatContributionValue(value: number | null) {
  if (value === null) return '未评估';
  if (value === 0 || value === 1) return value === 1 ? '计入 / 成功' : '计入 / 未通过';
  return value >= 10 ? value.toLocaleString() : value.toFixed(2);
}

export function MetricDetailDialog({ metric, snapshot, contributions, sessions, onClose, onOpenSession }: {
  metric: MetricDefinition | null;
  snapshot: MetricValueSnapshot | null;
  contributions: MetricContribution[];
  sessions: ObservabilitySession[];
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
}) {
  const traceById = new Map(sessions.flatMap((session) => session.turns.map((trace) => [trace.traceId, trace] as const)));
  return <Dialog open={metric !== null} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[88vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{metric?.nameZh} · {metric?.name}</DialogTitle></DialogHeader>{metric && <div className="space-y-5"><div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]"><div className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-2"><Badge className="border-slate-200 bg-slate-50 font-mono text-slate-600">{metric.code}</Badge><Badge className="border-blue-100 bg-blue-50 text-blue-700">{metric.scope}</Badge><Badge className="border-slate-200 bg-white text-slate-600">{metric.category}</Badge></div><p className="mt-3 text-sm leading-6 text-slate-700">{metric.description}</p><div className="mt-4 rounded-md bg-slate-950 px-4 py-3 font-mono text-xs text-slate-100">{metric.formula}</div>{metric.caveats.length > 0 && <ul className="mt-3 space-y-1 text-xs leading-5 text-amber-700">{metric.caveats.map((item) => <li key={item}>• {item}</li>)}</ul>}</div><div className="rounded-lg border border-slate-200 p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">当前统计范围</div><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">当前值</dt><dd className="mt-1 text-xl font-semibold">{snapshot?.value === null || snapshot?.value === undefined ? '未评估' : snapshot.value.toLocaleString()}</dd></div><div><dt className="text-xs text-slate-400">状态</dt><dd className="mt-1"><MetricStatusBadge status={snapshot?.status} /></dd></div><div><dt className="text-xs text-slate-400">分子 / 分母</dt><dd className="mt-1">{snapshot?.numerator ?? '—'} / {snapshot?.denominator ?? '—'}</dd></div><div><dt className="text-xs text-slate-400">样本 / 覆盖</dt><dd className="mt-1">{snapshot?.sampleCount ?? '—'}{snapshot?.coverageRate !== undefined ? ` · ${percentText(snapshot.coverageRate)}` : ''}</dd></div><div className="col-span-2"><dt className="text-xs text-slate-400">阈值</dt><dd className="mt-1">{snapshot?.thresholdLabel ?? '观察型指标，无统一阈值'}</dd></div></dl></div></div><div><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">构成指标的历史会话</h3><p className="mt-1 text-xs text-slate-500">当前展示 Agent、环境和时间范围内的全部匹配 mock 记录；未进入计算的记录会说明排除原因。</p></div><span className="text-xs text-slate-400">共 {contributions.length} 条 · PAGINATION: page,pageSize</span></div><Table><TableHeader><TableRow><TableHead>时间 / Session</TableHead><TableHead>历史对话</TableHead><TableHead>本条贡献</TableHead><TableHead>计算状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{contributions.map((item) => { const trace = traceById.get(item.traceId); return <TableRow key={`${item.metricCode}-${item.traceId}`}><TableCell><div className="text-xs text-slate-600">{item.occurredAt}</div><div className="mt-1 font-mono text-[11px] text-slate-400">{item.sessionId} · turn {item.turnSeq}</div></TableCell><TableCell className="max-w-[420px]"><div className="truncate text-sm text-slate-800">{trace?.input ?? item.traceId}</div><div className="mt-1 truncate text-xs text-slate-400">{trace?.output ?? '—'}</div></TableCell><TableCell>{formatContributionValue(item.contributionValue)}</TableCell><TableCell>{item.included ? <Badge className="border-emerald-100 bg-emerald-50 text-emerald-700">已计入</Badge> : <div><Badge className="border-slate-200 bg-slate-100 text-slate-600">未计入</Badge><div className="mt-1 max-w-[220px] text-xs text-slate-400">{item.exclusionReason}</div></div>}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => onOpenSession(item.sessionId)}>查看会话证据</Button></TableCell></TableRow>; })}</TableBody></Table></div></div>}</DialogContent></Dialog>;
}

export function ObservabilityRetentionNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50/50 shadow-none">
      <CardContent className="py-3">
        <div className="text-sm font-medium text-amber-900">明细数据保留 30 天</div>
        <p className="mt-1 text-xs leading-5 text-amber-800">Session、Trace 及 Tool、子 Agent、知识库和评分等详细证据仅保留最近 30 天。超过保留期后明细将删除且无法继续下钻；每日聚合指标和历史趋势继续保留。</p>
      </CardContent>
    </Card>
  );
}

export function MonitoringEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center">
        <div className="text-sm font-medium text-slate-800">尚未接入深度智能体监测</div>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500">当前原型仅接入智能客服PRO与运营助手的深度监测数据。客户聚合指标仍可用于识别风险，接入后可继续下钻到 Agent、Session 与 Trace。</p>
      </CardContent>
    </Card>
  );
}

export function PortalScopePicker({ sites, selectedSiteIds, onChange }: {
  sites: PortalSiteItem[];
  selectedSiteIds: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = selectedSiteIds.length === 0
    ? '全部门户网站'
    : sites.filter((site) => selectedSiteIds.includes(site.siteId)).map((site) => site.siteName).join('、');

  function toggleSite(id: string) {
    const next = selectedSiteIds.includes(id)
      ? selectedSiteIds.filter((siteId) => siteId !== id)
      : [...selectedSiteIds, id];
    onChange(next);
  }

  return (
    <div className="relative max-w-xl">
      <button
        type="button"
        className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <span className="float-right text-gray-400">⌄</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
          <label className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <input type="checkbox" checked={selectedSiteIds.length === 0} onChange={() => onChange([])} className="accent-blue-600" />
            全部门户网站
          </label>
          <div className="my-1 border-t" />
          {sites.map((site) => (
            <label key={site.siteId} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={selectedSiteIds.includes(site.siteId)} onChange={() => toggleSite(site.siteId)} className="accent-blue-600" />
                {site.siteName}
              </span>
              <span className="text-xs text-gray-400">{site.domain}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function QualityReviewDialog({ trace, onClose, onSubmit }: {
  trace: ObservabilityTrace | null;
  onClose: () => void;
  onSubmit: (form: QualityReviewInput) => void;
}) {
  const [score, setScore] = useState('4');
  const [issue, setIssue] = useState('回答依据不足');
  const [rootCause, setRootCause] = useState<RootCause>('knowledge_base');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!trace?.risk) return;
    setScore(String(trace.risk.reviewScore ?? 4));
    setIssue(trace.risk.reviewIssueType ?? trace.risk.issueType);
    setRootCause(trace.risk.rootCause ?? 'knowledge_base');
    setComment(trace.risk.reviewComment ?? '');
  }, [trace?.traceId]);

  function submit() {
    if (!trace) return;
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 5) return;
    onSubmit({ traceId: trace.traceId, score: numericScore, issueType: issue, rootCause, comment });
    onClose();
  }

  return (
    <Dialog open={trace !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>风险 Trace 人工质检</DialogTitle></DialogHeader>
        {trace?.risk && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2"><Badge>{trace.risk.issueType}</Badge><span className="font-mono text-xs text-gray-400">{trace.traceId}</span></div>
              <div className="mt-3 text-xs text-gray-400">用户问题</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{trace.input}</div>
              <div className="mt-3 text-xs text-gray-400">AI 回复</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{trace.output}</div>
              <div className="mt-3 text-xs text-gray-400">期望行为</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{trace.risk.expectedBehavior}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="mb-1 text-xs text-gray-500">评分（1-5）</div><Input type="number" min={1} max={5} step={1} value={score} onChange={(event) => setScore(event.target.value)} /></div>
              <div><div className="mb-1 text-xs text-gray-500">问题类型</div><Input value={issue} onChange={(event) => setIssue(event.target.value)} /></div>
              <div><div className="mb-1 text-xs text-gray-500">原因归类</div><Select value={rootCause} onValueChange={(value) => setRootCause(value as RootCause)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROOT_CAUSE_LABEL).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><div className="mb-1 text-xs text-gray-500">质检备注</div><Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="记录判断依据、改进建议和验证方式" /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={submit}>保存质检结论</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const KNOWLEDGE_GAP_STATUS_CONFIG: Record<KnowledgeGapResolution['status'], { label: string; cls: string }> = {
  not_started: { label: '未开始', cls: 'border-gray-200 bg-gray-50 text-gray-600' },
  uploaded: { label: '已上传文档', cls: 'border-blue-100 bg-blue-50 text-blue-700' },
  checking: { label: '检测中', cls: 'border-amber-100 bg-amber-50 text-amber-700' },
  resolved: { label: '已解决', cls: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
  unresolved: { label: '仍未解决', cls: 'border-red-100 bg-red-50 text-red-700' },
};

export function KnowledgeGapStatusBadge({ status }: { status: KnowledgeGapResolution['status'] }) {
  const config = KNOWLEDGE_GAP_STATUS_CONFIG[status];
  return <Badge className={config.cls}>{config.label}</Badge>;
}

function knowledgeGapMaterialLabel(method: KnowledgeGapResolutionMethod | null | undefined, fileName: string, faqQuestion: string) {
  return method === 'faq' ? `FAQ《${faqQuestion}》` : `《${fileName}》`;
}

export function KnowledgeGapResolutionDialog({ trace, onClose, onResolve }: {
  trace: ObservabilityTrace | null;
  onClose: () => void;
  onResolve: (traceId: string, resolution: KnowledgeGapResolution) => void;
}) {
  const [method, setMethod] = useState<KnowledgeGapResolutionMethod | null>(null);
  const [fileName, setFileName] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [status, setStatus] = useState<KnowledgeGapResolution['status']>('not_started');

  useEffect(() => {
    if (!trace?.risk) return;
    const resolution = trace.risk.knowledgeGapResolution;
    setStatus(resolution?.status ?? 'not_started');
    setMethod(resolution?.method ?? null);
    setFileName(resolution?.uploadedFileName ?? '');
    setFaqQuestion(resolution?.faqQuestion ?? trace.input);
    setFaqAnswer(resolution?.faqAnswer ?? trace.risk.expectedBehavior);
  }, [trace?.traceId]);

  function upload(file: File) {
    if (!trace) return;
    setMethod('document');
    setFileName(file.name);
    setStatus('uploaded');
    onResolve(trace.traceId, { status: 'uploaded', method: 'document', uploadedFileName: file.name, uploadedAt: '刚刚' });
  }

  function submitFaq() {
    if (!trace) return;
    setMethod('faq');
    setStatus('uploaded');
    onResolve(trace.traceId, { status: 'uploaded', method: 'faq', faqQuestion, faqAnswer, uploadedAt: '刚刚' });
  }

  function startRecheck() {
    if (!trace) return;
    setStatus('checking');
    onResolve(trace.traceId, { status: 'checking', method: method ?? undefined, uploadedFileName: fileName, faqQuestion, faqAnswer, uploadedAt: '刚刚' });
    setTimeout(() => {
      setStatus('resolved');
      onResolve(trace.traceId, {
        status: 'resolved',
        method: method ?? undefined,
        uploadedFileName: fileName,
        faqQuestion,
        faqAnswer,
        uploadedAt: '刚刚',
        recheckedAt: '刚刚',
        recheckSummary: `已命中新${method === 'faq' ? '创建的 FAQ' : '上传的'}${knowledgeGapMaterialLabel(method, fileName, faqQuestion)}，可覆盖原问题的知识缺口`,
        recheckGroundednessScore: 0.92,
      });
    }, 1500);
  }

  function markUnresolved() {
    if (!trace) return;
    setStatus('unresolved');
    onResolve(trace.traceId, {
      status: 'unresolved',
      method: method ?? undefined,
      uploadedFileName: fileName,
      faqQuestion,
      faqAnswer,
      uploadedAt: '刚刚',
      recheckedAt: '刚刚',
      recheckSummary: '复检后仍未命中该问题，需要转人工质检确认知识内容',
    });
  }

  return (
    <Dialog open={trace !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>加入知识库</DialogTitle></DialogHeader>
        {trace?.risk && (
          <div className="space-y-4">
            <div className="rounded-md border bg-gray-50 p-3">
              <div className="flex flex-wrap items-center gap-2"><Badge>{trace.risk.issueType}</Badge><span className="font-mono text-xs text-gray-400">{trace.traceId}</span><KnowledgeGapStatusBadge status={status} /></div>
              <div className="mt-3 text-xs text-gray-400">用户问题</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{trace.input}</div>
              <div className="mt-3 text-xs text-gray-400">AI 回复</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{trace.output}</div>
              <div className="mt-3 text-xs text-gray-400">期望行为</div><div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{trace.risk.expectedBehavior}</div>
            </div>

            {status === 'not_started' && method === null && (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="text-sm text-blue-900">该问题由知识库内容不足引发，请选择一种方式补充知识库，提交后需复检确认是否已覆盖该问题。</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setMethod('faq')} className="rounded-md border border-gray-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50">
                    <div className="text-sm font-medium text-gray-900">创建 FAQ 条目</div>
                    <div className="mt-1 text-xs text-gray-500">直接填写问题与答案，适合口径明确的问题</div>
                  </button>
                  <button type="button" onClick={() => setMethod('document')} className="rounded-md border border-gray-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50">
                    <div className="text-sm font-medium text-gray-900">上传补充文档</div>
                    <div className="mt-1 text-xs text-gray-500">上传更完整的资料，适合内容较多的知识缺口</div>
                  </button>
                </div>
              </div>
            )}

            {status === 'not_started' && method === 'faq' && (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center justify-between"><div className="text-sm text-blue-900">创建 FAQ 条目</div><button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setMethod(null)}>返回选择方式</button></div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-gray-500">问题</div>
                  <Input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} className="h-9 bg-white text-xs" />
                  <div className="text-xs text-gray-500">期望答案</div>
                  <Textarea value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} className="min-h-20 bg-white text-xs" />
                </div>
                <div className="mt-3 flex justify-end"><Button size="sm" onClick={submitFaq} disabled={!faqQuestion.trim() || !faqAnswer.trim()}>提交 FAQ 并复检</Button></div>
              </div>
            )}

            {status === 'not_started' && method === 'document' && (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-center justify-between"><div className="text-sm text-blue-900">上传补充文档</div><button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setMethod(null)}>返回选择方式</button></div>
                <div className="mt-3 flex items-center gap-2">
                  <Input type="file" className="h-9 bg-white text-xs" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); }} />
                </div>
              </div>
            )}

            {status === 'uploaded' && (
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="text-sm text-blue-900">已提交{method === 'faq' ? `FAQ《${faqQuestion}》` : `《${fileName}》`}</div>
                <div className="mt-1 text-xs text-blue-700">提交时间：刚刚</div>
                <div className="mt-3 flex justify-end"><Button size="sm" onClick={startRecheck}>开始检测</Button></div>
              </div>
            )}

            {status === 'checking' && (
              <div className="rounded-md border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">正在基于{knowledgeGapMaterialLabel(method ?? undefined, fileName, faqQuestion)}重新检测该问题是否已解决…</div>
            )}

            {status === 'resolved' && (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-sm text-emerald-900">检测通过：已命中{method === 'faq' ? '新创建的 FAQ' : '新上传的'}{knowledgeGapMaterialLabel(method ?? undefined, fileName, faqQuestion)}，Groundedness 0.92，可覆盖原问题的知识缺口。</div>
                <div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="outline" onClick={markUnresolved}>仍未解决，转人工质检</Button><Button size="sm" onClick={onClose}>完成</Button></div>
              </div>
            )}

            {status === 'unresolved' && (
              <div className="rounded-md border border-red-100 bg-red-50 p-3">
                <div className="text-sm text-red-900">复检后仍未命中该问题，建议转人工质检确认知识内容和补充范围。</div>
                <div className="mt-3 flex justify-end"><Button size="sm" variant="outline" onClick={onClose}>关闭，前往人工质检</Button></div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
