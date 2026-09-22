// 问答测试 — 参考 RAGFlow 检索测试（Run Retrieval Test）：左侧提问，右侧展示召回到的知识文本块及匹配评分
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { mockScoredHits, ScoredHit, SECTIONS, SECTION_MAP, SectionKey } from './data';
import { SectionTag, PageHeader } from './shared';

interface Msg { role: 'user' | 'bot'; text: string; hits?: ScoredHit[]; scoped?: boolean; }
// 匹配严格度对应的相似度得分阈值：宽松 0.25 / 标准 0.5 / 严格 0.75（见 PRD §7.9）
const STRICT: { label: string; minSim: number }[] = [
  { label: '宽松', minSim: 0.25 },
  { label: '标准', minSim: 0.5 },
  { label: '严格', minSim: 0.75 },
];
const EXAMPLES = ['空气滤清器多久换一次', 'KFR-35 还有货吗', '退换货怎么操作'];

// 多维评分条
function ScoreBar({ label, v }: { label: string; v: number }) {
  const pct = Math.round(v * 100);
  const cls = v >= 0.85 ? 'bg-green-500' : v >= 0.7 ? 'bg-blue-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 text-[11px] text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} /></div>
      <span className="w-7 text-right text-[11px] text-gray-500">{pct}</span>
    </div>
  );
}

export default function RetrievalPage() {
  const [strict, setStrict] = useState(1);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [scopeBoards, setScopeBoards] = useState<Set<SectionKey>>(new Set(SECTIONS.map((s) => s.key)));
  const [activeMsgIdx, setActiveMsgIdx] = useState<number | null>(null);

  const minSim = STRICT[strict].minSim;
  const scoped = scopeBoards.size < SECTIONS.length;
  const activeMsg = activeMsgIdx !== null ? msgs[activeMsgIdx] : undefined;

  function toggleBoard(k: SectionKey) {
    setScopeBoards((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next.size === 0 ? new Set(SECTIONS.map((s) => s.key)) : next;
    });
  }

  function send(q?: string) {
    const text = (q ?? input).trim();
    if (!text) return;
    const hits = mockScoredHits.filter((h) => scopeBoards.has(h.board) && h.similarity >= minSim);
    const answer = hits.length
      ? hits[0].snippet
      : scoped
        ? '当前测试范围内没有找到足够相关的知识，试试取消板块限制、扩大测试范围。'
        : '抱歉，没有找到足够相关的知识。该问题已记入「对话质量运营 · 覆盖盲区」，建议补充对应知识或降低严格度。';
    setMsgs((m) => {
      const next = [...m, { role: 'user' as const, text }, { role: 'bot' as const, text: answer, hits, scoped }];
      setActiveMsgIdx(next.length - 1);
      return next;
    });
    setInput('');
  }

  return (
    <div className="space-y-4">
      <PageHeader title="问答测试" desc="请完成问答测试：测试您的问题在知识库召回正确的文本块。" />

      {/* 设置条 */}
      <Card>
        <CardContent className="pt-3 pb-3 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">匹配严格度</span>
              <select value={strict} onChange={(e) => setStrict(+e.target.value)} className="h-8 px-2 rounded border text-xs bg-white">
                {STRICT.map((o, i) => <option key={o.label} value={i}>{o.label}（得分 ≥ {o.minSim}）</option>)}
              </select>
            </div>
            {msgs.length > 0 && <button className="text-xs text-gray-400 hover:text-gray-600 ml-auto" onClick={() => { setMsgs([]); setActiveMsgIdx(null); }}>清空对话</button>}
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            <span className="text-xs text-gray-400 shrink-0">测试范围</span>
            <button onClick={() => setScopeBoards(new Set(SECTIONS.map((s) => s.key)))}
              className={`px-2.5 py-1 rounded-full text-xs ${!scoped ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>全部板块</button>
            {SECTIONS.map((s) => (
              <button key={s.key} onClick={() => toggleBoard(s.key)}
                className={`px-2.5 py-1 rounded-full text-xs ${scopeBoards.has(s.key) && scoped ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 主体：左侧提问对话，右侧展示当前提问召回的知识文本块（RAGFlow 检索测试式布局） */}
      <div className="flex gap-4">
        {/* 左：对话区 */}
        <Card className="flex-1 min-w-0">
          <CardContent className="pt-4">
            <div className="space-y-4 min-h-[280px] max-h-[440px] overflow-y-auto">
              {msgs.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-12">
                  输入一个用户可能问的问题，试试机器人怎么回答 👇
                  <div className="flex gap-1.5 justify-center flex-wrap mt-3">
                    {EXAMPLES.map((ex) => <button key={ex} onClick={() => send(ex)} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500 hover:bg-gray-200">{ex}</button>)}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[70%] bg-blue-600 text-white text-sm rounded-2xl rounded-br-sm px-3.5 py-2">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <span className="text-lg">🤖</span>
                    <div className="max-w-[80%] bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-3.5 py-2">{m.text}</div>
                  </div>
                  {m.hits && m.hits.length > 0 ? (
                    <button
                      onClick={() => setActiveMsgIdx(i)}
                      className={`ml-8 self-start text-xs rounded px-2 py-1 ${activeMsgIdx === i ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                    >
                      📄 召回 {m.hits.length} 个文本块{m.scoped && ' · 已限定板块'} · {activeMsgIdx === i ? '正在右侧查看' : '在右侧查看 →'}
                    </button>
                  ) : (
                    <span className="ml-8 text-xs text-gray-400">未召回文本块</span>
                  )}
                </div>
              ))}
            </div>

            {/* 输入框 */}
            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className="flex-1 h-9" placeholder="输入问题，回车发送…" />
              <Button size="sm" className="bg-blue-600" onClick={() => send()}>发送</Button>
            </div>
          </CardContent>
        </Card>

        {/* 右：召回文本块列表 */}
        <Card className="w-[400px] shrink-0">
          <CardContent className="pt-4">
            <div className="text-sm font-medium text-gray-800">
              召回文本块{activeMsg?.hits ? `（${activeMsg.hits.length}）` : ''}
              {activeMsg?.scoped && <span className="ml-1.5 text-xs font-normal text-amber-600">· 已限定测试板块范围</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 mb-3">点击左侧任意一条回答下方的"召回 N 个文本块"，可在此查看该问题对应的召回结果。</p>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto">
              {!activeMsg && (
                <div className="text-center text-sm text-gray-400 py-16">在左侧提一个问题，这里会展示召回到的知识文本块与匹配评分</div>
              )}
              {activeMsg && (!activeMsg.hits || activeMsg.hits.length === 0) && (
                <div className="text-center text-sm text-gray-400 py-16">这个问题没有召回到足够相关的文本块<br />试试降低匹配严格度或扩大测试范围</div>
              )}
              {activeMsg?.hits?.map((h) => (
                <div key={h.doc} className="border rounded-lg p-2.5 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <SectionTag k={h.board} />
                      <span className="text-sm text-gray-700 truncate">{h.doc}</span>
                    </div>
                    <Badge className={`text-xs ${SECTION_MAP[h.board].retrievalCls} shrink-0`}>相似度 {Math.round(h.similarity * 100)}%</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{h.snippet}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <ScoreBar label="相关性" v={h.relevance} />
                    <ScoreBar label="权威性" v={h.authority} />
                    <ScoreBar label="时效性" v={h.freshness} />
                    <ScoreBar label="相似度" v={h.similarity} />
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1.5">出处：{h.source}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
