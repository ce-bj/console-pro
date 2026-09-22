import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TENANT_STATUS_CONFIG, mockTenantListData, mockTenantMonitoringData } from './data';
import { handleFetchPlatformAgentOverview, handleFetchTenantDetail, handleFetchTenantList } from './actions';
import { getCustomerPriorities, getPlatformCustomerOverview, getTenantInvocationSummaries } from './observabilitySelectors';
import { metricTone, percentText } from './shared';
import type { SortDirection, TenantInvocationType, TenantListItem, TenantListSortKey, TenantStatus, TimeRange } from './types';

function CompactMetric({ label, value, helper, tone }: { label: string; value: string; helper: string; tone?: string }) {
  return <div className="min-w-0 border-r border-slate-100 px-4 py-3 last:border-r-0"><div className="text-[11px] font-medium text-slate-500">{label}</div><div className={`mt-1 text-xl font-semibold tracking-tight ${tone ?? 'text-slate-950'}`}>{value}</div><div className="mt-1 truncate text-[11px] text-slate-400">{helper}</div></div>;
}

const statusOptions: TenantStatus[] = ['risk', 'warning', 'healthy'];
const invocationOptions: Array<{ value: TenantInvocationType; label: string }> = [
  { value: 'tool', label: 'Tool 调用' },
  { value: 'rag', label: 'RAG 调用' },
];
const sortDefaults: Record<TenantListSortKey, SortDirection> = {
  priority: 'desc', companyName: 'asc', sessionCount: 'desc', requestSuccessRate: 'desc',
  p95ResponseDurationSec: 'desc', satisfactionRate: 'asc', toolSuccessRate: 'asc', ragHitRate: 'asc',
  riskCount: 'desc', lastActiveAt: 'desc',
};
const sortLabels: Record<TenantListSortKey, string> = {
  priority: '处置优先级', companyName: '客户', sessionCount: '使用规模', requestSuccessRate: '请求成功率',
  p95ResponseDurationSec: '客户 P95', satisfactionRate: '满意率', toolSuccessRate: 'Tool 成功率',
  ragHitRate: 'RAG 命中率', riskCount: '风险', lastActiveAt: '最后活跃',
};

function MultiSelectFilter({ label, options, selected, onChange, countByOption }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  countByOption?: Record<string, number>;
}) {
  const triggerLabel = selected.length === 0 ? `全部${label}` : selected.length === 1 ? selected[0] : `已选 ${selected.length} 个${label}`;
  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  }
  return <details className="relative"><summary className="flex h-8 min-w-28 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 [&::-webkit-details-marker]:hidden"><span className="truncate">{triggerLabel}</span><span className="text-slate-400">⌄</span></summary><div className="absolute right-0 z-20 mt-1 min-w-48 rounded-md border border-slate-200 bg-white p-2 shadow-lg"><div className="mb-1 flex items-center justify-between px-2 py-1 text-[11px] text-slate-400"><span>可多选</span>{selected.length > 0 && <button type="button" className="text-blue-600 hover:underline" onClick={() => onChange([])}>清空</button>}</div>{options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900" /><span className="flex-1">{option}</span>{countByOption && <span className="text-[11px] text-slate-400">{countByOption[option] ?? 0}</span>}</label>)}</div></details>;
}

