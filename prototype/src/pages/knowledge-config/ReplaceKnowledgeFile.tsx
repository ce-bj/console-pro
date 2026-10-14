import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { KbAsset, getKnowledgeAsset, upsertKnowledgeAsset } from './data';
import { replacementFormats, replacementStatus, validateReplacement } from './knowledgeMaintenance';

// DataSlot: 独立预览样例；实际入口传入当前知识资产。
const mockAssetData = getKnowledgeAsset('k1')!;
export default function ReplaceKnowledgeFile({ asset = mockAssetData, onClose, onSaved }: { asset?: KbAsset; onClose: () => void; onSaved: (next: KbAsset) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  // ACTION: 重新上传知识文件并学习 [PUT] /api/kb/assets/{id}/file
  function handleReplaceFile() {
    if (!file || asset.status === 'learning') return;
    const failure = validateReplacement(asset.section, file);
    if (failure) { setError(failure); return; }
    const next: KbAsset = { ...asset, sourceRef: file.name, fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB', updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }), status: replacementStatus(asset.status), replacementPending: true };
    upsertKnowledgeAsset(next);
    onSaved(next); onClose();
  }
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>重新上传并学习</DialogTitle><DialogDescription>替换“{asset.name}”的源文件，保留知识名称、分类与适用范围。</DialogDescription></DialogHeader>
    <div className="rounded border bg-gray-50 p-3 text-sm">当前文件：{asset.sourceRef}</div>
    <label className="space-y-2 text-sm block">选择新文件<Input aria-label="选择替换文件" type="file" accept={replacementFormats(asset.section)} onChange={event => { setFile(event.target.files?.[0] || null); setError(''); }} /></label>
    <p className="text-xs text-gray-500">支持 {replacementFormats(asset.section)} · 最大 100 MB</p>
    {asset.section === 'structured' && <p className="text-xs text-gray-500">按稳定记录标识匹配，保留人工标签与启停；结构变化需重新核对。</p>}
    {(asset.status === 'draft' || asset.status === 'archived') && <p className="text-xs text-amber-700">当前知识为{asset.status === 'draft' ? '草稿' : '停用'}，替换后保持原状态，启用时再学习。</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!file || asset.status === 'learning'} onClick={handleReplaceFile}>{asset.status === 'draft' || asset.status === 'archived' ? '替换并保存' : '重新上传并学习'}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
