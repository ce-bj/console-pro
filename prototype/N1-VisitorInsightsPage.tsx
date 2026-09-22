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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type VisitorType = 'all' | 'anonymous' | 'identified';
type IntentLevel = 'high' | 'medium' | 'low';
type ChurnSignal = 'move_to_close' | 'form_interrupt' | 'tab_switch' | 'none';
type EventType = 'page_view' | 'scroll_depth' | 'click' | 'page_leave';
type TimeRange = 'today' | '7d' | '30d' | 'custom';

interface VisitorStats {
  todaySessions: number;
  todaySessionsChange: number;
  effectiveInteractionSessions: number;
  effectiveInteractionChange: number;
  keyPageVisits: number;
  keyPageVisitsChange: number;
  churnSignalCount: number;
  churnSignalChange: number;
}

interface VisitorItem {
  visitorId: string;
  companyName: string | null;
  region: string;
  regionFlag: string;
  visitCount: number;
  keyPageRepeatVisits: number;
  maxScrollPercent: number;
  dwellTimeSeconds: number;
  churnSignal: ChurnSignal;
  intentLevel: IntentLevel;
  lastVisitTime: string;
  isIdentified: boolean;
}

interface BehaviorEvent {
  eventId: string;
  eventType: EventType;
  pageUrl: string;
  eventTime: string;
  props: Record<string, string | number | boolean>;
}

// ── DataSlot: 统计指标 ─────────────────────────────────────────────
const mockVisitorStats: VisitorStats = {
  todaySessions: 238,
  todaySessionsChange: 12.5,
  effectiveInteractionSessions: 87,
  effectiveInteractionChange: -3.2,
  keyPageVisits: 43,
  keyPageVisitsChange: 8.1,
  churnSignalCount: 19,
  churnSignalChange: -5.0,
};

// PAGINATION: page,pageSize
// DataSlot: 访客列表
const mockVisitorsData: VisitorItem[] = [
  {
    visitorId: 'anony-8821',
    companyName: 'Acme 科技有限公司',
    region: '北京',
    regionFlag: '🇨🇳',
    visitCount: 7,
    keyPageRepeatVisits: 3,
    maxScrollPercent: 87,
    dwellTimeSeconds: 342,
    churnSignal: 'move_to_close',
    intentLevel: 'high',
    lastVisitTime: '2026-06-04T10:23:00Z',
    isIdentified: true,
  },
  {
    visitorId: 'anony-4432',
    companyName: null,
    region: '上海',
    regionFlag: '🇨🇳',
    visitCount: 2,
    keyPageRepeatVisits: 1,
    maxScrollPercent: 50,
    dwellTimeSeconds: 89,
    churnSignal: 'tab_switch',
    intentLevel: 'medium',
    lastVisitTime: '2026-06-04T09:55:00Z',
    isIdentified: false,
  },
  {
    visitorId: 'anony-9901',
    companyName: 'Global Trade Co.',
    region: 'California',
    regionFlag: '🇺🇸',
    visitCount: 1,
    keyPageRepeatVisits: 0,
    maxScrollPercent: 25,
    dwellTimeSeconds: 18,
    churnSignal: 'none',
    intentLevel: 'low',
    lastVisitTime: '2026-06-04T08:10:00Z',
    isIdentified: false,
  },
  {
    visitorId: 'anony-3310',
    companyName: '深圳制造集团',
    region: '深圳',
    regionFlag: '🇨🇳',
    visitCount: 4,
    keyPageRepeatVisits: 2,
    maxScrollPercent: 75,
    dwellTimeSeconds: 210,
    churnSignal: 'form_interrupt',
    intentLevel: 'medium',
    lastVisitTime: '2026-06-04T11:05:00Z',
    isIdentified: true,
  },
];

