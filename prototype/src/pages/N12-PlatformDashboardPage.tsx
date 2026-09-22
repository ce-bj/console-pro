// N12 平台运营看板 — 产品后台视角（智能客服 Pro 数据看板）
// 对齐《知识库项目对齐智能客服Pro数据看板差距分析.md》产品后台需求
// 期次标注：P0=第一期必须、P1=第二期、P2=第三期

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AIQualityDashboard from './agent-quality/AIQualityDashboard';

// ══════════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════════

type DateRangeKey = '7d' | '30d' | '90d';
type CustomerTier = 'high' | 'medium' | 'low';
type CustomerStatus = 'active' | 'sleeping' | 'risk';

interface PlatformOverview {
  totalCustomers: number;
  activeCustomers: number;
  sleepingCustomers: number;
  riskCustomers: number;
  avgRecallRate: number;
  avgReplyRate: number;
  avgRagAccuracy: number;
  avgSatisfaction: number;
  totalLeads: number;
  totalSessions: number;
}

interface CustomerHealthScore {
  customerId: string;
  customerName: string;
  industry: string;
  tier: CustomerTier;
  status: CustomerStatus;
  healthScore: number;
  docCount: number;
  lastUpdate: string;
  recallRate: number;
  replyRate: number;
  blindSpotCount: number;
  handoffRate: number;
}

interface ReplyLossReason {
  code: string;
  label: string;
  count: number;
  percentage: number;
  affectedCustomers: number;
  owner: string;
}

interface CrossCustomerBlindspot {
  topic: string;
  occurrenceCount: number;
  affectedCustomers: number;
  topIndustry: string;
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
}

interface IndustryStats {
  industry: string;
  customerCount: number;
  avgRecallRate: number;
  avgReplyRate: number;
  avgRagAccuracy: number;
  avgSatisfaction: number;
  totalLeads: number;
}

// ══════════════════════════════════════════════════════════════════
// Mock 数据
// ══════════════════════════════════════════════════════════════════

// DataSlot: 平台总览数据
const mockPlatformOverview: PlatformOverview = {
  totalCustomers: 34,
  activeCustomers: 28,
  sleepingCustomers: 4,
  riskCustomers: 2,
  avgRecallRate: 98.7,
  avgReplyRate: 87.3,
  avgRagAccuracy: 92.1,
  avgSatisfaction: 84.2,
  totalLeads: 3847,
  totalSessions: 12456,
};

// DataSlot: 客户健康度列表
const mockCustomerHealth: CustomerHealthScore[] = [
  { customerId: 'cust_001', customerName: '某科技公司', industry: '制造', tier: 'high', status: 'active',
    healthScore: 94, docCount: 89, lastUpdate: '2026-07-02', recallRate: 99.8, replyRate: 94.2, blindSpotCount: 3, handoffRate: 5.2 },
  { customerId: 'cust_002', customerName: '某电商平台', industry: '电商', tier: 'high', status: 'active',
    healthScore: 91, docCount: 134, lastUpdate: '2026-07-01', recallRate: 99.5, replyRate: 91.8, blindSpotCount: 5, handoffRate: 6.8 },
  { customerId: 'cust_003', customerName: '某医疗机构', industry: '医疗', tier: 'medium', status: 'active',
    healthScore: 85, docCount: 56, lastUpdate: '2026-06-30', recallRate: 98.9, replyRate: 85.6, blindSpotCount: 8, handoffRate: 9.3 },
  { customerId: 'cust_004', customerName: '某教育平台', industry: '教育', tier: 'medium', status: 'sleeping',
    healthScore: 72, docCount: 42, lastUpdate: '2026-06-28', recallRate: 98.2, replyRate: 82.4, blindSpotCount: 12, handoffRate: 11.5 },
  { customerId: 'cust_005', customerName: '某金融服务', industry: '金融', tier: 'low', status: 'risk',
    healthScore: 58, docCount: 28, lastUpdate: '2026-06-25', recallRate: 96.8, replyRate: 78.3, blindSpotCount: 18, handoffRate: 15.2 },
  { customerId: 'cust_006', customerName: '某汽配公司', industry: '汽配', tier: 'medium', status: 'active',
    healthScore: 88, docCount: 67, lastUpdate: '2026-07-02', recallRate: 99.2, replyRate: 89.1, blindSpotCount: 6, handoffRate: 7.1 },
  { customerId: 'cust_007', customerName: '某能源企业', industry: '能源', tier: 'high', status: 'active',
    healthScore: 92, docCount: 102, lastUpdate: '2026-07-01', recallRate: 99.6, replyRate: 92.5, blindSpotCount: 4, handoffRate: 5.8 },
  { customerId: 'cust_008', customerName: '某政务平台', industry: '政务', tier: 'medium', status: 'sleeping',
    healthScore: 68, docCount: 38, lastUpdate: '2026-06-20', recallRate: 97.5, replyRate: 80.2, blindSpotCount: 15, handoffRate: 13.4 },
];

