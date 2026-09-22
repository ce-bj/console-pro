// 同步状态 — 已入库内容的同步运行管理（不同同步方式的时间/状态，可管理）
// 默认展示近一周，通过筛选过滤，与知识资产目录字段保持一致
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { syncableAssets, KbAsset, CONNECT_CLS, SectionKey, SECTION_MAP, ConnectType, CONNECT_TYPES, effectiveStatus, STATUS_LABEL, daysSince, TODAY } from './data';
import { SectionTag, KpiCard, PageHeader, StatusBadge, HealthValue } from './shared';

const STATUS: Record<NonNullable<KbAsset['syncStatus']>, { label: string; cls: string }> = {
  ok: { label: '正常', cls: 'bg-green-50 text-green-600' },
  running: { label: '同步中', cls: 'bg-blue-50 text-blue-600' },
  failed: { label: '失败', cls: 'bg-red-50 text-red-500' },
  paused: { label: '未启用', cls: 'bg-gray-100 text-gray-400' },
};

// 同步方式归类（不同方式机制不同）
function methodGroup(sync: string): '实时同步' | '定时同步' | '手动' {
  if (sync.includes('实时') || sync.includes('发布即')) return '实时同步';
  if (sync.includes('定时')) return '定时同步';
  return '手动';
}
const METHOD_DESC: Record<string, string> = {
  实时同步: '网站内容发布/修改即时同步，无需等待',
  定时同步: '按设定频率（每日/每周）自动抓取更新',
  手动: '上传后一次性学习，更新需重新上传',
};
const FREQ_OPTS = ['实时', '每小时', '每日', '每周', '手动'];

// 判断同步记录是否在近一周内
function isRecentWeek(lastSync: string | undefined, today: string = TODAY): boolean {
  if (!lastSync) return false;
  const days = daysSince(lastSync, today);
  return days <= 7;
}

