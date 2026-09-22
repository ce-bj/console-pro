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
type TicketStatus = 'open' | 'in_progress' | 'pending_confirm' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
type TicketCategory = 'technical' | 'business' | 'after_sale' | 'complaint';
type SlaState = 'normal' | 'warning' | 'overdue';
type ViewMode = 'kanban' | 'list';

interface TicketStats {
  openCount: number;
  todayNewCount: number;
  slaOverdueCount: number;
  todayClosedCount: number;
}

interface TicketItem {
  ticketId: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  customerName: string;
  companyName: string;
  unifiedId: string;
  assignee: string;
  assigneeAvatar: string;
  slaState: SlaState;
  slaRemainingMinutes: number;
  slaDue: string;
  intentScore: number;
  createdAt: string;
}

interface TicketActivity {
  activityId: string;
  type: 'system' | 'note';
  content: string;
  actor: string;
  timestamp: string;
}

interface TicketDetail extends TicketItem {
  sessionSummary: string;
  rootCauseKeywords: string[];
  activities: TicketActivity[];
  aiSuggestion: string;
  priorityExplain: {
    intentScore: number;
    sentimentScore: number;
    slaUrgency: number;
    finalScore: number;
  };
}

// ── DataSlot: 工单统计 ─────────────────────────────────────────────
const mockTicketStats: TicketStats = {
  openCount: 23,
  todayNewCount: 7,
  slaOverdueCount: 3,
  todayClosedCount: 5,
};

// PAGINATION: page,pageSize
// DataSlot: 工单列表
const mockTicketsData: TicketItem[] = [
  {
    ticketId: 'TK-0091',
    title: '年度合同续签商务沟通',
    status: 'open',
    priority: 'urgent',
    category: 'business',
    customerName: '张伟',
    companyName: 'Acme 科技',
    unifiedId: 'u-88821',
    assignee: '客服赵敏',
    assigneeAvatar: '赵',
    slaState: 'overdue',
    slaRemainingMinutes: -45,
    slaDue: '2026-06-04T09:00:00Z',
    intentScore: 92,
    createdAt: '2026-06-04T06:00:00Z',
  },
  {
    ticketId: 'TK-0078',
    title: '多账号协作权限配置咨询',
    status: 'in_progress',
    priority: 'high',
    category: 'technical',
    customerName: '李梅',
    companyName: '深圳制造集团',
    unifiedId: 'u-44322',
    assignee: '技术陈磊',
    assigneeAvatar: '陈',
    slaState: 'warning',
    slaRemainingMinutes: 87,
    slaDue: '2026-06-04T13:00:00Z',
    intentScore: 76,
    createdAt: '2026-06-03T14:00:00Z',
  },
  {
    ticketId: 'TK-0065',
    title: '数据导出功能报错反馈',
    status: 'pending_confirm',
    priority: 'medium',
    category: 'technical',
    customerName: 'John Smith',
    companyName: 'Global Trade Co.',
    unifiedId: 'u-99014',
    assignee: '技术王鹏',
    assigneeAvatar: '王',
    slaState: 'normal',
    slaRemainingMinutes: 320,
    slaDue: '2026-06-05T09:00:00Z',
    intentScore: 54,
    createdAt: '2026-06-02T10:00:00Z',
  },
  {
    ticketId: 'TK-0042',
    title: 'API 文档请求与集成指南',
    status: 'closed',
    priority: 'low',
    category: 'technical',
    customerName: '王芳',
    companyName: '北京信通科技',
    unifiedId: 'u-33108',
    assignee: '技术陈磊',
    assigneeAvatar: '陈',
    slaState: 'normal',
    slaRemainingMinutes: 0,
    slaDue: '2026-05-30T18:00:00Z',
    intentScore: 68,
    createdAt: '2026-05-28T10:00:00Z',
  },
];

