import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KbAsset, mockRawContent } from './data';

export default function KnowledgeFilePreview({ asset }: { asset: KbAsset }) {
  const raw = mockRawContent[asset.id];
  const parsed = asset.section === 'structured' ? JSON.stringify(asset.structuredRecords || [], null, 2) : raw?.replace(/\r\n/g, '\n').trim();
  return <Tabs defaultValue="original">
    <TabsList aria-label="知识文件预览"><TabsTrigger value="original">原始文件</TabsTrigger><TabsTrigger value="parsed">解析文件</TabsTrigger></TabsList>
    <TabsContent value="original"><div className="h-[420px] overflow-auto rounded border bg-gray-50 p-3 text-xs space-y-3">
      <div className="border-b pb-3"><div className="font-medium text-gray-800">{asset.sourceRef}</div><div className="mt-1 text-gray-500">{asset.fileSize || asset.connect}</div></div>
      {asset.replacementPending ? <p className="text-amber-700">新文件已提交，等待解析；{asset.status === 'draft' || asset.status === 'archived' ? '启用后开始学习。' : '可在学习进度中查看处理状态。'}</p> : raw ? <pre className="whitespace-pre-wrap font-sans text-gray-600">{raw}</pre> : <p className="text-gray-500">暂无原始文件预览，可切换查看已解析内容。</p>}
    </div></TabsContent>
    <TabsContent value="parsed"><div className="h-[420px] overflow-auto rounded border p-3 text-xs">
      <p className="mb-3 text-gray-500">解析结果 · {asset.section === 'structured' ? '按记录保留字段和值' : '提取后的完整文本'}</p>
      {asset.replacementPending ? <p className="text-amber-700">新文件解析结果尚未生成。</p> : parsed ? <pre className="whitespace-pre-wrap break-words text-gray-700">{parsed}</pre> : <p className="text-gray-500">暂无解析结果，学习完成后展示。</p>}
    </div></TabsContent>
  </Tabs>;
}
