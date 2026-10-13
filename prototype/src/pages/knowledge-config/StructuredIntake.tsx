import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { mockAssets } from './data';
import { mockSourceConnectionsData } from './sourceConnections';
import { mockStructuredSourcesData, StructuredDraft, StructuredSource } from './structuredSources';
export { initialStructuredDraft } from './structuredSources';

export default function StructuredIntake({ mode, fileName, value, onChange }: { fileName?: string; mode: 'file' | 'backend'; value: StructuredDraft; onChange: (value: StructuredDraft) => void }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['产品管理', '云资讯', '采购招标']);
  const existing = (id: string) => mockAssets.some(a => a.section === 'structured' && a.backendPageId === id) || mockSourceConnectionsData.some(s => s.section === 'structured' && s.sourceId === id);
  const sources = mockStructuredSourcesData.filter(s => (s.application + s.name).toLowerCase().includes(query.toLowerCase()));
  const applications = [...new Set(sources.filter(s => !s.special).map(s => s.application))];
  const toggle = (id: string) => {
    const source = mockStructuredSourcesData.find(s => s.id === id);
    if (!source || existing(id) || source.status === 'unavailable' || source.special?.enabledProducts === 0) return;
    onChange({ selections: value.selections.some(s => s.sourceId === id) ? value.selections.filter(s => s.sourceId !== id) : [...value.selections, { sourceId: id, includeChildren: !!source.children }] });
  };
  const sourceRow = (source: StructuredSource) => {
    const selection = value.selections.find(s => s.sourceId === source.id);
    const exists = existing(source.id);
    const unavailable = source.status === 'unavailable' || source.special?.enabledProducts === 0;
    return <div key={source.id} className={selection ? 'bg-blue-50' : ''}>
      <div className="flex items-center gap-3 px-4 py-3 text-sm">
        <input aria-label={'选择' + source.application + '/' + source.name} type="checkbox" checked={!!selection || exists} disabled={exists || unavailable} onChange={() => toggle(source.id)} />
        <div className="flex-1"><div className="flex items-center gap-2"><Link className="font-medium text-blue-600 hover:underline" target="_blank" rel="noreferrer" to={'/knowledge-config/source-preview/' + source.id}>{source.name} ↗</Link><Badge className={selection ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}>{exists ? '已有' : unavailable ? '不可选' : selection ? '已选' : '新增'}</Badge></div>
        <div className="mt-1 text-xs text-gray-500">{source.special ? '已开启规格产品 / 全部产品：' + source.special.enabledProducts + ' / ' + source.special.totalProducts : source.count + ' 条记录'}{source.children ? ' · 含' + source.children.name : ''}</div>
        {source.special && <div className="mt-1 text-xs text-gray-500">{source.special.enabledProducts === 0 ? '请先在产品管理中开启产品规格' : '仅接入已开启规格的产品，跟随产品管理更新'}</div>}{source.reason && <p className="mt-1 text-xs text-amber-700">{source.reason}</p>}</div>
      </div>
      {selection && source.children && <label className="ml-10 mb-3 flex items-center gap-2 text-xs"><input type="checkbox" checked={selection.includeChildren} onChange={e => onChange({ selections: value.selections.map(v => v.sourceId === source.id ? { ...v, includeChildren: e.target.checked } : v) })} />包含{source.children.name}</label>}
    </div>;
  };
  if (mode === 'file') return <div className="rounded border bg-gray-50 p-3 text-sm">已选择：{fileName || '请先上传文件'}</div>;
  return <div className="space-y-3">
    <Tabs defaultValue="applications" className="space-y-3">
      <TabsList><TabsTrigger value="applications">应用数据</TabsTrigger><TabsTrigger value="specifications">产品规格</TabsTrigger></TabsList>
      <TabsContent value="applications" className="space-y-3">
        <Input aria-label="搜索应用或数据源" placeholder="搜索应用或数据源" value={query} onChange={e => setQuery(e.target.value)} />
        <div className="border rounded-lg divide-y max-h-[440px] overflow-auto">{applications.map(app => <div key={app}>
          <button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 font-medium" aria-expanded={expanded.includes(app)} onClick={() => setExpanded(expanded.includes(app) ? expanded.filter(a => a !== app) : [...expanded, app])}><span>{expanded.includes(app) ? '▾' : '▸'}</span>▦ {app}</button>
          {(query || expanded.includes(app)) && <div className="pl-6">{sources.filter(s => !s.special && s.application === app).map(sourceRow)}</div>}
        </div>)}{!applications.length && <div className="p-8 text-center text-sm text-gray-500">没有匹配的数据源</div>}</div>
      </TabsContent>
      <TabsContent value="specifications"><div className="rounded-lg border divide-y">{mockStructuredSourcesData.filter(s => s.special).map(sourceRow)}</div></TabsContent>
    </Tabs>
    <div className="rounded border p-3"><div className="flex items-center justify-between"><span className="text-sm">已选 {value.selections.length} 项</span><Button size="sm" variant="ghost" disabled={!value.selections.length} onClick={() => onChange({ selections: [] })}>清空</Button></div><div className="mt-2 flex flex-wrap gap-2">{value.selections.map(selection => { const s = mockStructuredSourcesData.find(source => source.id === selection.sourceId)!; return <Button key={s.id} variant="outline" size="sm" onClick={() => toggle(s.id)} aria-label={'移除' + s.application + '/' + s.name}>{s.application} / {s.name}{selection.includeChildren && s.children ? '（含' + s.children.name + '）' : ''} ×</Button>; })}</div></div>
  </div>;
}