// DataSlot: 工单详情
const mockTicketDetailData: TicketDetail = {
  ...mockTicketsData[0],
  sessionSummary:
    '客户张伟于本次会话中明确提出年度合同续签意向，询问是否可提供更优惠的续约条款，尤其关注多账号席位价格和技术支持 SLA。AI 判定为高意向商务诉求并自动建单。',
  rootCauseKeywords: ['续约商务', '席位定价', '技术支持SLA', '年度合同'],
  activities: [
    {
      activityId: 'act-1',
      type: 'system',
      content: '工单由 AI Agent 自动创建（来源会话 sess-001）',
      actor: 'system',
      timestamp: '2026-06-04T06:00:00Z',
    },
    {
      activityId: 'act-2',
      type: 'system',
      content: '工单已分配给客服赵敏（技能匹配：商务跟进）',
      actor: 'system',
      timestamp: '2026-06-04T06:01:00Z',
    },
    {
      activityId: 'act-3',
      type: 'note',
      content: '已电话联系客户确认续约意向，客户表示 Q3 内完成签约，需要提供正式报价单。',
      actor: '客服赵敏',
      timestamp: '2026-06-04T08:30:00Z',
    },
  ],
  aiSuggestion:
    '建议优先提供《企业年度续约方案》报价，重点突出席位数量阶梯折扣和 96h 技术支持响应承诺，可附上同类客户案例加强信心。预估成交概率 85%。',
  priorityExplain: {
    intentScore: 92,
    sentimentScore: 88,
    slaUrgency: 100,
    finalScore: 93,
  },
};

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 更新工单状态或负责人 [PATCH] /api/tickets/{ticket_id}
function handleUpdateTicket(ticketId: string, updates: Partial<Pick<TicketItem, 'status' | 'assignee' | 'priority'>>): void {
  console.log('update ticket', ticketId, updates);
}

// ACTION: 添加工单备注 [POST] /api/tickets/{ticket_id}/notes
function handleAddNote(ticketId: string, note: string): void {
  console.log('add note to ticket', ticketId, note);
  alert(`备注已添加到工单 ${ticketId}`);
}

// ACTION: 发起关闭（触发CSAT） [POST] /api/tickets/{ticket_id}/close
function handleCloseTicket(ticketId: string): void {
  console.log('close ticket', ticketId);
  alert(`工单 ${ticketId} 正在等待客户确认关闭，CSAT 调研已发送。`);
}

// ACTION: 重开工单 [POST] /api/tickets/{ticket_id}/reopen
function handleReopenTicket(ticketId: string): void {
  console.log('reopen ticket', ticketId);
}

// ACTION: 获取工单详情 [GET] /api/tickets/{ticket_id}
function handleViewTicketDetail(ticketId: string): void {
  console.log('view ticket detail', ticketId);
}

// ── 辅助函数 ──────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: '紧急', high: '高', medium: '中', low: '低',
};

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  technical: '技术', business: '商务', after_sale: '售后', complaint: '投诉',
};

const STATUS_LABEL: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: '待处理', cls: 'bg-blue-50 text-blue-600' },
  in_progress: { label: '处理中', cls: 'bg-yellow-50 text-yellow-600' },
  pending_confirm: { label: '待确认', cls: 'bg-purple-50 text-purple-600' },
  closed: { label: '已关闭', cls: 'bg-gray-50 text-gray-500' },
};

function slaLabel(ticket: TicketItem): { text: string; cls: string } {
  if (ticket.slaState === 'overdue') {
    return { text: `超时 ${Math.abs(ticket.slaRemainingMinutes)}min`, cls: 'text-red-600 bg-red-50' };
  }
  if (ticket.slaState === 'warning') {
    return { text: `剩余 ${ticket.slaRemainingMinutes}min`, cls: 'text-orange-600 bg-orange-50' };
  }
  const h = Math.floor(ticket.slaRemainingMinutes / 60);
  return { text: `剩余 ${h}h`, cls: 'text-green-600 bg-green-50' };
}