// DataSlot: 行业统计数据
const mockIndustryStats: IndustryStats[] = [
  { industry: '制造', customerCount: 12, avgRecallRate: 99.1, avgReplyRate: 89.4, avgRagAccuracy: 93.2, avgSatisfaction: 86.7, totalLeads: 1247 },
  { industry: '电商', customerCount: 8, avgRecallRate: 98.8, avgReplyRate: 88.2, avgRagAccuracy: 91.8, avgSatisfaction: 84.3, totalLeads: 892 },
  { industry: '医疗', customerCount: 6, avgRecallRate: 98.5, avgReplyRate: 86.9, avgRagAccuracy: 90.5, avgSatisfaction: 82.1, totalLeads: 645 },
  { industry: '教育', customerCount: 5, avgRecallRate: 97.9, avgReplyRate: 84.7, avgRagAccuracy: 88.6, avgSatisfaction: 79.4, totalLeads: 423 },
  { industry: '金融', customerCount: 3, avgRecallRate: 96.2, avgReplyRate: 80.3, avgRagAccuracy: 84.2, avgSatisfaction: 74.8, totalLeads: 178 },
];

// DataSlot: 跨客户回复损耗归因
const mockReplyLossReasons: ReplyLossReason[] = [
  { code: 'knowledge_missing', label: '知识缺失', count: 1247, percentage: 42.3, affectedCustomers: 18, owner: '知识运营' },
  { code: 'low_similarity', label: '召回相似度低', count: 892, percentage: 30.2, affectedCustomers: 14, owner: '算法/检索' },
  { code: 'rule_blocked', label: '规则拦截', count: 456, percentage: 15.4, affectedCustomers: 9, owner: '产品配置' },
  { code: 'model_refused', label: '模型拒答', count: 234, percentage: 7.9, affectedCustomers: 6, owner: '模型策略' },
  { code: 'system_error', label: '系统异常', count: 123, percentage: 4.2, affectedCustomers: 3, owner: '工程' },
];

// DataSlot: 平台跨客户知识盲区排行
const mockPlatformBlindspots: CrossCustomerBlindspot[] = [
  { topic: '私有化部署方案与报价边界', occurrenceCount: 234, affectedCustomers: 8, topIndustry: '制造 / 能源', suggestedAction: '沉淀标准方案文档，补齐实施周期与交付边界', priority: 'high' },
  { topic: 'API 调用频率与超额收费', occurrenceCount: 189, affectedCustomers: 6, topIndustry: '电商 / 金融', suggestedAction: '补 FAQ 与价格表字段，绑定计费规则答案', priority: 'high' },
  { topic: '数据迁移服务费用', occurrenceCount: 156, affectedCustomers: 5, topIndustry: '医疗 / 教育', suggestedAction: '新增迁移场景问答，明确免费/收费条件', priority: 'medium' },
  { topic: '多语言支持范围', occurrenceCount: 98, affectedCustomers: 4, topIndustry: '跨境电商', suggestedAction: '补支持语种、翻译策略和人工兜底说明', priority: 'medium' },
];

const metricRules = [
  { name: '知识库召回率', rule: '命中知识的对话轮次 / 发起检索的对话轮次 × 100%', note: '按客户会话量加权后汇总到平台均值' },
  { name: 'AI 回复率', rule: '最终返回有效 AI 答案轮次 / 召回成功轮次 × 100%', note: '拒答、规则拦截、系统异常都会进入回复损耗' },
  { name: 'RAG 准确率', rule: '命中且未点踩、未转人工、未被人工标错的轮次 / 命中知识轮次 × 100%', note: '用于识别“答了但答得不好”的问题' },
  { name: '客户健康分', rule: 'AI 质量 40% + 知识更新 25% + 覆盖盲区 15% + 使用活跃 20%', note: '低于 60 标高风险，60-75 进入观察队列' },
];

// ══════════════════════════════════════════════════════════════════
// 辅助函数
// ══════════════════════════════════════════════════════════════════

function getStatusLabel(status: CustomerStatus): string {
  return status === 'active' ? '活跃' : status === 'sleeping' ? '沉睡' : '高风险';
}

