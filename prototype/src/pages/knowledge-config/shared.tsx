// 知识库配置模块 · 共享 UI 片段（被各栏目页面复用）
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SectionKey, KbStatus, SECTION_MAP, STATUS_LABEL, STATUS_TRANSITIONS, healthCls,
  DateRangeKey, DATE_RANGE_OPTS,
} from './data';

// 日期范围选择（今天/近7天/近30天/全部）— 事件计数类指标（调用次数、引用次数等）用
export function DateRangeChips({ value, onChange }: { value: DateRangeKey; onChange: (v: DateRangeKey) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {DATE_RANGE_OPTS.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 rounded text-xs ${value === o.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 板块徽标（紧凑）
export function SectionTag({ k }: { k: SectionKey }) {
  const s = SECTION_MAP[k];
  return (
    <Badge className="text-xs bg-gray-100 text-gray-700 border border-gray-200 font-normal">
      {s.index} {s.name}
    </Badge>
  );
}

// 生命周期状态徽标
export function StatusBadge({ status }: { status: KbStatus }) {
  const s = STATUS_LABEL[status];
  return <Badge className={`text-xs ${s.cls}`}>{s.label}</Badge>;
}

// 状态操作：当前状态徽标 + 合法的下一步人工动作按钮（见 data.ts STATUS_TRANSITIONS）
// status 传"展示态"（effectiveStatus 的结果），保证"已过期自动降级为待更新"时也能看到对应的操作按钮
export function StatusActions({ status, onTransition }: {
  status: KbStatus; onTransition: (to: KbStatus, label: string) => void;
}) {
  const actions = STATUS_TRANSITIONS[status] ?? [];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge status={status} />
      {actions.map((act) => (
        <Button key={act.to} size="sm" variant="outline" className="h-7 text-xs" onClick={() => onTransition(act.to, act.label)}>{act.label}</Button>
      ))}
    </div>
  );
}

// 健康度数字
export function HealthValue({ value, status, className = '' }: { value: number; status?: KbStatus; className?: string }) {
  return <span className={`font-semibold ${healthCls(value)} ${className}`}>{value === 0 ? '—' : value}</span>;
}

// KPI 卡片
export function KpiCard({ label, value, sub, cls = 'text-gray-900', tooltip }: {
  label: string; value: React.ReactNode; sub?: string; cls?: string; tooltip?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500 font-normal inline-flex items-center gap-1">
          {label}
          {tooltip && <HelpIcon text={tooltip} />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${cls}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

// 栏目页统一标题
export function PageHeader({ title, desc, sub, actions, right }: {
  title: string; desc?: string; sub?: string; actions?: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {desc && <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">{desc}</p>}
        {sub && <p className="text-sm text-gray-500 mt-0.5 max-w-3xl">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      {right && <div className="flex gap-2 shrink-0">{right}</div>}
    </div>
  );
}

// 说明性脚注
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 px-1 leading-relaxed">{children}</p>;
}

export function HelpIcon({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group align-middle">
      <span tabIndex={0} className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-gray-300 text-gray-400 text-[10px] leading-none cursor-help">?</span>
      <span className="pointer-events-none absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-gray-900 text-white text-xs leading-relaxed p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}

// 分维度指标条（健康度分解、多维评分等复用）
export function MetricBar({ label, value, hint, tooltip }: { label: string; value: number; hint?: string; tooltip?: string }) {
  const cls = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="w-12 text-xs text-gray-400 shrink-0 flex items-center gap-0.5">
          {label}
          {tooltip && <HelpIcon text={tooltip} />}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${cls}`} style={{ width: `${value}%` }} /></div>
        <span className="w-7 text-right text-xs text-gray-600 shrink-0">{value}</span>
      </div>
      {hint && <div className="text-[11px] text-amber-600 mt-0.5 pl-14">{hint}</div>}
    </div>
  );
}