function SortHeader({ sortKey, currentKey, direction, onSort }: { sortKey: TenantListSortKey; currentKey: TenantListSortKey; direction: SortDirection; onSort: (key: TenantListSortKey) => void }) {
  const active = sortKey === currentKey;
  return <TableHead aria-sort={active ? direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="inline-flex items-center gap-1 whitespace-nowrap hover:text-slate-900" onClick={() => onSort(sortKey)}>{sortLabels[sortKey]}<span className="text-[10px] text-slate-400">{active ? direction === 'asc' ? '▲' : '▼' : '↕'}</span></button></TableHead>;
}

export default function AgentObservabilityOverviewPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [statuses, setStatuses] = useState<TenantStatus[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [invocationTypes, setInvocationTypes] = useState<TenantInvocationType[]>([]);
  const [toolProblemOnly, setToolProblemOnly] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<TenantListSortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDirection>(sortDefaults.priority);
  const overview = useMemo(() => getPlatformCustomerOverview(), []);
  const industryOptions = useMemo(() => [...new Set(mockTenantListData.map((tenant) => tenant.industry))].sort((left, right) => left.localeCompare(right, 'zh-CN')), []);
  const industryCounts = useMemo(() => mockTenantListData.reduce<Record<string, number>>((counts, tenant) => ({ ...counts, [tenant.industry]: (counts[tenant.industry] ?? 0) + 1 }), {}), []);
  const invocationSummaries = useMemo(() => new Map(getTenantInvocationSummaries().map((summary) => [summary.tenantId, summary])), []);
  const invocationCounts = useMemo(() => invocationOptions.reduce<Record<string, number>>((counts, option) => ({ ...counts, [option.value]: mockTenantListData.filter((tenant) => { const summary = invocationSummaries.get(tenant.tenantId); return option.value === 'tool' ? (summary?.toolCallCount ?? 0) > 0 : (summary?.ragCallCount ?? 0) > 0; }).length }), {}), [invocationSummaries]);
  const filteredTenants = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return mockTenantListData.filter((tenant) => {
      const summary = invocationSummaries.get(tenant.tenantId);
      const matchesInvocation = invocationTypes.length === 0 || invocationTypes.some((type) => type === 'tool' ? (summary?.toolCallCount ?? 0) > 0 : (summary?.ragCallCount ?? 0) > 0);
      return (!query || tenant.companyName.toLowerCase().includes(query) || tenant.industry.toLowerCase().includes(query))
        && (statuses.length === 0 || statuses.includes(tenant.status))
        && (industries.length === 0 || industries.includes(tenant.industry))
        && matchesInvocation
        && (!toolProblemOnly || tenant.toolSuccessRate < 95);
    });
  }, [industries, invocationSummaries, invocationTypes, keyword, statuses, toolProblemOnly]);
  const priorities = useMemo(() => getCustomerPriorities(filteredTenants).sort((left, right) => {
    const leftHasData = mockTenantMonitoringData.some((item) => item.tenantId === left.tenant.tenantId && item.agents.length > 0);
    const rightHasData = mockTenantMonitoringData.some((item) => item.tenantId === right.tenant.tenantId && item.agents.length > 0);
    return Number(rightHasData) - Number(leftHasData) || right.score - left.score;
  }), [filteredTenants]);
  const priorityByTenantId = useMemo(() => new Map(priorities.map((priority, index) => [priority.tenant.tenantId, { priority, rank: index + 1 }])), [priorities]);
  const sortedTenants = useMemo(() => {
    const valueFor = (tenant: TenantListItem): string | number => {
      if (sortKey === 'priority') return -(priorityByTenantId.get(tenant.tenantId)?.rank ?? Number.MAX_SAFE_INTEGER);
      if (sortKey === 'companyName') return tenant.companyName;
      if (sortKey === 'requestSuccessRate') return 100 - tenant.errorRate;
      if (sortKey === 'lastActiveAt') return tenant.lastActiveAt;
      return tenant[sortKey];
    };
    return [...filteredTenants].sort((left, right) => {
      const leftValue = valueFor(left);
      const rightValue = valueFor(right);
      const primary = typeof leftValue === 'string' && typeof rightValue === 'string'
        ? leftValue.localeCompare(rightValue, 'zh-CN')
        : Number(leftValue) - Number(rightValue);
      if (primary !== 0) return sortDir === 'asc' ? primary : -primary;
      const priorityDiff = (priorityByTenantId.get(right.tenantId)?.priority.score ?? 0) - (priorityByTenantId.get(left.tenantId)?.priority.score ?? 0);
      return priorityDiff || left.companyName.localeCompare(right.companyName, 'zh-CN');
    });
  }, [filteredTenants, priorityByTenantId, sortDir, sortKey]);
  const hasFilters = Boolean(keyword.trim() || statuses.length || industries.length || invocationTypes.length || toolProblemOnly);

  function refreshScope(nextTimeRange: TimeRange = timeRange) {
    handleFetchPlatformAgentOverview({ timeRange: nextTimeRange });
    handleFetchTenantList({ timeRange: nextTimeRange, keyword: keyword.trim() || undefined, statuses: statuses.length ? statuses : undefined, industries: industries.length ? industries : undefined, invocationTypes: invocationTypes.length ? invocationTypes : undefined, toolProblemOnly: toolProblemOnly || undefined, sortBy: sortKey, sortDir });
  }

  function openTenant(tenantId: string) {
    handleFetchTenantDetail(tenantId);
    navigate(`/platform/agent-observability/tenants/${tenantId}`);
  }

  function changeSort(nextKey: TenantListSortKey) {
    if (nextKey === sortKey) setSortDir((current) => current === 'asc' ? 'desc' : 'asc');
    else { setSortKey(nextKey); setSortDir(sortDefaults[nextKey]); }
  }

  function clearFilters() {
    setKeyword('');
    setStatuses([]);
    setIndustries([]);
    setInvocationTypes([]);
    setToolProblemOnly(false);
  }

  return <div className="min-h-full bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-[1500px] space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">智能体运营中心</h1><Badge className="border-slate-900 bg-slate-900 text-white">平台管理员</Badge><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">监测数据已同步</Badge></div><p className="mt-1.5 text-sm text-slate-500">按客户聚合运行健康、回答质量、Tool/RAG 表现、成本与风险；进入客户后查看 Agent、会话和 Trace 证据。</p></div><div className="flex items-center gap-2"><span className="text-xs text-slate-400">数据更新于 2 分钟前</span><Select value={timeRange} onValueChange={(value) => { const next = value as TimeRange; setTimeRange(next); refreshScope(next); }}><SelectTrigger className="h-9 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">今天</SelectItem><SelectItem value="7d">近 7 天</SelectItem><SelectItem value="30d">近 30 天</SelectItem></SelectContent></Select><Button variant="outline" size="sm" onClick={() => refreshScope()}>刷新数据</Button><Button size="sm" onClick={() => navigate('/platform/agent-observability/tools')}>Tool 质量中心</Button></div></header>

    <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-sm"><CardContent className="p-0"><div className="grid lg:grid-cols-[1.35fr_1fr]"><div className="p-5 lg:border-r lg:border-slate-800"><div className="flex items-center gap-2 text-xs font-medium text-amber-300"><span className="h-2 w-2 rounded-full bg-amber-400" />当前客户运营概览</div><div className="mt-3 text-2xl font-semibold leading-snug">{overview.riskTenantCount} 个客户需要关注，<span className="text-amber-300">优先查看高影响风险与运行异常</span></div><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">首页的所有数字均由客户监控汇总聚合而来，不混入单 Agent 的评估或发布状态。选择客户后，可继续定位具体 Agent、会话与 Trace。</p></div><div className="grid grid-cols-3 divide-x divide-slate-800 p-5"><div className="px-3"><div className="text-xs text-slate-400">风险客户</div><div className="mt-1 text-3xl font-semibold text-amber-300">{overview.riskTenantCount}</div><div className="mt-1 text-[11px] text-slate-500">客户健康状态非健康</div></div><div className="px-3"><div className="text-xs text-slate-400">待复盘风险</div><div className="mt-1 text-3xl font-semibold">{overview.totalRisks}</div><div className="mt-1 text-[11px] text-slate-500">客户风险计数之和</div></div><div className="px-3"><div className="text-xs text-slate-400">Tool 异常客户</div><div className="mt-1 text-3xl font-semibold text-rose-300">{mockTenantListData.filter((tenant) => tenant.toolSuccessRate < 95).length}</div><div className="mt-1 text-[11px] text-slate-500">执行成功率低于 95%</div></div></div></div></CardContent></Card>

    <Card className="overflow-hidden"><CardContent className="grid grid-cols-2 p-0 md:grid-cols-3 xl:grid-cols-6"><CompactMetric label="服务客户" value={`${overview.totalTenants}`} helper={`${overview.totalAgents} 个已接入智能体`} /><CompactMetric label="会话量" value={overview.totalSessions.toLocaleString()} helper={`${overview.totalTurns.toLocaleString()} 对话轮次`} /><CompactMetric label="请求成功率" value={percentText(overview.requestSuccessRate)} helper="按客户轮次加权" tone={metricTone(overview.requestSuccessRate, 98)} /><CompactMetric label="客户 P95 最大值" value={`${overview.maxTenantP95Seconds}s`} helper="非平台 P95 分位数" tone={overview.maxTenantP95Seconds <= 90 ? 'text-emerald-600' : 'text-rose-600'} /><CompactMetric label="用户满意率" value={percentText(overview.satisfactionRate)} helper="按客户轮次加权" tone={metricTone(overview.satisfactionRate, 85)} /><CompactMetric label="模型成本" value={`¥${(overview.totalCost / 10000).toFixed(2)}万`} helper="当前统计周期" /></CardContent></Card>

    <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">客户监控与优先处置</CardTitle><p className="mt-1 text-xs text-slate-500">客户聚合字段的统一工作列表；优先级由健康状态、Tool/RAG/质量异常和风险数量派生，不代表持久化严重等级。</p></div><div className="flex items-center gap-2"><Badge className="border-amber-200 bg-amber-50 text-amber-700">显示 {sortedTenants.length} / {mockTenantListData.length} 个客户</Badge>{hasFilters && <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-500" onClick={clearFilters}>清除筛选</Button>}</div></div><div className="mt-3 flex flex-wrap items-center gap-2"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && refreshScope()} placeholder="搜索客户或行业" className="h-8 w-52 bg-white text-xs" /><MultiSelectFilter label="状态" options={statusOptions.map((status) => TENANT_STATUS_CONFIG[status].label)} selected={statuses.map((status) => TENANT_STATUS_CONFIG[status].label)} onChange={(next) => setStatuses(next.map((label) => statusOptions.find((status) => TENANT_STATUS_CONFIG[status].label === label)).filter((status): status is TenantStatus => Boolean(status)))} /><MultiSelectFilter label="行业" options={industryOptions} selected={industries} onChange={setIndustries} countByOption={industryCounts} /><MultiSelectFilter label="调用类型" options={invocationOptions.map((option) => option.label)} selected={invocationTypes.map((type) => invocationOptions.find((option) => option.value === type)?.label ?? type)} onChange={(next) => setInvocationTypes(next.map((label) => invocationOptions.find((option) => option.label === label)?.value).filter((value): value is TenantInvocationType => Boolean(value)))} countByOption={Object.fromEntries(invocationOptions.map((option) => [option.label, invocationCounts[option.value] ?? 0]))} /><label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700"><input type="checkbox" checked={toolProblemOnly} onChange={(event) => setToolProblemOnly(event.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900" />仅 Tool 异常</label><Select value={sortKey} onValueChange={(value) => changeSort(value as TenantListSortKey)}><SelectTrigger className="h-8 w-36 bg-white text-xs"><SelectValue placeholder="排序字段" /></SelectTrigger><SelectContent>{(Object.keys(sortLabels) as TenantListSortKey[]).map((key) => <SelectItem key={key} value={key}>{sortLabels[key]}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setSortDir((current) => current === 'asc' ? 'desc' : 'asc')} aria-label={`切换${sortLabels[sortKey]}排序方向`}>{sortDir === 'asc' ? '升序 ▲' : '降序 ▼'}</Button><Button size="sm" variant="outline" className="h-8" onClick={() => refreshScope()}>查询</Button></div></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[1360px]"><TableHeader><TableRow><SortHeader sortKey="priority" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><SortHeader sortKey="companyName" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><SortHeader sortKey="sessionCount" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><SortHeader sortKey="requestSuccessRate" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><TableHead>质量与组件</TableHead><SortHeader sortKey="riskCount" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><SortHeader sortKey="lastActiveAt" currentKey={sortKey} direction={sortDir} onSort={changeSort} /><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{sortedTenants.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-slate-400">没有符合当前筛选条件的客户。{hasFilters && <Button size="sm" variant="link" className="ml-1" onClick={clearFilters}>清除筛选</Button>}</TableCell></TableRow> : sortedTenants.map((tenant) => { const priorityInfo = priorityByTenantId.get(tenant.tenantId); return <TableRow key={tenant.tenantId}><TableCell className="w-56"><div className="flex items-start gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${priorityInfo?.rank === 1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>P{priorityInfo?.rank ?? '—'}</span><div><div className="font-medium text-slate-900">{priorityInfo?.priority.label ?? '待评估'}</div><div className="mt-1 text-xs leading-4 text-slate-400">{priorityInfo?.priority.action}</div></div></div></TableCell><TableCell className="w-52"><div className="flex items-center gap-2"><span className="font-medium">{tenant.companyName}</span><Badge className={TENANT_STATUS_CONFIG[tenant.status].cls}>{TENANT_STATUS_CONFIG[tenant.status].label}</Badge></div><div className="mt-1 text-xs text-slate-400">{tenant.industry} · {tenant.plan}</div></TableCell><TableCell><div>{tenant.agentCount} 个智能体</div><div className="mt-1 text-xs text-slate-400">{tenant.sessionCount.toLocaleString()} 会话 / {tenant.turnCount.toLocaleString()} 轮</div></TableCell><TableCell><div className={metricTone(100 - tenant.errorRate, 98)}>成功 {percentText(100 - tenant.errorRate)}</div><div className="mt-1 text-xs text-slate-400">客户 P95 {tenant.p95ResponseDurationSec}s</div></TableCell><TableCell><div className={metricTone(tenant.satisfactionRate, 85)}>满意 {percentText(tenant.satisfactionRate)}</div><div className={`mt-1 ${metricTone(tenant.toolSuccessRate, 95)} text-xs`}>Tool 成功 {percentText(tenant.toolSuccessRate)}</div><div className={`mt-1 ${metricTone(tenant.ragHitRate, 75)} text-xs`}>RAG 命中 {percentText(tenant.ragHitRate)}{tenant.ragHitRate < 75 ? ' · no-hit 风险' : ''}</div></TableCell><TableCell><div className={tenant.riskCount >= 30 ? 'font-semibold text-rose-600' : 'text-amber-600'}>{tenant.riskCount} 条风险</div><div className="mt-1 text-xs text-slate-400">按客户范围汇总</div></TableCell><TableCell className="text-xs text-slate-500">{tenant.lastActiveAt}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openTenant(tenant.tenantId)}>查看客户监控</Button></TableCell></TableRow>; })}</TableBody></Table></div></CardContent></Card>
  </div></div>;
}
