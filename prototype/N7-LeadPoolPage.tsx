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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── 类型定义 ───────────────────────────────────────────────────────
type IntentLevel = 'high' | 'medium' | 'low';
type LeadStatus = 'pending' | 'following' | 'converted' | 'invalid';
type LeadSource = 'ai_chat' | 'form' | 'manual';
type CrmSyncStatus = 'not_synced' | 'syncing' | 'synced' | 'error';

interface LeadItem {
  leadId: string;
  unifiedId: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  intentLevel: IntentLevel;
  painPoints: string[];
  source: LeadSource;
  sourceSessionId: string | null;
  status: LeadStatus;
  createdAt: string;
  crmSyncStatus: CrmSyncStatus;
  crmRef: string | null;
}

interface LeadDetailData {
  leadId: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  intentLevel: IntentLevel;
  painPoints: string[];
  focusPoints: string[];
  sessionSummary: string;
  customFields: Record<string, string>;
  crmSyncStatus: CrmSyncStatus;
  crmRef: string | null;
  createdAt: string;
}

interface StatusCounts {
  pending: number;
  following: number;
  converted: number;
  invalid: number;
}

// ── DataSlot: 各状态数量 ───────────────────────────────────────────
const mockLeadStatusCounts: StatusCounts = {
  pending: 11,
  following: 4,
  converted: 0,
  invalid: 2,
};

// PAGINATION: page,pageSize
// DataSlot: 线索列表
const mockLeadsData: LeadItem[] = [
  {
    leadId: 'L-1001',
    unifiedId: 'u-88821',
    customerName: '张伟',
    companyName: 'Acme 科技有限公司',
    email: 'z****@acme.com',
    phone: '138****8821',
    intentLevel: 'high',
    painPoints: ['采购周期长', 'API 集成', '多人协作'],
    source: 'ai_chat',
    sourceSessionId: 'sess-001',
    status: 'following',
    createdAt: '2026-06-04T10:30:00Z',
    crmSyncStatus: 'synced',
    crmRef: 'crm-person-4421',
  },
  {
    leadId: 'L-1002',
    unifiedId: 'u-44322',
    customerName: '李梅',
    companyName: '深圳制造集团',
    email: 'l****@szgroup.com',
    phone: '139****4432',
    intentLevel: 'medium',
    painPoints: ['系统扩展性不足', '数据孤岛'],
    source: 'form',
    sourceSessionId: 'sess-002',
    status: 'pending',
    createdAt: '2026-06-04T09:15:00Z',
    crmSyncStatus: 'not_synced',
    crmRef: null,
  },
  {
    leadId: 'L-1003',
    unifiedId: 'u-99014',
    customerName: 'John Smith',
    companyName: 'Global Trade Co.',
    email: 'j****@globaltrade.com',
    phone: '+1 650****0012',
    intentLevel: 'low',
    painPoints: ['价格敏感'],
    source: 'ai_chat',
    sourceSessionId: 'sess-003',
    status: 'pending',
    createdAt: '2026-06-03T22:00:00Z',
    crmSyncStatus: 'error',
    crmRef: null,
  },
  {
    leadId: 'L-1004',
    unifiedId: 'u-33108',
    customerName: '王芳',
    companyName: '北京信通科技',
    email: 'w****@bj-it.com',
    phone: '137****3310',
    intentLevel: 'high',
    painPoints: ['客服效率低', '工单管理混乱'],
    source: 'manual',
    sourceSessionId: null,
    status: 'pending',
    createdAt: '2026-06-03T16:20:00Z',
    crmSyncStatus: 'not_synced',
    crmRef: null,
  },
];

// DataSlot: 线索详情（抽屉用）
const mockLeadDetailData: LeadDetailData = {
  leadId: 'L-1001',
  customerName: '张伟',
  companyName: 'Acme 科技有限公司',
  email: 'zhang.wei@acme.com',
  phone: '138-8821-xxxx',
  intentLevel: 'high',
  painPoints: ['采购周期长', 'API 集成', '多人协作'],
  focusPoints: ['企业版定价', '按年付费折扣', 'SSO 单点登录'],
  sessionSummary: '客户主动询问企业方案定价，三次访问定价页，AI 判断为高意向。留资后由人工客服跟进预约 Demo，客户明确表示 Q3 有采购预算。',
  customFields: {
    employeeCount: '200+',
    industry: '制造业',
    budget: '10-50万/年',
    decisionTimeline: 'Q3 2026',
  },
  crmSyncStatus: 'synced',
  crmRef: 'crm-person-4421',
  createdAt: '2026-06-04T10:30:00Z',
};

