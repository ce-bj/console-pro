import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ── 类型定义 ───────────────────────────────────────────────────────
type TicketCategory = 'technical' | 'business' | 'after_sale' | 'complaint';

// 可填写的触发参数
interface TriggerParam {
  key: string;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
}

interface HandoffTrigger {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
  params: TriggerParam[];
}

// 全局转人工设置（参数可填写）
interface HandoffSettings {
  greeting: string;            // 转接提示语
  carrySummary: boolean;       // 携带会话摘要
  carryProfile: boolean;       // 携带画像
  carrySentiment: boolean;     // 携带情绪曲线
  carrySuggestion: boolean;    // 携带 AI 建议话术
  queueTimeoutMin: number;     // 排队超时（分钟）
  noSeatFallback: 'leave_message' | 'queue' | 'ai_continue'; // 无坐席在线回退
}

interface AgentSeat {
  agentId: string;
  name: string;
  avatar: string;
  skills: TicketCategory[];
  online: boolean;
  currentLoad: number;
  maxLoad: number;
}

interface RoutingRule {
  ruleId: string;
  category: TicketCategory;
  targetGroup: string;
  strategy: 'skill_load' | 'round_robin' | 'least_load';
}

interface SlaPolicy {
  policyId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  firstResponseMin: number;
  resolveHours: number;
  escalateTo: string;
}

// ── DataSlot: 转人工触发器（含可填写参数）────────────────────────────
const mockTriggers: HandoffTrigger[] = [
  {
    key: 'high_intent', label: '高意向转人工', desc: '意向分达阈值自动转坐席', enabled: true,
    params: [{ key: 'threshold', label: '意向分阈值', value: '80', prefix: '≥' }],
  },
  {
    key: 'low_confidence', label: 'AI 置信度低', desc: 'AI 连续无法命中时转人工', enabled: true,
    params: [
      { key: 'rounds', label: '连续未命中轮次', value: '2', suffix: '轮' },
      { key: 'min_conf', label: '置信度低于', value: '0.4' },
    ],
  },
  {
    key: 'user_request', label: '用户明确要求', desc: '用户说「转人工/真人」时立即转', enabled: true,
    params: [{ key: 'keywords', label: '触发关键词', value: '转人工,真人,人工客服' }],
  },
  {
    key: 'negative_sentiment', label: '情绪转负', desc: '情绪识别为负时转人工挽回', enabled: false,
    params: [{ key: 'sentiment', label: '情绪分低于', value: '-0.5' }],
  },
  {
    key: 'keyword_hit', label: '关键词命中转人工', desc: '命中投诉/退款等高敏关键词立即转', enabled: false,
    params: [{ key: 'keywords', label: '高敏关键词', value: '投诉,退款,法务,曝光' }],
  },
];

// DataSlot: 全局转人工设置
const mockHandoffSettings: HandoffSettings = {
  greeting: '正在为您转接人工客服，请稍候，已为坐席同步本次对话摘要 ~',
  carrySummary: true,
  carryProfile: true,
  carrySentiment: false,
  carrySuggestion: true,
  queueTimeoutMin: 3,
  noSeatFallback: 'leave_message',
};

// DataSlot: 坐席技能与负载
const mockSeats: AgentSeat[] = [
  { agentId: 'a1', name: '客服赵敏', avatar: '赵', skills: ['business', 'after_sale'], online: true, currentLoad: 3, maxLoad: 6 },
  { agentId: 'a2', name: '技术陈磊', avatar: '陈', skills: ['technical'], online: true, currentLoad: 5, maxLoad: 6 },
  { agentId: 'a3', name: '技术王鹏', avatar: '王', skills: ['technical', 'complaint'], online: true, currentLoad: 2, maxLoad: 5 },
  { agentId: 'a4', name: '客服林晓', avatar: '林', skills: ['business', 'complaint'], online: false, currentLoad: 0, maxLoad: 5 },
];

// DataSlot: 路由规则
const mockRoutingRules: RoutingRule[] = [
  { ruleId: 'r1', category: 'technical', targetGroup: '技术组', strategy: 'least_load' },
  { ruleId: 'r2', category: 'business', targetGroup: '商务组', strategy: 'skill_load' },
  { ruleId: 'r3', category: 'after_sale', targetGroup: '售后组', strategy: 'round_robin' },
  { ruleId: 'r4', category: 'complaint', targetGroup: '主管组', strategy: 'skill_load' },
];

