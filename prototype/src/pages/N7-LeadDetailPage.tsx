import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ── 类型 ──────────────────────────────────────────────────────────
type IntentLevel = 'high' | 'medium' | 'low';
type LeadSource = 'ai_chat' | 'form' | 'manual';
type LeadStatus = 'pending' | 'following' | 'converted' | 'invalid';

interface ConfirmStep {
  question: string;
  answer: string;
}

interface CaptureField {
  label: string;
  value: string;
}

interface FollowUpRecord {
  time: string;
  type: string;
  content: string;
  nextContact?: string;
}

interface LeadDetail {
  leadId: string;
  status: LeadStatus;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  assignedTo: string;
  createdAt: string;

  // 意向
  source: LeadSource;
  sessionId: string | null;
  intentLevel: IntentLevel;
  consultProduct: string;
  intentFeatures: string[];
  interestedTier: string;
  confirmSteps: ConfirmStep[];

  // 留资
  captureFields: CaptureField[];
  captureTime: string;

  // 会话摘要（ai_chat 专属）
  sessionSummary: string;
  sessionDuration: string;
  sessionMessageCount: number;
  sessionStartTime: string;
  intentSignals: string[];

  // 来源
  channel: string;

  // 跟进
  followUpRecords: FollowUpRecord[];
}

// ── Mock 数据 ─────────────────────────────────────────────────────
// DataSlot: 线索详情 [GET] /api/leads/{lead_id}
const mockDetail: LeadDetail = {
  leadId: 'L-1001',
  status: 'following',
  customerName: '张伟',
  companyName: 'EnergiTech Industrial',
  phone: '138-8888-6666',
  email: 'zhangwei@energitech.com',
  address: '上海市浦东新区张江高科技园区',
  assignedTo: '陈雅婷',
  createdAt: '2026-06-16T14:26:33Z',

  source: 'ai_chat',
  sessionId: 'chat-20260616-8a3f',
  intentLevel: 'high',
  consultProduct: '工业物联网平台',
  intentFeatures: ['私有化部署', '数据安全合规', 'API 集成', '权限管控'],
  interestedTier: '企业版 / 私有化报价',
  confirmSteps: [
    { question: '您团队目前主要想用私有化部署解决哪类业务需求？', answer: '内部数据合规 / 安全要求' },
    { question: '您希望演示重点覆盖哪些方面？', answer: '数据安全与权限管控机制' },
  ],

  captureFields: [
    { label: '姓名', value: '张伟' },
    { label: '手机号', value: '138-8888-6666' },
    { label: '邮箱', value: 'zhangwei@energitech.com' },
    { label: '公司名称', value: 'EnergiTech Industrial' },
    { label: '需求描述', value: '50人团队，需了解私有化部署方案，关注数据安全合规，希望安排专属演示' },
  ],
  captureTime: '2026-06-16T14:26:33Z',

  sessionSummary:
    '用户主动询问价格方案，了解四档方案后确认团队 50 人规模，重点关注私有化部署可行性及数据安全合规需求。通过两轮确认选项明确演示重点（数据安全与权限管控），AI 判断意向强烈，用户最终主动提交联系方式申请专属演示。',
  sessionDuration: '8 分 23 秒',
  sessionMessageCount: 12,
  sessionStartTime: '2026-06-16T14:15:00Z',
  intentSignals: ['主动询价', '明确团队规模（50人）', '询问私有化部署', '数据安全合规需求', '主动提交留资'],

  channel: '英文 en001.xuoumaill.cn',

  followUpRecords: [
    {
      time: '2026-06-16 15:30',
      type: '电话',
      content: '已致电张伟，确认需求，对方表示将在本周内组织内部评估会议，期望下周安排产品演示。',
      nextContact: '2026-06-23 10:00',
    },
  ],
};

