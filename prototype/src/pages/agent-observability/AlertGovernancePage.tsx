import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ALERT_EVENT_STATUS_CONFIG, ALERT_STATUS_CONFIG, mockAlertEventsData, mockAlertRulesData,
  mockTenantListData, mockTenantMonitoringData,
} from './data';
import {
  handleFetchAlertEvents, handleFetchAlertRules, handleSaveAlertRule,
  handleToggleAlertRule, handleUpdateAlertEvent,
} from './actions';
import { MetricCard } from './shared';
import type { AlertEvent, AlertEventStatus, AlertRule, AlertScope, AlertStatus } from './types';

const ALERT_SCOPE_CONFIG: Record<AlertScope, { label: string; cls: string }> = {
  platform: { label: '全平台', cls: 'border-blue-100 bg-blue-50 text-blue-600' },
  tenant: { label: '公司租户', cls: 'border-purple-100 bg-purple-50 text-purple-600' },
  agent: { label: 'Agent', cls: 'border-green-100 bg-green-50 text-green-600' },
  tool: { label: 'Tool', cls: 'border-orange-100 bg-orange-50 text-orange-600' },
};

const EMPTY_RULE_FORM = {
  name: '', metricName: '', scope: 'agent' as AlertScope, scopeLabel: '', window: '最近 10 分钟',
  threshold: '', condition: '连续 2 个窗口满足条件', notificationTarget: '', recoveryCondition: '', owner: '',
};

