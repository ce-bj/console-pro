import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAssets, mockPortalSites } from './data';
import { mockSourceConnectionsData } from './sourceConnections';
import { BackendTargetBoard, mockStructuredSourcesData, plannedBackendBoards, StructuredDraft, StructuredSource, structuredSourcesForSite } from './structuredSources';
export { initialStructuredDraft } from './structuredSources';

const mockStructuredSitesData = mockPortalSites;
// ACTION: 获取网站的结构化数据源 [GET] /api/kb/structured-sources
function handleFetchStructuredSources(params: { siteId: string }) { console.log('fetch structured sources', params); }

export default function StructuredIntake({ mode, fileName, value, onChange, targetBoards = ['structured'] }: { fileName?: string; mode: 'file' | 'backend'; value: StructuredDraft; onChange: (value: StructuredDraft) => void; targetBoards?: BackendTargetBoard[] }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['产品管理', '云资讯', '采购招标']);
  useEffect(() => { if (mode === 'backend' && value.siteId) handleFetchStructuredSources({ siteId: value.siteId }); }, [mode, value.siteId]);
  const existingBoards = (id: string): BackendTargetBoard[] => targetBoards.filter(board => mockAssets.some(a => a.section === board && a.backendPageId === id) || mockSourceConnectionsData.some(s => s.section === board && s.sourceId === id));
  const siteSources = structuredSourcesForSite(value.siteId);
  const sources = siteSources.filter(s => (s.application + s.name).toLowerCase().includes(query.toLowerCase()));
  const applications = [...new Set(sources.filter(s => !s.special).map(s => s.application))];
  const toggle = (id: string) => {
    const source = siteSources.find(s => s.id === id);
    if (!source || !plannedBackendBoards(targetBoards, existingBoards(id)).length || source.status === 'unavailable' || source.special?.enabledProducts === 0) return;
    onChange({ ...value, selections: value.selections.some(s => s.sourceId === id) ? value.selections.filter(s => s.sourceId !== id) : [...value.selections, { sourceId: id, includeChildren: !!source.children }] });
  };
  const sourceRow = (source: StructuredSource) => {
    const selection = value.selections.find(s => s.sourceId === source.id);
    const existing = existingBoards(source.id);
    const availableBoards = plannedBackendBoards(targetBoards, existing);
    const exists = availableBoards.length === 0;
    const unavailable = source.status === 'unavailable' || source.special?.enabledProducts === 0;
    return <div key={source.id} className={selection ? 'bg-blue-50' : ''}>
      <div className="flex items-center gap-3 px-4 py-3 text-sm">
        <input aria-label={'选择' + source.application + '/' + source.name} type="checkbox" checked={!!selection} disabled={exists || unavailable} onChange={() => toggle(source.id)} />
        <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><Link className="font-medium text-blue-600 hover:underline" target="_blank" rel="noreferrer" to={'/knowledge-config/source-preview/' + source.id}>{source.name} ↗</Link>{targetBoards.map(board => <Badge key={board} className={existing.includes(board) ? 'bg-gray-100 text-gray-600' : selection ? 'bg-blue-100 text-blue-700' : 'bg-green-50 text-green-700'}>{board === 'content' ? '内容资产' : '结构化数据'} · {existing.includes(board) ? '已有' : unavailable ? '不可选' : selection ? '已选' : '新增'}</Badge>)}</div>
        <div className="mt-1 text-xs text-gray-500">{source.special ? '已开启规格产品 / 全部产品：' + source.special.enabledProducts + ' / ' + source.special.totalProducts : source.count + ' 条记录'}{source.children ? ' · 含' + source.children.name : ''}</div>
        {source.special && <div className="mt-1 text-xs text-gray-500">{source.special.enabledProducts === 0 ? '请先在产品管理中开启产品规格' : '仅接入已开启规格的产品，跟随产品管理更新'}</div>}{source.reason && <p className="mt-1 text-xs text-amber-700">{source.reason}</p>}</div>
      </div>
      {selection && source.children && <label className="ml-10 mb-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={selection.includeChildren} onChange={e => onChange({ ...value, selections: value.selections.map(v => v.sourceId === source.id ? { ...v, includeChildren: e.target.checked } : v) })} />包含{source.children.name}</label>}
    </div>;
  };
  if (mode === 'file') return <div className="rounded border bg-gray-50 p-3 text-sm">已选择：{fileName || '请先上传文件'}</div>;
  return <div className="space-y-3">
    <div className="space-y-2"><label className="text-sm" htmlFor="structured-website">网站名称 <span className="text-red-500">*</span></label><Select value={value.siteId} onValueChange={siteId => { onChange({ siteId, selections: [] }); setQuery(''); }}><SelectTrigger id="structured-website" className="max-w-sm"><SelectValue placeholder="请选择网站" /></SelectTrigger><SelectContent>{mockStructuredSitesData.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select></div>
    {!value.siteId ? <div className="rounded border p-6 text-center text-sm text-gray-500">请先选择网站</div> : <>
    <Tabs defaultValue="applications" className="space-y-3">
      <TabsList><TabsTrigger value="applications">应用数据</TabsTrigger><TabsTrigger value="specifications">产品规格</TabsTrigger></TabsList>
      <TabsContent value="applications" className="space-y-3">
        <Input aria-label="搜索应用或数据源" placeholder="搜索应用或数据源" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="border rounded-lg divide-y max-h-[440px] overflow-auto">{applications.map(app => <div key={app}>
          <button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 font-medium" aria-expanded={expanded.includes(app)} onClick={() => setExpanded(expanded.includes(app) ? expanded.filter(a => a !== app) : [...expanded, app])}><span>{expanded.includes(app) ? '▾' : '▸'}</span>▦ {app}</button>
          {(query || expanded.includes(app)) && <div className="pl-6">{sources.filter(s => !s.special && s.application === app).map(sourceRow)}</div>}
        </div>)}{!applications.length && <div className="p-8 text-center text-sm text-gray-500">没有匹配的数据源</div>}</div>
      </TabsContent>
      <TabsContent value="specifications"><div className="rounded-lg border divide-y">{siteSources.filter(s => s.special).map(sourceRow)}{!siteSources.some(s => s.special) && <p className="p-8 text-center text-sm text-gray-500">该网站暂无产品规格</p>}</div></TabsContent>
    </Tabs>
    <div className="rounded border p-3"><div className="flex items-center justify-between"><span className="text-sm">已选 {value.selections.length} 项</span><Button size="sm" variant="ghost" disabled={!value.selections.length} onClick={() => onChange({ ...value, selections: [] })}>清空</Button></div><div className="mt-2 flex flex-wrap gap-2">{value.selections.map(selection => { const s = mockStructuredSourcesData.find(source => source.id === selection.sourceId)!; return <Button key={s.id} variant="outline" size="sm" onClick={() => toggle(s.id)} aria-label={'移除' + s.application + '/' + s.name}>{s.application} / {s.name}{selection.includeChildren && s.children ? '（含' + s.children.name + '）' : ''} ×</Button>; })}</div></div>
    </>}
  </div>;
}