function getStatusColor(status: CustomerStatus): string {
  return status === 'active' ? 'bg-green-50 text-green-600' :
         status === 'sleeping' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
}

function getTierLabel(tier: CustomerTier): string {
  return tier === 'high' ? '高' : tier === 'medium' ? '中' : '低';
}

function getTierColor(tier: CustomerTier): string {
  return tier === 'high' ? 'bg-blue-50 text-blue-600' :
         tier === 'medium' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-500';
}

function getHealthColor(score: number): string {
  return score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';
}

function getMetricColor(value: number, type: 'rate' | 'satisfaction'): string {
  if (type === 'rate') {
    return value >= 95 ? 'text-green-600' : value >= 85 ? 'text-amber-600' : 'text-red-600';
  }
  return value >= 80 ? 'text-green-600' : value >= 70 ? 'text-amber-600' : 'text-red-600';
}

function getRiskReason(c: CustomerHealthScore): string {
  if (c.healthScore < 60) return '健康分低';
  if (c.replyRate < 85) return '回复率低';
  if (c.blindSpotCount >= 12) return '知识盲区多';
  if (c.status === 'sleeping') return '近期未更新';
  return '正常';
}

function getPriorityColor(priority: CrossCustomerBlindspot['priority']): string {
  return priority === 'high' ? 'bg-red-50 text-red-600' :
         priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600';
}