export default function AlertGovernancePage() {
  const navigate = useNavigate();
  const { tenantId = '', agentId = '' } = useParams<{ tenantId: string; agentId: string }>();
  const [status, setStatus] = useState<AlertStatus | 'all'>('all');
  const [scope, setScope] = useState<AlertScope | 'all'>('all');
  const [eventStatus, setEventStatus] = useState<AlertEventStatus | 'all'>('all');
  const [rules, setRules] = useState<AlertRule[]>(mockAlertRulesData);
  const [events, setEvents] = useState<AlertEvent[]>(mockAlertEventsData);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM);

  const tenant = mockTenantMonitoringData.find((item) => item.tenantId === tenantId);
  const currentAgent = tenant?.agents.find((item) => item.agentId === agentId);
  const currentTenant = mockTenantListData.find((item) => item.tenantId === tenantId);
  const filteredRules = useMemo(() => rules.filter((rule) => rule.tenantId === tenantId && rule.agentId === agentId && (status === 'all' || rule.status === status) && (scope === 'all' || rule.scope === scope)), [agentId, rules, scope, status, tenantId]);
  const filteredEvents = useMemo(() => events.filter((event) => event.tenantId === tenantId && event.agentId === agentId && (eventStatus === 'all' || event.status === eventStatus)), [agentId, eventStatus, events, tenantId]);

  const enabledCount = filteredRules.filter((rule) => rule.status === 'enabled').length;
  const openEventCount = filteredEvents.filter((event) => event.status === 'open').length;
  const matchedSampleCount = new Set(filteredEvents.flatMap((event) => event.matchedTraceIds)).size;

  function fetchRules(next: { status?: AlertStatus | 'all'; scope?: AlertScope | 'all' }) {
    handleFetchAlertRules({ tenantId, agentId, status: next.status ?? status, scope: next.scope ?? scope });
  }

  function openRuleDialog(rule?: AlertRule) {
    if (rule) {
      setEditingRuleId(rule.id);
      setRuleForm({ name: rule.name, metricName: rule.metricName, scope: rule.scope, scopeLabel: rule.scopeLabel, window: rule.window, threshold: rule.threshold, condition: rule.condition, notificationTarget: rule.notificationTarget, recoveryCondition: rule.recoveryCondition, owner: rule.owner });
    } else {
      setEditingRuleId(null);
      setRuleForm({ ...EMPTY_RULE_FORM, scopeLabel: currentAgent?.agentName ?? '' });
    }
    setRuleDialogOpen(true);
  }

  function saveRule() {
    if (!ruleForm.name.trim() || !ruleForm.metricName.trim() || !ruleForm.threshold.trim()) return;
    handleSaveAlertRule({ id: editingRuleId ?? undefined, agentId, name: ruleForm.name, metricName: ruleForm.metricName, scope: ruleForm.scope, threshold: ruleForm.threshold });
    if (editingRuleId) {
      setRules((current) => current.map((rule) => rule.id === editingRuleId ? { ...rule, ...ruleForm } : rule));
    } else {
      const rule: AlertRule = { tenantId, siteId: currentAgent?.siteId ?? '', agentId, id: `alert_new_${Date.now()}`, ...ruleForm, status: 'enabled', lastTriggeredAt: null };
      setRules((current) => [rule, ...current]);
    }
    setRuleDialogOpen(false);
  }

  function toggleRule(rule: AlertRule) {
    handleToggleAlertRule(rule.id);
    setRules((current) => current.map((item) => item.id === rule.id ? { ...item, status: item.status === 'enabled' ? 'disabled' : 'enabled' } : item));
  }

  function updateEvent(eventId: string, nextStatus: Extract<AlertEventStatus, 'acknowledged' | 'recovered'>) {
    handleUpdateAlertEvent({ eventId, status: nextStatus });
    setEvents((current) => current.map((event) => event.eventId === eventId ? {
      ...event,
      status: nextStatus,
      acknowledgedAt: nextStatus === 'acknowledged' ? '刚刚' : event.acknowledgedAt,
      recoveredAt: nextStatus === 'recovered' ? '刚刚' : event.recoveredAt,
    } : event));
  }

  if (!currentAgent) return <div className="min-h-full bg-gray-50 p-6"><Card><CardContent className="pt-6">未找到 Agent：{agentId}</CardContent></Card></div>;

  return <div className="min-h-full space-y-5 bg-gray-50 p-6">
    <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-gray-900">{currentAgent.agentName} · 告警治理</h1><Badge className="border-gray-900 bg-gray-900 text-white">规则 + 事件</Badge><Badge className="border-blue-100 bg-blue-50 text-blue-600">{currentTenant?.companyName}</Badge></div><p className="mt-1 max-w-4xl text-sm text-gray-500">配置当前 Agent 或其 Tool 的告警条件；规则命中后生成告警事件，并将对应问题样本同步到风险样本和会话质检。</p></div><div className="flex items-center gap-2"><Button size="sm" onClick={() => openRuleDialog()}>新建规则</Button><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/quality-reviews`)}>会话质检</Button><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}`)}>返回 Agent</Button></div></div>

    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><MetricCard title="启用规则" value={enabledCount} hint="当前 Agent 持续运行" /><MetricCard title="待处理事件" value={openEventCount} hint="尚未确认或恢复" tone="text-red-600" /><MetricCard title="事件命中样本" value={matchedSampleCount} hint="进入统一问题样本" tone="text-orange-600" /><MetricCard title="已恢复事件" value={filteredEvents.filter((event) => event.status === 'recovered').length} hint="保留完整处理记录" /></div>

    <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-sm">告警规则</CardTitle><div className="mt-1 text-xs text-gray-400">规则定义什么情况下触发、通知谁，以及如何判断恢复。</div></div><div className="flex items-center gap-2"><Select value={scope} onValueChange={(value) => { const next = value as AlertScope | 'all'; setScope(next); fetchRules({ scope: next }); }}><SelectTrigger className="h-8 w-32 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部范围</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="tool">Tool</SelectItem></SelectContent></Select><Select value={status} onValueChange={(value) => { const next = value as AlertStatus | 'all'; setStatus(next); fetchRules({ status: next }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="enabled">启用</SelectItem><SelectItem value="disabled">停用</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>状态</TableHead><TableHead>规则 / 指标</TableHead><TableHead>作用范围</TableHead><TableHead>窗口 / 条件</TableHead><TableHead>阈值 / 恢复</TableHead><TableHead>通知 / 负责人</TableHead><TableHead>最近触发</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{filteredRules.map((rule) => <TableRow key={rule.id}><TableCell><Badge className={ALERT_STATUS_CONFIG[rule.status].cls}>{ALERT_STATUS_CONFIG[rule.status].label}</Badge></TableCell><TableCell><div className="font-medium text-gray-900">{rule.name}</div><div className="mt-1 text-xs text-gray-500">{rule.metricName}</div></TableCell><TableCell><Badge className={ALERT_SCOPE_CONFIG[rule.scope].cls}>{ALERT_SCOPE_CONFIG[rule.scope].label}</Badge><div className="mt-1 text-xs text-gray-500">{rule.scopeLabel}</div></TableCell><TableCell className="max-w-[220px] text-xs text-gray-600"><div>{rule.window}</div><div className="mt-1 text-gray-400">{rule.condition}</div></TableCell><TableCell className="max-w-[220px] text-xs"><div className="font-medium text-rose-600">{rule.threshold}</div><div className="mt-1 text-gray-400">恢复：{rule.recoveryCondition}</div></TableCell><TableCell className="text-xs"><div>{rule.notificationTarget}</div><div className="mt-1 text-gray-400">{rule.owner}</div></TableCell><TableCell className="text-xs text-gray-400">{rule.lastTriggeredAt ?? '未触发'}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => openRuleDialog(rule)}>编辑</Button><Button size="sm" variant="outline" onClick={() => toggleRule(rule)}>{rule.status === 'enabled' ? '停用' : '启用'}</Button><Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/quality-reviews?alertRuleId=${rule.id}`)}>查看样本</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

    <Card><CardHeader className="pb-3"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-sm">告警事件</CardTitle><div className="mt-1 text-xs text-gray-400">规则每次命中生成独立事件，事件与风险样本保持双向关联。</div></div><Select value={eventStatus} onValueChange={(value) => { const next = value as AlertEventStatus | 'all'; setEventStatus(next); handleFetchAlertEvents({ tenantId, agentId, status: next }); }}><SelectTrigger className="h-8 w-28 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部事件</SelectItem><SelectItem value="open">待处理</SelectItem><SelectItem value="acknowledged">已确认</SelectItem><SelectItem value="recovered">已恢复</SelectItem></SelectContent></Select></div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>状态</TableHead><TableHead>规则 / 事件</TableHead><TableHead>指标值 / 阈值</TableHead><TableHead>范围 / 窗口</TableHead><TableHead>命中样本</TableHead><TableHead>通知对象</TableHead><TableHead>触发 / 恢复</TableHead><TableHead className="text-right">处理</TableHead></TableRow></TableHeader><TableBody>{filteredEvents.length === 0 ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-gray-400">当前范围没有告警事件。</TableCell></TableRow> : filteredEvents.map((event) => { const rule = rules.find((item) => item.id === event.ruleId); return <TableRow key={event.eventId}><TableCell><Badge className={ALERT_EVENT_STATUS_CONFIG[event.status].cls}>{ALERT_EVENT_STATUS_CONFIG[event.status].label}</Badge></TableCell><TableCell><div className="font-medium">{rule?.name ?? event.ruleId}</div><div className="mt-1 font-mono text-[11px] text-gray-400">{event.eventId}</div><div className="mt-1 max-w-[260px] text-xs text-gray-500">{event.summary}</div></TableCell><TableCell><div className="font-semibold text-rose-600">{event.observedValue}</div><div className="mt-1 text-xs text-gray-400">阈值 {event.threshold}</div></TableCell><TableCell className="text-xs"><div>{event.scopeLabel}</div><div className="mt-1 text-gray-400">{event.window}</div></TableCell><TableCell><div className="font-semibold">{event.matchedTraceIds.length} 条</div><div className="mt-1 text-xs text-gray-400">风险分析直接挂载在 Trace</div></TableCell><TableCell className="text-xs">{event.notificationTarget}</TableCell><TableCell className="text-xs"><div>{event.triggeredAt}</div><div className="mt-1 text-gray-400">{event.recoveredAt ? `恢复 ${event.recoveredAt}` : event.acknowledgedAt ? `确认 ${event.acknowledgedAt}` : '尚未确认'}</div></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{event.status === 'open' && <Button size="sm" variant="outline" onClick={() => updateEvent(event.eventId, 'acknowledged')}>确认</Button>}{event.status !== 'recovered' && <Button size="sm" variant="outline" onClick={() => updateEvent(event.eventId, 'recovered')}>标记恢复</Button>}<Button size="sm" variant="outline" onClick={() => navigate(`/platform/agent-observability/tenants/${tenantId}/agents/${agentId}/quality-reviews?alertEventId=${event.eventId}`)}>查看样本</Button></div></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>

    <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingRuleId ? '编辑告警规则' : '新建告警规则'}</DialogTitle></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div><div className="mb-1 text-xs text-gray-500">规则名称</div><Input value={ruleForm.name} onChange={(event) => setRuleForm((current) => ({ ...current, name: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">监控指标</div><Input value={ruleForm.metricName} onChange={(event) => setRuleForm((current) => ({ ...current, metricName: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">作用范围</div><Select value={ruleForm.scope} onValueChange={(value) => setRuleForm((current) => ({ ...current, scope: value as AlertScope }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="agent">Agent</SelectItem><SelectItem value="tool">Tool</SelectItem></SelectContent></Select></div><div><div className="mb-1 text-xs text-gray-500">范围目标</div><Input value={ruleForm.scopeLabel} onChange={(event) => setRuleForm((current) => ({ ...current, scopeLabel: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">统计窗口</div><Input value={ruleForm.window} onChange={(event) => setRuleForm((current) => ({ ...current, window: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">触发阈值</div><Input value={ruleForm.threshold} onChange={(event) => setRuleForm((current) => ({ ...current, threshold: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">触发条件</div><Input value={ruleForm.condition} onChange={(event) => setRuleForm((current) => ({ ...current, condition: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">恢复条件</div><Input value={ruleForm.recoveryCondition} onChange={(event) => setRuleForm((current) => ({ ...current, recoveryCondition: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">通知对象</div><Input value={ruleForm.notificationTarget} onChange={(event) => setRuleForm((current) => ({ ...current, notificationTarget: event.target.value }))} /></div><div><div className="mb-1 text-xs text-gray-500">负责人</div><Input value={ruleForm.owner} onChange={(event) => setRuleForm((current) => ({ ...current, owner: event.target.value }))} /></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRuleDialogOpen(false)}>取消</Button><Button onClick={saveRule}>保存规则</Button></div></DialogContent></Dialog>
  </div>;
}