const STATUS_COLUMNS: TicketStatus[] = ['open', 'in_progress', 'pending_confirm', 'closed'];

// ── 看板卡片 ──────────────────────────────────────────────────────
function TicketKanbanCard({ ticket, onView }: { ticket: TicketItem; onView: (id: string) => void }) {
  const sla = slaLabel(ticket);
  return (
    <div className="bg-white border rounded-lg shadow-sm mb-2 flex overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onView(ticket.ticketId)}>
      {/* 优先级色条 */}
      <div className={`w-1.5 shrink-0 ${PRIORITY_COLOR[ticket.priority]}`} />
      <div className="flex-1 p-3 space-y-2">
        <p className="text-sm font-medium text-gray-800 line-clamp-2">{ticket.title}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className="text-xs bg-gray-100 text-gray-600">{CATEGORY_LABEL[ticket.category]}</Badge>
          <Badge className="text-xs bg-gray-100 text-gray-600">{PRIORITY_LABEL[ticket.priority]}</Badge>
        </div>
        <div className="text-xs text-gray-500">
          {ticket.customerName} · {ticket.companyName}
        </div>
        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${sla.cls}`}>{sla.text}</Badge>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              {ticket.assigneeAvatar}
            </div>
            <span className="text-xs text-yellow-600 font-medium">{ticket.intentScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function TicketWorkbenchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  const stats = mockTicketStats;
  const detail = mockTicketDetailData;

  function openDetail(ticketId: string): void {
    setActiveTicketId(ticketId);
    handleViewTicketDetail(ticketId);
    setDetailOpen(true);
  }

  const filteredTickets = mockTicketsData.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (slaFilter !== 'all' && t.slaState !== slaFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">工单工作台</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-blue-600' : ''}
          >
            看板
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-blue-600' : ''}
          >
            列表
          </Button>
        </div>
      </div>

      {/* 指标卡 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '开放工单', value: stats.openCount, cls: 'text-blue-600', warn: false },
          { label: '今日新建', value: stats.todayNewCount, cls: 'text-gray-900', warn: false },
          { label: 'SLA 超时', value: stats.slaOverdueCount, cls: 'text-red-600', warn: true },
          { label: '今日闭环', value: stats.todayClosedCount, cls: 'text-green-600', warn: false },
        ].map((m) => (
          <Card key={m.label} className={m.warn ? 'border-red-200' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-normal">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${m.cls}`}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="open">待处理</SelectItem>
                <SelectItem value="in_progress">处理中</SelectItem>
                <SelectItem value="pending_confirm">待确认</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="technical">技术</SelectItem>
                <SelectItem value="business">商务</SelectItem>
                <SelectItem value="after_sale">售后</SelectItem>
                <SelectItem value="complaint">投诉</SelectItem>
              </SelectContent>
            </Select>

            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="SLA状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部 SLA</SelectItem>
                <SelectItem value="normal">正常</SelectItem>
                <SelectItem value="warning">即将超时</SelectItem>
                <SelectItem value="overdue">已超时</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 看板视图 */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((status) => {
            const colTickets = filteredTickets.filter((t) => t.status === status);
            const statusInfo = STATUS_LABEL[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs ${statusInfo.cls}`}>{statusInfo.label}</Badge>
                  <span className="text-sm text-gray-400">{colTickets.length}</span>
                </div>
                <div className="space-y-0">
                  {colTickets.map((ticket) => (
                    <TicketKanbanCard key={ticket.ticketId} ticket={ticket} onView={openDetail} />
                  ))}
                  {colTickets.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
                      暂无工单
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工单 ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const sla = slaLabel(ticket);
                  const statusInfo = STATUS_LABEL[ticket.status];
                  return (
                    <TableRow key={ticket.ticketId}>
                      <TableCell className="font-mono text-sm text-blue-600">{ticket.ticketId}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{ticket.title}</TableCell>
                      <TableCell className="text-sm">
                        <div>{ticket.customerName}</div>
                        <div className="text-xs text-gray-400">{ticket.companyName}</div>
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${statusInfo.cls}`}>{statusInfo.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[ticket.priority]}`} />
                          <span className="text-sm">{PRIORITY_LABEL[ticket.priority]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{CATEGORY_LABEL[ticket.category]}</TableCell>
                      <TableCell><Badge className={`text-xs ${sla.cls}`}>{sla.text}</Badge></TableCell>
                      <TableCell className="text-sm">{ticket.assignee}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => openDetail(ticket.ticketId)}>
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 工单详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail.ticketId} · {detail.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* 状态 + 优先级 + 可解释打分 */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={STATUS_LABEL[detail.status].cls}>{STATUS_LABEL[detail.status].label}</Badge>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${PRIORITY_COLOR[detail.priority]}`} />
                <span className="text-sm">{PRIORITY_LABEL[detail.priority]}优先级</span>
              </div>
              <div className="text-xs text-gray-500 ml-auto bg-gray-50 px-2 py-1 rounded">
                优先级分 {detail.priorityExplain.finalScore} =
                意向{detail.priorityExplain.intentScore} × 情绪{detail.priorityExplain.sentimentScore} × SLA紧迫{detail.priorityExplain.slaUrgency}
              </div>
            </div>

            {/* 关联客户 */}
            <div className="text-sm">
              关联客户：
              <a href={`/console/customers/${detail.unifiedId}`}
                className="text-blue-600 hover:underline ml-1">
                {detail.customerName} · {detail.companyName} ↗
              </a>
            </div>

            {/* SLA 进度条 */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>SLA 进度</span>
                <span>截止 {new Date(detail.slaDue).toLocaleString('zh-CN')}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    detail.slaState === 'overdue' ? 'bg-red-500 w-full' :
                    detail.slaState === 'warning' ? 'bg-orange-400 w-3/4' : 'bg-green-400 w-1/3'
                  }`}
                />
              </div>
            </div>

            {/* 来源会话摘要 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">来源会话摘要</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 leading-relaxed">
                {detail.sessionSummary}
              </p>
            </div>

            {/* 根因关键词 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">根因关键词（AI 抽取）</p>
              <div className="flex flex-wrap gap-1">
                {detail.rootCauseKeywords.map((kw) => (
                  <Badge key={kw} className="text-xs bg-purple-50 text-purple-700 border-purple-200">{kw}</Badge>
                ))}
              </div>
            </div>

            {/* AI 建议 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">🤖 AI 建议</p>
              <p className="text-sm text-blue-800">{detail.aiSuggestion}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700">采纳建议</Button>
                <Button size="sm" variant="outline" className="text-xs h-7">忽略</Button>
              </div>
            </div>

            {/* 处理记录时间线 */}
            <div>
              <p className="text-xs text-gray-500 mb-2">处理记录</p>
              <div className="space-y-3">
                {detail.activities.map((act) => (
                  <div key={act.activityId}
                    className="flex gap-3 items-start border-l-2 border-gray-200 pl-3">
                    <div className="absolute -left-[7px]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${act.type === 'system' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'}`}>
                          {act.type === 'system' ? '系统' : act.actor}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(act.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{act.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 添加备注 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">添加备注</p>
              <div className="flex gap-2">
                <Input
                  placeholder="输入内部备注..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button size="sm" variant="outline"
                  onClick={() => { handleAddNote(detail.ticketId, noteText); setNoteText(''); }}>
                  提交
                </Button>
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline"
                onClick={() => handleUpdateTicket(detail.ticketId, { assignee: '其他客服' })}>
                转派
              </Button>
              {detail.status !== 'closed' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleCloseTicket(detail.ticketId)}>
                  关闭（需客户确认）
                </Button>
              )}
              {detail.status === 'closed' && (
                <Button size="sm" variant="outline"
                  onClick={() => handleReopenTicket(detail.ticketId)}>
                  重开工单
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
