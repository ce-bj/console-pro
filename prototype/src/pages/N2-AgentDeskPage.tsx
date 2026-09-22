import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type ConvStatus = 'ai_serving' | 'waiting_human' | 'human_serving' | 'closed';
type Sentiment = 'positive' | 'neutral' | 'negative';
type MsgSender = 'visitor' | 'ai' | 'human';
// 对话对象不一定是客户：可能是匿名访客 / 已识别线索 / 已登录会员
type EntityType = 'visitor' | 'lead' | 'member';
type LeadStatus = 'processing' | 'converted' | 'invalid';

interface ConvItem {
  convId: string;
  name: string;            // 显示名（匿名访客ID / 线索名 / 会员名）
  entityType: EntityType;  // 访客 / 线索 / 会员
  country: string;
  flag: string;
  lang: 'ZH_CN' | 'EN';
  status: ConvStatus;
  intentLevel: 'high' | 'medium' | 'low';
  lastMsg: string;
  lastTime: string;
  unifiedId: string;
  location: string;        // 北京市·大兴区
  online: boolean;         // 在线 / 已离线
}

interface ChatMessage {
  msgId: string;
  sender: MsgSender;
  text: string;
  time: string;
}

// AI 总结（对应线上「AI总结」面板）
interface AiSummary {
  updatedAt: string;
  overall: string;
  // 线索信息提取（空串 = 未提供）
  leadInfo: { email: string; phone: string; otherContact: string; company: string; contactName: string };
  timeline: { date: string; text: string }[];
  member: { bound: boolean; memberId?: string; memberName?: string };
  lead: { leadId: string; status: LeadStatus; company: string; phone: string; email: string; contactName: string; otherContact: string } | null;
}

// 访问轨迹
interface VisitStep { time: string; page: string; stay: string; }

interface HandoffContext {
  intentLevel: 'high' | 'medium' | 'low';
  intentScore: number;
  sentimentArc: Sentiment[];
  facts: { label: string; value: string }[];
  painPoints: string[];
  aiSuggestions: string[];
}

// ── DataSlot: 会话列表 ─────────────────────────────────────────────
const mockConversations: ConvItem[] = [
  { convId: 'c-001', name: '张伟', entityType: 'member', country: '中国', flag: '🇨🇳', lang: 'ZH_CN', status: 'waiting_human', intentLevel: 'high', lastMsg: '我想了解年度续约的优惠条款', lastTime: '09:42', unifiedId: 'u-88821', location: '上海市·浦东新区', online: true },
  { convId: 'c-002', name: 'John Smith', entityType: 'lead', country: '美国', flag: '🇺🇸', lang: 'EN', status: 'human_serving', intentLevel: 'medium', lastMsg: 'How do I integrate the API?', lastTime: '09:38', unifiedId: 'u-99014', location: 'California·SF', online: true },
  { convId: 'c-003', name: '李梅', entityType: 'lead', country: '中国', flag: '🇨🇳', lang: 'ZH_CN', status: 'ai_serving', intentLevel: 'medium', lastMsg: '价格方案有哪些？', lastTime: '09:30', unifiedId: 'u-44322', location: '广东省·深圳市', online: true },
  { convId: 'c-004', name: 'anony2601290947593241799', entityType: 'visitor', country: '中国', flag: '🇨🇳', lang: 'ZH_CN', status: 'closed', intentLevel: 'low', lastMsg: '电池质保政策是怎样的？', lastTime: '昨天', unifiedId: 'v-2601', location: '北京市·大兴区', online: false },
];

