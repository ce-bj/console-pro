import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockStructuredSourcesData } from './structuredSources';

export default function StructuredSourcePreview() {
  const { sourceId } = useParams();
  const source = mockStructuredSourcesData.find(s => s.id === sourceId);
  if (!source) return <div className="p-6">来源不存在或已无查看权限</div>;
  return <div className="p-6 space-y-4"><Link className="text-blue-600 text-sm" to="/knowledge-config/catalog/new?action=backend&board=structured">返回新增知识</Link><h1 className="text-xl font-semibold">{source.application} / {source.name}</h1><p className="text-sm text-gray-600">{source.special ? '已开启规格产品 / 全部产品：' + source.special.enabledProducts + ' / ' + source.special.totalProducts : source.count + ' 条记录'}</p><Card><CardHeader><CardTitle className="text-sm">来源字段</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>字段名称</TableHead><TableHead>类型</TableHead><TableHead>单位</TableHead></TableRow></TableHeader><TableBody>{source.fields.map(f => <TableRow key={f.name}><TableCell>{f.label}</TableCell><TableCell>{f.type}</TableCell><TableCell>{f.unit || '—'}</TableCell></TableRow>)}</TableBody></Table>{!source.fields.length && <p className="text-sm text-gray-500">尚未配置字段</p>}</CardContent></Card></div>;
}
