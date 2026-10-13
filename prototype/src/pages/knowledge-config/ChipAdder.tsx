import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

// 小型 chip 编辑器（关键词 / 问题 / 标签 共用），点 + 号内联加一个
export default function ChipAdder({ items, onChange, placeholder }: { items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  function add() {
    const v = draft.trim();
    if (v && !items.includes(v)) onChange([...items, v]);
    setDraft(''); setAdding(false);
  }
  return (
    <div className="flex gap-1.5 flex-wrap items-center">
      {items.map((v) => (
        <Badge key={v} className="text-xs bg-gray-100 text-gray-600 font-normal gap-1.5 pr-1.5">
          {v}<button aria-label={'删除' + v} className="text-gray-400 hover:text-red-500" onClick={() => onChange(items.filter((x) => x !== v))}>✕</button>
        </Badge>
      ))}
      {adding ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()} onBlur={add}
          placeholder={placeholder} className="h-6 w-32 px-1.5 text-xs border rounded" />
      ) : (
        <button aria-label="添加一项" onClick={() => setAdding(true)} className="w-6 h-6 flex items-center justify-center rounded border border-dashed text-gray-400 hover:text-blue-600 hover:border-blue-400 text-sm">+</button>
      )}
    </div>
  );
}