// DataSlot: 当前会话消息流（按 convId 区分，缺省回落到通用流）
const mockMessages: Record<string, ChatMessage[]> = {
  'c-001': [
    { msgId: 'm1', sender: 'visitor', text: '你好，我们公司在用你们的产品，想了解年度续约政策', time: '09:35' },
    { msgId: 'm2', sender: 'ai', text: '您好！很高兴为您服务 👋 年度续约可享受席位阶梯折扣，请问贵司目前大概多少席位？', time: '09:36' },
    { msgId: 'm3', sender: 'visitor', text: '大概 50 个席位，另外想确认技术支持的 SLA', time: '09:38' },
    { msgId: 'm4', sender: 'ai', text: '50 席位可进入企业版折扣区间，技术支持提供 96h 响应承诺。这块涉及商务报价，我帮您转接专属顾问可以吗？', time: '09:40' },
    { msgId: 'm5', sender: 'visitor', text: '我想了解年度续约的优惠条款', time: '09:42' },
  ],
  'c-004': [
    { msgId: 'm1', sender: 'visitor', text: '你们的电池质保政策是怎样的？', time: '昨天 15:30' },
    { msgId: 'm2', sender: 'ai', text: '您好，我们的电池提供 8 年或 16 万公里质保。请问您方便留个联系方式，我们可以发详细政策给您吗？', time: '昨天 15:31' },
    { msgId: 'm3', sender: 'visitor', text: '先不用了，我自己看看', time: '昨天 15:32' },
  ],
};

// DataSlot: AI 总结（对应线上「AI总结」面板）
const mockSummaries: Record<string, AiSummary> = {
  'c-001': {
    updatedAt: '2026-06-16 15:42:27',
    overall: '客户为现有 50 席位企业会员，咨询年度续约折扣与技术支持 SLA，明确高意向商务诉求，处于决策期。建议本周内提供正式报价并跟进。',
    leadInfo: { email: 'zhangwei@acme.com', phone: '+86 13810255269', otherContact: '', company: 'ACME 科技', contactName: '张伟' },
    timeline: [
      { date: '2026-06-16', text: '咨询年度续约折扣与技术支持 SLA，明确 50 席位规模。' },
      { date: '2026-05-29', text: '客服再次鼓励访客留下联系信息。' },
      { date: '2026-05-21', text: '客服在展会期间提供咨询服务。' },
    ],
    member: { bound: true, memberId: 'M-88821', memberName: '张伟' },
    lead: { leadId: '1466481932696637440', status: 'processing', company: 'ACME 科技', phone: '+86 13810255269', email: 'zhangwei@acme.com', contactName: '张伟', otherContact: '' },
  },
  'c-004': {
    updatedAt: '2026-06-16 15:42:27',
    overall: '访客询问了电池质保政策和关于张颂文的信息，但未获得满意的回复。访客在后续会话中尝试与客服进行互动，但没有提供进一步的联系人信息。在新的会话中，客服继续保持主动，鼓励访客留下联系方式，以便后续联系。',
    leadInfo: { email: '', phone: '', otherContact: '', company: '', contactName: '' },
    timeline: [
      { date: '2026-06-16', text: '客服持续保持联系，询问访客是否需要帮助。' },
      { date: '2026-05-29', text: '客服再次鼓励访客留下联系信息。' },
      { date: '2026-05-21', text: '客服在展会期间提供咨询服务。' },
      { date: '2026-04-14', text: '客服继续提供咨询服务，询问注意事项。' },
    ],
    member: { bound: false },
    lead: { leadId: '1466481932696637440', status: 'processing', company: '33', phone: '+86 13810255269', email: '', contactName: '', otherContact: '' },
  },
};

const DEFAULT_SUMMARY: AiSummary = {
  updatedAt: '—',
  overall: '暂无总结，点击「AI 重新总结」生成。',
  leadInfo: { email: '', phone: '', otherContact: '', company: '', contactName: '' },
  timeline: [],
  member: { bound: false },
  lead: null,
};

// DataSlot: 访问轨迹
const mockVisitTrack: Record<string, VisitStep[]> = {
  'c-001': [
    { time: '09:30', page: '/pricing 定价页', stay: '2m18s' },
    { time: '09:28', page: '/enterprise 企业版', stay: '1m05s' },
    { time: '09:25', page: '/ 首页', stay: '0m42s' },
  ],
  'c-004': [
    { time: '昨天 15:29', page: '/warranty 质保政策', stay: '1m12s' },
    { time: '昨天 15:27', page: '/products 产品列表', stay: '0m48s' },
    { time: '昨天 15:26', page: '/ 首页', stay: '0m20s' },
  ],
};

