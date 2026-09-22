import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type VisitorType = 'all' | 'anonymous' | 'identified';
type VisitorRoute = 'anonymous' | 'member';
type IntentLevel = 'high' | 'medium' | 'low';
type ChurnSignal = 'move_to_close' | 'form_interrupt' | 'tab_switch' | 'none';
type EventType = 'page_view' | 'scroll_depth' | 'click' | 'page_leave';
type TimeRange = 'today' | '7d' | '30d' | 'custom';

// 独立站：一个后台关联多个独立站（面向不同地区）
interface SiteOption { id: string; name: string; flag: string; }

interface VisitorStats {
  dau: number;                          // 今日活跃访客（去重 visitor_id）
  dauChange: number;
  todaySessions: number;                // 今日进站会话（访问周期）
  todaySessionsChange: number;
  effectiveInteractionSessions: number;
  effectiveInteractionChange: number;
  churnSignalCount: number;
  churnSignalChange: number;
}

// 按天聚合的历史统计（多周期视角）
interface DailyStat {
  date: string;
  sessions: number;          // 当天访问周期数
  dwellSeconds: number;      // 当天累计停留
  pagesViewed: number;       // 当天浏览页面数
  maxScrollPercent: number;  // 当天最深滚动
  hadKeyPage: boolean;       // 当天是否访问关键页
}

interface VisitorItem {
  visitorId: string;
  unifiedId: string | null;   // 已识别（留资/登录）后才有
  visitorName: string | null; // 留资后的姓名（访客字段）
  companyName: string | null; // 企业字段（来源：IP 识别 或 留资）
  companySource: 'ip' | 'lead' | null;
  ip: string;
  region: string;
  regionFlag: string;
  siteId: string;             // 所属独立站
  route: VisitorRoute;
  sessionCount: number;       // 访问周期数（多个 session）
  keyPageRepeatVisits: number;
  totalDwellSeconds: number;  // 跨周期累计停留
  churnSignal: ChurnSignal;
  intentLevel: IntentLevel;
  firstSeenAt: string;
  lastVisitTime: string;
  isIdentified: boolean;
  dailyStats: DailyStat[];    // 下钻：按天统计
}

interface BehaviorEvent {
  eventId: string;
  eventType: EventType;
  pageUrl: string;
  eventTime: string;
  props: Record<string, string | number | boolean>;
}

// ── DataSlot: 独立站列表 ───────────────────────────────────────────
const SITES: SiteOption[] = [
  { id: 'all', name: '全部站点', flag: '🌐' },
  { id: 'site-cn', name: '中文官网', flag: '🇨🇳' },
  { id: 'site-en', name: 'EN Global', flag: '🇺🇸' },
  { id: 'site-sea', name: '东南亚站', flag: '🇸🇬' },
];
const SITE_MAP = Object.fromEntries(SITES.map((s) => [s.id, s]));

// ── DataSlot: 统计指标 ─────────────────────────────────────────────
const mockVisitorStats: VisitorStats = {
  dau: 156, dauChange: 9.4,
  todaySessions: 238, todaySessionsChange: 12.5,
  effectiveInteractionSessions: 87, effectiveInteractionChange: -3.2,
  churnSignalCount: 19, churnSignalChange: -5.0,
};

