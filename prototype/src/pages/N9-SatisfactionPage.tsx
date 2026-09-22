import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ── 类型定义 ───────────────────────────────────────────────────────
type Sentiment = 'positive' | 'neutral' | 'negative';
type SurveyType = 'csat' | 'nps';

interface SatisfactionStats {
  csat: number;
  csatChange: number;
  nps: number;
  npsChange: number;
  responseRate: number;
  riskCount: number;
}

interface FeedbackItem {
  fbId: string;
  customerName: string;
  unifiedId: string;
  ticketId: string;
  type: SurveyType;
  score: number;
  sentiment: Sentiment;
  feedback: string;
  themes: string[];
  submittedAt: string;
}

interface ThemeCluster {
  theme: string;
  count: number;
  sentiment: Sentiment;
  trend: 'up' | 'down' | 'flat';
}

interface Improvement {
  impId: string;
  suggestion: string;
  basedOn: string;
  priority: 'high' | 'medium' | 'low';
  target: string;
}

// ── DataSlot: 满意度统计 ───────────────────────────────────────────
const mockStats: SatisfactionStats = {
  csat: 0.88, csatChange: 0.03, nps: 42, npsChange: -5, responseRate: 0.64, riskCount: 4,
};

// PAGINATION: page,pageSize
// DataSlot: 满意度反馈列表
const mockFeedback: FeedbackItem[] = [
  { fbId: 'f1', customerName: '张伟', unifiedId: 'u-88821', ticketId: 'TK-0091', type: 'csat', score: 5, sentiment: 'positive', feedback: '客服响应很快，续约方案讲得很清楚，赞！', themes: ['响应速度', '方案专业'], submittedAt: '2026-06-11' },
  { fbId: 'f2', customerName: 'John Smith', unifiedId: 'u-99014', ticketId: 'TK-0065', type: 'csat', score: 2, sentiment: 'negative', feedback: '数据导出问题等了两天才解决，体验不好。', themes: ['解决时长', '技术问题'], submittedAt: '2026-06-10' },
  { fbId: 'f3', customerName: '李梅', unifiedId: 'u-44322', ticketId: 'TK-0078', type: 'nps', score: 9, sentiment: 'positive', feedback: '会推荐给同行，权限配置很灵活。', themes: ['功能灵活', '推荐意愿'], submittedAt: '2026-06-09' },
  { fbId: 'f4', customerName: '王芳', unifiedId: 'u-33108', ticketId: 'TK-0042', type: 'nps', score: 6, sentiment: 'neutral', feedback: 'API 文档可以再详细些。', themes: ['文档质量'], submittedAt: '2026-06-08' },
];

// DataSlot: 主题聚类
const mockThemes: ThemeCluster[] = [
  { theme: '响应速度', count: 38, sentiment: 'positive', trend: 'up' },
  { theme: '解决时长', count: 22, sentiment: 'negative', trend: 'up' },
  { theme: '功能灵活', count: 19, sentiment: 'positive', trend: 'flat' },
  { theme: '文档质量', count: 15, sentiment: 'negative', trend: 'down' },
  { theme: '方案专业', count: 12, sentiment: 'positive', trend: 'flat' },
];