// DataSlot: 转人工上下文 / AI 副驾（实时坐席辅助）
const mockHandoffContext: HandoffContext = {
  intentLevel: 'high',
  intentScore: 92,
  sentimentArc: ['neutral', 'positive', 'positive'],
  facts: [
    { label: '席位规模', value: '约 50' },
    { label: '访问次数', value: '6 次' },
    { label: '定价页访问', value: '3 次' },
    { label: '来源', value: '官网定价页' },
  ],
  painPoints: ['续约折扣', '技术支持 SLA', '席位阶梯定价'],
  aiSuggestions: [
    '优先提供《企业年度续约方案》报价，突出 50 席位阶梯折扣。',
    '强调 96h 技术支持响应承诺，可附同类客户案例。',
    '客户处于决策期，建议本周内跟进并发送正式报价单。',
  ],
};

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 坐席接手会话 [POST] /api/conversations/{conv_id}/takeover
function handleTakeover(convId: string): void {
  console.log('takeover', convId);
}

// ACTION: 转回 AI 接待 [POST] /api/conversations/{conv_id}/back-to-ai
function handleBackToAILog(convId: string): void {
  console.log('back_to_ai', convId);
}

// ACTION: 发送消息 [POST] /api/conversations/{conv_id}/messages
function handleSend(convId: string, text: string): void {
  console.log('send', convId, text);
}

// ACTION: 采纳 AI 副驾建议（写入输入框） [POST] /api/conversations/{conv_id}/adopt-suggestion
function handleAdoptSuggestion(convId: string, suggestion: string): void {
  console.log('adopt suggestion', convId, suggestion);
}

// ACTION: AI 重新总结 [POST] /api/conversations/{conv_id}/ai-summary/regenerate
function handleRegenSummary(convId: string): void {
  console.log('regenerate summary', convId);
  alert('已触发 AI 重新总结，稍后刷新查看');
}

// ACTION: 转存线索（访客/会员 → 线索池） [POST] /api/conversations/{conv_id}/save-as-lead
function handleSaveAsLead(convId: string): void {
  console.log('save as lead', convId);
  alert(`会话 ${convId} 已转存至线索池`);
}

// ACTION: 退出会话（坐席离开当前会话） [POST] /api/conversations/{conv_id}/exit
function handleExitConv(convId: string): void {
  console.log('exit conversation', convId);
  alert(`已退出会话 ${convId}`);
}

// ── 辅助常量 ──────────────────────────────────────────────────────
const CONV_STATUS: Record<ConvStatus, { label: string; cls: string }> = {
  ai_serving: { label: 'AI 接待中', cls: 'bg-blue-50 text-blue-600' },
  waiting_human: { label: '待接手', cls: 'bg-orange-50 text-orange-600' },
  human_serving: { label: '人工中', cls: 'bg-green-50 text-green-600' },
  closed: { label: '已结束', cls: 'bg-gray-100 text-gray-500' },
};

const ENTITY_META: Record<EntityType, { label: string; cls: string; icon: string }> = {
  visitor: { label: '访客', cls: 'bg-gray-100 text-gray-600', icon: '👤' },
  lead: { label: '线索', cls: 'bg-blue-50 text-blue-600', icon: '🎯' },
  member: { label: '会员', cls: 'bg-purple-50 text-purple-700', icon: '⭐' },
};

const LEAD_STATUS: Record<LeadStatus, { label: string; cls: string }> = {
  processing: { label: '处理中', cls: 'bg-blue-50 text-blue-600' },
  converted: { label: '已转化', cls: 'bg-green-50 text-green-600' },
  invalid: { label: '无效', cls: 'bg-gray-100 text-gray-500' },
};

const INTENT_CLS: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-50 text-red-600', medium: 'bg-yellow-50 text-yellow-600', low: 'bg-gray-100 text-gray-500',
};
const INTENT_LABEL = { high: '高意向', medium: '中意向', low: '低意向' };

const SENTIMENT_EMOJI: Record<Sentiment, string> = { positive: '😊', neutral: '😐', negative: '😟' };

