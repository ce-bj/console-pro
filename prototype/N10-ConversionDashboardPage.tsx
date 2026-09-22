import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type TimeRange = 'today' | '7d' | '30d' | 'custom';
type AbTestStatus = 'running' | 'significant' | 'not_significant' | 'ended';

interface NorthstarStats {
  lcr: {
    value: number;
    change: number;
    validLeads: number;
    totalSessions: number;
    miniTrend: number[];
  };
  csat: {
    value: number;
    change: number;
    distribution: { score: number; count: number }[];
  };
  ticketCloseRate: {
    value: number;
    change: number;
    fcrRate: number;
  };
}

interface FunnelStep {
  stepName: string;
  count: number;
  conversionRate: number;
  rateChange: number;
}

interface TrendDataPoint {
  date: string;
  lcr: number;
  csatScore: number;
  ticketCloseRate: number;
}

interface SegmentData {
  dimension: string;
  segments: { label: string; lcr: number; count: number }[];
}

interface AbTestItem {
  testId: string;
  name: string;
  status: AbTestStatus;
  startDate: string;
  experimentGroupSize: number;
  controlGroupSize: number;
  targetSampleSize: number;
  experimentLcr: number;
  controlLcr: number;
  pValue: number;
  sigmaScore: number;
  isSignificant: boolean;
}

// ── DataSlot: 北极星指标 ─────────────────────────────────────────
const mockNorthstarStats: NorthstarStats = {
  lcr: {
    value: 8.3,
    change: 1.2,
    validLeads: 198,
    totalSessions: 2384,
    miniTrend: [5.1, 6.2, 5.8, 7.0, 7.5, 8.0, 8.3],
  },
  csat: {
    value: 87.4,
    change: 2.1,
    distribution: [
      { score: 5, count: 62 },
      { score: 4, count: 21 },
      { score: 3, count: 8 },
      { score: 2, count: 5 },
      { score: 1, count: 4 },
    ],
  },
  ticketCloseRate: {
    value: 76.5,
    change: -0.8,
    fcrRate: 54.2,
  },
};

// DataSlot: 转化漏斗
const mockFunnelData: FunnelStep[] = [
  { stepName: '进站会话', count: 2384, conversionRate: 100, rateChange: 0 },
  { stepName: '进入对话', count: 718, conversionRate: 30.1, rateChange: 2.3 },
  { stepName: '有效留资', count: 198, conversionRate: 27.6, rateChange: 1.2 },
  { stepName: '合格线索 SQL', count: 89, conversionRate: 44.9, rateChange: -0.5 },
  { stepName: '工单闭环', count: 68, conversionRate: 76.4, rateChange: 3.1 },
  { stepName: '续约留存', count: 41, conversionRate: 60.3, rateChange: 0 },
];

// DataSlot: 趋势数据
const mockTrendData: TrendDataPoint[] = [
  { date: '06/01', lcr: 5.8, csatScore: 84.1, ticketCloseRate: 71.2 },
  { date: '06/02', lcr: 6.2, csatScore: 85.0, ticketCloseRate: 73.4 },
  { date: '06/03', lcr: 7.0, csatScore: 86.2, ticketCloseRate: 75.1 },
  { date: '06/04', lcr: 8.3, csatScore: 87.4, ticketCloseRate: 76.5 },
];

// DataSlot: 分群分析数据
const mockSegmentData: SegmentData[] = [
  {
    dimension: 'industry',
    segments: [
      { label: '制造业', lcr: 10.2, count: 680 },
      { label: 'IT / 科技', lcr: 9.1, count: 512 },
      { label: '外贸 / 电商', lcr: 7.8, count: 423 },
      { label: '金融', lcr: 6.3, count: 211 },
    ],
  },
  {
    dimension: 'channel',
    segments: [
      { label: '直接访问', lcr: 9.5, count: 890 },
      { label: '搜索引擎', lcr: 8.1, count: 743 },
      { label: '社交媒体', lcr: 6.7, count: 421 },
      { label: '邮件营销', lcr: 11.3, count: 330 },
    ],
  },
];

