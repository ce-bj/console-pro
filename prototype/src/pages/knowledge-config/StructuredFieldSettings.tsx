import CapabilityLabel from './CapabilityLabel';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CAPABILITIES, FieldCapabilities, getFieldPolicy, resolveFieldCapabilities } from './structuredPolicy';
import { SourceField } from './structuredSources';
import { KbAsset } from './data';

export default function StructuredFieldSettings({ asset, fields, onClose, onSave }: { asset: KbAsset; fields: SourceField[]; onClose: () => void; onSave: () => void }) {
  const [defaults, setDefaults] = useState(() => ({ ...asset.structuredCapabilityDefaults }));
  const [overrides, setOverrides] = useState<Record<string, Partial<FieldCapabilities>>>(() => ({ ...asset.structuredCapabilities }));
  // ACTION: 保存数据集字段用途 [PUT] /api/kb/assets/{id}/structured/fields
  function handleSaveFields() {
    asset.structuredCapabilityDefaults = defaults;
    asset.structuredCapabilities = overrides;
    onSave(); onClose();
  }
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="max-w-5xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>字段设置</DialogTitle></DialogHeader>
    <p className="text-xs text-gray-500">调整本数据集的字段用途，不修改来源字段。子表按子字段设置。</p>
    <Table><TableHeader><TableRow><TableHead>字段</TableHead><TableHead>类型</TableHead>{CAPABILITIES.map(c => <TableHead className="text-center" key={c.key}><CapabilityLabel capability={c.key} label={c.label} /></TableHead>)}<TableHead>设置来源</TableHead></TableRow></TableHeader><TableBody>{fields.map(field => {
      const policy = getFieldPolicy(field.type);
      const values = resolveFieldCapabilities(field.type, { ...defaults[field.name], ...overrides[field.name] });
      return <TableRow key={field.name}><TableCell>{field.label}</TableCell><TableCell>{field.type}</TableCell>{CAPABILITIES.map(c => <TableCell className="text-center" key={c.key}><input type="checkbox" aria-label={field.label + c.label} checked={values[c.key]} disabled={!policy.supported.includes(c.key)} onChange={e => setOverrides({ ...overrides, [field.name]: { ...overrides[field.name], [c.key]: e.target.checked } })} /></TableCell>)}<TableCell className="text-xs whitespace-nowrap">{Object.keys(overrides[field.name] || {}).length ? '自定义' : '平台默认'}</TableCell></TableRow>;
    })}</TableBody></Table>
    <DialogFooter><Button variant="outline" onClick={() => { setDefaults(Object.fromEntries(fields.map(f => [f.name, resolveFieldCapabilities(f.type)]))); setOverrides({}); }}>恢复平台默认</Button><Button variant="outline" onClick={onClose}>取消</Button><Button onClick={handleSaveFields}>保存</Button></DialogFooter>
  </DialogContent></Dialog>;
}