// 线索信息提取行
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className={`text-sm ${value ? 'text-gray-700' : 'text-gray-300'}`}>{value || '未提供'}</span>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function AgentDeskPage() {
  const [activeConvId, setActiveConvId] = useState<string>('c-001');
  const [filter, setFilter] = useState<string>('all');
  const [input, setInput] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [saveLeadOpen, setSaveLeadOpen] = useState(false);
  // 本地状态：记录坐席操作后的会话状态（覆盖 mock 初始值）
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, ConvStatus>>({});
  // 系统通知（坐席接手 / 转回 AI 时插入聊天流）
  const [sysNotifs, setSysNotifs] = useState<Record<string, string[]>>({});

  const activeConv = mockConversations.find((c) => c.convId === activeConvId)!;
  const ctx = mockHandoffContext;
  const sum = mockSummaries[activeConvId] ?? DEFAULT_SUMMARY;
  const track = mockVisitTrack[activeConvId] ?? [];
  const messages = mockMessages[activeConvId] ?? mockMessages['c-001'];

  const localStatus = localStatusMap[activeConvId] ?? activeConv.status;
  const isHumanServing = localStatus === 'human_serving';

  function doTransferToHuman() {
    // 通知 AI 停止回答（waiting_human 期间 AI 不自动回复）
    setLocalStatusMap(prev => ({ ...prev, [activeConvId]: 'waiting_human' }));
    handleTakeover(activeConvId);
  }

  function doAgentTakeover() {
    setLocalStatusMap(prev => ({ ...prev, [activeConvId]: 'human_serving' }));
    setSysNotifs(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), '🤝 坐席已接入，AI 已暂停自动回复'],
    }));
    handleTakeover(activeConvId);
  }

  function doBackToAI() {
    setLocalStatusMap(prev => ({ ...prev, [activeConvId]: 'ai_serving' }));
    setSysNotifs(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), '🤖 AI 客服已接管，坐席已退出'],
    }));
    handleBackToAILog(activeConvId);
  }

  const getDisplayStatus = (c: ConvItem) => localStatusMap[c.convId] ?? c.status;

  const filtered = mockConversations.filter((c) => {
    const s = getDisplayStatus(c);
    return filter === 'all' || s === filter;
  });
  const entity = ENTITY_META[activeConv.entityType];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── 左栏：会话列表 ── */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="p-3 border-b">
          <h1 className="text-sm font-semibold text-gray-900">对话工作台</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">N2 · ⑤ 在线对话 · 访客/线索/会员</p>
          <div className="flex gap-1 mt-2">
            {[
              { k: 'all', l: '全部' },
              { k: 'waiting_human', l: '待接手' },
              { k: 'human_serving', l: '人工中' },
            ].map((t) => (
              <Button key={t.k} size="sm"
                variant={filter === t.k ? 'default' : 'outline'}
                className={`h-6 text-xs ${filter === t.k ? 'bg-blue-600' : ''}`}
                onClick={() => setFilter(t.k)}>
                {t.l}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => {
            const e = ENTITY_META[c.entityType];
            return (
              <div key={c.convId}
                onClick={() => setActiveConvId(c.convId)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${activeConvId === c.convId ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium text-gray-800 truncate">{c.flag} {c.name}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">{c.lastTime}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge className={`text-[10px] ${e.cls}`}>{e.icon} {e.label}</Badge>
                  <Badge className={`text-[10px] ${CONV_STATUS[getDisplayStatus(c)].cls}`}>{CONV_STATUS[getDisplayStatus(c)].label}</Badge>
                  <Badge className={`text-[10px] ${INTENT_CLS[c.intentLevel]}`}>{INTENT_LABEL[c.intentLevel]}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">{c.lastMsg}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 中栏：对话面板 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 表头：身份信息 + 右侧 4 按钮（AI总结 / 访问轨迹 / 转存线索 / 退出） */}
        <div className="px-4 py-2.5 border-b bg-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">{activeConv.flag} {activeConv.name}</span>
              <Badge className={`text-[10px] ${entity.cls}`}>{entity.icon} {entity.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              <span>📍 {activeConv.location}</span>
              <span className="flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${activeConv.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                {activeConv.online ? '在线' : '已离线'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSummaryOpen(true)}>AI总结</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTrackOpen(true)}>访问轨迹</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSaveLeadOpen(true)}>转存线索</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500" onClick={() => handleExitConv(activeConv.convId)}>退出</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m) => (
            <div key={m.msgId} className={`flex ${m.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[70%]">
                {m.sender !== 'visitor' && (
                  <div className="text-[10px] text-gray-400 text-right mb-0.5">{m.sender === 'ai' ? '🤖 AI' : '👤 坐席'}</div>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  m.sender === 'visitor' ? 'bg-white border text-gray-700 rounded-bl-sm'
                  : m.sender === 'ai' ? 'bg-blue-100 text-blue-900 rounded-br-sm'
                  : 'bg-green-600 text-white rounded-br-sm'}`}>
                  {m.text}
                </div>
                <div className={`text-[10px] text-gray-300 mt-0.5 ${m.sender === 'visitor' ? '' : 'text-right'}`}>{m.time}</div>
              </div>
            </div>
          ))}
          {/* 系统通知：坐席接手 / 转回 AI */}
          {(sysNotifs[activeConvId] ?? []).map((msg, i) => (
            <div key={`sys-${i}`} className="flex justify-center">
              <span className="text-[11px] text-gray-500 bg-gray-100 rounded-full px-3 py-1">{msg}</span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Input
              placeholder={isHumanServing ? "输入回复…" : "AI 服务中，坐席输入已暂停"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isHumanServing}
              className={!isHumanServing ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
            />
            <Button size="sm" className="bg-blue-600" disabled={!isHumanServing}
              onClick={() => { handleSend(activeConv.convId, input); setInput(''); }}>发送</Button>
          </div>
          {/* 人工接手控制按钮 */}
          <div className="flex justify-end mt-2 gap-2">
            {localStatus === 'ai_serving' && (
              <Button size="sm" variant="outline"
                className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={doTransferToHuman}>转人工</Button>
            )}
            {localStatus === 'waiting_human' && (
              <Button size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={doAgentTakeover}>接手</Button>
            )}
            {localStatus === 'human_serving' && (
              <Button size="sm" variant="outline"
                className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                onClick={doBackToAI}>AI客服</Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 右栏：AI 副驾（实时坐席辅助） ── */}
      <div className="w-80 border-l bg-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">🤖 AI 副驾</p>
          <span className="text-[11px] text-gray-400">实时坐席辅助</span>
        </div>
        <div className="p-3 space-y-4">
          {/* 意向 + 情绪 */}
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${INTENT_CLS[ctx.intentLevel]}`}>{INTENT_LABEL[ctx.intentLevel]} {ctx.intentScore}</Badge>
            <div className="flex items-center gap-0.5 text-base">
              {ctx.sentimentArc.map((s, i) => <span key={i}>{SENTIMENT_EMOJI[s]}</span>)}
              <span className="text-[10px] text-gray-400 ml-1">情绪弧度</span>
            </div>
          </div>

          {/* 事实标签 */}
          <div>
            <p className="text-xs text-gray-400 mb-1">事实标签</p>
            <div className="grid grid-cols-2 gap-2">
              {ctx.facts.map((f) => (
                <div key={f.label} className="bg-gray-50 rounded p-2">
                  <p className="text-[10px] text-gray-400">{f.label}</p>
                  <p className="text-sm text-gray-700">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 需求类型 */}
          <div>
            <p className="text-xs text-gray-400 mb-1">需求类型</p>
            <div className="flex flex-wrap gap-1">
              {ctx.painPoints.map((p) => <Badge key={p} className="text-xs bg-purple-50 text-purple-700 border-purple-200">{p}</Badge>)}
            </div>
          </div>

          {/* AI 副驾建议 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-400">💡 回复建议</p>
              <button
                className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                onClick={() => alert('正在刷新回复建议…')}>
                ↻ 刷新
              </button>
            </div>
            <div className="space-y-2">
              {ctx.aiSuggestions.map((s, i) => (
                <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-800">{s}</p>
                  <Button size="sm" variant="outline" className="h-6 text-[11px] mt-1.5"
                    onClick={() => handleAdoptSuggestion(activeConv.convId, s)}>采纳到输入框</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ AI总结 弹窗 ══ */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{activeConv.flag} {activeConv.name}</span>
              <Badge className={`text-[10px] ${entity.cls}`}>{entity.icon} {entity.label}</Badge>
              <span className="text-[11px] font-normal text-gray-400">📍 {activeConv.location} · {activeConv.online ? '在线' : '已离线'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleRegenSummary(activeConv.convId)}>AI 重新总结</Button>
            <span className="text-xs text-gray-400">最新时间：{sum.updatedAt}</span>
          </div>

          {/* 整体总结 + 线索信息提取 */}
          <div className="bg-blue-50/60 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-700">💡 整体总结</p>
            <p className="text-sm text-gray-700 leading-relaxed">{sum.overall}</p>
            <div className="bg-white border rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">线索信息提取</p>
              <div className="space-y-1.5">
                <InfoRow label="邮箱" value={sum.leadInfo.email} />
                <InfoRow label="手机" value={sum.leadInfo.phone} />
                <InfoRow label="其它联系方式" value={sum.leadInfo.otherContact} />
                <InfoRow label="访客公司名称" value={sum.leadInfo.company} />
                <InfoRow label="联系人姓名" value={sum.leadInfo.contactName} />
              </div>
            </div>
          </div>

          {/* 时间轴总结 */}
          <div className="bg-blue-50/40 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-3">💡 时间轴总结</p>
            {sum.timeline.length === 0 ? (
              <p className="text-sm text-gray-300">暂无</p>
            ) : (
              <div className="border-l-2 border-blue-200 ml-1 pl-4 space-y-3">
                {sum.timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs text-gray-500">{t.date}</p>
                    <p className="text-sm text-gray-700">{t.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 关联会员 */}
          <div className="bg-blue-50/40 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">关联会员</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs text-gray-400">是否绑定会员</span>
              <span className="text-gray-700">{sum.member.bound ? '是' : '否'}</span>
              {sum.member.bound && (
                <a href={`/customers/${sum.member.memberId}`} className="text-blue-600 text-xs hover:underline">
                  {sum.member.memberName}（{sum.member.memberId}）查看客户360 ↗
                </a>
              )}
            </div>
          </div>

          {/* 关联线索 */}
          <div className="bg-blue-50/40 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">关联线索</p>
            {sum.lead ? (
              <div className="bg-white border-l-2 border-blue-400 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">线索ID：</span>
                  <a href={`/leads/${sum.lead.leadId}`} className="text-blue-600 text-sm hover:underline">{sum.lead.leadId}</a>
                  <Badge className={`text-[10px] ${LEAD_STATUS[sum.lead.status].cls}`}>{LEAD_STATUS[sum.lead.status].label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <InfoRow label="公司名称" value={sum.lead.company} />
                  <InfoRow label="联系人手机" value={sum.lead.phone} />
                  <InfoRow label="联系人邮箱" value={sum.lead.email} />
                  <InfoRow label="联系人姓名" value={sum.lead.contactName} />
                  <InfoRow label="其它联系方式" value={sum.lead.otherContact} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300">暂无关联线索</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSummaryOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ 访问轨迹 弹窗 ══ */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>访问轨迹 · {activeConv.name}</DialogTitle>
          </DialogHeader>
          {track.length === 0 ? (
            <p className="text-sm text-gray-300">暂无访问记录</p>
          ) : (
            <div className="border-l-2 border-gray-200 ml-1 pl-4 space-y-3">
              {track.map((s, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{s.page}</span>
                    <span className="text-[11px] text-gray-400">停留 {s.stay}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{s.time}</p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <a href={`/visitors?unifiedId=${activeConv.unifiedId}`}>
              <Button variant="outline" size="sm">在访客洞察中查看完整轨迹 ↗</Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ 转存线索 确认弹窗 ══ */}
      <Dialog open={saveLeadOpen} onOpenChange={setSaveLeadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>转存线索</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 leading-relaxed">
            将把当前会话对象「{activeConv.name}」转存至线索池。
            {sum.lead
              ? `该对象已关联线索 ${sum.lead.leadId}，将更新该条线索。`
              : '将新建一条线索记录（记录 IP / 来源 / 已识别联系方式）。'}
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveLeadOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
              onClick={() => { handleSaveAsLead(activeConv.convId); setSaveLeadOpen(false); }}>确认转存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
