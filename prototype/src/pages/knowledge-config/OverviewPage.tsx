// 概览 — 运营看板：关键指标 + 需要处理 + 板块分布（全局了解、知道下一步）
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  SECTIONS, KB_TOTALS, mockAssets, mockBlindSpots, healthCls,
} from './data';
import { KpiCard } from './shared';

export default function OverviewPage() {
  const navigate = useNavigate();
  const warnings = mockAssets.filter((a) => a.health > 0 && a.health < 60).length;
  const drafts = KB_TOTALS.drafts;
  const stale = KB_TOTALS.stale;
  const maxCount = Math.max(...SECTIONS.map((s) => s.docCount));

  // 需要处理（运营下一步）
  const todos = [
    { label: '草稿，待发布上线', count: drafts, cls: 'text-amber-600', to: 'catalog', cta: '去处理' },
    { label: '低质知识（健康度<60），建议整改', count: warnings, cls: 'text-red-500', to: 'quality', cta: '去查看' },
    { label: '内容过期 / 待更新', count: stale, cls: 'text-orange-600', to: 'sync', cta: '去同步' },
    { label: '用户问了但答不上（覆盖盲区）', count: mockBlindSpots.length, cls: 'text-blue-600', to: 'quality', cta: '去补录' },
  ].filter((t) => t.count > 0);

  return (
    <div className="space-y-5">
      {/* 关键指标 */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="知识总数" value={KB_TOTALS.totalDocs} cls="text-gray-900" />
        <KpiCard label="已发布上线" value={KB_TOTALS.published} sub="正在为客服/搜索服务" cls="text-green-600" />
        <KpiCard label="待处理" value={drafts + stale + warnings} sub="草稿/过期/低质合计" cls="text-amber-600" />
        <KpiCard label="平均健康度" value={KB_TOTALS.avgHealth} sub="满分100，越高越好" cls="text-blue-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 需要处理 */}
        <Card className="col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">需要处理 — 建议下一步</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {todos.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">暂无待处理事项 👍</p>}
            {todos.map((t) => (
              <div key={t.label} className="flex items-center justify-between px-3 py-2.5 rounded border bg-white">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold w-10 text-center ${t.cls}`}>{t.count}</span>
                  <span className="text-sm text-gray-600">{t.label}</span>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(t.to)}>{t.cta} →</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">快捷操作</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start bg-blue-600 h-9 text-sm" onClick={() => navigate('catalog')}>+ 录入知识</Button>
            <Button variant="outline" className="w-full justify-start h-9 text-sm" onClick={() => navigate('retrieval')}>问答测试</Button>
          </CardContent>
        </Card>
      </div>

      {/* 板块内容分布 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">知识内容分布（按板块）</CardTitle>
          <button className="text-xs text-blue-600 hover:underline" onClick={() => navigate('sections')}>去管理 →</button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {SECTIONS.map((s) => (
            <div key={s.key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5" onClick={() => navigate(`catalog?section=${s.key}`)}>
              <span className="w-28 text-sm text-gray-700 shrink-0">{s.emoji} {s.name}</span>
              <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(s.docCount / maxCount) * 100}%` }} />
              </div>
              <span className="w-12 text-right text-sm text-gray-700 shrink-0">{s.docCount} 条</span>
              <span className="w-16 text-right text-xs text-gray-400 shrink-0">健康 <span className={`font-semibold ${healthCls(s.health)}`}>{s.health}</span></span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