// ── 辅助 ─────────────────────────────────────────────────────────
function intentLabel(l: IntentLevel) {
  return { high: '高意向', medium: '中意向', low: '低意向' }[l];
}
function intentCls(l: IntentLevel) {
  return {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-500 border-gray-200',
  }[l];
}
function statusLabel(s: LeadStatus) {
  return { pending: '待处理', following: '跟进中', converted: '已转化', invalid: '无效' }[s];
}
function statusCls(s: LeadStatus) {
  return {
    pending: 'bg-yellow-100 text-yellow-700',
    following: 'bg-blue-100 text-blue-700',
    converted: 'bg-green-100 text-green-700',
    invalid: 'bg-gray-100 text-gray-500',
  }[s];
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── ACTION: 跳转至对话页 ─────────────────────────────────────────
// ACTION: 查看完整对话 [GET] /api/sessions/{session_id}
function handleJumpToSession(sessionId: string): void {
  console.log('navigate to session', sessionId);
  alert(`跳转至对话页：sessionId=${sessionId}`);
}

// ACTION: 保存跟进记录 [POST] /api/leads/{lead_id}/follow-ups
function handleSaveFollowUp(leadId: string, content: string, type: string): void {
  console.log('save follow-up', { leadId, content, type });
  alert('跟进记录已保存');
}

// ── 子组件：分区标题 ─────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-blue-500" />
      <span className="text-sm font-semibold text-gray-800">{children}</span>
    </div>
  );
}

