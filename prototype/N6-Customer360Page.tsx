import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

// ── 类型定义 ───────────────────────────────────────────────────────
type IntentLevel = 'high' | 'medium' | 'low';
type EventType = 'page_view' | 'scroll_depth' | 'click' | 'page_leave';
type SessionChannel = 'ai' | 'human';
type TicketStatus = 'open' | 'in_progress' | 'pending_confirm' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';

interface CustomerData {
  unifiedId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobTitle: string | null;
  intentLevel: IntentLevel;
  sourceChannel: string;
  isIdentified: boolean;
  createdAt: string;
}

interface BehaviorEvent {
  eventId: string;
  eventType: EventType;
  pageUrl: string;
  eventTime: string;
  summary: string;
}

interface SessionRecord {
  sessionId: string;
  channel: SessionChannel;
  messageSummary: string;
  intentChange: 'up' | 'down' | 'stable';
  startedAt: string;
  messageCount: number;
}

interface ProfileData {
  factTags: string[];
  intentLevel: IntentLevel;
  focusPoints: string[];
  painPoints: string[];
  narrative: string;
  sentimentArc: { round: number; score: number }[];
}

interface TicketItem {
  ticketId: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  csatScore: number | null;
}

interface SessionMessage {
  messageId: string;
  sender: 'agent' | 'visitor';
  text: string;
  sentAt: string;
  isIntentNode: boolean;
}

// ── DataSlot: 客户基础信息 ─────────────────────────────────────────
const mockCustomerData: CustomerData = {
  unifiedId: 'u-88821',
  name: '张伟',
  email: 'zhang.wei@acme.com',
  phone: '138****8821',
  companyName: 'Acme 科技有限公司',
  jobTitle: 'IT 采购总监',
  intentLevel: 'high',
  sourceChannel: 'AI 对话',
  isIdentified: true,
  createdAt: '2026-05-20T08:00:00Z',
};

// DataSlot: 行为轨迹事件
const mockCustomerEventsData: BehaviorEvent[] = [
  {
    eventId: 'ev-01',
    eventType: 'page_view',
    pageUrl: '/demo.html',
    eventTime: '2026-06-04T10:00:00Z',
    summary: '进入首页，加载耗时 1.2s',
  },
  {
    eventId: 'ev-02',
    eventType: 'scroll_depth',
    pageUrl: '/demo.html#pricing',
    eventTime: '2026-06-04T10:03:20Z',
    summary: '滚动至定价方案页 75%',
  },
  {
    eventId: 'ev-03',
    eventType: 'click',
    pageUrl: '/demo.html#pricing',
    eventTime: '2026-06-04T10:04:10Z',
    summary: '点击"查看企业方案"CTA 按钮',
  },
  {
    eventId: 'ev-04',
    eventType: 'page_leave',
    pageUrl: '/demo.html',
    eventTime: '2026-06-04T10:23:00Z',
    summary: '离开页面，总停留 23 分钟，最深滚动 87%',
  },
];

// DataSlot: 会话记录列表
const mockCustomerSessionsData: SessionRecord[] = [
  {
    sessionId: 'sess-001',
    channel: 'ai',
    messageSummary: '咨询企业方案价格，询问是否支持按年付费，意向强烈',
    intentChange: 'up',
    startedAt: '2026-06-04T10:25:00Z',
    messageCount: 12,
  },
  {
    sessionId: 'sess-002',
    channel: 'human',
    messageSummary: '转人工后确认 Demo 预约，客服协助完成企业留资',
    intentChange: 'stable',
    startedAt: '2026-06-03T15:10:00Z',
    messageCount: 8,
  },
  {
    sessionId: 'sess-003',
    channel: 'ai',
    messageSummary: '询问 API 接入文档，自助浏览后离开，未留资',
    intentChange: 'down',
    startedAt: '2026-06-01T09:00:00Z',
    messageCount: 4,
  },
];