export default function PlatformDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeKey>('30d');
  const [tab, setTab] = useState('overview');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | CustomerTier>('all');

  const dateRangeLabel = dateRange === '7d' ? '近7天' : dateRange === '30d' ? '近30天' : '近90天';
  const replyLossGap = Number((mockPlatformOverview.avgRecallRate - mockPlatformOverview.avgReplyRate).toFixed(1));
  const avgBlindSpotCount = Number((mockCustomerHealth.reduce((sum, c) => sum + c.blindSpotCount, 0) / mockCustomerHealth.length).toFixed(1));
  const maxLossCount = Math.max(...mockReplyLossReasons.map((r) => r.count));
  const maxBlindspotCount = Math.max(...mockPlatformBlindspots.map((b) => b.occurrenceCount));
  const highRiskQueue = mockCustomerHealth
    .filter((c) => c.status === 'risk' || c.healthScore < 75 || c.replyRate < 85 || c.blindSpotCount >= 12)
    .sort((a, b) => a.healthScore - b.healthScore);

  // 客户健康度筛选
  const filteredCustomers = mockCustomerHealth.filter((c) => {
    if (industryFilter !== 'all' && c.industry !== industryFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 页头 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">平台运营看板</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            N12 · 平台跨客户视角 · 监控产品力、AI 质量、客户使用效果，指导产品迭代和客户成功跟进
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-400">统计范围：</span>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeKey)}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
              <SelectItem value="90d">近90天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="overview">平台总览</TabsTrigger>
          <TabsTrigger value="quality">跨客户质量诊断</TabsTrigger>
          <TabsTrigger value="customers">客户健康度</TabsTrigger>
          <TabsTrigger value="industry">行业分析</TabsTrigger>
        </TabsList>

        {/* 平台总览 */}
        <TabsContent value="overview">
          <div className="space-y-5">
            {/* P0-第一期：核心指标卡片 */}
            <div className="grid grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">总客户数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{mockPlatformOverview.totalCustomers}</div>
                  <div className="text-xs text-gray-400 mt-0.5">已开通智能客服</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">活跃客户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{mockPlatformOverview.activeCustomers}</div>
                  <div className="text-xs text-gray-400 mt-0.5">近30天有更新</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">沉睡客户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{mockPlatformOverview.sleepingCustomers}</div>
                  <div className="text-xs text-gray-400 mt-0.5">30天未更新</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">高风险客户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{mockPlatformOverview.riskCustomers}</div>
                  <div className="text-xs text-gray-400 mt-0.5">健康度 &lt; 60</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">总线索数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{mockPlatformOverview.totalLeads.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{dateRangeLabel}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-gray-500 font-normal">总会话数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{mockPlatformOverview.totalSessions.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{dateRangeLabel}</div>
                </CardContent>
              </Card>
            </div>

            {/* 平台平均 AI 质量指标 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  平台平均 AI 质量指标
                  <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
                  <span className="text-xs text-gray-400 font-normal">— {dateRangeLabel}，全客户加权平均</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">知识库召回率</div>
                    <div className={`text-3xl font-bold ${getMetricColor(mockPlatformOverview.avgRecallRate, 'rate')}`}>
                      {mockPlatformOverview.avgRecallRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">RAG 检索命中</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">AI 回复率</div>
                    <div className={`text-3xl font-bold ${getMetricColor(mockPlatformOverview.avgReplyRate, 'rate')}`}>
                      {mockPlatformOverview.avgReplyRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">召回后给出回答</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">RAG 准确率</div>
                    <div className={`text-3xl font-bold ${getMetricColor(mockPlatformOverview.avgRagAccuracy, 'rate')}`}>
                      {mockPlatformOverview.avgRagAccuracy}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">命中且未点踩/转人工</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">满意度</div>
                    <div className={`text-3xl font-bold ${getMetricColor(mockPlatformOverview.avgSatisfaction, 'satisfaction')}`}>
                      {mockPlatformOverview.avgSatisfaction}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">用户点赞比例</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">本期平台判断</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>召回到回复损耗</span>
                    <span className="font-semibold text-amber-600">{replyLossGap}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>单客户平均盲区</span>
                    <span className="font-semibold text-red-600">{avgBlindSpotCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>需客户成功介入</span>
                    <span className="font-semibold text-blue-600">{highRiskQueue.length} 家</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">平台指标计算口径</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {metricRules.slice(0, 4).map((item) => (
                      <div key={item.name} className="rounded border bg-white p-3">
                        <div className="text-xs font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.rule}</div>
                        <div className="text-[11px] text-gray-400 mt-1">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 跨客户质量诊断 */}
        <TabsContent value="quality">
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  平台跨客户质量诊断
                  <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
                  <span className="text-xs text-gray-400 font-normal">— 从所有客户对话中定位共性问题、风险客户和产品改进项</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">召回到回复损耗</div>
                    <div className="text-3xl font-bold text-amber-600">{replyLossGap}%</div>
                    <div className="text-xs text-gray-500 mt-1">召回率 - 回复率</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">风险客户队列</div>
                    <div className="text-3xl font-bold text-red-600">{highRiskQueue.length}</div>
                    <div className="text-xs text-gray-500 mt-1">低分/低回复/盲区多</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">平均知识盲区</div>
                    <div className="text-3xl font-bold text-purple-600">{avgBlindSpotCount}</div>
                    <div className="text-xs text-gray-500 mt-1">每客户待补主题数</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">共性盲区主题</div>
                    <div className="text-3xl font-bold text-blue-600">{mockPlatformBlindspots.length}</div>
                    <div className="text-xs text-gray-500 mt-1">影响 4 家以上客户</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-white">
                    <div className="text-xs text-gray-400 mb-1">需产品/算法介入</div>
                    <div className="text-3xl font-bold text-gray-900">2</div>
                    <div className="text-xs text-gray-500 mt-1">相似度低 / 模型拒答</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">回复损耗归因</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockReplyLossReasons.map((r) => (
                    <div key={r.code}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{r.label}</span>
                        <span className="text-gray-500">{r.count.toLocaleString()} 次 · {r.percentage}% · {r.affectedCustomers} 家客户</span>
                      </div>
                      <div className="h-2 rounded bg-gray-100 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${(r.count / maxLossCount) * 100}%` }} />
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">责任归口：{r.owner}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">客户风险队列</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>客户</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>健康分</TableHead>
                        <TableHead>回复率</TableHead>
                        <TableHead>风险原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {highRiskQueue.map((c) => (
                        <TableRow key={c.customerId}>
                          <TableCell className="font-medium">{c.customerName}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getStatusColor(c.status)}`}>
                              {getStatusLabel(c.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className={getHealthColor(c.healthScore)}>{c.healthScore}</TableCell>
                          <TableCell className={getMetricColor(c.replyRate, 'rate')}>{c.replyRate}%</TableCell>
                          <TableCell className="text-xs text-gray-600">{getRiskReason(c)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">跨客户知识盲区排行</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>盲区主题</TableHead>
                      <TableHead>出现次数</TableHead>
                      <TableHead>影响客户</TableHead>
                      <TableHead>主要行业</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>建议动作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPlatformBlindspots.map((b) => (
                      <TableRow key={b.topic}>
                        <TableCell className="font-medium">
                          <div>{b.topic}</div>
                          <div className="mt-1 h-1.5 rounded bg-gray-100 overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${(b.occurrenceCount / maxBlindspotCount) * 100}%` }} />
                          </div>
                        </TableCell>
                        <TableCell>{b.occurrenceCount}</TableCell>
                        <TableCell>{b.affectedCustomers} 家</TableCell>
                        <TableCell className="text-xs text-gray-600">{b.topIndustry}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getPriorityColor(b.priority)}`}>
                            {b.priority === 'high' ? '高' : b.priority === 'medium' ? '中' : '低'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-sm">{b.suggestedAction}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <AIQualityDashboard />
          </div>
        </TabsContent>

        {/* 客户健康度 */}
        <TabsContent value="customers">
          <div className="space-y-5">
            {/* 筛选器 */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-4 items-center">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">客户状态：</span>
                    <div className="flex gap-1">
                      {(['all', 'active', 'sleeping', 'risk'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-2.5 py-1 rounded text-xs ${
                            statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s === 'all' ? '全部' : getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">行业筛选：</span>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="制造">制造</SelectItem>
                        <SelectItem value="电商">电商</SelectItem>
                        <SelectItem value="医疗">医疗</SelectItem>
                        <SelectItem value="教育">教育</SelectItem>
                        <SelectItem value="金融">金融</SelectItem>
                        <SelectItem value="汽配">汽配</SelectItem>
                        <SelectItem value="能源">能源</SelectItem>
                        <SelectItem value="政务">政务</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">客户档次：</span>
                    <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as 'all' | CustomerTier)}>
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="low">低</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 客户健康度列表 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  客户健康度列表
                  <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
                  <span className="text-xs text-gray-400 font-normal">— 识别高风险客户、沉睡客户，支撑客户成功跟进</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户</TableHead>
                      <TableHead>行业</TableHead>
                      <TableHead>档次</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>健康分</TableHead>
                      <TableHead>风险原因</TableHead>
                      <TableHead>文档数</TableHead>
                      <TableHead>召回率</TableHead>
                      <TableHead>回复率</TableHead>
                      <TableHead>回复损耗</TableHead>
                      <TableHead>盲区数</TableHead>
                      <TableHead>转人工率</TableHead>
                      <TableHead>最近更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center text-sm text-gray-400 py-8">
                          当前筛选条件下无客户数据
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredCustomers.map((c) => (
                      <TableRow key={c.customerId}>
                        <TableCell className="font-medium">{c.customerName}</TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-gray-100 text-gray-600">{c.industry}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getTierColor(c.tier)}`}>
                            {getTierLabel(c.tier)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusColor(c.status)}`}>
                            {getStatusLabel(c.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-lg font-semibold ${getHealthColor(c.healthScore)}`}>
                            {c.healthScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{getRiskReason(c)}</TableCell>
                        <TableCell>{c.docCount}</TableCell>
                        <TableCell className={getMetricColor(c.recallRate, 'rate')}>
                          {c.recallRate}%
                        </TableCell>
                        <TableCell className={getMetricColor(c.replyRate, 'rate')}>
                          {c.replyRate}%
                        </TableCell>
                        <TableCell className="text-xs text-amber-600">
                          {(c.recallRate - c.replyRate).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${c.blindSpotCount > 10 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            {c.blindSpotCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{c.handoffRate}%</TableCell>
                        <TableCell className="text-xs text-gray-400">{c.lastUpdate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 行业分析 */}
        <TabsContent value="industry">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                行业质量统计
                <Badge className="text-xs bg-purple-50 text-purple-600">P1-第二期</Badge>
                <span className="text-xs text-gray-400 font-normal">— 指导行业销售策略与产品适配</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>行业</TableHead>
                    <TableHead>客户数</TableHead>
                    <TableHead>平均召回率</TableHead>
                    <TableHead>平均回复率</TableHead>
                    <TableHead>平均准确率</TableHead>
                    <TableHead>平均满意度</TableHead>
                    <TableHead>总线索数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIndustryStats.map((ind) => (
                    <TableRow key={ind.industry}>
                      <TableCell className="font-medium">{ind.industry}</TableCell>
                      <TableCell>{ind.customerCount}</TableCell>
                      <TableCell className={getMetricColor(ind.avgRecallRate, 'rate')}>
                        {ind.avgRecallRate}%
                      </TableCell>
                      <TableCell className={getMetricColor(ind.avgReplyRate, 'rate')}>
                        {ind.avgReplyRate}%
                      </TableCell>
                      <TableCell className={getMetricColor(ind.avgRagAccuracy, 'rate')}>
                        {ind.avgRagAccuracy}%
                      </TableCell>
                      <TableCell className={getMetricColor(ind.avgSatisfaction, 'satisfaction')}>
                        {ind.avgSatisfaction}%
                      </TableCell>
                      <TableCell>{ind.totalLeads.toLocaleString()}</TableCell>
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
