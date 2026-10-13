import CapabilityLabel from './CapabilityLabel';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { CAPABILITIES, mockFieldPoliciesData as fieldPolicies, mockStructuredPolicyData as structuredPolicy } from './structuredPolicy';

const mockPlatformFieldsData = fieldPolicies;
const mockPlatformConfigData = structuredPolicy;

export default function StructuredRetrievalConfig() {
  const [policy, setPolicy] = useState({ ...mockPlatformConfigData });
  const [fields, setFields] = useState(() => mockPlatformFieldsData.map(f => ({ ...f, defaults: { ...f.defaults } })).sort((a, b) => ['基础字段', '高级字段', '业务字段'].indexOf(a.group) - ['基础字段', '高级字段', '业务字段'].indexOf(b.group)));
  const [message, setMessage] = useState('');
  // ACTION: 保存平台结构化处理与检索策略 [PUT] /api/kb/sections/structured/retrieval
  function handleSave() {
    if (![policy.limit, policy.childLimit].every(n => Number.isInteger(n) && n >= 1 && n <= 100)) return setMessage('返回记录数请输入 1–100 的整数。');
    if (![policy.maxFields, policy.lowCardinality].every(n => Number.isInteger(n) && n >= 1 && n <= 1000)) return setMessage('字段上限及聚合推荐上限请输入 1–1000 的整数。');
    Object.assign(mockPlatformConfigData, policy, { version: mockPlatformConfigData.version + 1 });
    mockPlatformFieldsData.splice(0, mockPlatformFieldsData.length, ...fields.map(f => ({ ...f, defaults: { ...f.defaults } })));
    setMessage('平台配置已保存');
  }
  return <Card><CardHeader><CardTitle className="text-sm">平台级设置</CardTitle></CardHeader><CardContent className="space-y-5">
    <section className="space-y-3"><h3 className="font-medium text-sm">字段默认用途</h3>
      <p className="text-xs text-gray-500">新字段使用以下默认值，用户可在知识详情中调整。子表单按子字段分别设置。</p>
      <div className="max-h-96 overflow-auto border rounded"><Table><TableHeader><TableRow><TableHead className="w-28">字段分类</TableHead><TableHead>字段类型</TableHead>{CAPABILITIES.map(c => <TableHead key={c.key} className="text-center"><CapabilityLabel capability={c.key} label={c.label} /></TableHead>)}</TableRow></TableHeader><TableBody>{fields.map((f, index) => <TableRow key={f.type}>{fields.findIndex(item => item.group === f.group) === index && <TableCell rowSpan={fields.filter(item => item.group === f.group).length} className="align-top bg-gray-50 border-r font-medium text-gray-600">{f.group}</TableCell>}<TableCell className="whitespace-nowrap">{f.type}</TableCell>{CAPABILITIES.map(c => <TableCell key={c.key} className="text-center"><input type="checkbox" aria-label={f.type + c.label} disabled={!f.supported.includes(c.key)} checked={f.defaults[c.key]} onChange={e => setFields(fields.map(item => item.type === f.type ? { ...item, defaults: { ...item.defaults, [c.key]: e.target.checked } } : item))} /></TableCell>)}</TableRow>)}</TableBody></Table></div>
    </section>
    <section className="space-y-3"><h3 className="font-medium text-sm">自动推荐</h3><div className="flex items-center justify-between text-sm"><span>根据字段类型与数据特征推荐用途</span><Switch aria-label="自动推荐字段用途" checked={policy.recommendation} onCheckedChange={recommendation => setPolicy({ ...policy, recommendation })} /></div><label className="block text-sm space-y-1">聚合推荐的不同值数量上限<Input type="number" min={1} max={1000} disabled={!policy.recommendation} value={policy.lowCardinality} onChange={e => setPolicy({ ...policy, lowCardinality: Number(e.target.value) })} /></label></section>
    <section className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm">记录召回<select className="h-9 w-full rounded border px-3" value={policy.retrieval} onChange={e => setPolicy({ ...policy, retrieval: e.target.value })}><option value="hybrid">语义与关键词召回 + 字段筛选</option><option value="keyword">关键词召回 + 字段筛选</option></select></label><label className="space-y-1 text-sm">长文本处理<select className="h-9 w-full rounded border px-3" value={policy.richText} onChange={e => setPolicy({ ...policy, richText: e.target.value })}><option value="plain">提取正文参与检索</option><option value="returnOnly">仅随记录展示</option></select></label>
      <label className="space-y-1 text-sm">单次返回记录上限<Input type="number" min={1} max={100} value={policy.limit} onChange={e => setPolicy({ ...policy, limit: Number(e.target.value) })} /></label><label className="space-y-1 text-sm">关联子记录返回上限<Input type="number" min={1} max={100} value={policy.childLimit} onChange={e => setPolicy({ ...policy, childLimit: Number(e.target.value) })} /></label>
      <label className="space-y-1 text-sm">每个数据集字段上限<Input type="number" min={1} max={1000} value={policy.maxFields} onChange={e => setPolicy({ ...policy, maxFields: Number(e.target.value) })} /></label><label className="space-y-1 text-sm">字段删除或类型改变<select className="h-9 w-full rounded border px-3" value={policy.schemaChange} onChange={e => setPolicy({ ...policy, schemaChange: e.target.value })}><option value="pause">暂停相关查询，提示重新处理</option><option value="exclude">隔离异常字段，保留其他字段</option></select></label>
      <label className="space-y-1 text-sm">文件异常行<select className="h-9 w-full rounded border px-3" value={policy.invalid} onChange={e => setPolicy({ ...policy, invalid: e.target.value })}><option value="reject">修正异常行后入库</option><option value="isolate">导入有效行，保留异常清单</option></select></label>
    </section>
    <div className="flex items-center gap-3"><Button onClick={handleSave}>保存平台配置</Button><span role="status" className="text-sm">{message}</span></div>
  </CardContent></Card>;
}