// DataSlot: 对话详情消息（弹窗用）
const mockSessionMessagesData: SessionMessage[] = [
  {
    messageId: 'msg-1',
    sender: 'agent',
    text: '您好！我是 Anvil 智能助手，请问您对哪方面最感兴趣？',
    sentAt: '2026-06-04T10:25:00Z',
    isIntentNode: false,
  },
  {
    messageId: 'msg-2',
    sender: 'visitor',
    text: '想了解一下企业方案的价格，我们公司大概有 200 人左右。',
    sentAt: '2026-06-04T10:25:30Z',
    isIntentNode: true,
  },
  {
    messageId: 'msg-3',
    sender: 'agent',
    text: '好的！针对 200 人规模的企业，我们有定制化方案，支持按年付费享 8 折优惠。方便留下联系方式，我安排专属顾问为您详细说明？',
    sentAt: '2026-06-04T10:25:50Z',
    isIntentNode: false,
  },
  {
    messageId: 'msg-4',
    sender: 'visitor',
    text: '可以，我邮箱是 zhang.wei@acme.com',
    sentAt: '2026-06-04T10:26:15Z',
    isIntentNode: true,
  },
];

// DataSlot: 客户画像
const mockCustomerProfileData: ProfileData = {
  factTags: ['访问 7 次', '定价页重访 3 次', '企业规模 200+', '制造业'],
  intentLevel: 'high',
  focusPoints: ['企业方案定价', '按年付费', 'API 集成', '多人协作'],
  painPoints: ['采购流程审批周期长', '当前系统扩展性不足', '多团队协同困难'],
  narrative:
    '该访客来自大型制造业企业 IT 部门，身为采购决策者，对企业版定价和 API 集成能力高度关注。已三次重访定价页，意向等级高。预算决策周期约 3 个月，需提供可量化的 ROI 数据辅助说服内部。',
  sentimentArc: [
    { round: 1, score: 0.1 },
    { round: 2, score: 0.3 },
    { round: 3, score: 0.6 },
    { round: 4, score: 0.8 },
    { round: 5, score: 0.7 },
    { round: 6, score: 0.9 },
  ],
};

// DataSlot: 工单与满意度
const mockCustomerTicketsData: TicketItem[] = [
  {
    ticketId: 'TK-0042',
    title: '企业方案集成接口 API 文档请求',
    status: 'closed',
    priority: 'high',
    createdAt: '2026-05-28T10:00:00Z',
    csatScore: 5,
  },
  {
    ticketId: 'TK-0078',
    title: '多账号协作权限配置咨询',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2026-06-03T14:00:00Z',
    csatScore: null,
  },
  {
    ticketId: 'TK-0091',
    title: '年度合同续签商务沟通',
    status: 'open',
    priority: 'urgent',
    createdAt: '2026-06-04T09:00:00Z',
    csatScore: null,
  },
];

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 转为线索 [POST] /api/leads
function handleConvertToLead(unifiedId: string): void {
  console.log('convert to lead', unifiedId);
}

// ACTION: 创建工单 [POST] /api/tickets
function handleCreateTicket(unifiedId: string): void {
  console.log('create ticket for customer', unifiedId);
}

// ACTION: 发起对话 [POST] /api/sessions
function handleInitiateConversation(unifiedId: string): void {
  console.log('initiate conversation with', unifiedId);
}

// ACTION: 获取会话消息 [GET] /api/sessions/{session_id}/messages
function handleViewSessionDetail(sessionId: string): void {
  console.log('view session detail', sessionId);
}

// ── 辅助函数 ──────────────────────────────────────────────────────
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

function ticketStatusLabel(status: TicketStatus): { label: string; cls: string } {
  return {
    open: { label: '待处理', cls: 'text-blue-600 bg-blue-50' },
    in_progress: { label: '处理中', cls: 'text-yellow-600 bg-yellow-50' },
    pending_confirm: { label: '待确认', cls: 'text-purple-600 bg-purple-50' },
    closed: { label: '已关闭', cls: 'text-gray-500 bg-gray-50' },
  }[status];
}

function priorityLabel(p: TicketPriority): string {
  return { urgent: '紧急', high: '高', medium: '中', low: '低' }[p];
}

function eventIcon(type: EventType): string {
  return { page_view: '📄', scroll_depth: '↕️', click: '👆', page_leave: '🚪' }[type];
}

function avatarLetters(name: string | null, id: string): string {
  if (name) return name.slice(0, 2);
  return id.slice(-2).toUpperCase();
}

