import { CONNECTION_ACTIONS, ConnectionBatchAction, canRunConnectionAction } from './connectionActions';
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProfileReturnBanner from './ProfileReturnBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReplaceKnowledgeFile from './ReplaceKnowledgeFile';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  KbAsset, SectionKey, SECTIONS, mockAssets, STATUS_LABEL, effectiveStatus, upsertKnowledgeAssets,
  mockAssetChunks, mockCallLogs, computeHealthBreakdown, computeHealth, mockHealthWeights,
} from './data';
import { HealthValue, PageHeader, SectionTag } from './shared';
import {
  SourceConnection, SourceFrequency, mockSourceConnectionsData, sourceAssets, handlePauseSource,
} from './sourceConnections';

const mockSourceConnectionsPageData = mockSourceConnectionsData;
const mockKnowledgeUpdatesData = mockAssets;
const SOURCE_STATUS = {
  active: { label: '正常', cls: 'bg-green-50 text-green-700' },
  pending: { label: '待手动更新', cls: 'bg-amber-50 text-amber-700' },
  syncing: { label: '同步中', cls: 'bg-blue-50 text-blue-700' },
  failed: { label: '同步失败', cls: 'bg-red-50 text-red-600' },
  paused: { label: '已关闭使用', cls: 'bg-gray-100 text-gray-600' },
};
const FREQUENCIES: SourceFrequency[] = ['实时', '每小时', '每日', '每周'];
const FREQUENCY_LABELS: Record<SourceFrequency, string> = { 实时: '实时 · 发现即处理', 每小时: '每小时 · 整点', 每日: '每日 · 00:00', 每周: '每周一 · 00:00' };
const GUIDE: Record<SectionKey, [string, string]> = {
  document: ['更新文档', '原文过期请更新文档；局部问题可编辑切片'],
  faq: ['编辑问答', '核对标准答案、相似问法与适用范围'],
  content: ['管理接入来源', '在来源栏目修正正文，内容发布后实时同步'],
  structured: ['检查数据来源', '核对业务字段、缺失值及数据新鲜度'],
  web: ['检查网址与正文', '检查网址可访问性；来源改变后重新抓取'],
  industry: ['编辑行业资料', '核对资料有效性，平台导入内容不会自动覆盖'],
};

// ACTION: 获取接入来源列表 [GET] /api/kb/source-connections
function handleFetchSourceConnections(params: { keyword?: string; section?: string; kind?: string }) {
  console.log('fetch source connections', params);
}
// ACTION: 获取知识更新列表 [GET] /api/kb/assets/updates
function handleFetchKnowledgeUpdates(params: { keyword?: string; section?: string }) { console.log('fetch knowledge updates', params); }

function nextSyncLabel(frequency: SourceFrequency, enabled: boolean): string {
  if (!enabled) return '自动更新已关闭';
  if (frequency === '实时') return '检测到新增 / 删除时';
  if (frequency === '每小时') return '下个整点';
  if (frequency === '每日') return '每日 00:00';
  return '下周一 00:00';
}