export default function SyncPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<KbAsset[]>(syncableAssets);
  const [showAll, setShowAll] = useState(false); // 默认只显示近一周
  const [sectionFilter, setSectionFilter] = useState<'all' | SectionKey>('all');
  const [connectFilter, setConnectFilter] = useState<'all' | ConnectType>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<'all' | NonNullable<KbAsset['syncStatus']>>('all');
  const [logOpen, setLogOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<{ name: string; logs: string[] }>({ name: '', logs: [] });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const groups: ('实时同步' | '定时同步' | '手动')[] = ['实时同步', '定时同步', '手动'];

  function setFreq(id: string, freq: string) {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, freq } : r)));
  }

  // 筛选逻辑
  const filteredRows = rows.filter((r) => {
    if (!showAll && !isRecentWeek(r.lastSync)) return false;
    if (sectionFilter !== 'all' && r.section !== sectionFilter) return false;
    if (connectFilter !== 'all' && r.connect !== connectFilter) return false;
    if (syncStatusFilter !== 'all' && r.syncStatus !== syncStatusFilter) return false;
    return true;
  });

  const failed = filteredRows.filter((r) => r.syncStatus === 'failed').length;
  const selectedRows = rows.filter((r) => selectedIds.includes(r.id));
  const selectedGroup = selectedRows.length > 0 ? methodGroup(selectedRows[0].sync ?? '') : null;
  const selectableRows = selectedGroup ? filteredRows.filter((r) => methodGroup(r.sync ?? '') === selectedGroup) : filteredRows;
  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every((r) => selectedIds.includes(r.id));
  const statusCounts = {
    ok: filteredRows.filter((r) => r.syncStatus === 'ok').length,
    running: filteredRows.filter((r) => r.syncStatus === 'running').length,
    failed,
    paused: filteredRows.filter((r) => !r.syncStatus || r.syncStatus === 'paused').length,
  };

  // 模拟 RAGFlow 式的日志查看
  function viewLog(asset: KbAsset) {
    const logs = [
      `[${asset.lastSync}] 同步开始`,
      `[${asset.lastSync}] 解析文档：${asset.name}`,
      `[${asset.lastSync}] 切片处理：生成 ${asset.chunks} 个可检索片段`,
      asset.syncStatus === 'ok' ? `[${asset.lastSync}] ✓ 同步成功` : `[${asset.lastSync}] ✗ 同步失败：网络超时`,
      asset.syncStatus === 'ok' ? `[${asset.lastSync}] 向量化完成，已入库` : `[${asset.lastSync}] 建议检查网络连接后重试`,
    ];
    setCurrentLog({ name: asset.name, logs });
    setLogOpen(true);
  }

  function toggleRowSelect(asset: KbAsset) {
    const group = methodGroup(asset.sync ?? '');
    if (!selectedIds.includes(asset.id) && selectedGroup && group !== selectedGroup) {
      alert(`已选择「${selectedGroup}」类型内容，请先清空选择后再选择「${group}」。`);
      return;
    }
    setSelectedIds((p) => (p.includes(asset.id) ? p.filter((id) => id !== asset.id) : [...p, asset.id]));
  }

  function toggleSelectAllVisible() {
    if (filteredRows.length === 0) return;
    const targetGroup = selectedGroup ?? methodGroup(filteredRows[0].sync ?? '');
    const targetRows = filteredRows.filter((r) => methodGroup(r.sync ?? '') === targetGroup);
    const allSelected = targetRows.every((r) => selectedIds.includes(r.id));
    setSelectedIds((p) => {
      const targetIds = targetRows.map((r) => r.id);
      if (allSelected) return p.filter((id) => !targetIds.includes(id));
      return Array.from(new Set([...p.filter((id) => methodGroup(rows.find((r) => r.id === id)?.sync ?? '') === targetGroup), ...targetIds]));
    });
  }

  function batchSync() {
    if (selectedRows.length === 0) return;
    // ACTION: 批量触发同类型内容同步 [POST] /api/kb/sync-jobs/batch-run
    setRows((p) => p.map((r) => (selectedIds.includes(r.id) ? { ...r, syncStatus: 'running' } : r)));
    alert(`已触发 ${selectedRows.length} 条「${selectedGroup}」内容同步`);
  }

  function batchSetFreq(freq: string) {
    if (selectedRows.length === 0 || selectedGroup !== '定时同步') return;
    // ACTION: 批量更新定时同步频率 [PATCH] /api/kb/sync-jobs/batch-frequency
    setRows((p) => p.map((r) => (selectedIds.includes(r.id) ? { ...r, freq } : r)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="同步状态" desc="不同内容用不同方式保持更新：网站内容实时同步、外部网页定时抓取、手动文件按需上传。这里看运行情况、调整频率、失败重试。" />
        <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? '仅显示近一周' : '查看更多'}
        </Button>
      </div>

      {/* 按同步方式概览 */}
      <div className="grid grid-cols-3 gap-4">
        {groups.map((g) => {
          const cnt = filteredRows.filter((r) => methodGroup(r.sync ?? '') === g).length;
          return <KpiCard key={g} label={g} value={cnt} sub={METHOD_DESC[g]} cls="text-gray-900" />;
        })}
      </div>

      {/* 状态分布（运营视角总览，不用逐组去数） */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="正常" value={statusCounts.ok} sub="同步运行正常" cls="text-green-600" />
        <KpiCard label="同步中" value={statusCounts.running} sub="正在执行同步任务" cls="text-blue-600" />
        <KpiCard label="失败" value={statusCounts.failed} sub="需要检查并重试" cls="text-red-500" />
        <KpiCard label="未启用" value={statusCounts.paused} sub="尚未开始同步" cls="text-gray-400" />
      </div>

      {failed > 0 && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ 有 {failed} 个来源同步失败，请检查并重试。</div>
      )}

      {/* 筛选条件（与知识资产目录保持一致） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">板块</span>
              <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value as any)} className="h-8 px-2 rounded border text-xs bg-white">
                <option value="all">全部板块</option>
                {Object.values(SECTION_MAP).map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">来源方式</span>
              <select value={connectFilter} onChange={(e) => setConnectFilter(e.target.value as any)} className="h-8 px-2 rounded border text-xs bg-white">
                <option value="all">全部来源</option>
                {CONNECT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">同步状态</span>
              <select value={syncStatusFilter} onChange={(e) => setSyncStatusFilter(e.target.value as any)} className="h-8 px-2 rounded border text-xs bg-white">
                <option value="all">全部状态</option>
                <option value="ok">正常</option>
                <option value="running">同步中</option>
                <option value="failed">失败</option>
                <option value="paused">未启用</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统一列表（与知识资产目录字段保持一致） */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm">同步内容列表 {!showAll && <span className="text-xs text-gray-400 font-normal">（近一周）</span>}</CardTitle>
            <div className="text-xs text-gray-400">同类型内容可多选后批量操作</div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRows.length > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-md border bg-blue-50 px-3 py-2">
              <div className="text-sm text-blue-700">
                已选择 <span className="font-semibold">{selectedRows.length}</span> 条「{selectedGroup}」内容
                <span className="text-xs text-blue-500 ml-2">只能同时选择同一同步类型</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroup === '定时同步' && (
                  <select
                    className="h-8 rounded border bg-white px-2 text-xs"
                    value={selectedRows[0]?.freq ?? '每日'}
                    onChange={(e) => batchSetFreq(e.target.value)}
                  >
                    {FREQ_OPTS.filter((f) => f !== '手动' && f !== '实时').map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
                <Button size="sm" className="h-8 bg-blue-600 text-xs" onClick={batchSync}>
                  {selectedRows.some((r) => r.syncStatus === 'failed') ? '批量重试' : '批量立即同步'}
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedIds([])}>清空</Button>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleSelectAllVisible}
                    className="accent-blue-600"
                  />
                </TableHead>
                <TableHead>内容标题</TableHead>
                <TableHead>板块</TableHead>
                <TableHead>来源方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>健康度</TableHead>
                <TableHead>频率</TableHead>
                <TableHead>上次同步</TableHead>
                <TableHead>下次同步</TableHead>
                <TableHead>同步状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-sm text-gray-400 py-8">
                    {showAll ? '暂无同步内容' : '近一周无同步记录，点击右上角"查看更多"查看全部'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => {
                  const rowGroup = methodGroup(r.sync ?? '');
                  const disabledByType = !!selectedGroup && selectedGroup !== rowGroup && !selectedIds.includes(r.id);
                  return (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/knowledge-config/catalog/${r.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(r.id)}
                        disabled={disabledByType}
                        onChange={() => toggleRowSelect(r)}
                        className="accent-blue-600 disabled:opacity-40"
                        title={disabledByType ? `已选择${selectedGroup}，不能混选${rowGroup}` : ''}
                      />
                    </TableCell>
                    <TableCell className="text-sm">{r.name}</TableCell>
                    <TableCell><SectionTag k={r.section} /></TableCell>
                    <TableCell><Badge className={`text-xs ${CONNECT_CLS[r.connect]}`}>{r.connect}</Badge></TableCell>
                    <TableCell><StatusBadge status={effectiveStatus(r)} /></TableCell>
                    <TableCell><HealthValue value={r.health} status={r.status} /></TableCell>
                    <TableCell>
                      {methodGroup(r.sync ?? '') === '定时同步' ? (
                        <select value={r.freq} onChange={(e) => { e.stopPropagation(); setFreq(r.id, e.target.value); }} className="h-7 px-1.5 rounded border text-xs bg-white" onClick={(e) => e.stopPropagation()}>
                          {FREQ_OPTS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                      ) : <span className="text-xs text-gray-500">{r.freq}</span>}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{r.lastSync}</TableCell>
                    <TableCell className="text-xs text-gray-400">{r.nextSync}</TableCell>
                    <TableCell><Badge className={`text-xs ${STATUS[r.syncStatus ?? 'paused'].cls}`}>{STATUS[r.syncStatus ?? 'paused'].label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); alert(`已触发「${r.name}」立即同步`); }}>{r.syncStatus === 'failed' ? '重试' : '立即同步'}</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); viewLog(r); }}>日志</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 日志查看弹窗（参考 RAGFlow） */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>同步日志 · {currentLog.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {currentLog.logs.map((log, i) => (
              <div key={i} className={log.includes('✓') ? 'text-green-400' : log.includes('✗') ? 'text-red-400' : ''}>
                {log}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