// PAGINATION: page,pageSize
// DataSlot: 访客列表（按访客去重，跨周期聚合）
const mockVisitorsData: VisitorItem[] = [
  {
    visitorId: 'v-88821', unifiedId: 'u-88821', visitorName: '张伟',
    companyName: 'Acme 科技有限公司', companySource: 'lead',
    ip: '114.88.21.10', region: '北京', regionFlag: '🇨🇳', siteId: 'site-cn', route: 'anonymous',
    sessionCount: 7, keyPageRepeatVisits: 3, totalDwellSeconds: 1820, churnSignal: 'move_to_close',
    intentLevel: 'high', firstSeenAt: '2026-05-29T09:00:00Z', lastVisitTime: '2026-06-04T10:23:00Z', isIdentified: true,
    dailyStats: [
      { date: '2026-05-29', sessions: 1, dwellSeconds: 120, pagesViewed: 3, maxScrollPercent: 40, hadKeyPage: false },
      { date: '2026-06-01', sessions: 2, dwellSeconds: 420, pagesViewed: 8, maxScrollPercent: 70, hadKeyPage: true },
      { date: '2026-06-03', sessions: 2, dwellSeconds: 560, pagesViewed: 9, maxScrollPercent: 85, hadKeyPage: true },
      { date: '2026-06-04', sessions: 2, dwellSeconds: 720, pagesViewed: 11, maxScrollPercent: 87, hadKeyPage: true },
    ],
  },
  {
    visitorId: 'v-4432', unifiedId: null, visitorName: null,
    companyName: null, companySource: null,
    ip: '101.44.32.2', region: '上海', regionFlag: '🇨🇳', siteId: 'site-cn', route: 'anonymous',
    sessionCount: 2, keyPageRepeatVisits: 1, totalDwellSeconds: 178, churnSignal: 'tab_switch',
    intentLevel: 'medium', firstSeenAt: '2026-06-03T09:00:00Z', lastVisitTime: '2026-06-04T09:55:00Z', isIdentified: false,
    dailyStats: [
      { date: '2026-06-03', sessions: 1, dwellSeconds: 89, pagesViewed: 2, maxScrollPercent: 45, hadKeyPage: false },
      { date: '2026-06-04', sessions: 1, dwellSeconds: 89, pagesViewed: 3, maxScrollPercent: 50, hadKeyPage: true },
    ],
  },
  {
    visitorId: 'v-9901', unifiedId: null, visitorName: null,
    companyName: 'Global Trade Co.', companySource: 'ip',
    ip: '650.12.0.12', region: 'California', regionFlag: '🇺🇸', siteId: 'site-en', route: 'anonymous',
    sessionCount: 1, keyPageRepeatVisits: 0, totalDwellSeconds: 18, churnSignal: 'none',
    intentLevel: 'low', firstSeenAt: '2026-06-04T08:10:00Z', lastVisitTime: '2026-06-04T08:10:00Z', isIdentified: false,
    dailyStats: [
      { date: '2026-06-04', sessions: 1, dwellSeconds: 18, pagesViewed: 1, maxScrollPercent: 25, hadKeyPage: false },
    ],
  },
  {
    visitorId: 'v-33108', unifiedId: 'u-33108', visitorName: '王芳',
    companyName: '深圳制造集团', companySource: 'lead',
    ip: '124.33.10.8', region: '深圳', regionFlag: '🇨🇳', siteId: 'site-sea', route: 'member',
    sessionCount: 4, keyPageRepeatVisits: 2, totalDwellSeconds: 640, churnSignal: 'form_interrupt',
    intentLevel: 'medium', firstSeenAt: '2026-05-30T10:00:00Z', lastVisitTime: '2026-06-04T11:05:00Z', isIdentified: true,
    dailyStats: [
      { date: '2026-05-30', sessions: 1, dwellSeconds: 150, pagesViewed: 4, maxScrollPercent: 60, hadKeyPage: false },
      { date: '2026-06-02', sessions: 1, dwellSeconds: 180, pagesViewed: 5, maxScrollPercent: 72, hadKeyPage: true },
      { date: '2026-06-04', sessions: 2, dwellSeconds: 310, pagesViewed: 7, maxScrollPercent: 75, hadKeyPage: true },
    ],
  },
];

