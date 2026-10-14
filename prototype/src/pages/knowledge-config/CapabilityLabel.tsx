import { useId, useState } from 'react';
import { Capability } from './structuredPolicy';

const HELP: Record<Capability, string> = {
  search: '让字段内容参与关键词搜索。',
  filter: '用字段值限定结果，例如颜色、价格范围。',
  facet: '按字段值分组并统计可用记录数，例如统计各颜色的规格数量。',
  sort: '按字段值排列结果，例如价格从低到高。',
  display: '在检索结果中展示这个字段。',
  ai: '仅在数据集启用语义检索时，让字段内容参与 AI 语义检索。',
};

export default function CapabilityLabel({ capability, label }: { capability: Capability; label: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return <span className="inline-flex items-center gap-1 whitespace-nowrap"><span>{label}</span><span className="relative group inline-flex">
    <button type="button" aria-label={label + '说明'} aria-describedby={id} aria-expanded={open} onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} onKeyDown={e => e.key === 'Escape' && setOpen(false)} className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-gray-400 text-[10px] hover:text-blue-600 focus-visible:outline-blue-500">?</button>
    <span id={id} role="tooltip" className={'absolute right-0 top-full mt-1 z-50 w-44 whitespace-normal rounded bg-gray-800 px-2 py-1.5 text-left text-xs font-normal text-white shadow ' + (open ? 'block' : 'hidden group-hover:block group-focus-within:block')}>{HELP[capability]}</span>
  </span></span>;
}