// DataSlot: SLA 策略
const mockSlaPolicies: SlaPolicy[] = [
  { policyId: 's1', priority: 'urgent', firstResponseMin: 15, resolveHours: 4, escalateTo: '主管' },
  { policyId: 's2', priority: 'high', firstResponseMin: 30, resolveHours: 8, escalateTo: '组长' },
  { policyId: 's3', priority: 'medium', firstResponseMin: 120, resolveHours: 24, escalateTo: '组长' },
  { policyId: 's4', priority: 'low', firstResponseMin: 240, resolveHours: 48, escalateTo: '—' },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 切换转人工触发器 [PATCH] /api/routing/triggers/{key}
function handleToggleTrigger(key: string, enabled: boolean): void {
  console.log('toggle trigger', key, enabled);
}

// ACTION: 保存转人工触发器参数 [PUT] /api/routing/triggers
function handleSaveTriggers(triggers: HandoffTrigger[], settings: HandoffSettings): void {
  console.log('save handoff triggers', triggers, settings);
  alert('转人工触发器与参数已保存');
}

// ACTION: 保存路由规则 [PUT] /api/routing/rules/{rule_id}
function handleSaveRouting(ruleId: string): void {
  console.log('save routing', ruleId);
}

// ACTION: 保存 SLA 策略 [PUT] /api/routing/sla/{policy_id}
function handleSaveSla(policyId: string): void {
  console.log('save sla', policyId);
  alert(`SLA 策略 ${policyId} 已保存`);
}

// ── 辅助常量 ──────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<TicketCategory, string> = {
  technical: '技术', business: '商务', after_sale: '售后', complaint: '投诉',
};
const STRATEGY_LABEL: Record<RoutingRule['strategy'], string> = {
  skill_load: '技能 + 负载', round_robin: '轮询', least_load: '最小负载',
};
const PRIORITY_LABEL = { urgent: '紧急', high: '高', medium: '中', low: '低' };