// DataSlot: 单周期（本次会话）行为事件流
const mockVisitorEventsData: BehaviorEvent[] = [
  { eventId: 'e-001', eventType: 'page_view', pageUrl: '/demo.html', eventTime: '2026-06-04T10:20:00Z', props: { load_time_ms: 1200, viewport: '1440x900' } },
  { eventId: 'e-002', eventType: 'scroll_depth', pageUrl: '/demo.html', eventTime: '2026-06-04T10:20:45Z', props: { depth_percent: 50 } },
  { eventId: 'e-003', eventType: 'click', pageUrl: '/demo.html#pricing', eventTime: '2026-06-04T10:21:30Z', props: { element_text: '查看价格方案', is_cta: true } },
  { eventId: 'e-004', eventType: 'scroll_depth', pageUrl: '/demo.html#pricing', eventTime: '2026-06-04T10:22:10Z', props: { depth_percent: 87 } },
  { eventId: 'e-005', eventType: 'page_leave', pageUrl: '/demo.html', eventTime: '2026-06-04T10:23:00Z', props: { dwell_time_ms: 180000, max_scroll_percent: 87 } },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 获取访客按天历史统计 [GET] /api/visitors/{visitor_id}/daily-stats
function handleFetchDailyStats(visitorId: string): void { console.log('fetch daily stats', visitorId); }

// ACTION: 获取单次会话行为事件 [GET] /api/visitors/{visitor_id}/events?session_id=
function handleFetchVisitorEvents(visitorId: string): void { console.log('fetch visitor events', visitorId); }

// ACTION: 发起对话 [POST] /api/sessions
function handleInitiateConversation(visitorId: string): void { console.log('initiate conversation', visitorId); }

// ACTION: 手动合并访客（识别为同一人）[POST] /api/visitors/merge
function handleMergeVisitors(primaryVisitorId: string, mergeVisitorIds: string[]): void {
  console.log('merge visitors', { primaryVisitorId, mergeVisitorIds });
  alert(`已将 ${mergeVisitorIds.length} 个访客合并到主访客 ${primaryVisitorId}（历史按天数据合并，统一 unified_id，可审计）`);
}

// ── 辅助函数 ──────────────────────────────────────────────────────
function formatDwell(seconds: number): string {
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}
function intentBadgeClass(level: IntentLevel): string {
  return { high: 'bg-red-100 text-red-700 border-red-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-gray-100 text-gray-500 border-gray-200' }[level];
}
function intentLabel(level: IntentLevel): string { return { high: '高意向', medium: '中意向', low: '低意向' }[level]; }
const ROUTE_BADGE: Record<VisitorRoute, { label: string; cls: string }> = {
  anonymous: { label: '匿名', cls: 'bg-gray-100 text-gray-500' },
  member: { label: '会员', cls: 'bg-indigo-50 text-indigo-600' },
};
function churnLabel(signal: ChurnSignal): string {
  return { move_to_close: '移向关闭', form_interrupt: '表单中断', tab_switch: '切 Tab', none: '无' }[signal];
}
const CHURN_DESC: Record<ChurnSignal, string> = {
  move_to_close: '鼠标快速上移越过页面顶部（指向关闭/地址栏），判定正要离开',
  tab_switch: '页面切到后台（切标签页/最小化），且本会话未留资',
  form_interrupt: '留资表单已聚焦但提交前离开（8s 无新输入或直接关闭）',
  none: '无',
};

// ── 指标口径配置（运营方可设置；开启的条件/信号才计入计数）──────────
interface MetricConfig {
  // 有效互动会话：满足所选条件即计为"有效互动"
  effective: {
    enabled: boolean;
    matchMode: 'all' | 'any';        // 全部满足 / 任一满足
    scroll: { on: boolean; min: number };   // 滚动深度 ≥ min%
    dwell: { on: boolean; min: number };     // 停留 ≥ min 秒
    click: { on: boolean };                  // 发生点击/CTA
    chat: { on: boolean };                   // 发起对话
  };
  // 流失前兆：每种信号可单独开关，开启后才计入计数
  churn: {
    move_to_close: { on: boolean };
    tab_switch: { on: boolean; onlyUnsubmitted: boolean };
    form_interrupt: { on: boolean; idleSec: number };
  };
}

// DataSlot: 指标口径配置（运营方设置，后端存租户级）
const DEFAULT_METRIC_CFG: MetricConfig = {
  effective: {
    enabled: true, matchMode: 'all',
    scroll: { on: true, min: 50 },
    dwell: { on: true, min: 30 },
    click: { on: true },
    chat: { on: false },
  },
  churn: {
    move_to_close: { on: true },
    tab_switch: { on: true, onlyUnsubmitted: true },
    form_interrupt: { on: true, idleSec: 8 },
  },
};

// ACTION: 保存指标口径配置 [PUT] /api/metrics/config
function handleSaveMetricConfig(cfg: MetricConfig): void {
  console.log('save metric config', cfg);
  alert('指标口径已保存，新定义将用于后续统计');
}
function eventIcon(type: EventType): string { return { page_view: '📄', scroll_depth: '↕️', click: '👆', page_leave: '🚪' }[type]; }
function changeText(change: number): { label: string; cls: string } {
  const up = change >= 0;
  return { label: `${up ? '↑' : '↓'}${Math.abs(change)}%`, cls: up ? 'text-green-600' : 'text-red-500' };
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function VisitorInsightsPage() {
  const [siteId, setSiteId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [visitorType, setVisitorType] = useState<VisitorType>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [showRule, setShowRule] = useState<boolean>(false);
  const [metricCfgOpen, setMetricCfgOpen] = useState<boolean>(false);
  const [metricCfg, setMetricCfg] = useState<MetricConfig>(DEFAULT_METRIC_CFG);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergeOpen, setMergeOpen] = useState<boolean>(false);

  function openTrajectoryDrawer(visitorId: string): void {
    setActiveVisitorId(visitorId);
    handleFetchDailyStats(visitorId);
    handleFetchVisitorEvents(visitorId);
    setDrawerOpen(true);
  }
  function toggleSelect(id: string): void {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const stats = mockVisitorStats;
  const filtered = mockVisitorsData.filter((v) => {
    if (siteId !== 'all' && v.siteId !== siteId) return false;
    if (visitorType === 'anonymous' && v.isIdentified) return false;
    if (visitorType === 'identified' && !v.isIdentified) return false;
    return true;
  });
  const activeVisitor = mockVisitorsData.find((v) => v.visitorId === activeVisitorId);
  const selectedVisitors = mockVisitorsData.filter((v) => selectedIds.includes(v.visitorId));
  const maxDaySessions = activeVisitor ? Math.max(...activeVisitor.dailyStats.map((d) => d.sessions), 1) : 1;

  // 指标卡 hint 跟随运营方配置
  const effConds = [
    metricCfg.effective.scroll.on && `滚动≥${metricCfg.effective.scroll.min}%`,
    metricCfg.effective.dwell.on && `停留≥${metricCfg.effective.dwell.min}s`,
    metricCfg.effective.click.on && '有点击',
    metricCfg.effective.chat.on && '发起对话',
  ].filter(Boolean) as string[];
  const effHint = !metricCfg.effective.enabled
    ? '未启用（计全部会话）'
    : `${effConds.join(metricCfg.effective.matchMode === 'all' ? ' 且 ' : ' 或 ')}`;
  const churnEnabledCount = [metricCfg.churn.move_to_close.on, metricCfg.churn.tab_switch.on, metricCfg.churn.form_interrupt.on].filter(Boolean).length;
  const churnHint = `${churnEnabledCount}/3 信号已启用 · 按会话去重`;

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">访客洞察</h1>
          <p className="text-sm text-gray-500 mt-0.5">N1 · 行为视角 · 全量访客（含噪音）— 流量/行为分析，发现高意向与流失信号</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRule((s) => !s)}>
            {showRule ? '收起统计规则' : '统计规则说明'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMetricCfgOpen(true)}>指标口径设置</Button>
          <Button variant="outline" size="sm">导出报告</Button>
        </div>
      </div>

      {/* 统计规则说明 */}
      {showRule && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="pt-4 text-sm text-gray-700 space-y-2">
            <p><strong className="text-blue-700">什么是一个访客？</strong> 同一浏览器（<code className="bg-white px-1 rounded">visitor_id</code>，存 localStorage）记为一个访客；留资 / 登录后按 <code className="bg-white px-1 rounded">unified_id</code> 跨设备合并为「同一个人」。同一 IP 仅作弱提示，不强制合并。</p>
            <p><strong className="text-blue-700">访问周期（session）：</strong> 一次会话为一个访问周期，30 分钟无活动即结束（<code className="bg-white px-1 rounded">session_id</code> 标识）。一个访客可有多个周期。</p>
            <p><strong className="text-blue-700">按天统计：</strong> DAU = 当天去重 visitor_id 数；列表里「访问周期数 / 累计停留 / 关键页重访」为所选时间范围内的<strong>跨周期聚合</strong>。</p>
            <p><strong className="text-blue-700">单周期 vs 多周期展示：</strong> 列表为多周期聚合；点「查看轨迹」下钻：<strong>多周期</strong>看按天历史（每天会话/停留/页数/滚动），<strong>单周期</strong>看本次会话的事件时间线。</p>
            <div className="border-t border-blue-200/60 pt-2 mt-1">
              <p><strong className="text-orange-600">流失前兆（3 种触发条件，由 tracker 前端判定）：</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-1">
                <li><strong>移向关闭</strong>：鼠标在页面内快速上移并越过顶部边界（<code className="bg-white px-1 rounded">mouseleave</code> 且指针 Y≤0，指向关闭/地址栏/切窗区），判定"正要离开"。</li>
                <li><strong>切 Tab</strong>：页面 <code className="bg-white px-1 rounded">visibilitychange</code> 转 hidden（切去别的标签页 / 最小化），且本会话尚未完成目标（未留资）。</li>
                <li><strong>表单中断</strong>：留资表单已聚焦输入，但提交前离开（最后一次输入后 8s 无新输入，或直接关闭/切走）。</li>
              </ul>
              <p className="mt-1"><strong className="text-orange-600">流失前兆统计口径：</strong> 指标卡「流失前兆触发」= 所选时间范围内、<strong>按会话去重</strong>触发任一前兆的会话数（同一会话内同类前兆只计一次，避免抖动重复计）；列表「流失前兆」列 = 该访客<strong>最近一次</strong>触发的类型。触发后可联动「流失拦截」挽回（阶段二，N3 触发器）。</p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* 筛选栏（含独立站选择） */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="w-40"><SelectValue placeholder="独立站" /></SelectTrigger>
              <SelectContent>
                {SITES.map((s) => <SelectItem key={s.id} value={s.id}>{s.flag} {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="时间范围" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="7d">最近 7 天</SelectItem>
                <SelectItem value="30d">最近 30 天</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visitorType} onValueChange={(v) => setVisitorType(v as VisitorType)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="访客类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部访客</SelectItem>
                <SelectItem value="anonymous">匿名访客</SelectItem>
                <SelectItem value="identified">已识别</SelectItem>
              </SelectContent>
            </Select>
            <Input className="w-44" placeholder="来源页面筛选" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} />
            <Button className="bg-blue-600 hover:bg-blue-700">查询</Button>
          </div>
        </CardContent>
      </Card>

      {/* 四个指标卡 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '今日活跃访客 DAU', value: stats.dau, change: stats.dauChange, warn: false, hint: '去重 visitor_id' },
          { label: '今日进站会话', value: stats.todaySessions, change: stats.todaySessionsChange, warn: false, hint: '访问周期数' },
          { label: '有效互动会话', value: stats.effectiveInteractionSessions, change: stats.effectiveInteractionChange, warn: false, hint: effHint },
          { label: '流失前兆触发', value: stats.churnSignalCount, change: stats.churnSignalChange, warn: true, hint: churnHint },
        ].map((metric) => {
          const { label, cls } = changeText(metric.change);
          return (
            <Card key={metric.label} className={metric.warn ? 'border-orange-200' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-normal">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metric.warn ? 'text-orange-500' : 'text-gray-900'}`}>{metric.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-sm ${cls}`}>{label} 环比</span>
                  <span className="text-[11px] text-gray-400">{metric.hint}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 访客列表 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">访客列表</CardTitle>
          {selectedIds.length >= 2 && (
            <Button size="sm" className="bg-blue-600" onClick={() => setMergeOpen(true)}>合并为同一人（{selectedIds.length}）</Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>访客</TableHead>
                <TableHead>企业</TableHead>
                <TableHead>站点</TableHead>
                <TableHead>路线</TableHead>
                <TableHead>IP / 地区</TableHead>
                <TableHead className="text-center">访问周期</TableHead>
                <TableHead className="text-center">关键页重访</TableHead>
                <TableHead>累计停留</TableHead>
                <TableHead title="该访客最近一次触发的前兆：移向关闭 / 切 Tab / 表单中断">
                  流失前兆 <span className="text-gray-300">ⓘ</span>
                </TableHead>
                <TableHead>意向</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((visitor) => {
                const site = SITE_MAP[visitor.siteId];
                return (
                  <TableRow key={visitor.visitorId}>
                    <TableCell>
                      <input type="checkbox" className="rounded" checked={selectedIds.includes(visitor.visitorId)} onChange={() => toggleSelect(visitor.visitorId)} />
                    </TableCell>
                    {/* 访客字段 */}
                    <TableCell>
                      <div className="font-medium text-sm">
                        {visitor.isIdentified && <span className="mr-1 text-blue-500 text-xs">✓</span>}
                        {visitor.visitorName ?? '匿名访客'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{visitor.visitorId}</div>
                    </TableCell>
                    {/* 企业字段 */}
                    <TableCell>
                      {visitor.companyName ? (
                        <div>
                          <div className="text-sm text-gray-700">{visitor.companyName}</div>
                          <Badge className={`text-[10px] ${visitor.companySource === 'lead' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {visitor.companySource === 'lead' ? '留资' : 'IP 识别'}
                          </Badge>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </TableCell>
                    <TableCell><span className="text-sm">{site.flag} {site.name}</span></TableCell>
                    <TableCell><Badge className={`text-xs ${ROUTE_BADGE[visitor.route].cls}`}>{ROUTE_BADGE[visitor.route].label}</Badge></TableCell>
                    <TableCell>
                      <div className="text-xs font-mono text-gray-600">{visitor.ip}</div>
                      <div className="text-xs text-gray-400">{visitor.regionFlag} {visitor.region}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{visitor.sessionCount}</TableCell>
                    <TableCell className="text-center">{visitor.keyPageRepeatVisits}</TableCell>
                    <TableCell className="text-sm">{formatDwell(visitor.totalDwellSeconds)}</TableCell>
                    <TableCell>
                      {visitor.churnSignal !== 'none'
                        ? <Badge title={CHURN_DESC[visitor.churnSignal]} className="text-orange-600 bg-orange-50 border border-orange-200 text-xs">{churnLabel(visitor.churnSignal)}</Badge>
                        : <span className="text-gray-400 text-xs">无</span>}
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${intentBadgeClass(visitor.intentLevel)}`}>{intentLabel(visitor.intentLevel)}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openTrajectoryDrawer(visitor.visitorId)}>查看轨迹</Button>
                        {visitor.isIdentified
                          ? (visitor.unifiedId
                              ? <a href={`/customers/${visitor.unifiedId}`}><Button size="sm" variant="outline" className="text-xs h-7">客户360 ↗</Button></a>
                              : <a href="/leads"><Button size="sm" variant="outline" className="text-xs h-7">线索 ↗</Button></a>)
                          : <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleInitiateConversation(visitor.visitorId)}>发起对话</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={12} className="text-center text-gray-400 py-8">该站点暂无访客</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">
              共 {filtered.length} 个访客{selectedIds.length > 0 && ` · 已选 ${selectedIds.length}`}
              {selectedIds.length >= 2 && '（≥2 个可合并为同一人）'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>上一页</Button>
              <span className="text-sm text-gray-600 px-2">第 {page} 页</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 单访客下钻：多周期（按天）+ 单周期（本次会话） */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-2xl max-h-[82vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              访客详情 · {activeVisitor?.visitorName ?? '匿名访客'}
              <span className="ml-2 text-xs font-normal text-gray-400 font-mono">{activeVisitorId}</span>
            </DialogTitle>
          </DialogHeader>

          {activeVisitor && (
            <div className="mt-2">
              {/* 概要 */}
              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <div className="bg-gray-50 rounded p-2"><div className="text-lg font-bold text-gray-800">{activeVisitor.sessionCount}</div><div className="text-xs text-gray-400">访问周期</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-lg font-bold text-gray-800">{activeVisitor.dailyStats.length}</div><div className="text-xs text-gray-400">活跃天数</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-lg font-bold text-gray-800">{formatDwell(activeVisitor.totalDwellSeconds)}</div><div className="text-xs text-gray-400">累计停留</div></div>
                <div className="bg-gray-50 rounded p-2"><div className="text-lg font-bold text-gray-800">{activeVisitor.keyPageRepeatVisits}</div><div className="text-xs text-gray-400">关键页重访</div></div>
              </div>

              <Tabs defaultValue="daily">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="daily">多周期 · 按天历史</TabsTrigger>
                  <TabsTrigger value="session">单周期 · 本次会话</TabsTrigger>
                </TabsList>

                {/* 多周期：按天统计 */}
                <TabsContent value="daily">
                  <div className="space-y-3 mt-1">
                    {/* 每天会话数迷你柱状 */}
                    <div className="flex items-end gap-2 h-24 px-1">
                      {activeVisitor.dailyStats.map((d) => (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-[10px] text-gray-500">{d.sessions}</div>
                          <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(d.sessions / maxDaySessions) * 70}px` }} />
                          <div className="text-[10px] text-gray-400">{d.date.slice(5)}</div>
                        </div>
                      ))}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>日期</TableHead><TableHead className="text-center">会话</TableHead>
                          <TableHead>停留</TableHead><TableHead className="text-center">浏览页</TableHead>
                          <TableHead className="text-center">最深滚动</TableHead><TableHead className="text-center">关键页</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...activeVisitor.dailyStats].reverse().map((d) => (
                          <TableRow key={d.date}>
                            <TableCell className="text-sm">{d.date}</TableCell>
                            <TableCell className="text-center">{d.sessions}</TableCell>
                            <TableCell className="text-sm">{formatDwell(d.dwellSeconds)}</TableCell>
                            <TableCell className="text-center">{d.pagesViewed}</TableCell>
                            <TableCell className="text-center">{d.maxScrollPercent}%</TableCell>
                            <TableCell className="text-center">{d.hadKeyPage ? <span className="text-green-600">✓</span> : <span className="text-gray-300">—</span>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* 单周期：本次会话事件流 */}
                <TabsContent value="session">
                  <div className="space-y-1 mt-1">
                    {mockVisitorEventsData.map((event) => (
                      <div key={event.eventId} className="flex gap-3 items-start border-l-2 border-blue-200 pl-3 pb-4 relative">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                        <span className="text-lg leading-none mt-0.5">{eventIcon(event.eventType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{event.eventType.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-400">{new Date(event.eventTime).toLocaleTimeString('zh-CN')}</span>
                          </div>
                          <div className="text-xs text-blue-600 truncate">{event.pageUrl}</div>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                            {Object.entries(event.props).map(([k, v]) => (
                              <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded">{k}: <strong>{String(v)}</strong></span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 手动合并访客弹窗 */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>合并为同一人</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-gray-600">管理员确认以下访客为<strong>同一个人</strong>（如换设备/换浏览器）。选主访客，其余访客的按天历史与会话将合并到主记录，统一 unified_id。</p>
            <div className="space-y-2">
              {selectedVisitors.map((v, i) => (
                <label key={v.visitorId} className="flex items-center gap-2 border rounded p-2 cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="primary-visitor" defaultChecked={i === 0} />
                  <div className="flex-1">
                    <span className="text-sm">{v.visitorName ?? '匿名访客'} <span className="font-mono text-xs text-gray-400">{v.visitorId}</span></span>
                    <div className="text-xs text-gray-400">{SITE_MAP[v.siteId].flag} {SITE_MAP[v.siteId].name} · {v.ip} · {v.sessionCount} 周期</div>
                  </div>
                  {i === 0 && <Badge className="text-[10px] bg-blue-50 text-blue-600">主记录</Badge>}
                </label>
              ))}
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">⚠️ 合并不可自动撤销，请确认确为同一人。同 IP 不等于同一人。</div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setMergeOpen(false)}>取消</Button>
              <Button size="sm" className="bg-blue-600" onClick={() => { handleMergeVisitors(selectedIds[0], selectedIds.slice(1)); setMergeOpen(false); setSelectedIds([]); }}>确认合并</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 指标口径设置（运营方可配置：开启的条件/信号才计入计数）*/}
      <Dialog open={metricCfgOpen} onOpenChange={setMetricCfgOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>指标口径设置</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 mt-1">运营方自定义「有效互动会话」与「流失前兆」的判定规则。<strong>开启的条件/信号才计入对应指标卡的计数</strong>；底层事件始终采集，这里只调口径。</p>

          {/* 有效互动会话 */}
          <div className="border rounded-lg p-3 mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-800">有效互动会话</span>
                <p className="text-xs text-gray-500">满足下列条件的会话才算"有效互动"（校准跳出率）</p>
              </div>
              <Switch checked={metricCfg.effective.enabled}
                onCheckedChange={(v) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, enabled: v } })} />
            </div>
            {metricCfg.effective.enabled && (
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={metricCfg.effective.scroll.on}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, scroll: { ...metricCfg.effective.scroll, on: e.target.checked } } })} />
                  <span className="text-gray-600">滚动深度 ≥</span>
                  <Input className="w-16 h-7" type="number" value={metricCfg.effective.scroll.min}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, scroll: { ...metricCfg.effective.scroll, min: +e.target.value } } })} />
                  <span className="text-gray-500">%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={metricCfg.effective.dwell.on}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, dwell: { ...metricCfg.effective.dwell, on: e.target.checked } } })} />
                  <span className="text-gray-600">停留时长 ≥</span>
                  <Input className="w-16 h-7" type="number" value={metricCfg.effective.dwell.min}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, dwell: { ...metricCfg.effective.dwell, min: +e.target.value } } })} />
                  <span className="text-gray-500">秒</span>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={metricCfg.effective.click.on}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, click: { on: e.target.checked } } })} />
                  <span className="text-gray-600">发生点击 / CTA 点击</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={metricCfg.effective.chat.on}
                    onChange={(e) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, chat: { on: e.target.checked } } })} />
                  <span className="text-gray-600">发起对话</span>
                </label>
                <div className="flex items-center gap-2 text-sm pt-1">
                  <span className="text-gray-500">满足方式</span>
                  <Select value={metricCfg.effective.matchMode}
                    onValueChange={(v) => setMetricCfg({ ...metricCfg, effective: { ...metricCfg.effective, matchMode: v as 'all' | 'any' } })}>
                    <SelectTrigger className="w-32 h-7"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部满足</SelectItem>
                      <SelectItem value="any">任一满足</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* 流失前兆 */}
          <div className="border rounded-lg p-3 mt-3 space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-800">流失前兆</span>
              <p className="text-xs text-gray-500">每种信号单独开关，<strong>开启后才计入「流失前兆触发」计数</strong></p>
            </div>
            <div className="flex items-center justify-between">
              <div><span className="text-sm text-gray-700">移向关闭</span><p className="text-xs text-gray-400">鼠标上移越过页面顶部</p></div>
              <Switch checked={metricCfg.churn.move_to_close.on}
                onCheckedChange={(v) => setMetricCfg({ ...metricCfg, churn: { ...metricCfg.churn, move_to_close: { on: v } } })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-700">切 Tab</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                  <input type="checkbox" checked={metricCfg.churn.tab_switch.onlyUnsubmitted}
                    disabled={!metricCfg.churn.tab_switch.on}
                    onChange={(e) => setMetricCfg({ ...metricCfg, churn: { ...metricCfg.churn, tab_switch: { ...metricCfg.churn.tab_switch, onlyUnsubmitted: e.target.checked } } })} />
                  仅未留资会话计入
                </label>
              </div>
              <Switch checked={metricCfg.churn.tab_switch.on}
                onCheckedChange={(v) => setMetricCfg({ ...metricCfg, churn: { ...metricCfg.churn, tab_switch: { ...metricCfg.churn.tab_switch, on: v } } })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-sm text-gray-700">表单中断</span>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <span>无输入超时</span>
                    <Input className="w-14 h-6" type="number" value={metricCfg.churn.form_interrupt.idleSec}
                      disabled={!metricCfg.churn.form_interrupt.on}
                      onChange={(e) => setMetricCfg({ ...metricCfg, churn: { ...metricCfg.churn, form_interrupt: { ...metricCfg.churn.form_interrupt, idleSec: +e.target.value } } })} />
                    <span>秒</span>
                  </div>
                </div>
              </div>
              <Switch checked={metricCfg.churn.form_interrupt.on}
                onCheckedChange={(v) => setMetricCfg({ ...metricCfg, churn: { ...metricCfg.churn, form_interrupt: { ...metricCfg.churn.form_interrupt, on: v } } })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button size="sm" variant="outline" onClick={() => setMetricCfg(DEFAULT_METRIC_CFG)}>恢复默认</Button>
            <Button size="sm" variant="outline" onClick={() => setMetricCfgOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={() => { handleSaveMetricConfig(metricCfg); setMetricCfgOpen(false); }}>保存口径</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
