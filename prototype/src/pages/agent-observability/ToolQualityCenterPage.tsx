import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TOOL_TYPE_CONFIG } from './data';
import { handleFetchToolMetrics } from './actions';
import { getToolQualityAggregates } from './observabilitySelectors';
import { metricTone, percentText, scoreText } from './shared';
import type { TimeRange, ToolType } from './types';

function ScoreCell({ value, coverage, callCount }: { value: number | null; coverage: number; callCount: number }) {
  return <div className={value === null ? 'text-slate-400' : metricTone(value * 100, 80)}>{value === null ? '未评估' : scoreText(value)}<div className="mt-1 text-[11px] text-slate-400">已评估 {coverage} / {callCount}</div></div>;
}

export default function ToolQualityCenterPage() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [toolType, setToolType] = useState<ToolType | 'all'>('all');
  const tools = useMemo(() => getToolQualityAggregates(toolType === 'all' ? undefined : toolType), [toolType]);

  function changeToolType(next: ToolType | 'all') {
    setToolType(next);
    handleFetchToolMetrics({ timeRange, toolType: next });
  }

  return <div className="min-h-full space-y-5 bg-gray-50 p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-gray-900">工具质量中心</h1><Badge className="border-gray-900 bg-gray-900 text-white">平台管理员</Badge></div><p className="mt-1 text-sm text-gray-500">基于 Tool Observation 聚合跨客户调用表现；执行稳定性与评分质量分别展示，低质量调用均可回溯到具体证据。</p></div><div className="flex items-center gap-2"><Select value={timeRange} onValueChange={(value) => { const next = value as TimeRange; setTimeRange(next); handleFetchToolMetrics({ timeRange: next, toolType }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">今天</SelectItem><SelectItem value="7d">近 7 天</SelectItem><SelectItem value="30d">近 30 天</SelectItem></SelectContent></Select><Button size="sm" variant="outline" onClick={() => navigate('/platform/agent-observability')}>返回总览</Button></div></div><Card><CardHeader className="flex-row items-center justify-between pb-2"><div><CardTitle className="text-sm">全部工具</CardTitle><p className="mt-1 text-xs text-slate-500">成功率 = 成功调用 / 全部已结束调用；评分均仅计算已评估调用。</p></div><Select value={toolType} onValueChange={(value) => changeToolType(value as ToolType | 'all')}><SelectTrigger className="h-8 w-36 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部工具</SelectItem>{Object.entries(TOOL_TYPE_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[1280px]"><TableHeader><TableRow><TableHead>工具</TableHead><TableHead>覆盖 Agent</TableHead><TableHead>调用 / Trace</TableHead><TableHead>每 Trace 平均</TableHead><TableHead>执行成功率</TableHead><TableHead>平均耗时</TableHead><TableHead>Tool 选择</TableHead><TableHead>动作对齐</TableHead><TableHead>参数准确</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{tools.length === 0 ? <TableRow><TableCell colSpan={10} className="py-10 text-center text-slate-400">当前范围没有 Tool Observation。</TableCell></TableRow> : tools.map((tool) => <TableRow key={tool.toolType}><TableCell><Badge className={TOOL_TYPE_CONFIG[tool.toolType].cls}>{TOOL_TYPE_CONFIG[tool.toolType].label}</Badge></TableCell><TableCell>{tool.agentCount}</TableCell><TableCell>{tool.callCount.toLocaleString()} / {tool.traceCount}</TableCell><TableCell>{tool.avgCallsPerTrace.toFixed(2)}</TableCell><TableCell className={metricTone(tool.successRate, 97)}>{percentText(tool.successRate)}<div className="mt-1 text-[11px] text-slate-400">成功 {tool.successCount} / {tool.callCount}</div></TableCell><TableCell>{tool.avgDurationMs.toFixed(0)}ms</TableCell><TableCell><ScoreCell value={tool.selectionScore} coverage={tool.selectionCoverage} callCount={tool.callCount} /></TableCell><TableCell><ScoreCell value={tool.actionAlignmentScore} coverage={tool.actionAlignmentCoverage} callCount={tool.callCount} /></TableCell><TableCell><ScoreCell value={tool.parameterAccuracyScore} coverage={tool.parameterAccuracyCoverage} callCount={tool.callCount} /></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tools/${tool.toolType}`)}>查看详情</Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></div>;
}