// DataSlot: 访客行为事件流（抽屉用）
const mockVisitorEventsData: BehaviorEvent[] = [
  {
    eventId: 'e-001',
    eventType: 'page_view',
    pageUrl: '/demo.html',
    eventTime: '2026-06-04T10:20:00Z',
    props: { load_time_ms: 1200, viewport: '1440x900' },
  },
  {
    eventId: 'e-002',
    eventType: 'scroll_depth',
    pageUrl: '/demo.html',
    eventTime: '2026-06-04T10:20:45Z',
    props: { depth_percent: 50 },
  },
  {
    eventId: 'e-003',
    eventType: 'click',
    pageUrl: '/demo.html#pricing',
    eventTime: '2026-06-04T10:21:30Z',
    props: { element_text: '查看价格方案', is_cta: true },
  },
  {
    eventId: 'e-004',
    eventType: 'scroll_depth',
    pageUrl: '/demo.html#pricing',
    eventTime: '2026-06-04T10:22:10Z',
    props: { depth_percent: 87 },
  },
  {
    eventId: 'e-005',
    eventType: 'page_leave',
    pageUrl: '/demo.html',
    eventTime: '2026-06-04T10:23:00Z',
    props: { dwell_time_ms: 180000, max_scroll_percent: 87 },
  },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 获取访客行为事件 [GET] /api/visitors/{visitor_id}/events
function handleFetchVisitorEvents(visitorId: string): void {
  console.log('fetch visitor events', visitorId);
}

// ACTION: 发起对话 [POST] /api/sessions
function handleInitiateConversation(visitorId: string): void {
  console.log('initiate conversation with visitor', visitorId);
}

// ── 辅助函数 ──────────────────────────────────────────────────────
function formatDwell(seconds: number): string {
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function intentBadgeClass(level: IntentLevel): string {
  return {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-500 border-gray-200',
  }[level];
}

function intentLabel(level: IntentLevel): string {
  return { high: '高意向', medium: '中意向', low: '低意向' }[level];
}

function churnLabel(signal: ChurnSignal): string {
  return {
    move_to_close: '移向关闭',
    form_interrupt: '表单中断',
    tab_switch: '切 Tab',
    none: '无',
  }[signal];
}

function eventIcon(type: EventType): string {
  return { page_view: '📄', scroll_depth: '↕️', click: '👆', page_leave: '🚪' }[type];
}

function changeText(change: number): { label: string; cls: string } {
  const up = change >= 0;
  return {
    label: `${up ? '↑' : '↓'}${Math.abs(change)}%`,
    cls: up ? 'text-green-600' : 'text-red-500',
  };
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function VisitorInsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [visitorType, setVisitorType] = useState<VisitorType>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);

  function openTrajectoryDrawer(visitorId: string): void {
    setActiveVisitorId(visitorId);
    handleFetchVisitorEvents(visitorId);
    setDrawerOpen(true);
  }

  const stats = mockVisitorStats;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 页面标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">访客洞察</h1>
          <p className="text-sm text-gray-500 mt-0.5">实时监控访客行为与意向信号 · 每 10 分钟更新</p>
        </div>
        <Button variant="outline" size="sm">导出报告</Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="7d">最近 7 天</SelectItem>
                <SelectItem value="30d">最近 30 天</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="w-48"
              placeholder="来源网站筛选"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            />

            <Select value={visitorType} onValueChange={(v) => setVisitorType(v as VisitorType)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="访客类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部访客</SelectItem>
                <SelectItem value="anonymous">匿名访客</SelectItem>
                <SelectItem value="identified">已识别</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700">查询</Button>
          </div>
        </CardContent>
      </Card>

      {/* 四个指标卡 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '今日进站会话', value: stats.todaySessions, change: stats.todaySessionsChange, warn: false },
          { label: '有效互动会话', value: stats.effectiveInteractionSessions, change: stats.effectiveInteractionChange, warn: false },
          { label: '关键页访问数', value: stats.keyPageVisits, change: stats.keyPageVisitsChange, warn: false },
          { label: '流失前兆触发', value: stats.churnSignalCount, change: stats.churnSignalChange, warn: true },
        ].map((metric) => {
          const { label, cls } = changeText(metric.change);
          return (
            <Card key={metric.label} className={metric.warn ? 'border-orange-200' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 font-normal">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metric.warn ? 'text-orange-500' : 'text-gray-900'}`}>
                  {metric.value}
                </div>
                <div className={`text-sm mt-1 ${cls}`}>{label} 环比昨日</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 访客列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">访客列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>访客 / 企业</TableHead>
                <TableHead>地区</TableHead>
                <TableHead>访问次数</TableHead>
                <TableHead>关键页重访</TableHead>
                <TableHead className="min-w-[140px]">最深滚动</TableHead>
                <TableHead>停留时长</TableHead>
                <TableHead>流失前兆</TableHead>
                <TableHead>意向等级</TableHead>
                <TableHead>最近访问</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockVisitorsData.map((visitor) => (
                <TableRow key={visitor.visitorId}>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {visitor.isIdentified && (
                        <span className="mr-1 text-blue-500 text-xs">✓</span>
                      )}
                      {visitor.companyName ?? visitor.visitorId}
                    </div>
                    {visitor.companyName && (
                      <div className="text-xs text-gray-400">{visitor.visitorId}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="mr-1">{visitor.regionFlag}</span>
                    <span className="text-sm">{visitor.region}</span>
                  </TableCell>
                  <TableCell className="text-center">{visitor.visitCount}</TableCell>
                  <TableCell className="text-center">{visitor.keyPageRepeatVisits}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${visitor.maxScrollPercent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{visitor.maxScrollPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDwell(visitor.dwellTimeSeconds)}</TableCell>
                  <TableCell>
                    {visitor.churnSignal !== 'none' ? (
                      <Badge className="text-orange-600 bg-orange-50 border border-orange-200 text-xs">
                        {churnLabel(visitor.churnSignal)}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">无</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${intentBadgeClass(visitor.intentLevel)}`}>
                      {intentLabel(visitor.intentLevel)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(visitor.lastVisitTime).toLocaleString('zh-CN', {
                      month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => openTrajectoryDrawer(visitor.visitorId)}>
                        查看轨迹
                      </Button>
                      <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleInitiateConversation(visitor.visitorId)}>
                        发起对话
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* 分页 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">共 {mockVisitorsData.length} 条记录</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}>
                上一页
              </Button>
              <span className="text-sm text-gray-600 px-2">第 {page} 页</span>
              <Button variant="outline" size="sm"
                onClick={() => setPage((p) => p + 1)}>
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 行为轨迹详情抽屉（Dialog 模拟右侧抽屉） */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>行为轨迹 · {activeVisitorId}</DialogTitle>
          </DialogHeader>

          {/* 事件时间线 */}
          <div className="space-y-1 mt-2">
            {mockVisitorEventsData.map((event, idx) => (
              <div key={event.eventId}
                className="flex gap-3 items-start border-l-2 border-blue-200 pl-3 pb-4 relative">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <span className="text-lg leading-none mt-0.5">{eventIcon(event.eventType)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      {event.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(event.eventTime).toLocaleTimeString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 truncate">{event.pageUrl}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                    {Object.entries(event.props).map(([k, v]) => (
                      <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded">
                        {k}: <strong>{String(v)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 滚动深度里程碑分布 */}
          <div className="mt-4 border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">滚动深度里程碑达成次数</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { depth: '25%', count: 4 },
                { depth: '50%', count: 3 },
                { depth: '75%', count: 2 },
                { depth: '100%', count: 1 },
              ].map((milestone) => (
                <div key={milestone.depth}
                  className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-lg font-bold text-blue-600">{milestone.depth}</div>
                  <div className="text-xs text-gray-500 mt-1">到达 {milestone.count} 次</div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
