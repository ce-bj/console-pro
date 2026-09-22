// AI 质量监控看板 — 产品后台视角（对齐智能客服 Pro 数据看板差距分析）
// 期次标注：P0=第一期必须、P1=第二期、P2=第三期
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ══════════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════════

type DateRangeKey = '7d' | '30d' | '90d';
type CustomerTier = 'high' | 'medium' | 'low';

interface QualityMetrics {
  recallRate: number;      // 知识库召回率 ~99%
  replyRate: number;       // AI 回复率 ~87%
  ragAccuracy: number;     // RAG 准确率（命中且未点踩/转人工）
  satisfaction: number;    // 满意度（👍/总反馈）
  handoffRate: number;     // 转人工率
}

interface UnreplyReason {
  reason: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface CustomerQualityRank {
  customerId: string;
  customerName: string;
  industry: string;
  tier: CustomerTier;
  recallRate: number;
  replyRate: number;
  ragAccuracy: number;
  satisfaction: number;
  leadCount: number;
  docCount: number;
  lastUpdate: string;
}

interface IndustryQualityStats {
  industry: string;
  customerCount: number;
  avgRecallRate: number;
  avgReplyRate: number;
  avgRagAccuracy: number;
  avgSatisfaction: number;
  totalLeads: number;
}

interface BlindSpotItem {
  topic: string;
  count: number;
  affectedCustomers: number;
  priority: number;
  suggestedSection: string;
  status: 'pending' | 'recorded' | 'ignored';
}

// ══════════════════════════════════════════════════════════════════
// Mock 数据（DataSlot）
// ══════════════════════════════════════════════════════════════════

// DataSlot: 全局 AI 质量指标（P0-第一期）
const mockGlobalMetrics: QualityMetrics = {
  recallRate: 99.2,
  replyRate: 87.3,
  ragAccuracy: 92.8,
  satisfaction: 84.5,
  handoffRate: 8.2,
};

// DataSlot: 未回复原因分析（P0-第一期）
const mockUnreplyReasons: UnreplyReason[] = [
  { reason: '知识缺失', count: 1247, percentage: 42.3, trend: 'down' },
  { reason: '召回相似度低', count: 892, percentage: 30.2, trend: 'stable' },
  { reason: '规则拦截', count: 456, percentage: 15.4, trend: 'up' },
  { reason: '模型拒答', count: 234, percentage: 7.9, trend: 'stable' },
  { reason: '系统异常', count: 123, percentage: 4.2, trend: 'down' },
];

// DataSlot: 客户质量排行榜（P1-第二期）
const mockCustomerRanks: CustomerQualityRank[] = [
  { customerId: 'cust_001', customerName: '某科技公司', industry: '制造', tier: 'high',
    recallRate: 99.8, replyRate: 94.2, ragAccuracy: 96.5, satisfaction: 92.1,
    leadCount: 127, docCount: 89, lastUpdate: '2026-07-02' },
  { customerId: 'cust_002', customerName: '某电商平台', industry: '电商', tier: 'high',
    recallRate: 99.5, replyRate: 91.8, ragAccuracy: 94.3, satisfaction: 88.7,
    leadCount: 203, docCount: 134, lastUpdate: '2026-07-01' },
  { customerId: 'cust_003', customerName: '某医疗机构', industry: '医疗', tier: 'medium',
    recallRate: 98.9, replyRate: 85.6, ragAccuracy: 90.2, satisfaction: 81.3,
    leadCount: 78, docCount: 56, lastUpdate: '2026-06-30' },
  { customerId: 'cust_004', customerName: '某教育平台', industry: '教育', tier: 'medium',
    recallRate: 98.2, replyRate: 82.4, ragAccuracy: 87.9, satisfaction: 76.5,
    leadCount: 45, docCount: 42, lastUpdate: '2026-06-28' },
  { customerId: 'cust_005', customerName: '某金融服务', industry: '金融', tier: 'low',
    recallRate: 96.8, replyRate: 78.3, ragAccuracy: 82.1, satisfaction: 68.9,
    leadCount: 12, docCount: 28, lastUpdate: '2026-06-25' },
];

// DataSlot: 行业质量统计（P1-第二期）
const mockIndustryStats: IndustryQualityStats[] = [
  { industry: '制造', customerCount: 12, avgRecallRate: 99.1, avgReplyRate: 89.4,
    avgRagAccuracy: 93.2, avgSatisfaction: 86.7, totalLeads: 1247 },
  { industry: '电商', customerCount: 8, avgRecallRate: 98.8, avgReplyRate: 88.2,
    avgRagAccuracy: 91.8, avgSatisfaction: 84.3, totalLeads: 892 },
  { industry: '医疗', customerCount: 6, avgRecallRate: 98.5, avgReplyRate: 86.9,
    avgRagAccuracy: 90.5, avgSatisfaction: 82.1, totalLeads: 645 },
  { industry: '教育', customerCount: 5, avgRecallRate: 97.9, avgReplyRate: 84.7,
    avgRagAccuracy: 88.6, avgSatisfaction: 79.4, totalLeads: 423 },
  { industry: '金融', customerCount: 3, avgRecallRate: 96.2, avgReplyRate: 80.3,
    avgRagAccuracy: 84.2, avgSatisfaction: 74.8, totalLeads: 178 },
];

// DataSlot: 知识库待补主题榜（P0-第一期）
const mockBlindSpotRanks: BlindSpotItem[] = [
  { topic: '产品对接技术规范', count: 234, affectedCustomers: 8, priority: 5,
    suggestedSection: 'document', status: 'pending' },
  { topic: 'API 调用频率限制', count: 189, affectedCustomers: 6, priority: 4,
    suggestedSection: 'faq', status: 'pending' },
  { topic: '数据迁移服务费用', count: 156, affectedCustomers: 5, priority: 4,
    suggestedSection: 'faq', status: 'pending' },
  { topic: '私有化部署方案', count: 142, affectedCustomers: 7, priority: 5,
    suggestedSection: 'document', status: 'recorded' },
  { topic: '多语言支持情况', count: 98, affectedCustomers: 4, priority: 3,
    suggestedSection: 'faq', status: 'pending' },
];

// ══════════════════════════════════════════════════════════════════
// 辅助函数
// ══════════════════════════════════════════════════════════════════

function getTierLabel(tier: CustomerTier): string {
  return tier === 'high' ? '高' : tier === 'medium' ? '中' : '低';
}

function getTierColor(tier: CustomerTier): string {
  return tier === 'high' ? 'bg-green-50 text-green-600' :
         tier === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
}

function getMetricColor(value: number, type: 'rate' | 'satisfaction'): string {
  if (type === 'rate') {
    return value >= 95 ? 'text-green-600' : value >= 85 ? 'text-amber-600' : 'text-red-600';
  }
  return value >= 80 ? 'text-green-600' : value >= 70 ? 'text-amber-600' : 'text-red-600';
}

function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  return trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';
}

