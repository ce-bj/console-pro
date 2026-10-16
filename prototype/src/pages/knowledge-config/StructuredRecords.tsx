import { Fragment, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KbAsset, getKnowledgeAsset } from './data';
import { SourceField } from './structuredSources';
import { initializeStructuredDefaults, resolveFieldCapabilities } from './structuredPolicy';
import StructuredFieldSettings from './StructuredFieldSettings';

const mockStructuredRecordAssetData = getKnowledgeAsset('structured-excel')!;

// ACTION: 筛选结构化记录 [GET] /api/kb/assets/{id}/structured/records
function handleFetchStructuredRecords(params: { assetId: string; field: string; query: string; page: number; pageSize: number }) {
  console.log('fetch structured records', params);
}

export default function StructuredRecords({ asset = mockStructuredRecordAssetData, onAssetChange }: { asset?: KbAsset; onAssetChange?: (asset: KbAsset) => void }) {
  const records = asset.structuredRecords || [];
  const fields: SourceField[] = asset.structuredSchema || (asset.structuredFields || []).map(name => ({ name, label: name, type: records.some(r => typeof r[name] === 'number') ? '数值' : '单行文本' }));
  const childFields = (asset.structuredChildSchema || []).map(f => ({ ...f, name: 'children.' + f.name, label: (asset.structuredSelection?.childName || '子表') + ' / ' + f.label }));
  const settingFields = [...fields, ...childFields];
  initializeStructuredDefaults(asset, settingFields);
  const [query, setQuery] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [fieldsSettingsOpen, setFieldsSettingsOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState('');
  const visibleFields = fields.filter(f => resolveFieldCapabilities(f.type, { ...asset.structuredCapabilityDefaults?.[f.name], ...asset.structuredCapabilities?.[f.name] }).display);
  const rows = records.map((row, index) => ({ row, index })).filter(({ row }) =>
    (filterField === 'all' ? Object.values(row).join(' ') : String(row[filterField] ?? '')).toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pages);
  const pageRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const filter = (field: string, keyword: string, nextPage = 1) => {
    setFilterField(field); setQuery(keyword); setPage(nextPage); setExpanded([]);
    handleFetchStructuredRecords({ assetId: asset.id, field, query: keyword, page: nextPage, pageSize: 10 });
  };
  return <div className="space-y-3" data-revision={revision}>
    <div className="flex flex-wrap justify-between gap-3 items-center"><div className="text-xs text-gray-500">共 {records.length} 条记录 · {fields.length} 个字段 · {asset.structuredSemanticEnabled ? '已启用语义检索' : '关键词检索'}</div><Button size="sm" className="h-8 text-xs" variant="outline" onClick={() => setFieldsSettingsOpen(true)} disabled={!fields.length}>字段设置</Button></div>
    <div className="flex flex-wrap gap-2">
      <Select value={filterField} onValueChange={field => filter(field, query)}><SelectTrigger aria-label="筛选字段" className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部业务字段</SelectItem>{fields.map(f => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}</SelectContent></Select>
      <Input className="h-8 text-xs flex-1 min-w-40" aria-label="筛选结构化记录" placeholder="输入字段内容筛选" value={query} onChange={e => filter(filterField, e.target.value)} />
      <Button size="sm" variant="ghost" className="h-8 text-xs" disabled={filterField === 'all' && !query} onClick={() => filter('all', '')}>重置</Button>
    </div>
    {message && <div role="status" className="text-xs text-gray-500">{message}</div>}
    <div className="max-h-[480px] overflow-auto rounded border"><Table className="text-xs">
      <TableHeader><TableRow><TableHead className="w-16">序号</TableHead>{visibleFields.map(f => <TableHead key={f.name} className="whitespace-nowrap">{f.label}{f.unit ? '（' + f.unit + '）' : ''}</TableHead>)}{asset.structuredChildSchema?.length ? <TableHead>子表</TableHead> : null}</TableRow></TableHeader>
      <TableBody>{pageRows.map(({ row, index }) => {
        const children = asset.structuredChildRecords?.[String(row.product_id)] || [];
        return <Fragment key={asset.structuredRecordIds?.[index] || index}>
          <TableRow><TableCell>{index + 1}</TableCell>{visibleFields.map(f => <TableCell key={f.name} className="max-w-xs break-words">{row[f.name] ?? '未提供'}</TableCell>)}{asset.structuredChildSchema?.length ? <TableCell><Button size="sm" variant="link" className="h-7 text-xs p-0" disabled={!children.length} aria-expanded={expanded.includes(index)} onClick={() => setExpanded(expanded.includes(index) ? expanded.filter(i => i !== index) : [...expanded, index])}>{expanded.includes(index) ? '收起' : '查看'} {children.length} 条</Button></TableCell> : null}</TableRow>
          {expanded.includes(index) && <TableRow><TableCell colSpan={visibleFields.length + 2} className="bg-gray-50"><Table><TableHeader><TableRow>{asset.structuredChildSchema?.map(f => <TableHead key={f.name}>{f.label}{f.unit ? '（' + f.unit + '）' : ''}</TableHead>)}</TableRow></TableHeader><TableBody>{children.map((child, i) => <TableRow key={i}>{asset.structuredChildSchema?.map(f => <TableCell key={f.name}>{child[f.name] ?? '未提供'}</TableCell>)}</TableRow>)}</TableBody></Table></TableCell></TableRow>}
        </Fragment>;
      })}{!pageRows.length && <TableRow><TableCell colSpan={visibleFields.length + 2} className="py-8 text-center text-gray-500">{records.length ? '没有匹配记录' : '学习完成后展示结构化记录'}</TableCell></TableRow>}</TableBody>
    </Table></div>
    <div className="flex justify-end items-center gap-3 text-xs"><span>筛选结果 {rows.length} 条</span><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => filter(filterField, query, currentPage - 1)}>上一页</Button>{currentPage} / {pages}<Button size="sm" variant="outline" disabled={currentPage === pages} onClick={() => filter(filterField, query, currentPage + 1)}>下一页</Button></div>
    {fieldsSettingsOpen && <StructuredFieldSettings asset={asset} fields={settingFields} onClose={() => setFieldsSettingsOpen(false)} onSave={() => { setRevision(revision + 1); onAssetChange?.({ ...asset }); setMessage(asset.status === 'stale' ? '字段设置已保存，待重新学习后生效' : '字段设置已保存'); }} />}
  </div>;
}
