import CapabilityLabel from './CapabilityLabel';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CAPABILITIES, Capability, FieldCapabilities, getFieldPolicy, resolveFieldCapabilities, applyBatchFieldCapability } from './structuredPolicy';
import { SourceField } from './structuredSources';
import { KbAsset, getKnowledgeAsset } from './data';

// DataSlot: 独立预览的默认样例；正常入口由知识详情传入已加载的当前资产。
const mockAssetData = getKnowledgeAsset('structured-excel')!;

export default function StructuredFieldSettings({ asset = mockAssetData, fields, onClose, onSave }: { asset?: KbAsset; fields: SourceField[]; onClose: () => void; onSave: () => void }) {
  const [defaults, setDefaults] = useState(() => ({ ...asset.structuredCapabilityDefaults }));
  const [overrides, setOverrides] = useState<Record<string, Partial<FieldCapabilities>>>(() => ({ ...asset.structuredCapabilities }));
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [capability, setCapability] = useState<Capability>('search');
  const [bulkValue, setBulkValue] = useState('on');
  // ACTION: 保存数据集字段用途 [PUT] /api/kb/assets/{id}/structured/fields
  function handleSaveFields() {
    const reindex = fields.some(field => {
      const before = resolveFieldCapabilities(field.type, { ...asset.structuredCapabilityDefaults?.[field.name], ...asset.structuredCapabilities?.[field.name] });
      const after = resolveFieldCapabilities(field.type, { ...defaults[field.name], ...overrides[field.name] });
      return CAPABILITIES.some(c => c.key !== 'display' && before[c.key] !== after[c.key]);
    });
    asset.structuredCapabilityDefaults = defaults;
    asset.structuredCapabilities = overrides;
    if (reindex && asset.status === 'published') asset.status = 'stale';
    onSave(); onClose();
  }
  const reset = () => {
    setDefaults(Object.fromEntries(fields.map(f => [f.name, resolveFieldCapabilities(f.type)])));
    setOverrides({});
    setMessage('已载入最新平台默认值，保存后生效。');
  };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-w-5xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>字段设置 · {asset.name}</DialogTitle><DialogDescription>仅影响当前数据集，不修改来源应用或其他租户。</DialogDescription></DialogHeader>
    <p className="text-xs text-gray-500">字段与类型来自{asset.connect === '上传文件' ? '文件解析' : '来源应用'}；默认用途来自平台设置。</p>
    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded border border-blue-100 bg-blue-50 p-3 text-sm"><span>已选 {selected.length} 个字段</span><Select value={capability} onValueChange={value => setCapability(value as Capability)}><SelectTrigger aria-label="批量字段用途" className="w-28"><SelectValue /></SelectTrigger><SelectContent>{CAPABILITIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent></Select><Select value={bulkValue} onValueChange={setBulkValue}><SelectTrigger aria-label="批量用途开关" className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="on">开启</SelectItem><SelectItem value="off">关闭</SelectItem></SelectContent></Select><Button size="sm" variant="outline" onClick={() => { const next = applyBatchFieldCapability(fields, selected, overrides, capability, bulkValue === 'on'); setOverrides(next.overrides); setMessage(`已调整 ${selected.length - next.skipped} 个字段，跳过 ${next.skipped} 个不支持的字段。保存后生效。`); }}>应用到已选字段</Button><Button size="sm" variant="ghost" onClick={() => setSelected([])}>清空选择</Button></div>}
    <div className="overflow-auto"><Table><TableHeader><TableRow><TableHead><input type="checkbox" aria-label="全选字段" checked={fields.length > 0 && selected.length === fields.length} onChange={e => setSelected(e.target.checked ? fields.map(f => f.name) : [])} /></TableHead><TableHead>字段</TableHead><TableHead>类型</TableHead>{CAPABILITIES.map(c => <TableHead className="text-center" key={c.key}><CapabilityLabel capability={c.key} label={c.label} /></TableHead>)}<TableHead>设置来源</TableHead></TableRow></TableHeader><TableBody>{fields.map(field => {
      const policy = getFieldPolicy(field.type);
      const values = resolveFieldCapabilities(field.type, { ...defaults[field.name], ...overrides[field.name] });
      return <TableRow key={field.name}><TableCell><input type="checkbox" aria-label={'选择字段' + field.label} checked={selected.includes(field.name)} onChange={e => setSelected(e.target.checked ? [...selected, field.name] : selected.filter(name => name !== field.name))} /></TableCell><TableCell className="whitespace-nowrap">{field.label}<div className="text-xs text-gray-400">{field.name}{field.unit ? ` · ${field.unit}` : ''}</div></TableCell><TableCell className="whitespace-nowrap">{field.type}</TableCell>{CAPABILITIES.map(c => <TableCell className="text-center" key={c.key}><input type="checkbox" aria-label={field.label + c.label} checked={values[c.key]} disabled={!policy.supported.includes(c.key)} onChange={e => setOverrides({ ...overrides, [field.name]: { ...overrides[field.name], [c.key]: e.target.checked } })} /></TableCell>)}<TableCell className="text-xs whitespace-nowrap">{Object.keys(overrides[field.name] || {}).length ? '自定义' : '平台默认'}</TableCell></TableRow>;
    })}</TableBody></Table></div>
    {message && <p role="status" className="text-xs text-amber-700">{message}</p>}
    <DialogFooter><Button variant="outline" onClick={reset}>恢复平台默认</Button><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={handleSaveFields}>保存</Button></DialogFooter>
  </DialogContent></Dialog>;
}