// DataSlot: A/B 实验列表
const mockAbTestsData: AbTestItem[] = [
  {
    testId: 'ab-001',
    name: '对话 Widget 主动招呼 A/B',
    status: 'significant',
    startDate: '2026-05-20',
    experimentGroupSize: 892,
    controlGroupSize: 876,
    targetSampleSize: 800,
    experimentLcr: 9.8,
    controlLcr: 7.1,
    pValue: 0.021,
    sigmaScore: 2.31,
    isSignificant: true,
  },
  {
    testId: 'ab-002',
    name: '快捷选项组件 vs 纯文本输入',
    status: 'running',
    startDate: '2026-06-01',
    experimentGroupSize: 412,
    controlGroupSize: 398,
    targetSampleSize: 800,
    experimentLcr: 8.5,
    controlLcr: 7.8,
    pValue: 0.18,
    sigmaScore: 0.92,
    isSignificant: false,
  },
  {
    testId: 'ab-003',
    name: '流失拦截弹窗触发策略',
    status: 'running',
    startDate: '2026-06-03',
    experimentGroupSize: 201,
    controlGroupSize: 195,
    targetSampleSize: 800,
    experimentLcr: 8.1,
    controlLcr: 7.9,
    pValue: 0.44,
    sigmaScore: 0.14,
    isSignificant: false,
  },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 导出报告 [GET] /api/analytics/export
function handleExportReport(timeRange: string, site: string): void {
  console.log('export analytics report', { timeRange, site });
  alert('报告生成中，稍后将发送到您的邮箱。');
}

// ACTION: 查看A/B实验详情 [GET] /api/analytics/ab-tests/{test_id}
function handleViewAbTestDetail(testId: string): void {
  console.log('view ab test detail', testId);
}

// ── 辅助函数 ──────────────────────────────────────────────────────
function changeText(change: number): { label: string; cls: string } {
  const up = change >= 0;
  return {
    label: `${up ? '↑' : '↓'}${Math.abs(change).toFixed(1)}%`,
    cls: up ? 'text-green-600' : 'text-red-500',
  };
}

function progressWidth(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

// ── 简易趋势迷你图（SVG 折线） ────────────────────────────────────
function MiniTrendLine({ values, color }: { values: number[]; color: string }) {
  const W = 80, H = 32, PAD = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xs = values.map((_, i) => PAD + (i / (values.length - 1)) * (W - PAD * 2));
  const ys = values.map((v) => PAD + ((max - v) / range) * (H - PAD * 2));
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  return (
    <svg width={W} height={H}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── 横向漏斗图 ────────────────────────────────────────────────────
function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const maxCount = steps[0].count;
  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const barWidth = (step.count / maxCount) * 100;
        const { label: changeLabel, cls } = changeText(step.rateChange);
        return (
          <div key={step.stepName} className="flex items-center gap-3">
            <div className="w-28 text-xs text-gray-600 text-right shrink-0">{step.stepName}</div>
            <div className="flex-1 relative">
              <div className="h-8 rounded" style={{ width: `${barWidth}%`, background: COLORS[i] }} />
              <span className="absolute left-2 top-1.5 text-white text-xs font-medium">
                {step.count.toLocaleString()}
              </span>
            </div>
            <div className="w-20 text-right shrink-0">
              {i > 0 && (
                <div className="text-xs text-gray-500">{step.conversionRate}%</div>
              )}
              {i > 0 && step.rateChange !== 0 && (
                <div className={`text-xs ${cls}`}>{changeLabel}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CSAT 分布小图 ────────────────────────────────────────────────
function CsatDistribution({ data }: { data: { score: number; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex gap-1 h-6 items-end">
      {data.map((d) => {
        const pct = (d.count / total) * 100;
        const color = d.score >= 4 ? '#22c55e' : d.score === 3 ? '#f59e0b' : '#ef4444';
        return (
          <div key={d.score} title={`${d.score}星: ${d.count}条`}
            className="flex-1 rounded-sm"
            style={{ height: `${pct}%`, background: color, minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
}

// ── LCR 趋势折线（简单文字表） ───────────────────────────────────
function TrendTable({ data }: { data: TrendDataPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            <th className="text-left py-1 font-normal">日期</th>
            <th className="text-right py-1 font-normal">LCR</th>
            <th className="text-right py-1 font-normal">CSAT</th>
            <th className="text-right py-1 font-normal">工单闭环</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.date} className="border-b border-gray-50">
              <td className="py-1.5 text-gray-600">{row.date}</td>
              <td className="py-1.5 text-right text-blue-600 font-medium">{row.lcr}%</td>
              <td className="py-1.5 text-right text-green-600">{row.csatScore}%</td>
              <td className="py-1.5 text-right text-yellow-600">{row.ticketCloseRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function ConversionDashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [segmentTab, setSegmentTab] = useState<string>('industry');
  const [abDetailOpen, setAbDetailOpen] = useState<boolean>(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const stats = mockNorthstarStats;
  const activeTest = mockAbTestsData.find((t) => t.testId === activeTestId);
  const currentSegment = mockSegmentData.find((s) => s.dimension === segmentTab);

  function openAbDetail(testId: string): void {
    setActiveTestId(testId);
    handleViewAbTestDetail(testId);
    setAbDetailOpen(true);
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">转化看板</h1>
        <div className="flex gap-2">
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="切换网站" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部网站</SelectItem>
              <SelectItem value="main">主站（demo.html）</SelectItem>
              <SelectItem value="en">英文站</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="7d">最近 7 天</SelectItem>
              <SelectItem value="30d">最近 30 天</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm"
            onClick={() => handleExportReport(timeRange, siteFilter)}>
            导出报告
          </Button>
        </div>
      </div>

      {/* 北极星指标卡 */}
      <div className="grid grid-cols-3 gap-5">
        {/* LCR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">留资转化率 LCR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold text-blue-600">{stats.lcr.value}</span>
                <span className="text-lg text-gray-500 ml-1">%</span>
              </div>
              <MiniTrendLine values={stats.lcr.miniTrend} color="#3b82f6" />
            </div>
            <div className={`text-sm ${changeText(stats.lcr.change).cls}`}>
              {changeText(stats.lcr.change).label} 环比上周
            </div>
            <div className="text-xs text-gray-400">
              {stats.lcr.validLeads} 有效留资 / {stats.lcr.totalSessions.toLocaleString()} 进站会话
            </div>
          </CardContent>
        </Card>

        {/* CSAT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">客户满意度 CSAT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold text-green-600">{stats.csat.value}</span>
                <span className="text-lg text-gray-500 ml-1">%</span>
              </div>
              <div className="w-20">
                <CsatDistribution data={stats.csat.distribution} />
              </div>
            </div>
            <div className={`text-sm ${changeText(stats.csat.change).cls}`}>
              {changeText(stats.csat.change).label} 环比上周
            </div>
            <div className="text-xs text-gray-400">
              最近 {stats.csat.distribution.reduce((s, d) => s + d.count, 0)} 条评价
            </div>
          </CardContent>
        </Card>

        {/* 工单闭环率 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal">工单闭环率</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-4xl font-bold text-yellow-600">{stats.ticketCloseRate.value}</span>
              <span className="text-lg text-gray-500 ml-1">%</span>
            </div>
            <div className={`text-sm ${changeText(stats.ticketCloseRate.change).cls}`}>
              {changeText(stats.ticketCloseRate.change).label} 环比上周
            </div>
            <div className="text-xs text-gray-400">
              首次解决率 FCR：<strong className="text-gray-700">{stats.ticketCloseRate.fcrRate}%</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 转化漏斗 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">转化漏斗</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={mockFunnelData} />
          <div className="mt-3 text-xs text-gray-400 flex gap-4">
            <span>端到端转化：进站 → 续约 = {((mockFunnelData[5].count / mockFunnelData[0].count) * 100).toFixed(2)}%</span>
            <span>↑ 环比指标含本周 A/B 实验数据</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        {/* 趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">指标趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendTable data={mockTrendData} />
          </CardContent>
        </Card>

        {/* 分群分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">分群分析（LCR）</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={segmentTab} onValueChange={setSegmentTab}>
              <TabsList className="mb-3 h-8">
                <TabsTrigger value="industry" className="text-xs">行业</TabsTrigger>
                <TabsTrigger value="channel" className="text-xs">渠道</TabsTrigger>
              </TabsList>
              {['industry', 'channel'].map((dim) => (
                <TabsContent key={dim} value={dim}>
                  <div className="space-y-2">
                    {(mockSegmentData.find((s) => s.dimension === dim)?.segments ?? []).map((seg) => (
                      <div key={seg.label} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-gray-600 text-right shrink-0">{seg.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                          <div
                            className="h-5 bg-blue-400 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(seg.lcr / 12) * 100}%` }}
                          >
                            <span className="text-white text-xs font-medium">{seg.lcr}%</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right">{seg.count}次</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* A/B 实验状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">A/B 实验状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAbTestsData.map((test) => {
              const sampleProgress = progressWidth(
                test.experimentGroupSize + test.controlGroupSize,
                test.targetSampleSize * 2,
              );
              return (
                <div key={test.testId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openAbDetail(test.testId)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{test.name}</span>
                        <Badge className={`text-xs ${
                          test.status === 'significant' ? 'bg-green-100 text-green-700' :
                          test.status === 'running' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {test.status === 'significant' ? '✓ 显著' :
                           test.status === 'running' ? '进行中' : '已结束'}
                        </Badge>
                        {test.isSignificant && (
                          <Badge className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            σ = {test.sigmaScore.toFixed(2)} &gt; 1.96
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        开始：{test.startDate} · 实验组 {test.experimentLcr}% vs 对照组 {test.controlLcr}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">样本量进度</div>
                      <div className="text-sm font-medium">{sampleProgress}%</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${test.isSignificant ? 'bg-green-500' : 'bg-blue-400'}`}
                        style={{ width: `${sampleProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* A/B 实验详情弹窗 */}
      <Dialog open={abDetailOpen} onOpenChange={setAbDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>A/B 实验详情</DialogTitle>
          </DialogHeader>
          {activeTest && (
            <div className="space-y-4 mt-2">
              <p className="font-medium">{activeTest.name}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">实验组 LCR</div>
                  <div className="text-2xl font-bold text-blue-600">{activeTest.experimentLcr}%</div>
                  <div className="text-xs text-gray-400">n = {activeTest.experimentGroupSize}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">对照组 LCR</div>
                  <div className="text-2xl font-bold text-gray-600">{activeTest.controlLcr}%</div>
                  <div className="text-xs text-gray-400">n = {activeTest.controlGroupSize}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">p 值</span>
                  <span className="font-medium">{activeTest.pValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">σ（标准误差比）</span>
                  <span className="font-medium">{activeTest.sigmaScore.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">统计显著</span>
                  <Badge className={activeTest.isSignificant ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {activeTest.isSignificant ? '是（σ > 1.96）' : '否，继续采样'}
                  </Badge>
                </div>
              </div>
              {activeTest.isSignificant && (
                <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  实验组 LCR 比对照组高 {(activeTest.experimentLcr - activeTest.controlLcr).toFixed(1)}%，
                  达到统计显著标准，建议全量推广实验方案。
                </div>
              )}
              {!activeTest.isSignificant && (
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                  当前样本量不足，σ = {activeTest.sigmaScore.toFixed(2)} &lt; 1.96，
                  需继续采样至目标量 {activeTest.targetSampleSize * 2} 后再判断。
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