// ══════════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════════

export default function AIQualityDashboard() {
  const [dateRange, setDateRange] = useState<DateRangeKey>('30d');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const dateRangeLabel = dateRange === '7d' ? '近7天' : dateRange === '30d' ? '近30天' : '近90天';

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI 质量监控</h2>
          <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">
            产品后台视角 · 监控全局 AI 回复质量、定位客户知识库问题、支撑产品迭代与销售成交
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

      {/* P0-第一期：全局 AI 质量核心指标 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            全局 AI 质量核心指标
            <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
            <span className="text-xs text-gray-400 font-normal">— {dateRangeLabel}，全客户汇总</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-gray-400 mb-1">知识库召回率</div>
              <div className={`text-3xl font-bold ${getMetricColor(mockGlobalMetrics.recallRate, 'rate')}`}>
                {mockGlobalMetrics.recallRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">RAG 检索是否命中</div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-gray-400 mb-1">AI 回复率</div>
              <div className={`text-3xl font-bold ${getMetricColor(mockGlobalMetrics.replyRate, 'rate')}`}>
                {mockGlobalMetrics.replyRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">召回后是否给出回答</div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-gray-400 mb-1">RAG 准确率</div>
              <div className={`text-3xl font-bold ${getMetricColor(mockGlobalMetrics.ragAccuracy, 'rate')}`}>
                {mockGlobalMetrics.ragAccuracy}%
              </div>
              <div className="text-xs text-gray-500 mt-1">命中且未点踩/转人工</div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-gray-400 mb-1">满意度</div>
              <div className={`text-3xl font-bold ${getMetricColor(mockGlobalMetrics.satisfaction, 'satisfaction')}`}>
                {mockGlobalMetrics.satisfaction}%
              </div>
              <div className="text-xs text-gray-500 mt-1">用户点赞比例</div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-gray-400 mb-1">转人工率</div>
              <div className="text-3xl font-bold text-purple-600">
                {mockGlobalMetrics.handoffRate}%
              </div>
              <div className="text-xs text-gray-500 mt-1">AI 未解决需转人工</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P0-第一期：未回复原因分析 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            未回复原因分析
            <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
            <span className="text-xs text-gray-400 font-normal">— 定位召回率 → 回复率损耗的根因</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>原因</TableHead>
                <TableHead>次数</TableHead>
                <TableHead>占比</TableHead>
                <TableHead>趋势</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUnreplyReasons.map((r) => (
                <TableRow key={r.reason}>
                  <TableCell className="font-medium">{r.reason}</TableCell>
                  <TableCell>{r.count.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="text-xs bg-gray-100 text-gray-600">
                      {r.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getTrendIcon(r.trend)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      查看明细
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* P0-第一期：知识库待补主题榜 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            知识库待补主题榜
            <Badge className="text-xs bg-blue-50 text-blue-600">P0-第一期</Badge>
            <Badge className="text-xs bg-orange-50 text-orange-600">
              {mockBlindSpotRanks.filter((b) => b.status === 'pending').length} 个待补
            </Badge>
            <span className="text-xs text-gray-400 font-normal">— 按影响客户数和优先级排序</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>优先级</TableHead>
                <TableHead>主题</TableHead>
                <TableHead>出现次数</TableHead>
                <TableHead>影响客户数</TableHead>
                <TableHead>建议板块</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBlindSpotRanks.map((b) => (
                <TableRow key={b.topic}>
                  <TableCell>
                    <Badge className={`text-xs ${b.priority >= 4 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      P{b.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{b.topic}</TableCell>
                  <TableCell>
                    <Badge className="text-xs bg-gray-100 text-gray-600">
                      {b.count} 次
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-xs bg-blue-50 text-blue-600">
                      {b.affectedCustomers} 客户
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-xs bg-gray-100 text-gray-700 border border-gray-200 font-normal">
                      {b.suggestedSection === 'document' ? '① 正式文档' :
                       b.suggestedSection === 'faq' ? '② 问答知识' : b.suggestedSection}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.status === 'pending' ? (
                      <Badge className="text-xs bg-orange-50 text-orange-600">待补录</Badge>
                    ) : b.status === 'recorded' ? (
                      <Badge className="text-xs bg-green-50 text-green-600">已补录</Badge>
                    ) : (
                      <Badge className="text-xs bg-gray-100 text-gray-600">已忽略</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="h-7 text-xs bg-blue-600"
                      disabled={b.status !== 'pending'}>
                      去补录
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* P1-第二期：客户质量排行榜 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            客户质量排行榜
            <Badge className="text-xs bg-purple-50 text-purple-600">P1-第二期</Badge>
            <span className="text-xs text-gray-400 font-normal">— 支撑客户成功跟进和商务案例</span>
          </CardTitle>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400">行业筛选：</span>
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
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户</TableHead>
                <TableHead>行业</TableHead>
                <TableHead>档次</TableHead>
                <TableHead>召回率</TableHead>
                <TableHead>回复率</TableHead>
                <TableHead>准确率</TableHead>
                <TableHead>满意度</TableHead>
                <TableHead>线索数</TableHead>
                <TableHead>文档数</TableHead>
                <TableHead>最近更新</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCustomerRanks
                .filter((c) => industryFilter === 'all' || c.industry === industryFilter)
                .map((c) => (
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
                  <TableCell className={getMetricColor(c.recallRate, 'rate')}>
                    {c.recallRate}%
                  </TableCell>
                  <TableCell className={getMetricColor(c.replyRate, 'rate')}>
                    {c.replyRate}%
                  </TableCell>
                  <TableCell className={getMetricColor(c.ragAccuracy, 'rate')}>
                    {c.ragAccuracy}%
                  </TableCell>
                  <TableCell className={getMetricColor(c.satisfaction, 'satisfaction')}>
                    {c.satisfaction}%
                  </TableCell>
                  <TableCell>{c.leadCount}</TableCell>
                  <TableCell>{c.docCount}</TableCell>
                  <TableCell className="text-xs text-gray-400">{c.lastUpdate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* P1-第二期：行业质量统计 */}
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

      {/* 后续规划提示 */}
      <Card className="border-dashed">
        <CardContent className="pt-5">
          <div className="text-sm text-gray-500 space-y-2">
            <div className="font-medium text-gray-700">📋 后续规划（P2-第三期及以后）</div>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>知识库效果与线索转化关联</strong>：证明知识库质量是否影响互动和线索</li>
              <li><strong>低质量回答复盘池</strong>：让产品/算法/知识运营定期复盘坏例</li>
              <li><strong>转人工归因分析</strong>：判断 AI 没解决哪些问题，指导知识库补充</li>
              <li><strong>产品力质量看板</strong>：给产品/商务统一看产品质量证据</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