// DataSlot: 改进建议（LLM 生成）
const mockImprovements: Improvement[] = [
  { impId: 'i1', suggestion: '技术类工单平均解决时长偏高，建议补充「数据导出」专题 FAQ 并优化路由到技术组。', basedOn: '解决时长 / 技术问题主题（22 条负面）', priority: 'high', target: 'N5 知识库 + N11 路由' },
  { impId: 'i2', suggestion: 'API 文档质量负面反馈持续，建议沉淀完整对接指南入知识库。', basedOn: '文档质量主题（15 条）', priority: 'medium', target: 'N5 知识库' },
  { impId: 'i3', suggestion: '响应速度好评显著，可作为续约话术亮点沉淀给坐席。', basedOn: '响应速度主题（38 条正面）', priority: 'low', target: 'N2 坐席话术' },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 知识沉淀回流 [POST] /api/knowledge/from-feedback
function handleFlowToKnowledge(impId: string): void {
  console.log('flow improvement to knowledge', impId);
  alert(`改进建议 ${impId} 已回流知识库`);
}

// ACTION: 风险客户回流画像/CSM跟进 [POST] /api/profiles/{unified_id}/risk-flag
function handleFlagRisk(unifiedId: string): void {
  console.log('flag risk + CSM follow', unifiedId);
  alert(`已为 ${unifiedId} 打风险标签并提醒 CSM 跟进`);
}

// ── 辅助常量 ──────────────────────────────────────────────────────
const SENTIMENT_LABEL: Record<Sentiment, { label: string; cls: string; emoji: string }> = {
  positive: { label: '正面', cls: 'bg-green-50 text-green-600', emoji: '😊' },
  neutral: { label: '中性', cls: 'bg-gray-100 text-gray-500', emoji: '😐' },
  negative: { label: '负面', cls: 'bg-red-50 text-red-600', emoji: '😟' },
};
const TREND_ICON = { up: '↑', down: '↓', flat: '→' };
const PRIORITY_CLS = { high: 'bg-red-50 text-red-600', medium: 'bg-yellow-50 text-yellow-600', low: 'bg-gray-100 text-gray-500' };

// ── 主组件 ────────────────────────────────────────────────────────
export default function SatisfactionPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = mockFeedback.filter((f) => typeFilter === 'all' || f.type === typeFilter);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 标题 */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">满意度中心</h1>
        <p className="text-sm text-gray-500 mt-0.5">N9 · 承载 ⑦ 满意度回流 — CSAT/NPS 采集 + 情感识别 + 主题聚类 + 改进回流</p>
      </div>

      {/* 指标卡 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'CSAT 满意度', value: `${(mockStats.csat * 100).toFixed(0)}%`, change: `+${(mockStats.csatChange * 100).toFixed(0)}%`, up: true, cls: 'text-green-600' },
          { label: 'NPS 净推荐值', value: mockStats.nps, change: `${mockStats.npsChange}`, up: false, cls: 'text-blue-600' },
          { label: '调研回收率', value: `${(mockStats.responseRate * 100).toFixed(0)}%`, change: '', up: true, cls: 'text-gray-900' },
          { label: '风险客户', value: mockStats.riskCount, change: '需跟进', up: false, cls: 'text-red-600' },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500 font-normal">{m.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={`text-3xl font-bold ${m.cls}`}>{m.value}</div>
                {m.change && <span className={`text-xs ${m.up ? 'text-green-500' : 'text-red-500'}`}>{m.change}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="feedback">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="feedback">反馈明细</TabsTrigger>
          <TabsTrigger value="themes">主题聚类</TabsTrigger>
          <TabsTrigger value="improvements">改进建议</TabsTrigger>
        </TabsList>

        {/* ── 反馈明细 ── */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2">
              {[
                { k: 'all', l: '全部' }, { k: 'csat', l: 'CSAT' }, { k: 'nps', l: 'NPS' },
              ].map((t) => (
                <Button key={t.k} size="sm" variant={typeFilter === t.k ? 'default' : 'outline'}
                  className={`h-7 text-xs ${typeFilter === t.k ? 'bg-blue-600' : ''}`}
                  onClick={() => setTypeFilter(t.k)}>{t.l}</Button>
              ))}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户</TableHead>
                    <TableHead>来源工单</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>情感</TableHead>
                    <TableHead>反馈 / 主题</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((f) => (
                    <TableRow key={f.fbId}>
                      <TableCell className="text-sm">
                        <a href={`/customers/${f.unifiedId}`} className="text-blue-600 hover:underline">{f.customerName}</a>
                      </TableCell>
                      <TableCell><a href="/tickets" className="text-xs font-mono text-blue-600 hover:underline">{f.ticketId}</a></TableCell>
                      <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{f.type.toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-sm font-semibold">{f.score}{f.type === 'csat' ? '/5' : '/10'}</TableCell>
                      <TableCell><Badge className={`text-xs ${SENTIMENT_LABEL[f.sentiment].cls}`}>{SENTIMENT_LABEL[f.sentiment].emoji} {SENTIMENT_LABEL[f.sentiment].label}</Badge></TableCell>
                      <TableCell className="max-w-[260px]">
                        <p className="text-sm text-gray-700 truncate">{f.feedback}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {f.themes.map((t) => <Badge key={t} className="text-[10px] bg-purple-50 text-purple-600">{t}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {f.sentiment === 'negative' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={() => handleFlagRisk(f.unifiedId)}>标记风险</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 主题聚类 ── */}
        <TabsContent value="themes">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">反馈主题聚类（情感识别 + 聚类）</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockThemes.map((t) => (
                <div key={t.theme} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-20 shrink-0">{t.theme}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${t.sentiment === 'positive' ? 'bg-green-400' : t.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'}`}
                      style={{ width: `${(t.count / 38) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-10">{t.count} 条</span>
                  <Badge className={`text-[10px] ${SENTIMENT_LABEL[t.sentiment].cls}`}>{SENTIMENT_LABEL[t.sentiment].label} {TREND_ICON[t.trend]}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 改进建议 ── */}
        <TabsContent value="improvements">
          <div className="space-y-3">
            {mockImprovements.map((imp) => (
              <Card key={imp.impId}>
                <CardContent className="pt-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs ${PRIORITY_CLS[imp.priority]}`}>{imp.priority === 'high' ? '高优先' : imp.priority === 'medium' ? '中优先' : '低优先'}</Badge>
                      <span className="text-xs text-gray-400">回流目标：{imp.target}</span>
                    </div>
                    <p className="text-sm text-gray-800">{imp.suggestion}</p>
                    <p className="text-xs text-gray-400 mt-1">依据：{imp.basedOn}</p>
                  </div>
                  <Button size="sm" className="bg-blue-600 shrink-0" onClick={() => handleFlowToKnowledge(imp.impId)}>回流</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
