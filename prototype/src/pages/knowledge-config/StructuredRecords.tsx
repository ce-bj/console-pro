import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { KbAsset } from './data';
import { SourceField } from './structuredSources';
import { initializeStructuredDefaults, resolveFieldCapabilities } from './structuredPolicy';
import StructuredFieldSettings from './StructuredFieldSettings';
import ChipAdder from './ChipAdder';

type RecordMetadata = { enabled: boolean; keywords: string[]; questions: string[]; tags: string[] };
const emptyMetadata = (): RecordMetadata => ({ enabled: true, keywords: [], questions: [], tags: [] });
const splitItems = (value: string) => [...new Set(value.split(/[\n,，]/).map(v => v.trim()).filter(Boolean))];

export default function StructuredRecords({ asset, onAssetChange }: { asset: KbAsset; onAssetChange?: (asset: KbAsset) => void }) {
  const records = asset.structuredRecords || [];
  const fields: SourceField[] = asset.structuredSchema || (asset.structuredFields || []).map(name => ({ name, label: name, type: records.some(r => typeof r[name] === 'number') ? '数值' : '单行文本' }));
  const childFields = (asset.structuredChildSchema || []).map(f => ({ ...f, name: 'children.' + f.name, label: (asset.structuredSelection?.childName || '子表') + ' / ' + f.label }));
  const settingFields = [...fields, ...childFields];
  initializeStructuredDefaults(asset, settingFields);
  const [metadata, setMetadata] = useState<Record<string, RecordMetadata>>(() => {
    return { ...asset.structuredRecordMetadata };
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('全部');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string; row: Record<string, string | number>; meta: RecordMetadata } | null>(null);
  const [editor, setEditor] = useState({ keywords: '', questions: '', tags: '' });
  const [fieldsSettingsOpen, setFieldsSettingsOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const visibleFields = fields.filter(f => resolveFieldCapabilities(f.type, { ...asset.structuredCapabilityDefaults?.[f.name], ...asset.structuredCapabilities?.[f.name] }).display);
  const rows = records.map((row, i) => ({ row, id: asset.structuredRecordIds![i], meta: metadata[asset.structuredRecordIds![i]] || emptyMetadata() })).filter(({ row, meta }) =>
    Object.values(row).concat(meta.keywords, meta.questions, meta.tags).join(' ').toLowerCase().includes(query.toLowerCase()) && (status === '全部' || (status === '启用') === meta.enabled));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  const pageRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const children = editing ? asset.structuredChildRecords?.[String(editing.row.product_id)] || [] : [];
  const update = (next: Record<string, RecordMetadata>, notice: string) => { asset.structuredRecordMetadata = next; setMetadata(next); setMessage(notice); };
  // ACTION: 批量启停结构化记录 [PATCH] /api/kb/assets/{id}/structured/records/status
  function handleEnabled(ids: string[], enabled: boolean) {
    const next = { ...metadata };
    ids.forEach(id => { next[id] = { ...(next[id] || emptyMetadata()), enabled }; });
    update(next, '已' + (enabled ? '启用' : '停用') + ' ' + ids.length + ' 条记录');
  }
  // ACTION: 保存结构化记录知识信息 [PATCH] /api/kb/assets/{id}/structured/records/{recordId}
  function handleSaveRecord() {
    if (!editing) return;
    update({ ...metadata, [editing.id]: { ...editing.meta, keywords: splitItems(editor.keywords), questions: splitItems(editor.questions), tags: splitItems(editor.tags) } }, '记录知识信息已保存');
    setEditing(null);
  }
  // ACTION: 批量添加结构化记录标签 [PATCH] /api/kb/assets/{id}/structured/records/tags
  function handleBulkTags() {
    const tags = splitItems(bulkTags);
    if (!tags.length) return;
    const next = { ...metadata };
    selectedIds.forEach(id => { const item = next[id] || emptyMetadata(); next[id] = { ...item, tags: [...new Set([...item.tags, ...tags])] }; });
    update(next, '已为 ' + selectedIds.length + ' 条记录添加标签'); setBulkOpen(false); setBulkTags('');
  }
  const openRecord = (item: typeof rows[number]) => { setEditing({ ...item, meta: { ...item.meta } }); setEditor({ keywords: item.meta.keywords.join('\n'), questions: item.meta.questions.join('\n'), tags: item.meta.tags.join('\n') }); };
  const toggleSelected = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(v => v !== id) : [...selectedIds, id]);
  return <div className="space-y-3" data-revision={revision}>
    <div className="flex flex-wrap justify-between gap-3 items-center"><div className="text-xs text-gray-400">共 {records.length} 条记录 · {fields.length} 个字段 · {asset.structuredSemanticEnabled ? '已启用语义检索' : '关键词检索'}</div><Button size="sm" className="h-8 text-xs" variant="outline" onClick={() => setFieldsSettingsOpen(true)} disabled={!fields.length}>字段设置</Button></div>
    {asset.structuredQueryContext?.recordGrain && <div className="text-xs text-gray-500">每行：{asset.structuredQueryContext.recordGrain}{asset.structuredQueryContext.purpose ? ` · ${asset.structuredQueryContext.purpose}` : ''}</div>}
    <div className="flex gap-2"><Input className="h-8 text-xs flex-1" aria-label="搜索结构化记录" placeholder="筛选记录（字段值 / 关键词 / 标签）" value={query} onChange={e => { setQuery(e.target.value); setPage(1); setSelectedIds([]); }} /><select aria-label="记录状态" className="h-8 rounded border bg-white px-2 text-xs" value={status} onChange={e => { setStatus(e.target.value); setPage(1); setSelectedIds([]); }}>{['全部', '启用', '停用'].map(s => <option key={s}>{s}</option>)}</select></div>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button className="text-blue-600 disabled:text-gray-300" disabled={!rows.length} onClick={() => setSelectedIds(rows.map(r => r.id))}>全选筛选结果（{rows.length}）</button>
      {selectedIds.length > 0 && <><span className="text-gray-400">已选 {selectedIds.length}</span><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEnabled(selectedIds, true)}>启用</Button><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEnabled(selectedIds, false)}>停用</Button><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setBulkOpen(true)}>添加标签</Button><button className="text-gray-400 hover:text-blue-600" onClick={() => setSelectedIds([])}>清空选择</button></>}
    </div>
    {asset.status !== 'published' && <p className="text-xs text-amber-700">记录启用后，仍需所属知识启用且通过质量检查才能被检索。</p>}
    {message && <div role="status" className="text-xs text-green-700">{message}</div>}
    <div className="max-h-[420px] overflow-auto rounded border"><Table className="text-xs"><TableHeader><TableRow><TableHead colSpan={2} className="bg-gray-50">记录标识</TableHead>{visibleFields.length > 0 && <TableHead colSpan={visibleFields.length} className="bg-blue-50 text-blue-800 border-x">来源业务字段 · 随数据源变化</TableHead>}<TableHead colSpan={3} className="bg-gray-100 text-gray-700">知识管理 · 固定字段</TableHead></TableRow><TableRow><TableHead><input aria-label="选择本页全部记录" type="checkbox" checked={pageRows.length > 0 && pageRows.every(r => selectedIds.includes(r.id))} onChange={e => setSelectedIds(e.target.checked ? [...new Set([...selectedIds, ...pageRows.map(r => r.id)])] : selectedIds.filter(id => !pageRows.some(r => r.id === id)))} /></TableHead><TableHead>记录</TableHead>{visibleFields.map(f => <TableHead key={f.name} className="whitespace-nowrap bg-blue-50/40">{f.label}{f.unit ? '（' + f.unit + '）' : ''}</TableHead>)}<TableHead className="border-l bg-gray-50">状态</TableHead><TableHead className="bg-gray-50">标签</TableHead><TableHead className="bg-gray-50">操作</TableHead></TableRow></TableHeader><TableBody>{pageRows.map(item => <TableRow key={item.id} className={item.meta.enabled ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'}><TableCell><input type="checkbox" aria-label={'选择记录' + item.id} checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} /></TableCell><TableCell><button className="text-blue-600 whitespace-nowrap" onClick={() => openRecord(item)}>记录 {records.indexOf(item.row) + 1}</button></TableCell>{visibleFields.map(f => <TableCell key={f.name}><button className="text-left max-w-xs break-words" onClick={() => openRecord(item)}>{item.row[f.name] ?? '未提供'}</button></TableCell>)}<TableCell className="whitespace-nowrap border-l bg-gray-50/60"><Badge className={item.meta.enabled ? 'bg-green-50 text-green-600 text-[11px] font-normal' : 'bg-gray-100 text-gray-500 text-[11px] font-normal'}>{item.meta.enabled ? '启用' : '停用'}</Badge></TableCell><TableCell><div className="flex flex-wrap gap-1">{item.meta.tags.map(tag => <Badge key={tag} className="bg-blue-50 text-blue-700">{tag}</Badge>)}</div></TableCell><TableCell><div className="flex gap-1"><Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => openRecord(item)}>编辑</Button><Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => handleEnabled([item.id], !item.meta.enabled)}>{item.meta.enabled ? '停用' : '启用'}</Button></div></TableCell></TableRow>)}{!pageRows.length && <TableRow><TableCell colSpan={visibleFields.length + 5} className="py-8 text-center text-gray-500">{records.length ? '没有匹配记录' : '处理完成后展示结构化记录'}</TableCell></TableRow>}</TableBody></Table></div>
    <div className="flex justify-end items-center gap-3 text-sm"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</Button>{currentPage} / {pages}<Button size="sm" variant="outline" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>下一页</Button></div>
    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}><DialogContent className="max-w-lg max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>编辑结构化记录</DialogTitle></DialogHeader>{editing && <>
      <h3 className="text-sm font-medium text-blue-800">来源业务字段 <span className="text-xs font-normal text-gray-500">· 只读</span></h3><dl className="grid grid-cols-2 gap-3 rounded border bg-gray-50 p-3 text-xs">{fields.map(field => <div key={field.name}><dt className="text-gray-500">{field.label}</dt><dd className="break-words">{editing.row[field.name] ?? '未提供'} {field.unit}</dd></div>)}</dl>
      {asset.structuredSelection?.childName && <div className="space-y-2 border-t pt-3"><h3 className="text-sm font-medium">{asset.structuredSelection.childName} · {children.length} 条</h3><Table><TableHeader><TableRow>{asset.structuredChildSchema?.map(f => <TableHead key={f.name}>{f.label}</TableHead>)}</TableRow></TableHeader><TableBody>{children.map((row, i) => <TableRow key={i}>{asset.structuredChildSchema?.map(f => <TableCell key={f.name}>{row[f.name] ?? '未提供'} {f.unit}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
      <p className="text-xs text-gray-500">{asset.connect === '上传文件' ? '原始数据请通过更新文件修改。' : '原始数据请在来源应用中修改。'}</p>
      <div className="space-y-3 rounded border bg-white p-3"><h3 className="text-sm font-medium">知识管理 <span className="text-xs font-normal text-gray-500">· 可编辑</span></h3>{(['keywords', 'questions', 'tags'] as const).map((key, i) => <div key={key} className="space-y-1"><div className="text-xs text-gray-500">{['关键词', '可能问题', '标签'][i]}</div><ChipAdder items={splitItems(editor[key])} onChange={items => setEditor({ ...editor, [key]: items.join('\n') })} placeholder="回车添加" /></div>)}<div className="flex items-center justify-between pt-1 text-sm"><span>启用</span><Switch aria-label="启用当前记录" checked={editing.meta.enabled} onCheckedChange={enabled => setEditing({ ...editing, meta: { ...editing.meta, enabled } })} /></div></div>

    </>}<DialogFooter><Button size="sm" variant="outline" onClick={() => setEditing(null)}>取消</Button><Button size="sm" className="bg-blue-600" onClick={handleSaveRecord}>确认</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}><DialogContent><DialogHeader><DialogTitle>为 {selectedIds.length} 条记录添加标签</DialogTitle></DialogHeader><Textarea aria-label="批量添加标签" placeholder="每行一项，保留记录已有标签" value={bulkTags} onChange={e => setBulkTags(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setBulkOpen(false)}>取消</Button><Button disabled={!splitItems(bulkTags).length} onClick={handleBulkTags}>确认添加</Button></DialogFooter></DialogContent></Dialog>
    {fieldsSettingsOpen && <StructuredFieldSettings asset={asset} fields={settingFields} onClose={() => setFieldsSettingsOpen(false)} onSave={() => { setRevision(revision + 1); onAssetChange?.({ ...asset }); setMessage(asset.status === 'stale' ? '字段设置已保存，待重新学习后生效' : '字段设置已保存'); }} />}
  </div>;
}
