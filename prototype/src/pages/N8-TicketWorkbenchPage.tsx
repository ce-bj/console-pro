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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type TicketStatus = 'open' | 'in_progress' | 'pending_confirm' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
// 分类为可配置 key（不写死枚举），由下方 mockCategories 定义；Agent 自行判断后人工可调整
type CategoryBy = 'ai' | 'human';
type SlaState = 'normal' | 'warning' | 'overdue';
type ViewMode = 'kanban' | 'list';

// 可自定义配置的工单类型
interface CategoryConfig {
  key: string;
  label: string;
  desc: string;     // 供 Agent 对话中判断归类的说明
  color: string;    // badge 配色 class
  enabled: boolean;
}

// 关联客户候选（来自 N6 客户管理）
interface CustomerOption { unifiedId: string; name: string; company: string; }

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
  category: string;            // 分类 key（对应可配置分类）
  categoryBy: CategoryBy;      // ai 自动判断 / human 人工调整
  categoryConfidence: number;  // AI 归类置信度 0–100
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

// ── DataSlot: 可配置工单类型（售后服务为主）───────────────────────
const mockCategories: CategoryConfig[] = [
  { key: 'product_fault', label: '产品故障', desc: '产品使用报错、功能异常、报修等技术故障', color: 'bg-blue-50 text-blue-600 border-blue-200', enabled: true },
  { key: 'return_exchange', label: '退换货', desc: '退货、换货、退款申请', color: 'bg-orange-50 text-orange-600 border-orange-200', enabled: true },
  { key: 'logistics', label: '物流配送', desc: '发货进度、物流查询、签收异常', color: 'bg-cyan-50 text-cyan-600 border-cyan-200', enabled: true },
  { key: 'billing', label: '发票账单', desc: '开票、账单、付款/对账问题', color: 'bg-purple-50 text-purple-600 border-purple-200', enabled: true },
  { key: 'account', label: '账号权限', desc: '登录、账号、权限/席位配置问题', color: 'bg-teal-50 text-teal-600 border-teal-200', enabled: true },
  { key: 'complaint', label: '投诉建议', desc: '不满、升级、负面情绪及改进建议', color: 'bg-red-50 text-red-600 border-red-200', enabled: true },
];

// ── DataSlot: 关联客户候选 ─────────────────────────────────────────
const mockCustomerOptions: CustomerOption[] = [
  { unifiedId: 'u-88821', name: '张伟', company: 'Acme 科技' },
  { unifiedId: 'u-44322', name: '李梅', company: '深圳制造集团' },
  { unifiedId: 'u-99014', name: 'John Smith', company: 'Global Trade Co.' },
  { unifiedId: 'u-33108', name: '王芳', company: '北京信通科技' },
];

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
    title: '设备到货后无法开机，疑似运输损坏',
    status: 'open',
    priority: 'urgent',
    category: 'product_fault',
    categoryBy: 'ai',
    categoryConfidence: 94,
    customerName: '张伟',
    companyName: 'Acme 科技',
    unifiedId: 'u-88821',
    assignee: '售后赵敏',
    assigneeAvatar: '赵',
    slaState: 'overdue',
    slaRemainingMinutes: -45,
    slaDue: '2026-06-04T09:00:00Z',
    intentScore: 92,
    createdAt: '2026-06-04T06:00:00Z',
  },
  {
    ticketId: 'TK-0078',
    title: '申请退货退款（型号不符）',
    status: 'in_progress',
    priority: 'high',
    category: 'return_exchange',
    categoryBy: 'human',
    categoryConfidence: 71,
    customerName: '李梅',
    companyName: '深圳制造集团',
    unifiedId: 'u-44322',
    assignee: '售后陈磊',
    assigneeAvatar: '陈',
    slaState: 'warning',
    slaRemainingMinutes: 87,
    slaDue: '2026-06-04T13:00:00Z',
    intentScore: 76,
    createdAt: '2026-06-03T14:00:00Z',
  },
  {
    ticketId: 'TK-0065',
    title: '数据导出功能报错，提示超时',
    status: 'pending_confirm',
    priority: 'medium',
    category: 'product_fault',
    categoryBy: 'ai',
    categoryConfidence: 88,
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
    title: '发票抬头开错，需作废重开',
    status: 'closed',
    priority: 'low',
    category: 'billing',
    categoryBy: 'ai',
    categoryConfidence: 82,
    customerName: '王芳',
    companyName: '北京信通科技',
    unifiedId: 'u-33108',
    assignee: '财务客服陈磊',
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
    '客户张伟反馈：设备到货后无法开机，外箱有挤压痕迹，疑似运输途中损坏。客户情绪急切，已购订单需尽快处理。AI 判定为高优先级产品故障并自动建单。',
  rootCauseKeywords: ['无法开机', '运输损坏', '外箱挤压', '到货异常'],
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
      content: '工单已分配给售后赵敏（技能匹配：产品故障 / 报修）',
      actor: 'system',
      timestamp: '2026-06-04T06:01:00Z',
    },
    {
      activityId: 'act-3',
      type: 'note',
      content: '已电话联系客户，确认外箱破损并拍照取证，已发起换货流程，预计 2 个工作日内补发。',
      actor: '售后赵敏',
      timestamp: '2026-06-04T08:30:00Z',
    },
  ],
  aiSuggestion:
    '判断为运输损坏，建议走「换货 + 物流理赔」流程：先安排同型号补发，同步向承运方发起破损理赔；附《开箱验收指引》降低复发。预估 2 个工作日内闭环。',
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