// ── ActionSlot ────────────────────────────────────────────────────

// ACTION: 转为客户 [POST] /api/leads/{lead_id}/convert
function handleConvertToCustomer(leadId: string): void {
  console.log('convert lead to customer', leadId);
}

// ACTION: 单条写入TwentyCRM [POST] /api/leads/crm-sync
function handleSyncToCRM(leadId: string): void {
  console.log('sync lead to CRM', leadId);
  alert(`正在将线索 ${leadId} 写入 TwentyCRM...`);
}

// ACTION: 批量写入TwentyCRM [POST] /api/leads/crm-sync
function handleBatchSyncToCRM(leadIds: string[]): void {
  console.log('batch sync to CRM', leadIds);
  alert(`正在批量写入 ${leadIds.length} 条线索到 TwentyCRM...`);
}

// ACTION: 获取线索详情 [GET] /api/leads/{lead_id}
function handleViewLeadDetail(leadId: string): void {
  console.log('view lead detail', leadId);
}

// ACTION: 标记无效 [PATCH] /api/leads/{lead_id}
function handleMarkInvalid(leadId: string): void {
  console.log('mark lead as invalid', leadId);
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

function sourceLabel(source: LeadSource): string {
  return { ai_chat: 'AI 对话', form: '表单', manual: '人工录入' }[source];
}

function crmSyncBadge(status: CrmSyncStatus): { label: string; cls: string } {
  return {
    not_synced: { label: '未同步', cls: 'bg-gray-100 text-gray-500' },
    syncing: { label: '同步中...', cls: 'bg-blue-100 text-blue-600' },
    synced: { label: '已同步', cls: 'bg-green-100 text-green-600' },
    error: { label: '同步失败', cls: 'bg-red-100 text-red-600' },
  }[status];
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function LeadPoolPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<LeadStatus>('pending');
  const [page, setPage] = useState<number>(1);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const counts = mockLeadStatusCounts;

  const filteredLeads = mockLeadsData.filter((lead) => {
    const matchStatus = lead.status === statusTab;
    const matchIntent = intentFilter === 'all' || lead.intentLevel === intentFilter;
    const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchSearch = !searchQuery ||
      lead.customerName.includes(searchQuery) ||
      lead.companyName.includes(searchQuery) ||
      lead.email.includes(searchQuery);
    return matchStatus && matchIntent && matchSource && matchSearch;
  });

  function toggleSelect(leadId: string): void {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId],
    );
  }

  function toggleSelectAll(): void {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.leadId));
    }
  }

  function openDetail(leadId: string): void {
    setActiveLeadId(leadId);
    handleViewLeadDetail(leadId);
    setDetailDrawerOpen(true);
  }

  const detail = mockLeadDetailData;
  const crmSync = crmSyncBadge(detail.crmSyncStatus);

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">线索池</h1>
        <div className="flex gap-2">
          {selectedLeadIds.length > 0 && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm"
              onClick={() => handleBatchSyncToCRM(selectedLeadIds)}>
              写入 CRM（{selectedLeadIds.length}）
            </Button>
          )}
          <Button variant="outline" size="sm">导出</Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              className="w-56"
              placeholder="搜索姓名 / 邮箱 / 公司"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="意向等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部意向</SelectItem>
                <SelectItem value="high">高意向</SelectItem>
                <SelectItem value="medium">中意向</SelectItem>
                <SelectItem value="low">低意向</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="ai_chat">AI 对话</SelectItem>
                <SelectItem value="form">表单</SelectItem>
                <SelectItem value="manual">人工录入</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-blue-600 hover:bg-blue-700">查询</Button>
          </div>
        </CardContent>
      </Card>

      {/* 状态 Tab */}
      <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as LeadStatus)}>
        <TabsList>
          <TabsTrigger value="pending">待处理 ({counts.pending})</TabsTrigger>
          <TabsTrigger value="following">跟进中 ({counts.following})</TabsTrigger>
          <TabsTrigger value="converted">已转化 ({counts.converted})</TabsTrigger>
          <TabsTrigger value="invalid">无效 ({counts.invalid})</TabsTrigger>
        </TabsList>

        {(['pending', 'following', 'converted', 'invalid'] as LeadStatus[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input type="checkbox"
                          className="rounded"
                          checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead>公司名</TableHead>
                      <TableHead>联系方式</TableHead>
                      <TableHead>意向等级</TableHead>
                      <TableHead>痛点关键词</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead>留资时间</TableHead>
                      <TableHead>CRM 状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const syncInfo = crmSyncBadge(lead.crmSyncStatus);
                      return (
                        <TableRow key={lead.leadId}>
                          <TableCell>
                            <input type="checkbox"
                              className="rounded"
                              checked={selectedLeadIds.includes(lead.leadId)}
                              onChange={() => toggleSelect(lead.leadId)}
                            />
                          </TableCell>
                          <TableCell>
                            <a href={`/console/customers/${lead.unifiedId}`}
                              className="font-medium text-blue-600 hover:underline text-sm">
                              {lead.customerName}
                            </a>
                          </TableCell>
                          <TableCell className="text-sm">{lead.companyName}</TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              <div>{lead.email}</div>
                              <div className="text-gray-400">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${intentBadgeClass(lead.intentLevel)}`}>
                              {intentLabel(lead.intentLevel)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {lead.painPoints.slice(0, 3).map((p) => (
                                <Badge key={p} className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {sourceLabel(lead.source)}
                            {lead.sourceSessionId && (
                              <a href="#" className="block text-blue-500 hover:underline mt-0.5">
                                查看会话 ↗
                              </a>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-xs ${syncInfo.cls}`}>{syncInfo.label}</Badge>
                              {lead.crmRef && (
                                <a href="#" title={`TwentyCRM: ${lead.crmRef}`}
                                  className="text-gray-400 hover:text-blue-500 text-xs">↗</a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="text-xs h-6"
                                onClick={() => openDetail(lead.leadId)}>
                                查看
                              </Button>
                              {lead.status !== 'converted' && (
                                <Button size="sm" variant="outline" className="text-xs h-6"
                                  onClick={() => handleConvertToCustomer(lead.leadId)}>
                                  转客户
                                </Button>
                              )}
                              {lead.crmSyncStatus !== 'synced' && (
                                <Button size="sm" className="text-xs h-6 bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleSyncToCRM(lead.leadId)}>
                                  入 CRM
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-400 py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* 分页 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    共 {filteredLeads.length} 条 {selectedLeadIds.length > 0 && `，已选 ${selectedLeadIds.length} 条`}
                  </span>
                  <div className="flex gap-2">
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
          </TabsContent>
        ))}
      </Tabs>

      {/* 线索详情抽屉 */}
      <Dialog open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>线索详情 · {activeLeadId}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">姓名</span><p className="font-medium">{detail.customerName}</p></div>
              <div><span className="text-gray-500">公司</span><p className="font-medium">{detail.companyName}</p></div>
              <div><span className="text-gray-500">邮箱</span><p className="font-medium text-xs break-all">{detail.email}</p></div>
              <div><span className="text-gray-500">电话</span><p className="font-medium">{detail.phone}</p></div>
            </div>

            {/* 自定义字段 */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">留资字段</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(detail.customFields).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded p-2">
                    <div className="text-xs text-gray-400">{k}</div>
                    <div className="text-sm font-medium">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 痛点/关注点 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">痛点</p>
              <div className="flex flex-wrap gap-1">
                {detail.painPoints.map((p) => (
                  <Badge key={p} className="text-xs bg-orange-50 text-orange-700 border-orange-200">{p}</Badge>
                ))}
              </div>
            </div>

            {/* 来源会话摘要 */}
            <div>
              <p className="text-xs text-gray-500 mb-1">来源会话摘要</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 leading-relaxed">
                {detail.sessionSummary}
              </p>
            </div>

            {/* CRM 同步状态 */}
            <div className="border rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">TwentyCRM 同步状态</p>
                <Badge className={`text-xs mt-1 ${crmSync.cls}`}>{crmSync.label}</Badge>
                {detail.crmRef && (
                  <p className="text-xs text-gray-400 mt-0.5">ref: {detail.crmRef}</p>
                )}
              </div>
              {detail.crmSyncStatus !== 'synced' && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"
                  onClick={() => handleSyncToCRM(detail.leadId)}>
                  立即同步到 CRM
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