// ── 情绪弧度图（简化 SVG 折线） ────────────────────────────────────
function SentimentArcChart({ data }: { data: { round: number; score: number }[] }) {
  const W = 300, H = 80, PAD = 12;
  const maxR = Math.max(...data.map((d) => d.round));
  const x = (r: number) => PAD + ((r - 1) / (maxR - 1)) * (W - PAD * 2);
  const y = (s: number) => PAD + ((1 - s) / 2) * (H - PAD * 2);
  const points = data.map((d) => `${x(d.round)},${y(d.score)}`).join(' ');
  const zeroY = y(0);
  return (
    <svg width={W} height={H} className="border border-gray-100 rounded bg-gray-50">
      <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="#d1d5db" strokeWidth="1" strokeDasharray="3,3" />
      <text x={PAD - 2} y={y(1) + 4} fontSize="8" fill="#9ca3af">+1</text>
      <text x={PAD - 2} y={y(-1) + 4} fontSize="8" fill="#9ca3af">-1</text>
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d) => (
        <circle key={d.round} cx={x(d.round)} cy={y(d.score)} r="3" fill="#3b82f6" />
      ))}
    </svg>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function Customer360Page() {
  const [sessionDialogOpen, setSessionDialogOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const customer = mockCustomerData;
  const profile = mockCustomerProfileData;

  function openSessionDetail(sessionId: string): void {
    setActiveSessionId(sessionId);
    handleViewSessionDetail(sessionId);
    setSessionDialogOpen(true);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── 左侧身份卡 ── */}
      <aside className="w-60 border-r bg-white flex flex-col p-5 gap-4 shrink-0">
        {/* 头像 + 姓名 */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto">
            {avatarLetters(customer.name, customer.unifiedId)}
          </div>
          <div className="mt-2 font-semibold text-gray-900">
            {customer.name ?? `anony-${customer.unifiedId.slice(-4)}`}
          </div>
          {customer.isIdentified && (
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="text-blue-500 text-xs">✉</span>
              <span className="text-xs text-blue-500">已识别</span>
            </div>
          )}
        </div>

        {/* 意向等级 */}
        <div className="text-center">
          <Badge className={`text-sm px-3 py-1 ${intentBadgeClass(customer.intentLevel)}`}>
            {intentLabel(customer.intentLevel)}
          </Badge>
        </div>

        {/* 基础信息 */}
        <div className="space-y-2 text-sm">
          {customer.companyName && (
            <div className="flex items-start gap-1">
              <span className="text-gray-400 shrink-0">🏢</span>
              <span className="text-gray-700">{customer.companyName}</span>
            </div>
          )}
          {customer.jobTitle && (
            <div className="flex items-start gap-1">
              <span className="text-gray-400 shrink-0">💼</span>
              <span className="text-gray-700">{customer.jobTitle}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-start gap-1">
              <span className="text-gray-400 shrink-0">✉️</span>
              <span className="text-gray-700 break-all text-xs">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-start gap-1">
              <span className="text-gray-400 shrink-0">📱</span>
              <span className="text-gray-700">{customer.phone}</span>
            </div>
          )}
          <div className="flex items-start gap-1">
            <span className="text-gray-400 shrink-0">📌</span>
            <span className="text-gray-500 text-xs">{customer.sourceChannel}</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-2 mt-auto">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8"
            onClick={() => handleConvertToLead(customer.unifiedId)}>
            转为线索
          </Button>
          <Button variant="outline" className="w-full text-xs h-8"
            onClick={() => handleCreateTicket(customer.unifiedId)}>
            创建工单
          </Button>
          <Button variant="outline" className="w-full text-xs h-8"
            onClick={() => handleInitiateConversation(customer.unifiedId)}>
            发起对话
          </Button>
        </div>
      </aside>

      {/* ── 右侧 Tab 区 ── */}
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900">客户 360 · {customer.unifiedId}</h1>
          <p className="text-sm text-gray-500">
            创建于 {new Date(customer.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>

        <Tabs defaultValue="events">
          <TabsList className="mb-4">
            <TabsTrigger value="events">行为轨迹</TabsTrigger>
            <TabsTrigger value="sessions">会话记录</TabsTrigger>
            <TabsTrigger value="profile">客户画像</TabsTrigger>
            <TabsTrigger value="tickets">工单 &amp; 满意度</TabsTrigger>
          </TabsList>

          {/* Tab1: 行为轨迹 */}
          <TabsContent value="events">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-0">
                  {mockCustomerEventsData.map((event, idx) => (
                    <div key={event.eventId}
                      className="flex gap-3 items-start border-l-2 border-blue-200 pl-4 pb-6 relative">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-400" />
                      <span className="text-base mt-0.5">{eventIcon(event.eventType)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{event.summary}</span>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                            {new Date(event.eventTime).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-xs text-blue-500 mt-0.5">{event.pageUrl}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab2: 会话记录 */}
          <TabsContent value="sessions">
            <Card>
              <CardContent className="pt-4 space-y-3">
                {mockCustomerSessionsData.map((session) => (
                  <div key={session.sessionId}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => openSessionDetail(session.sessionId)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={session.channel === 'ai'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 text-xs'
                          : 'bg-green-50 text-green-600 border-green-200 text-xs'}>
                          {session.channel === 'ai' ? 'AI 智能客服' : '人工客服'}
                        </Badge>
                        <span className="text-xs text-gray-400">{session.messageCount} 条消息</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm ${
                          session.intentChange === 'up' ? 'text-green-500' :
                          session.intentChange === 'down' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          {session.intentChange === 'up' ? '↑' :
                           session.intentChange === 'down' ? '↓' : '→'}
                        </span>
                        <span className="text-xs text-gray-400">意向变化</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{session.messageSummary}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.startedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab3: 客户画像 */}
          <TabsContent value="profile">
            <div className="space-y-4">
              {/* 事实标签 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    事实标签（规则计算）
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {profile.factTags.map((tag) => (
                    <Badge key={tag} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* 意向分析 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    意向分析
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">意向等级</p>
                    <Badge className={intentBadgeClass(profile.intentLevel)}>
                      {intentLabel(profile.intentLevel)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">关注点</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.focusPoints.map((p) => (
                        <Badge key={p} className="bg-green-50 text-green-700 border border-green-200 text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">痛点关键词</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.painPoints.map((p) => (
                        <Badge key={p} className="bg-orange-50 text-orange-700 border border-orange-200 text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 叙事画像 */}
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    🤖 AI 叙事画像
                    <Badge className="text-xs bg-gray-200 text-gray-500">AI 生成</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">{profile.narrative}</p>
                </CardContent>
              </Card>

              {/* 情绪弧度图 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">情绪弧度（最近一次对话）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <SentimentArcChart data={profile.sentimentArc} />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>横轴：对话轮次</p>
                      <p>纵轴：情绪分（-1 负面 → +1 正面）</p>
                      <p className="mt-2 text-green-600 font-medium">
                        结尾情绪：+{profile.sentimentArc[profile.sentimentArc.length - 1].score} 正向 ✓
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab4: 工单 & 满意度 */}
          <TabsContent value="tickets">
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工单 ID</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>满意度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCustomerTicketsData.map((ticket) => {
                      const statusInfo = ticketStatusLabel(ticket.status);
                      return (
                        <TableRow key={ticket.ticketId}>
                          <TableCell className="font-mono text-sm text-blue-600">
                            {ticket.ticketId}
                          </TableCell>
                          <TableCell className="text-sm">{ticket.title}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${statusInfo.cls}`}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{priorityLabel(ticket.priority)}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                          </TableCell>
                          <TableCell>
                            {ticket.csatScore !== null ? (
                              <span className="text-yellow-500">
                                {'★'.repeat(ticket.csatScore)}{'☆'.repeat(5 - ticket.csatScore)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">待评价</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 会话详情弹窗 */}
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>会话详情 · {activeSessionId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {mockSessionMessagesData.map((msg) => (
              <div key={msg.messageId}
                className={`flex ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm relative ${
                  msg.sender === 'visitor'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                  {msg.isIntentNode && (
                    <div className="absolute -top-4 right-0">
                      <Badge className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                        意向节点
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