// ACTION: 人工调整工单分类（覆盖 AI 判断）[PATCH] /api/tickets/{ticket_id}  {category, category_by:"human"}
function handleAdjustCategory(ticketId: string, category: string): void {
  console.log('adjust category', ticketId, category);
}

// ACTION: 保存自定义工单类型配置 [PUT] /api/ticket-categories
function handleSaveCategories(categories: CategoryConfig[]): void {
  console.log('save categories', categories);
  alert('工单类型配置已保存，Agent 将按新类型在对话中自动归类');
}

// ACTION: 新增工单（手动建单） [POST] /api/tickets
function handleCreateTicket(form: NewTicketForm): void {
  console.log('create ticket', form);
  alert(`已创建工单：${form.title || '(未命名)'}（类型 ${form.category} · 关联客户 ${form.unifiedId || '无'}）`);
}

// 新增工单表单
interface NewTicketForm {
  title: string;
  category: string;
  unifiedId: string;     // 关联客户
  priority: TicketPriority;
  assignee: string;
  description: string;
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

// 分类查找（基于可配置分类）
function catLabel(key: string): string {
  return mockCategories.find((c) => c.key === key)?.label ?? key;
}
function catCls(key: string): string {
  return mockCategories.find((c) => c.key === key)?.color ?? 'bg-gray-100 text-gray-600';
}

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
          <Badge className={`text-xs ${catCls(ticket.category)}`}>
            {catLabel(ticket.category)}
            {ticket.categoryBy === 'ai' && <span className="ml-0.5 opacity-60">·AI</span>}
          </Badge>
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
  const [catConfigOpen, setCatConfigOpen] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryConfig[]>(mockCategories);
  const [detailCategory, setDetailCategory] = useState<string>(mockTicketDetailData.category);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [newTicket, setNewTicket] = useState<NewTicketForm>({
    title: '', category: mockCategories[0].key, unifiedId: '', priority: 'medium', assignee: '', description: '',
  });

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
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateOpen(true)}>+ 新增工单</Button>
          <Button variant="outline" size="sm" onClick={() => setCatConfigOpen(true)}>工单类型配置</Button>
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
                <SelectValue placeholder="工单类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {mockCategories.filter((c) => c.enabled).map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
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
                  <TableHead>工单类型</TableHead>
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
                      <TableCell>
                        <Badge className={`text-xs ${catCls(ticket.category)}`}>{catLabel(ticket.category)}</Badge>
                        <span className="ml-1 text-[10px] text-gray-400">{ticket.categoryBy === 'ai' ? `AI ${ticket.categoryConfidence}%` : '人工'}</span>
                      </TableCell>
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

            {/* 分类：AI 自动判断 + 人工可调整 */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">工单类型</span>
                <Badge className={`text-xs ${catCls(detailCategory)}`}>{catLabel(detailCategory)}</Badge>
                {detail.categoryBy === 'ai' && detailCategory === detail.category ? (
                  <Badge className="text-[10px] bg-blue-50 text-blue-600 border-blue-200">🤖 AI 自动归类 · 置信 {detail.categoryConfidence}%</Badge>
                ) : (
                  <Badge className="text-[10px] bg-yellow-50 text-yellow-700 border-yellow-200">已人工调整</Badge>
                )}
              </div>
              <Select value={detailCategory} onValueChange={(v) => { setDetailCategory(v); handleAdjustCategory(detail.ticketId, v); }}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.enabled).map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 关联客户 */}
            <div className="text-sm">
              关联客户：
              <a href={`/customers/${detail.unifiedId}`}
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

      {/* 分类配置弹窗：自定义分类，Agent 对话中按 desc 自动归类 */}
      <Dialog open={catConfigOpen} onOpenChange={setCatConfigOpen}>
        <DialogContent className="max-w-xl max-h-[82vh] overflow-y-auto">
          <DialogHeader><DialogTitle>工单类型配置</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs text-blue-700">
              🤖 工单类型的「说明」会作为提示注入 Agent。对话中 Agent 据此<strong>自动判断类型</strong>并建单，坐席可在工单详情<strong>人工调整</strong>。
            </div>
            {categories.map((c) => (
              <div key={c.key} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${c.color}`}>{c.label}</Badge>
                  <Input className="h-7 text-xs flex-1" defaultValue={c.label}
                    onChange={(e) => setCategories((prev) => prev.map((x) => x.key === c.key ? { ...x, label: e.target.value } : x))} />
                  <span className="text-[11px] text-gray-400 font-mono">{c.key}</span>
                  <Switch checked={c.enabled}
                    onCheckedChange={(v) => setCategories((prev) => prev.map((x) => x.key === c.key ? { ...x, enabled: v } : x))} />
                </div>
                <Textarea className="text-xs" defaultValue={c.desc} placeholder="供 Agent 判断归类的说明"
                  onChange={(e) => setCategories((prev) => prev.map((x) => x.key === c.key ? { ...x, desc: e.target.value } : x))} />
              </div>
            ))}
            <div className="flex justify-between pt-1">
              <Button size="sm" variant="outline"
                onClick={() => setCategories((prev) => [...prev, { key: `custom_${Date.now()}`, label: '新类型', desc: '', color: 'bg-gray-100 text-gray-600 border-gray-200', enabled: true }])}>
                + 新增类型
              </Button>
              <Button size="sm" className="bg-blue-600" onClick={() => { handleSaveCategories(categories); setCatConfigOpen(false); }}>保存配置</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增工单弹窗：手动建单，可选工单类型 + 关联客户 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>新增工单</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {/* 标题 */}
            <div>
              <label className="text-xs text-gray-500">工单标题 <span className="text-red-500">*</span></label>
              <Input className="mt-1" placeholder="一句话描述客户的问题"
                value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* 工单类型 */}
              <div>
                <label className="text-xs text-gray-500">工单类型 <span className="text-red-500">*</span></label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.enabled).map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* 优先级 */}
              <div>
                <label className="text-xs text-gray-500">优先级</label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as TicketPriority })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">紧急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* 关联客户 */}
              <div>
                <label className="text-xs text-gray-500">关联客户</label>
                <Select value={newTicket.unifiedId || 'none'} onValueChange={(v) => setNewTicket({ ...newTicket, unifiedId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="选择客户" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">暂不关联</SelectItem>
                    {mockCustomerOptions.map((c) => (
                      <SelectItem key={c.unifiedId} value={c.unifiedId}>{c.name} · {c.company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-gray-400 mt-0.5">关联后可在客户 360 看到此工单</p>
              </div>
              {/* 负责人 */}
              <div>
                <label className="text-xs text-gray-500">负责人</label>
                <Input className="mt-1 h-9" placeholder="指派给（留空走自动分配）"
                  value={newTicket.assignee} onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })} />
              </div>
            </div>

            {/* 问题描述 */}
            <div>
              <label className="text-xs text-gray-500">问题描述</label>
              <Textarea className="mt-1" placeholder="客户问题详情、复现步骤、诉求…"
                value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={!newTicket.title}
                onClick={() => { handleCreateTicket(newTicket); setCreateOpen(false); }}>创建工单</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