// ── 主组件 ────────────────────────────────────────────────────────
export default function RoutingRulesPage() {
  const [triggers, setTriggers] = useState<HandoffTrigger[]>(mockTriggers);
  const [settings, setSettings] = useState<HandoffSettings>(mockHandoffSettings);

  function toggleTrigger(key: string) {
    setTriggers((prev) => prev.map((t) => {
      if (t.key !== key) return t;
      handleToggleTrigger(key, !t.enabled);
      return { ...t, enabled: !t.enabled };
    }));
  }

  function updateParam(triggerKey: string, paramKey: string, value: string) {
    setTriggers((prev) => prev.map((t) =>
      t.key !== triggerKey ? t : { ...t, params: t.params.map((p) => p.key === paramKey ? { ...p, value } : p) },
    ));
  }

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 标题 */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">接待规则与路由</h1>
        <p className="text-sm text-gray-500 mt-0.5">N11 · 承载 ⑤ 路由/SLA — 转人工触发器、技能负载路由、SLA 策略集中配置</p>
      </div>

      <Tabs defaultValue="triggers">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="triggers">转人工触发器</TabsTrigger>
          <TabsTrigger value="seats">坐席技能与负载</TabsTrigger>
          <TabsTrigger value="routing">路由规则</TabsTrigger>
          <TabsTrigger value="sla">SLA 策略</TabsTrigger>
        </TabsList>

        {/* ── 转人工触发器（参数可填写）── */}
        <TabsContent value="triggers">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">触发条件（满足任一即转人工，参数可填写）</CardTitle>
                <Button size="sm" className="bg-blue-600" onClick={() => handleSaveTriggers(triggers, settings)}>保存</Button>
              </CardHeader>
              <CardContent className="divide-y">
                {triggers.map((t) => (
                  <div key={t.key} className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{t.label}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      </div>
                      <Switch checked={t.enabled} onCheckedChange={() => toggleTrigger(t.key)} />
                    </div>
                    {/* 可填写参数 */}
                    <div className={`flex flex-wrap gap-4 mt-2 ${t.enabled ? '' : 'opacity-40 pointer-events-none'}`}>
                      {t.params.map((p) => (
                        <div key={p.key} className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-500">{p.label}</label>
                          {p.prefix && <span className="text-xs text-gray-400">{p.prefix}</span>}
                          <Input
                            className={`h-7 text-xs ${p.value.includes(',') ? 'w-56' : 'w-20'}`}
                            value={p.value}
                            onChange={(e) => updateParam(t.key, p.key, e.target.value)}
                          />
                          {p.suffix && <span className="text-xs text-gray-400">{p.suffix}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 全局转人工设置 */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">转人工行为设置</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500">转接提示语（发给访客）</label>
                  <Textarea className="mt-1" value={settings.greeting}
                    onChange={(e) => setSettings({ ...settings, greeting: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">交接时携带上下文</label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {([
                      ['carrySummary', '会话摘要'],
                      ['carryProfile', '客户画像'],
                      ['carrySentiment', '情绪曲线'],
                      ['carrySuggestion', 'AI 建议话术'],
                    ] as [keyof HandoffSettings, string][]).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-2 text-sm text-gray-700">
                        <Switch checked={settings[k] as boolean} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">排队超时</label>
                    <Input className="h-7 w-20 text-xs" type="number" value={settings.queueTimeoutMin}
                      onChange={(e) => setSettings({ ...settings, queueTimeoutMin: Number(e.target.value) })} />
                    <span className="text-xs text-gray-400">分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">无坐席在线时</label>
                    <select className="h-7 text-xs border border-gray-200 rounded px-2"
                      value={settings.noSeatFallback}
                      onChange={(e) => setSettings({ ...settings, noSeatFallback: e.target.value as HandoffSettings['noSeatFallback'] })}>
                      <option value="leave_message">引导留言表单</option>
                      <option value="queue">继续排队等待</option>
                      <option value="ai_continue">AI 继续接待</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── 坐席技能与负载 ── */}
        <TabsContent value="seats">
          <div className="grid grid-cols-2 gap-3">
            {mockSeats.map((s) => (
              <Card key={s.agentId}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${s.online ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>{s.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                      <Badge className={`text-[10px] ${s.online ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{s.online ? '在线' : '离线'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.skills.map((sk) => <Badge key={sk} className="text-[10px] bg-gray-100 text-gray-600">{CATEGORY_LABEL[sk]}</Badge>)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${s.currentLoad / s.maxLoad > 0.8 ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${(s.currentLoad / s.maxLoad) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-400">{s.currentLoad}/{s.maxLoad}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── 路由规则 ── */}
        <TabsContent value="routing">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">工单分类 → 坐席组路由</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工单分类</TableHead>
                    <TableHead>目标坐席组</TableHead>
                    <TableHead>分配策略</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRoutingRules.map((r) => (
                    <TableRow key={r.ruleId}>
                      <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{CATEGORY_LABEL[r.category]}</Badge></TableCell>
                      <TableCell className="text-sm">{r.targetGroup}</TableCell>
                      <TableCell className="text-sm text-gray-600">{STRATEGY_LABEL[r.strategy]}</TableCell>
                      <TableCell><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSaveRouting(r.ruleId)}>编辑</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SLA 策略 ── */}
        <TabsContent value="sla">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">按优先级的 SLA 倒计时与超时升级</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>优先级</TableHead>
                    <TableHead>首次响应（分钟）</TableHead>
                    <TableHead>解决时限（小时）</TableHead>
                    <TableHead>超时升级至</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSlaPolicies.map((p) => (
                    <TableRow key={p.policyId}>
                      <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{PRIORITY_LABEL[p.priority]}</Badge></TableCell>
                      <TableCell><Input className="w-20 h-8" defaultValue={p.firstResponseMin} /></TableCell>
                      <TableCell><Input className="w-20 h-8" defaultValue={p.resolveHours} /></TableCell>
                      <TableCell className="text-sm">{p.escalateTo}</TableCell>
                      <TableCell><Button size="sm" className="h-7 text-xs bg-blue-600" onClick={() => handleSaveSla(p.policyId)}>保存</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