export default function ConnectionUpdatesPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'sources');
  const [query, setQuery] = useState(params.get('keyword') || '');
  const [section, setSection] = useState('all');
  const [kind, setKind] = useState('all');
  const [, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  const [changeSource, setChangeSource] = useState<SourceConnection | null>(null);
  const [logSource, setLogSource] = useState<SourceConnection | null>(null);
  const [pauseSource, setPauseSource] = useState<SourceConnection | null>(null);
  const [upload, setUpload] = useState<KbAsset | null>(null);

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [detecting, setDetecting] = useState<string[]>([]);
  const detectingRef = useRef(new Set<string>());
  const [batchAction, setBatchAction] = useState<ConnectionBatchAction>('detect');
  const [batchFrequency, setBatchFrequency] = useState<SourceFrequency>('每日');
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const refresh = () => setRevision((value) => value + 1);
  const sourceId = params.get('source');
  const sources = mockSourceConnectionsPageData.filter((source) =>
    (!sourceId || source.sourceId === sourceId) &&
    (section === 'all' || source.section === section) &&
    (kind === 'all' || source.kind === kind) &&
    (source.name + ' ' + sourceAssets(source).map(a => a.name).join(' ')).toLowerCase().includes(query.toLowerCase()),
  );
  const assets = mockKnowledgeUpdatesData.filter((asset) =>
    (section === 'all' || asset.section === section) && asset.name.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedSourceRows = sources.filter(s => selectedSources.includes(s.id));
  const batchEligible = selectedSourceRows.filter(s => canRunConnectionAction(s.status, batchAction, detecting.includes(s.id)));
  const toggleSelection = (ids: string[], id: string) => ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id];

  // ACTION: 手动检测接入变化 [POST] /api/kb/source-connections/{id}/detect
  async function handleDetect(source: SourceConnection, silent = false): Promise<boolean> {
    if (!canRunConnectionAction(source.status, 'detect', detectingRef.current.has(source.id))) return false;
    detectingRef.current.add(source.id);
    setDetecting([...detectingRef.current]);
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const failed = source.status === 'failed';
    if (!failed) {
      source.lastDetected = now;
      if (source.added + source.removed > 0 && !source.autoUpdate) source.status = 'pending';
    }
    source.logs.unshift({ id: source.id + '-detect-' + Date.now(), time: now, action: '手动检测', result: failed ? '失败' : '成功', detail: failed ? '来源暂时无法访问，保留上次检测结果，请检查来源后重试。' : '发现新增 ' + source.added + ' 条、来源删除 ' + source.removed + ' 条；本次检测不执行同步。' });
    detectingRef.current.delete(source.id);
    setDetecting([...detectingRef.current]);
    if (!silent) setMessage(failed ? '检测失败，已保留上次结果，可查看任务日志。' : '检测完成：新增 ' + source.added + ' 条，删除 ' + source.removed + ' 条。');
    refresh();
    return !failed;
  }

  // ACTION: 批量管理接入来源 [POST] /api/kb/source-connections/batch
  async function handleBatchSources() {
    if (batchBusy) return;
    const targets = selectedSourceRows.filter(s => canRunConnectionAction(s.status, batchAction, detectingRef.current.has(s.id)));
    const skipped = selectedSourceRows.length - targets.length;
    setBatchBusy(true);
    let success = 0;
    for (const source of targets) {
      if (batchAction === 'detect') { if (await handleDetect(source, true)) success++; continue; }
      if (batchAction === 'sync') handleSyncNow(source);
      else if (batchAction === 'autoOn' || batchAction === 'autoOff') handleAutoUpdate(source, batchAction === 'autoOn');
      else if (batchAction === 'frequency') handleFrequency(source, batchFrequency);
      else handleSourceEnabled(source, batchAction === 'resume');
      success++;
    }
    setMessage(CONNECTION_ACTIONS[batchAction] + '：成功 ' + success + ' 项，失败 ' + (targets.length - success) + ' 项，跳过 ' + skipped + ' 项。');
    setSelectedSources([]); setBatchOpen(false); setBatchBusy(false); refresh();
  }

  // ACTION: 立即同步接入来源 [POST] /api/kb/source-connections/{id}/sync
  function handleSyncNow(source: SourceConnection) {
    if (!canRunConnectionAction(source.status, 'sync', detectingRef.current.has(source.id))) return;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const wasPending = source.status === 'pending';
    source.status = 'syncing';
    refresh();
    if (wasPending) source.count = Math.max(0, source.count + source.added - source.removed);
    source.status = 'active';
    source.lastSync = now;
    source.nextSync = nextSyncLabel(source.frequency, source.autoUpdate);
    source.logs.unshift({ id: `${source.id}-${Date.now()}`, time: now, action: '立即同步', result: '成功', detail: `已处理最近发现的新增 ${source.added} 条、来源删除 ${source.removed} 条；内容修改按发布事件实时同步。` });
    setMessage(`“${source.name}”同步完成。`);
    refresh();
  }

  // ACTION: 更新自动更新开关 [PATCH] /api/kb/source-connections/{id}/auto-update
  function handleAutoUpdate(source: SourceConnection, enabled: boolean) {
    source.autoUpdate = enabled;
    source.nextSync = nextSyncLabel(source.frequency, enabled);
    if (source.status !== 'paused' && source.status !== 'failed') source.status = enabled ? 'active' : (source.added + source.removed > 0 ? 'pending' : 'active');
    source.logs.unshift({ id: `${source.id}-${Date.now()}`, time: '刚刚', action: enabled ? '开启自动更新' : '关闭自动更新', result: '成功', detail: enabled ? `按“${source.frequency}”执行；页面正文修改仍随发布事件实时同步。` : '继续检测新增和删除，但需要用户手动立即同步。' });
    setMessage(enabled ? '已开启自动更新。' : '已关闭自动更新；系统仍会实时显示新增和删除。');
    refresh();
  }

  // ACTION: 修改来源更新频率 [PATCH] /api/kb/source-connections/{id}/frequency
  function handleFrequency(source: SourceConnection, frequency: SourceFrequency) {
    source.frequency = frequency;
    source.nextSync = nextSyncLabel(frequency, source.autoUpdate);
    source.logs.unshift({ id: `${source.id}-${Date.now()}`, time: '刚刚', action: '修改更新频率', result: '成功', detail: `更新频率调整为“${frequency}”。` });
    setMessage(`“${source.name}”更新频率已改为${frequency}。`);
    refresh();
  }

  // ACTION: 更新接入使用状态 [PATCH] /api/kb/source-connections/{id}/enabled
  function handleSourceEnabled(source: SourceConnection, enabled: boolean) {
    if (!enabled) {
      handlePauseSource(source);
      setMessage(`“${source.name}”已关闭使用；接入关系和历史记录继续保留。`);
      refresh();
      return;
    }
    upsertKnowledgeAssets(sourceAssets(source).filter((asset) => source.pausedIds.includes(asset.id)).map((asset) => ({ ...asset, status: 'published' })));
    source.status = source.added + source.removed > 0 && !source.autoUpdate ? 'pending' : 'active';
    source.nextSync = nextSyncLabel(source.frequency, source.autoUpdate);
    source.logs.unshift({ id: `${source.id}-${Date.now()}`, time: '刚刚', action: '恢复使用', result: '成功', detail: '恢复该应用/数据源的变化检测与内容学习；用户此前单独停用的知识保持停用。' });
    source.pausedIds = [];
    setMessage(`“${source.name}”已恢复使用。`);
    refresh();
  }

  // ACTION: 重新检查知识健康度 [POST] /api/kb/assets/health-check
  function handleHealth(ids?: string[]) {
    const result: Record<string, number> = {};
    assets.filter((asset) => (!ids || ids.includes(asset.id)) && asset.status !== 'learning' && asset.status !== 'draft').forEach((asset) => {
      result[asset.id] = computeHealth(computeHealthBreakdown(asset, mockAssetChunks[asset.id] || [], mockCallLogs), mockHealthWeights);
    });
    setScores(previous => ({ ...previous, ...result }));
    setMessage('健康检查完成 ' + Object.keys(result).length + ' 项，跳过 ' + ((ids?.length ?? assets.length) - Object.keys(result).length) + ' 项；草稿或学习中的知识暂不检查，不触发学习。');
  }

  function changeFilters(next: { keyword?: string; section?: string; kind?: string }) {
    setSelectedSources([]); setSelectedAssets([]);
    if (tab === 'sources') handleFetchSourceConnections(next);
    else handleFetchKnowledgeUpdates({ keyword: next.keyword, section: next.section });
  }

  function openAssetAction(asset: KbAsset) {
    const returnContext = params.get('returnTo')?.startsWith('/knowledge-config?profileSite=') ? `&returnTo=${encodeURIComponent(params.get('returnTo')!)}` : '';
    if ((asset.section === 'content' || asset.section === 'structured') && (asset.frontendPageId || asset.backendPageId)) {
      navigate(`/knowledge-config/sync?source=${encodeURIComponent(asset.frontendPageId || asset.backendPageId || '')}${returnContext}`);
      setQuery('');
      setTab('sources');
      return;
    }
    if (asset.connect === '上传文件') { setUpload(asset); return; }
    navigate(`/knowledge-config/catalog/${asset.id}${returnContext ? `?${returnContext.slice(1)}` : ''}`);
  }

  return <div className="space-y-5">
    <ProfileReturnBanner />
    <PageHeader title="接入与更新" desc="管理已接入知识的更新方式与使用状态。" />
    <Tabs value={tab} onValueChange={(value) => { setTab(value); setSelectedSources([]); setSelectedAssets([]); if (value === 'sources') handleFetchSourceConnections({ keyword: query, section, kind }); else handleFetchKnowledgeUpdates({ keyword: query, section }); }}>
      <TabsList><TabsTrigger value="sources">接入来源</TabsTrigger><TabsTrigger value="updates">知识更新与体检</TabsTrigger></TabsList>
      <div className="my-4 flex flex-wrap gap-3">
        <Input aria-label="搜索名称" className="max-w-xs" placeholder="搜索栏目、应用或知识名称" value={query} onChange={(event) => { setQuery(event.target.value); changeFilters({ keyword: event.target.value, section, kind }); }} />
        <select aria-label="知识板块" className="h-9 rounded border bg-white px-3 text-sm" value={section} onChange={(event) => { setSection(event.target.value); changeFilters({ keyword: query, section: event.target.value, kind }); }}><option value="all">全部知识板块</option>{SECTIONS.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}</select>
        {tab === 'sources' && <select aria-label="来源方式" className="h-9 rounded border bg-white px-3 text-sm" value={kind} onChange={(event) => { setKind(event.target.value); changeFilters({ keyword: query, section, kind: event.target.value }); }}><option value="all">全部来源</option><option>前台页面</option><option>后台页面</option></select>}
        {sourceId && tab === 'sources' && <Button variant="outline" onClick={() => navigate('/knowledge-config/sync')}>查看全部接入</Button>}
      </div>
      {message && <p role="status" className="mb-4 rounded bg-blue-50 p-3 text-sm text-blue-700">{message}</p>}

      <TabsContent value="sources">
        <Card><CardContent className="pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">共 {sources.length} 个应用/数据源 · 使用中持续检测新增和删除</p>
            <Button onClick={() => navigate('/knowledge-config/catalog/new')}>新增应用/数据源</Button>
          </div>
          <div className="mb-4 grid gap-3 rounded border bg-gray-50 p-3 text-xs sm:grid-cols-3"><div><strong className="block text-gray-800 mb-1">新增 / 删除</strong>自动按频率处理，或手动立即同步</div><div><strong className="block text-gray-800 mb-1">已有内容修改</strong>发布后实时学习，不受新增 / 删除频率影响</div><div><strong className="block text-gray-800 mb-1">关闭使用</strong>停止全部更新，并停用关联知识</div></div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><Button size="sm" variant="ghost" disabled={!sources.length} onClick={() => setSelectedSources(sources.map(s => s.id))}>全选筛选结果</Button>{selectedSources.length > 0 && <div className="flex flex-wrap flex-1 items-center gap-2 rounded border border-blue-100 bg-blue-50 p-2"><span className="px-2">已选 {selectedSources.length} 项</span><Button size="sm" variant="outline" disabled={batchBusy} onClick={() => { setBatchAction('detect'); setBatchOpen(true); }}>检测变化</Button><Button size="sm" variant="outline" disabled={batchBusy} onClick={() => { setBatchAction('sync'); setBatchOpen(true); }}>立即同步</Button><Select value="" onValueChange={value => { setBatchAction(value as ConnectionBatchAction); setBatchOpen(true); }}><SelectTrigger aria-label="批量更新设置" className="w-36 h-8 bg-white"><SelectValue placeholder="更新设置" /></SelectTrigger><SelectContent>{(['autoOn', 'autoOff', 'frequency', 'pause', 'resume'] as ConnectionBatchAction[]).map(key => <SelectItem key={key} value={key}>{CONNECTION_ACTIONS[key]}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="ghost" onClick={() => setSelectedSources([])}>取消选择</Button></div>}</div>
          <div className="overflow-x-auto"><Table className="[&_th]:whitespace-nowrap">
            <TableHeader><TableRow><TableHead><input type="checkbox" aria-label="全选筛选后的接入" checked={sources.length > 0 && sources.every(s => selectedSources.includes(s.id))} onChange={e => setSelectedSources(e.target.checked ? sources.map(s => s.id) : [])} /></TableHead><TableHead>知识资产</TableHead><TableHead>知识板块</TableHead><TableHead>知识数</TableHead><TableHead>使用状态</TableHead><TableHead>更新规则</TableHead><TableHead>变化详情</TableHead><TableHead>最近检测 / 学习</TableHead><TableHead>健康度</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
            <TableBody>{sources.map((source) => {
              const status = SOURCE_STATUS[source.status];
              const linkedAssets = sourceAssets(source);
              return <TableRow key={source.id}>
                <TableCell><input type="checkbox" aria-label={'选择' + source.name} checked={selectedSources.includes(source.id)} onChange={() => setSelectedSources(toggleSelection(selectedSources, source.id))} /></TableCell>
                <TableCell className="min-w-56"><div className="space-y-1">{linkedAssets.length ? linkedAssets.slice(0, 2).map(asset => <button key={asset.id} className="block text-left font-medium text-blue-600 hover:underline" onClick={() => navigate(`/knowledge-config/catalog/${asset.id}`)}>{asset.name}</button>) : <span className="text-gray-400">尚未生成知识资产</span>}{linkedAssets.length > 2 && <button className="text-xs text-blue-600" onClick={() => navigate(`/knowledge-config/catalog?source=${encodeURIComponent(source.sourceId)}&section=${source.section}`)}>查看全部 {linkedAssets.length} 项</button>}</div><div className="mt-1 text-xs text-gray-400">{source.kind} · {source.name}</div>{source.status === 'failed' && <p className="mt-1 text-xs text-red-600">来源暂时无法访问，未将其误判为来源删除。</p>}</TableCell>
                <TableCell className="min-w-28"><SectionTag k={source.section} /></TableCell>
                <TableCell>{source.count}</TableCell>
                <TableCell className="min-w-28 whitespace-nowrap"><div className="flex items-center gap-2"><Switch aria-label={`${source.name}使用状态`} checked={source.status !== 'paused'} disabled={source.status === 'syncing' || detecting.includes(source.id)} onCheckedChange={(enabled) => enabled ? handleSourceEnabled(source, true) : setPauseSource(source)} /><span className="text-xs text-gray-500">{source.status === 'paused' ? '已关闭' : '使用中'}</span></div></TableCell>
                <TableCell className="min-w-52"><div className="flex items-center gap-2"><Switch aria-label={`${source.name}自动更新知识`} checked={source.autoUpdate} disabled={source.status === 'paused' || source.status === 'syncing' || detecting.includes(source.id)} onCheckedChange={enabled => handleAutoUpdate(source, enabled)} /><span className="text-xs">{source.autoUpdate ? '自动处理新增 / 删除' : '手动处理新增 / 删除'}</span></div>{source.autoUpdate && <Select value={source.frequency} disabled={source.status === 'paused' || source.status === 'syncing' || detecting.includes(source.id)} onValueChange={value => handleFrequency(source, value as SourceFrequency)}><SelectTrigger aria-label={`${source.name}更新频率`} className="h-8 mt-2 text-xs"><SelectValue /></SelectTrigger><SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>)}</SelectContent></Select>}<div className="mt-1 text-xs text-gray-500">{source.status === 'paused' ? '已停止全部更新' : source.status === 'failed' ? '连接恢复后重试' : source.autoUpdate ? '下次：' + nextSyncLabel(source.frequency, true) : '检测到变化后点击立即同步'}</div></TableCell>
                <TableCell><Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setChangeSource(source)}><span className={source.added ? 'text-green-600' : 'text-gray-400'}>新增 {source.added}</span><span className="mx-1 text-gray-300">/</span><span className={source.removed ? 'text-red-500' : 'text-gray-400'}>删除 {source.removed}</span></Button></TableCell>

                <TableCell className="min-w-40 text-xs"><div>检测：{source.lastDetected}</div><Button size="sm" variant="outline" className="h-7 text-xs mt-1" disabled={!canRunConnectionAction(source.status, 'detect', detecting.includes(source.id))} onClick={() => handleDetect(source)}>{detecting.includes(source.id) ? '检测中…' : '检测变化'}</Button><div className="mt-1 text-gray-400">学习：{source.lastSync}</div></TableCell>
                <TableCell><HealthValue value={source.health} /></TableCell>
                <TableCell><Badge className={status.cls}>{status.label}</Badge></TableCell>
                <TableCell><div className="flex min-w-56 flex-wrap justify-end gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/knowledge-config/catalog?source=${encodeURIComponent(source.sourceId)}&section=${source.section}`)}>查看知识</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={source.status === 'paused' || source.status === 'syncing' || detecting.includes(source.id)} onClick={() => handleSyncNow(source)}>立即同步</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLogSource(source)}>任务日志</Button>
                </div></TableCell>
              </TableRow>;
            })}{sources.length === 0 && <TableRow><TableCell colSpan={11} className="py-10 text-center text-gray-500">暂无匹配接入</TableCell></TableRow>}</TableBody>
          </Table></div>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="updates"><Card><CardContent className="pt-4 overflow-x-auto">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm text-gray-500">按板块维护内容，保存后按对应规则学习。</span><Button variant="outline" onClick={() => handleHealth()}>重新检查健康度</Button></div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><span>已选 {selectedAssets.length} 项</span><Button size="sm" variant="ghost" onClick={() => setSelectedAssets(assets.map(a => a.id))} disabled={!assets.length}>全选筛选结果</Button><Button size="sm" variant="ghost" disabled={!selectedAssets.length} onClick={() => setSelectedAssets([])}>清空</Button><Button size="sm" variant="outline" disabled={!selectedAssets.length} onClick={() => handleHealth(selectedAssets)}>批量检测健康度</Button></div>
        <Table><TableHeader><TableRow><TableHead><input type="checkbox" aria-label="全选筛选后的知识资产" checked={assets.length > 0 && assets.every(a => selectedAssets.includes(a.id))} onChange={e => setSelectedAssets(e.target.checked ? assets.map(a => a.id) : [])} /></TableHead><TableHead>知识资产</TableHead><TableHead>板块</TableHead><TableHead>状态</TableHead><TableHead>健康度</TableHead><TableHead>维护建议</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
          <TableBody>{assets.map((asset) => <TableRow key={asset.id}><TableCell><input type="checkbox" aria-label={'选择' + asset.name} checked={selectedAssets.includes(asset.id)} onChange={() => setSelectedAssets(toggleSelection(selectedAssets, asset.id))} /></TableCell><TableCell><button className="text-left text-blue-600" onClick={() => navigate(`/knowledge-config/catalog/${asset.id}`)}>{asset.name}</button></TableCell><TableCell><SectionTag k={asset.section} /></TableCell><TableCell>{STATUS_LABEL[effectiveStatus(asset)].label}</TableCell><TableCell>{asset.status === 'learning' || asset.status === 'draft' ? '待检查' : `${scores[asset.id] ?? asset.health} 分`}</TableCell><TableCell className="min-w-48 text-xs text-gray-600">{asset.status === 'learning' ? '学习完成后重新检查' : GUIDE[asset.section][1]}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={asset.status === 'learning'} onClick={() => openAssetAction(asset)}>{asset.connect === '上传文件' ? '重新上传并学习' : GUIDE[asset.section][0]}</Button><Button size="sm" variant="ghost" onClick={() => navigate(`/knowledge-config/catalog/${asset.id}`)}>{asset.status === 'learning' ? '查看学习进度' : '查看内容与切片'}</Button></div></TableCell></TableRow>)}{assets.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center">暂无匹配知识</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent></Card></TabsContent>
    </Tabs>

    <Dialog open={batchOpen} onOpenChange={open => !batchBusy && setBatchOpen(open)}><DialogContent><DialogHeader><DialogTitle>批量{CONNECTION_ACTIONS[batchAction]}</DialogTitle></DialogHeader><p className="text-sm">已选 {selectedSourceRows.length} 项，可执行 {batchEligible.length} 项；不符合当前状态的条目将跳过。</p><div className="max-h-40 overflow-auto text-sm space-y-1">{selectedSourceRows.map(s => <div key={s.id}>{s.name}{!batchEligible.includes(s) && <span className="text-gray-400">（跳过）</span>}</div>)}</div>{batchAction === 'pause' && <p className="text-sm text-amber-700">将停止检测与同步，并停用关联的 {batchEligible.reduce((sum, s) => sum + s.count, 0)} 条知识。保留内容、接入关系与日志。</p>}{batchAction === 'detect' && <p className="text-xs text-gray-500">只检查新增与删除，不执行同步或学习。</p>}{batchAction === 'frequency' && <label className="text-sm">更新频率<select className="ml-3 h-9 rounded border px-3" value={batchFrequency} onChange={e => setBatchFrequency(e.target.value as SourceFrequency)}>{FREQUENCIES.map(f => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}</select></label>}<DialogFooter><Button variant="outline" disabled={batchBusy} onClick={() => setBatchOpen(false)}>取消</Button><Button disabled={batchBusy || !batchEligible.length} onClick={handleBatchSources}>{batchBusy ? '执行中…' : '确认执行'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!changeSource} onOpenChange={(open) => !open && setChangeSource(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>变化详情 · {changeSource?.name}</DialogTitle></DialogHeader><p className="rounded bg-blue-50 px-3 py-2 text-xs text-blue-700">内容修改随发布事件实时同步，不在栏目变化数量中统计；可在日志查看处理结果。</p><div className="grid gap-4 md:grid-cols-2"><div><h3 className="mb-2 text-sm font-medium text-green-700">新增 {changeSource?.added || 0} 条</h3><div className="max-h-64 space-y-2 overflow-auto">{changeSource?.addedItems.map((item) => <div key={item.id} className="rounded border p-2 text-sm"><div>{item.name}</div><div className="mt-1 text-xs text-gray-400">{item.path} · {item.detectedAt}</div></div>)}{changeSource?.added === 0 && <p className="text-sm text-gray-400">没有新增条目</p>}</div></div><div><h3 className="mb-2 text-sm font-medium text-red-600">来源删除 {changeSource?.removed || 0} 条</h3><div className="max-h-64 space-y-2 overflow-auto">{changeSource?.removedItems.map((item) => <div key={item.id} className="rounded border p-2 text-sm"><div>{item.name}</div><div className="mt-1 text-xs text-gray-400">{item.path} · {item.detectedAt}</div></div>)}{changeSource?.removed === 0 && <p className="text-sm text-gray-400">没有来源删除条目</p>}</div></div></div><DialogFooter><Button variant="outline" onClick={() => setChangeSource(null)}>关闭</Button>{changeSource && !changeSource.autoUpdate && changeSource.status !== 'paused' && changeSource.status !== 'syncing' && !detecting.includes(changeSource.id) && <Button onClick={() => { handleSyncNow(changeSource); setChangeSource(null); }}>立即同步</Button>}</DialogFooter></DialogContent></Dialog>

    <Dialog open={!!logSource} onOpenChange={(open) => !open && setLogSource(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>任务日志 · {logSource?.name}</DialogTitle></DialogHeader><div className="max-h-96 overflow-auto"><Table><TableHeader><TableRow><TableHead>时间</TableHead><TableHead>动作</TableHead><TableHead>结果</TableHead><TableHead>说明</TableHead></TableRow></TableHeader><TableBody>{logSource?.logs.map((item) => <TableRow key={item.id}><TableCell className="text-xs">{item.time}</TableCell><TableCell>{item.action}</TableCell><TableCell><Badge className={item.result === '成功' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}>{item.result}</Badge></TableCell><TableCell className="max-w-72 text-xs text-gray-600">{item.detail}</TableCell></TableRow>)}</TableBody></Table></div></DialogContent></Dialog>

    <Dialog open={!!pauseSource} onOpenChange={(open) => !open && setPauseSource(null)}><DialogContent><DialogHeader><DialogTitle>关闭使用</DialogTitle></DialogHeader><p className="text-sm">关闭“{pauseSource?.name}”后，这条应用/数据源接入关系和历史记录仍会保留，但不再检测或同步变化，已生成的 {pauseSource?.count} 条知识将停用。重新开启后可继续使用。</p><DialogFooter><Button variant="outline" onClick={() => setPauseSource(null)}>取消</Button><Button onClick={() => { if (pauseSource) handleSourceEnabled(pauseSource, false); setPauseSource(null); }}>确认关闭</Button></DialogFooter></DialogContent></Dialog>

    {upload && <ReplaceKnowledgeFile asset={upload} onClose={() => setUpload(null)} onSaved={next => { setMessage(next.status === 'learning' ? '文件已提交，正在解析与学习。' : '文件已替换，保持原状态；启用后再学习。'); refresh(); }} />}

  </div>;
}