// ── 子组件：字段行 ───────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="w-24 text-gray-400 flex-shrink-0">{label}</span>
      <span className="flex-1 text-gray-800 font-medium">{children}</span>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const lead = mockDetail;
  const [followType, setFollowType] = useState('电话');
  const [followContent, setFollowContent] = useState('');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 顶部面包屑 & 标题 */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <span className="hover:text-blue-500 cursor-pointer">首页</span>
        <span>/</span>
        <span className="hover:text-blue-500 cursor-pointer">线索管理</span>
        <span>/</span>
        <span className="text-gray-700">详情</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900">
          线索详情 · {lead.companyName}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">转移线索</Button>
          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            标记无效
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">转为客户</Button>
        </div>
      </div>

      {/* 两列布局 */}
      <div className="grid grid-cols-3 gap-5">

        {/* ── 左栏（占 2/3） ── */}
        <div className="col-span-2 space-y-4">

          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📋</span> 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <FieldRow label="线索状态">
                    <Badge className={`text-xs ${statusCls(lead.status)}`}>
                      {statusLabel(lead.status)}
                    </Badge>
                  </FieldRow>
                  <FieldRow label="企业名称">{lead.companyName}</FieldRow>
                  <FieldRow label="联系人">{lead.customerName}</FieldRow>
                </div>
                <div>
                  <FieldRow label="手机号">{lead.phone}</FieldRow>
                  <FieldRow label="邮箱">
                    <span className="text-xs">{lead.email}</span>
                  </FieldRow>
                  <FieldRow label="企业地址">
                    <span className="text-xs text-gray-500">{lead.address}</span>
                  </FieldRow>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 意向信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🎯</span> 意向信息
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* 意向等级 */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-20">意向等级</span>
                <Badge className={`text-xs ${intentCls(lead.intentLevel)}`}>
                  {lead.intentLevel === 'high' ? '🔥 ' : ''}{intentLabel(lead.intentLevel)}
                </Badge>
                {/* 进度条 */}
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500"
                    style={{ width: lead.intentLevel === 'high' ? '85%' : lead.intentLevel === 'medium' ? '50%' : '20%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8">
                <FieldRow label="咨询产品">{lead.consultProduct}</FieldRow>
                <FieldRow label="关注价格段">{lead.interestedTier}</FieldRow>
              </div>

              <div>
                <span className="text-xs text-gray-400 block mb-2">关注功能点</span>
                <div className="flex flex-wrap gap-1.5">
                  {lead.intentFeatures.map((f) => (
                    <span
                      key={f}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI 对话确认步骤 */}
              {lead.confirmSteps.length > 0 && (
                <div>
                  <span className="text-xs text-gray-400 block mb-2">AI 对话确认步骤</span>
                  <div className="space-y-2">
                    {lead.confirmSteps.map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">{step.question}</p>
                          <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-1 rounded-md">
                            {step.answer}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 留资信息 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📝</span> 留资信息
                <span className="ml-auto text-xs font-normal text-gray-400">
                  提交于 {fmtTime(lead.captureTime)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                {lead.captureFields.map((f) => (
                  <FieldRow key={f.label} label={f.label}>{f.value}</FieldRow>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 来源会话摘要（仅 ai_chat 来源） */}
          {lead.source === 'ai_chat' && lead.sessionId && (
            <Card className="border-purple-100 bg-gradient-to-br from-purple-50/60 to-blue-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>🤖</span> 来源会话摘要
                  <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 ml-1">
                    智能客服
                  </Badge>
                  <div className="ml-auto flex items-center gap-4 text-xs text-gray-400 font-normal">
                    <span>⏱ {lead.sessionDuration}</span>
                    <span>💬 {lead.sessionMessageCount} 条</span>
                    <span>🕐 {fmtTime(lead.sessionStartTime)}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* 摘要文本 */}
                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 leading-relaxed border border-gray-100">
                  {lead.sessionSummary}
                </p>

                {/* 意向信号标签 */}
                <div>
                  <span className="text-xs text-gray-400 block mb-1.5">关键意向信号</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.intentSignals.map((sig) => (
                      <span
                        key={sig}
                        className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 跳转按钮 */}
                <div className="pt-1">
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    onClick={() => handleJumpToSession(lead.sessionId!)}
                  >
                    查看完整对话 ↗
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 渠道与来源 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>📌</span> 渠道与来源
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-x-8">
                <FieldRow label="渠道">{lead.channel}</FieldRow>
                <FieldRow label="线索来源">
                  <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                    {lead.source === 'ai_chat' ? '智能客服' : lead.source === 'form' ? '表单' : '人工录入'}
                  </Badge>
                </FieldRow>
                <FieldRow label="会话 ID">
                  <span className="font-mono text-xs text-gray-500">{lead.sessionId ?? '—'}</span>
                </FieldRow>
                <FieldRow label="留资时间">{fmtTime(lead.captureTime)}</FieldRow>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 右栏（占 1/3） ── */}
        <div className="space-y-4">

          {/* 负责人 */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {lead.assignedTo[0]}
                </div>
                <div>
                  <p className="text-xs text-gray-400">负责销售</p>
                  <p className="text-sm font-semibold">{lead.assignedTo}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto text-xs">转移</Button>
              </div>
            </CardContent>
          </Card>

          {/* AI 建议 */}
          <Card className="border-blue-100 bg-blue-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>💡</span> AI 建议行动
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-gray-600 leading-relaxed">
                高价值线索，已完成意向确认。建议：
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-gray-700">
                <li className="flex gap-2"><span className="text-blue-500">①</span> 本周内安排私有化专项演示</li>
                <li className="flex gap-2"><span className="text-blue-500">②</span> 发送数据安全合规白皮书</li>
                <li className="flex gap-2"><span className="text-blue-500">③</span> 准备企业版 / 私有化定制报价单</li>
              </ul>
              <div className="mt-3 space-y-1.5">
                <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2">
                  ✉️ AI 生成跟进邮件
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2">
                  📄 生成定制报价单
                </Button>
                <Button variant="outline" size="sm" className="w-full text-xs justify-start gap-2">
                  📅 安排演示日历邀请
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 跟进记录 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>🗒️</span> 跟进记录
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {lead.followUpRecords.map((r, i) => (
                <div key={i} className="border-l-2 border-blue-200 pl-3 py-0.5 text-xs text-gray-600 space-y-0.5">
                  <p className="font-semibold text-gray-700">{r.time} · {r.type}</p>
                  <p className="leading-relaxed">{r.content}</p>
                  {r.nextContact && (
                    <p className="text-gray-400">下次联系：{r.nextContact}</p>
                  )}
                </div>
              ))}

              {/* 添加跟进 */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-600">添加跟进记录</p>
                <Select value={followType} onValueChange={setFollowType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="电话">电话</SelectItem>
                    <SelectItem value="邮件">邮件</SelectItem>
                    <SelectItem value="短信">短信</SelectItem>
                    <SelectItem value="备注">备注</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="请输入跟进内容…"
                  value={followContent}
                  onChange={(e) => setFollowContent(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                  onClick={() => {
                    handleSaveFollowUp(lead.leadId, followContent, followType);
                    setFollowContent('');
                  }}
                >
                  保存跟进
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
