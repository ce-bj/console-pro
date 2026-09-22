// 知识板块 — 6 类能力总览（只读）：每类怎么处理/检索 + 知识量 + 入口
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SECTIONS, BOARD_HOWTO, healthCls } from './data';
import { PageHeader, Hint } from './shared';

export default function SectionsPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <PageHeader
        title="知识板块"
        desc="网站知识按内容类型分为 6 类，每类的处理与检索方式不同（系统内置，固定），相当于一个已经配好解析方式的知识库。这里配置处理方式；内容概览与同步健康度去「知识资产目录」看，日常上传/新增内容也去那里。"
      />

      <div className="grid grid-cols-2 gap-4">
        {SECTIONS.map((s) => {
          const howto = BOARD_HOWTO[s.key];
          return (
            <Card key={s.key} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate(`/knowledge-config/catalog?section=${s.key}`)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.sample}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-xs ${s.retrievalCls}`}>{s.retrieval}</Badge>
                    <button
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500"
                      title="配置该板块的解析/清洗/检索策略"
                      onClick={(e) => { e.stopPropagation(); navigate(`/knowledge-config/sections/${s.key}`); }}
                    >⚙️</button>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex gap-1.5"><span className="text-gray-400 w-12 shrink-0">怎么处理</span><span className="text-gray-600">{howto.handle}</span></div>
                  <div className="flex gap-1.5"><span className="text-gray-400 w-12 shrink-0">怎么检索</span><span className="text-gray-600">{howto.retrieve}</span></div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex gap-4 text-xs">
                    <span className="text-gray-400">知识 <span className="text-gray-800 font-semibold">{s.docCount}</span> 条</span>
                    <span className="text-gray-400">健康 <span className={`font-semibold ${healthCls(s.health)}`}>{s.health}</span></span>
                  </div>
                  <span className="text-xs text-blue-600">查看该类知识 →</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Hint>板块是"内容怎么处理"的内置分类，运营无需增减，相当于已经配好解析方式的一个知识库；点卡片直接看该类知识（进知识资产目录，已按板块筛选），点右上角 ⚙️ 进入配置（切片解析方式、入库清洗与质量策略、检索策略）。</Hint>
    </div>
  );
}
