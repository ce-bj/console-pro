// 板块配置 — 切片解析方式（参考 RAGFlow） + 入库前清洗与质量评估策略 + 检索策略
// 日常"传内容"去「知识资产目录」，这里只负责怎么处理、跑得好不好、要不要关注
import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  SECTION_MAP, SectionKey, KbSection, BOARD_HOWTO,
  CHUNK_METHODS, EMBEDDING_MODELS, PDF_PARSERS, DEDUP_STRATEGIES, PRIVACY_MASK_TYPES,
  metaChunkingEligible, doc2queryEligible, embeddingEligible,
  MetadataFieldDef, META_FIELD_TYPES, BUILTIN_METADATA_FIELDS,
  ChunkRule, generalChunkRule, mockExtraChunkRules, CONTENT_FORMATS,
  McpAction, mockMcpActions,
} from './data';

const mockSectionChunkRuleDefaultsData = [
  { section: '文档知识', defaultRule: '通用', specializedRules: ['政策', '手册'], reason: '法规条款与长手册的结构差异明显' },
  { section: '问答知识', defaultRule: '问答对（固定）', specializedRules: [], reason: '板块已确定为一问一答，不再按内容形式分流' },
  { section: '内容资产', defaultRule: '通用', specializedRules: [], reason: '网页正文先共用语义分块，出现稳定差异后再增加规则' },
  { section: '网络知识', defaultRule: '通用', specializedRules: [], reason: '抓取页面结构差异大，优先使用稳健兜底规则' },
  { section: '行业知识', defaultRule: '通用', specializedRules: ['政策', '报告'], reason: '政策按条款切，长报告按章节与父子块切' },
];

// ACTION: 获取板块切片规则默认方案 [GET] /api/kb/sections/chunk-rule-defaults
function handleFetchSectionChunkRuleDefaults() {
  console.log('fetch section chunk rule defaults');
}

interface Cfg {
  // 切片解析方式：按内容形式分成多条规则，rules[0] 恒为「通用」兜底规则
  chunkRules: ChunkRule[];
  // 入库前清洗与质量评估策略（板块级，不按内容形式分）
  privacyMaskEnabled: boolean;
  privacyMaskTypes: string[];
  dedupEnabled: boolean;
  dedupStrategy: string;
  qualityScoreThreshold: number;
  // 检索策略（板块级）
  vectorWeight: number;
  threshold: number;
  rerankOn: boolean;
  embeddingModel: string;
  topK: number;
}

function cfgFromSection(s: KbSection): Cfg {
  return {
    chunkRules: [generalChunkRule(s), ...(mockExtraChunkRules[s.key] ?? []).map((r) => ({ ...r }))],
    privacyMaskEnabled: s.privacyMaskEnabled, privacyMaskTypes: [...s.privacyMaskTypes], dedupEnabled: s.dedupEnabled,
    dedupStrategy: s.dedupStrategy, qualityScoreThreshold: s.qualityScoreThreshold,
    vectorWeight: s.vectorWeight, threshold: s.threshold,
    rerankOn: s.rerank === '开启' || s.rerank === '文档开启',
    embeddingModel: s.embeddingModel === '—' ? EMBEDDING_MODELS[0] : s.embeddingModel,
    topK: s.topK,
  };
}

export default function SectionDetailPage() {
  const { sectionKey } = useParams();
  const navigate = useNavigate();
  const s = sectionKey ? SECTION_MAP[sectionKey as SectionKey] : undefined;

  const [cfg, setCfg] = useState<Cfg | null>(s ? cfgFromSection(s) : null);
  const [saved, setSaved] = useState(false);

  // 切片解析方式：当前正在编辑哪条内容形式规则
  const [activeRuleIdx, setActiveRuleIdx] = useState(0);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [newRuleFormat, setNewRuleFormat] = useState('');

  // ⑤结构化数据：MCP 动作勾选
  const [mcpActions, setMcpActions] = useState<McpAction[]>(() => mockMcpActions.map((a) => ({ ...a })));

  // 元数据生成设置弹窗（参考 RAGFlow：字段/描述/类型/值/操作）
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaTab, setMetaTab] = useState<'生成' | '内置'>('生成');
  const [metaDraft, setMetaDraft] = useState<MetadataFieldDef[]>([]);

  useEffect(() => {
    handleFetchSectionChunkRuleDefaults();
    if (s) {
      setCfg(cfgFromSection(s));
      setSaved(false);
      setMetaOpen(false);
      setActiveRuleIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  if (!s || !cfg) return <Navigate to="/knowledge-config/sections" replace />;
  const board: SectionKey = s.key;

  const howto = BOARD_HOWTO[board];
  const isStructured = board === 'structured';
  const isFaq = board === 'faq';

  // ── 切片解析方式：按内容形式维护多条规则 ─────────────────────────
  const cfgNow = cfg;
  const rule = cfgNow.chunkRules[activeRuleIdx] ?? cfgNow.chunkRules[0];
  const isGeneralRule = activeRuleIdx === 0;
  // 已占用的内容形式不能重复添加；'通用'是保留值，不出现在可选列表里
  // 与「元数据规范」共用同一个内容形式枚举，避免两处配置漂移。
  const availableFormats = CONTENT_FORMATS.filter((f) => !cfgNow.chunkRules.some((r) => r.contentFormat === f));
  const boardDefault = mockSectionChunkRuleDefaultsData.find((item) => item.section === s.name);
  function setRule(patch: Partial<ChunkRule>) {
    setCfg({ ...cfgNow, chunkRules: cfgNow.chunkRules.map((r, i) => (i === activeRuleIdx ? { ...r, ...patch } : r)) });
  }
  function openAddRule() {
    if (cfgNow.chunkRules.length >= 6) { alert('每个板块最多配置 5 条内容形式专属规则'); return; }
    if (availableFormats.length === 0) { alert('全部内容形式都已配置切片方式'); return; }
    setNewRuleFormat(availableFormats[0]);
    setAddRuleOpen(true);
  }
  function addChunkRule() {
    if (!newRuleFormat) return;
    // ACTION: 新增内容形式的切片解析方式 [POST] /api/kb/sections/{key}/chunk-rules
    // 新规则以「通用」为起点，运营只需要改差异项，不用从零配一遍
    const next: ChunkRule = { ...cfgNow.chunkRules[0], contentFormat: newRuleFormat };
    setCfg({ ...cfgNow, chunkRules: [...cfgNow.chunkRules, next] });
    setActiveRuleIdx(cfgNow.chunkRules.length);
    setAddRuleOpen(false);
  }
  function removeChunkRule(index: number) {
    if (index === 0) return; // 「通用」是兜底规则，不可删
    const target = cfgNow.chunkRules[index];
    if (!confirm(`删除「${target.contentFormat}」的切片方式？该内容形式的知识将回落到「通用」规则。`)) return;
    // ACTION: 删除内容形式的切片解析方式 [DELETE] /api/kb/sections/{key}/chunk-rules/{contentFormat}
    setCfg({ ...cfgNow, chunkRules: cfgNow.chunkRules.filter((_, i) => i !== index) });
    setActiveRuleIdx((p) => (p >= index ? Math.max(0, p - 1) : p));
  }
  function toggleMcpAction(id: string) {
    // ACTION: 启停结构化数据 MCP 动作 [PATCH] /api/kb/sections/structured/mcp-actions/{id}
    setMcpActions((p) => p.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  }

  function saveCfg() {
    // ACTION: 保存板块配置（解析/清洗/检索） [PUT] /api/kb/sections/{key}/config
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const openMeta = () => {
    setMetaDraft(rule.autoMetadataFields.map((f) => ({ ...f })));
    setMetaTab('生成');
    setMetaOpen(true);
  };
  function addMetaField() {
    setMetaDraft((p) => [...p, { field: '', desc: '', type: META_FIELD_TYPES[0] }]);
  }
  function updateMetaField(i: number, patch: Partial<MetadataFieldDef>) {
    setMetaDraft((p) => p.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function removeMetaField(i: number) {
    setMetaDraft((p) => p.filter((_, idx) => idx !== i));
  }
  const saveMeta = () => {
    // ACTION: 保存元数据生成字段 schema [PUT] /api/kb/sections/{key}/config
    setRule({ autoMetadataFields: metaDraft });
    setMetaOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button className="hover:text-blue-600" onClick={() => navigate('/knowledge-config/sections')}>知识板块</button>
        <span>/</span><span className="text-gray-700">{s.name} 配置</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">{s.emoji}</span>{s.name}配置
            <Badge className={`text-xs ${s.retrievalCls}`}>{s.retrieval}</Badge>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{s.define} — {s.sample}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate(`/knowledge-config/catalog?section=${board}`)}>→ 去知识资产目录管理内容</Button>
      </div>

      {isStructured ? (
        <>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">这类知识怎么用</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">结构化数据不进向量库、不分块，通过 MCP 参数化查询数据库实时返回，无需配置解析/清洗/检索参数。</p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="p-3 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-400">怎么处理</div>
                  <div className="text-sm text-gray-700 mt-1">{howto.handle}</div>
                </div>
                <div className="p-3 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-400">怎么检索</div>
                  <div className="text-sm text-gray-700 mt-1">{howto.retrieve}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MCP 动作：结构化数据不做切片，改为勾选开放哪些实时查询动作 */}
          <Card>
            <CardHeader className="pb-2 flex-row items-start justify-between">
              <div>
                <CardTitle className="text-sm">MCP 动作</CardTitle>
                <p className="mt-0.5 text-xs text-gray-500">
                  每个动作对应一次业务库的参数化查询。勾选后该动作对智能客服开放，用户提问命中时实时取数作答；表映射与查询语句由平台在接入时配置，运营侧只决定开不开。
                </p>
              </div>
              <Badge className="shrink-0 bg-blue-50 text-blue-600 text-xs">
                已启用 {mcpActions.filter((a) => a.enabled).length}/{mcpActions.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">启用</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>数据来源</TableHead>
                    <TableHead>主要入参</TableHead>
                    <TableHead>返回内容</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mcpActions.map((a) => (
                    <TableRow key={a.id} className={a.enabled ? '' : 'opacity-60'}>
                      <TableCell>
                        <Switch checked={a.enabled} onCheckedChange={() => toggleMcpAction(a.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-800">{a.name}</div>
                        <div className="mt-0.5 text-xs text-gray-400">{a.desc}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">{a.source}</TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">{a.params}</TableCell>
                      <TableCell className="text-xs text-gray-500">{a.returns}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-[11px] text-gray-400">
                关闭某个动作后，智能客服不再调用它；已产生的对话记录保留。新增动作需平台侧先完成数据库接入，再在此列表出现。
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* ① 切片解析方式（参考 RAGFlow 通用切片方法），按内容形式可配多套 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">切片解析方式</CardTitle></CardHeader>
            <CardContent>
              {/* 问答知识由板块固定为问答对；其它非结构化板块才允许按内容形式增加专属规则 */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1.5">
                  解析规则适用范围
                  <span className="ml-1 text-gray-400">
                    {isFaq ? '— 问答知识板块固定使用问答对解析，不再重复选择 FAQ 内容形式' : '— 只有确实需要不同算法的内容形式才单独配置，其余内容走「通用」'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {cfgNow.chunkRules.map((r, i) => (
                    <button key={r.contentFormat} onClick={() => setActiveRuleIdx(i)}
                      className={`group inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${i === activeRuleIdx ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {isFaq && i === 0 ? '问答对' : r.contentFormat}
                      {i === 0 && <span className={i === activeRuleIdx ? 'text-blue-100' : 'text-gray-400'}>{isFaq ? '固定' : '默认'}</span>}
                      {i > 0 && (
                        <span role="button" tabIndex={0}
                          className={i === activeRuleIdx ? 'text-blue-100 hover:text-red-200' : 'text-gray-400 hover:text-red-500'}
                          onClick={(e) => { e.stopPropagation(); removeChunkRule(i); }}>✕</span>
                      )}
                    </button>
                  ))}
                  {!isFaq && availableFormats.length > 0 && cfgNow.chunkRules.length < 6 && (
                    <button onClick={openAddRule}
                      className="rounded border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600">
                      ＋ 新增专属规则
                    </button>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {isFaq
                    ? '一条问答作为一个完整检索单元，问题与答案不会被切散；可在下方调整关键词提取等参数。'
                    : isGeneralRule
                    ? '当前编辑「通用」规则：本板块所有未单独配置内容形式的知识都按这套参数解析。'
                    : `当前编辑「${rule.contentFormat}」规则：仅本板块中内容形式为「${rule.contentFormat}」的知识按这套参数解析。`}
                </div>
                {boardDefault && (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-gray-600">
                    <span className="font-medium text-blue-700">推荐默认：</span>
                    {boardDefault.defaultRule}
                    {boardDefault.specializedRules.length > 0 && ` + ${boardDefault.specializedRules.join('、')}专属规则`}
                    <span className="text-gray-400"> · {boardDefault.reason}</span>
                  </div>
                )}
              </div>

              <CfgField label="分块整体策略（chunk_method）">
                <select value={rule.chunkMethod} onChange={(e) => setRule({ chunkMethod: e.target.value })} className="h-9 w-full max-w-md px-2 rounded-md border text-sm bg-white">
                  {CHUNK_METHODS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </CfgField>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <CfgField label="任务页面大小" help="如果使用布局识别，PDF 文件将被分成连续的组。布局分析将在组之间并行执行，以提高处理速度。任务页面大小决定组的大小。页面大小越大，将页面之间的连续文本分割成不同块的机会就越低。">
                  <input type="number" min={1} value={rule.taskPageSize}
                    onChange={(e) => setRule({ taskPageSize: Math.max(1, +e.target.value) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                <CfgField label="PDF 解析器" help="使用视觉模型进行 PDF 布局分析，以更好地识别文档结构，找到标题、文本块、图像和表格的位置。如果选择朴素解析（Naive），则只能获取 PDF 的纯文本。该功能只适用于 PDF 文档，对其他文档不生效。">
                  <select value={rule.pdfParser} onChange={(e) => setRule({ pdfParser: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                    {PDF_PARSERS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </CfgField>
                <CfgField label="建议文本块大小（token）">
                  <div className="flex items-center gap-2">
                    <input type="range" min={64} max={2048} step={64} value={rule.chunkTokenSize}
                      onChange={(e) => setRule({ chunkTokenSize: +e.target.value })} className="flex-1" />
                    <span className="text-xs text-gray-500 w-12 text-right shrink-0">{rule.chunkTokenSize}</span>
                  </div>
                </CfgField>
                <CfgField label="文本分段标识符">
                  <input value={rule.chunkDelimiter} onChange={(e) => setRule({ chunkDelimiter: e.target.value })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white font-mono" />
                </CfgField>
                <CfgField label="图像与表格上下文窗口" help="抓取图像与表格上下方的 N 个 token，为该 chunk 提供更丰富的背景上下文。">
                  <input type="number" min={0} max={5} value={rule.imageTableContextWindow}
                    onChange={(e) => setRule({ imageTableContextWindow: Math.min(5, Math.max(0, +e.target.value)) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                <CfgField label="自动关键词提取（每块个数，0=关闭）" help="自动为每个文本块提取 N 个关键词，用以提升查询精度。该功能采用板块指定的 Embedding 模型提取，会产生额外 Token 消耗；生成后也可在块列表里手动改。">
                  <input type="number" min={0} max={10} value={rule.autoKeywordCount}
                    onChange={(e) => setRule({ autoKeywordCount: Math.min(10, Math.max(0, +e.target.value)) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                {doc2queryEligible(board) && (
                  <CfgField label="自动问题提取（每块个数，0=关闭）" help="对每个文本块提取 N 个可能的提问方式以提高排名得分（即反向问题生成 Doc2Query）。开启后消耗额外 Token，可在块列表里查看/编辑结果；提取出错也不会影响分块本身，只是留空。">
                    <input type="number" min={0} max={10} value={rule.autoQuestionCount}
                      onChange={(e) => setRule({ autoQuestionCount: Math.min(10, Math.max(0, +e.target.value)) })}
                      className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                  </CfgField>
                )}
              </div>

              <div className="mt-4 pt-4 border-t space-y-2.5">
                <ToggleRow label="子文本块用于检索" desc="开启后检索命中粒度更细，返回子块而非整段父块" checked={rule.useSubChunksForRetrieval} onChange={(v) => setRule({ useSubChunksForRetrieval: v })} />
                <ToggleRow label="PageIndex" desc="保留原文页码索引，便于溯源与跳转原文"
                  help="为已有的 chunk 生成层级结构的目录信息（每个文件一个目录）。查询时激活 PageIndex 后，系统会用大模型判断用户问题和哪些目录项相关，从而定位相关 chunk。"
                  checked={rule.pageIndexEnabled} onChange={(v) => setRule({ pageIndexEnabled: v })} />
                <ToggleRow label="自动元数据" desc={`解析时自动抽取自定义字段（已配置 ${rule.autoMetadataFields.length} 个字段），适用于新解析的文件，现有文件需重新解析才能更新`}
                  help="自动生成元数据。适用于解析新文件；现有文件需要重新解析才能更新（chunk 会保留）。配置中指定的索引模型将消耗额外 Token。"
                  checked={rule.autoMetadataEnabled} onChange={(v) => setRule({ autoMetadataEnabled: v })}
                  action={<Button size="sm" variant="outline" className="h-7 text-xs" onClick={openMeta}>⚙️ 设置</Button>} />
                {metaChunkingEligible(board) && (
                  <ToggleRow label="语义感知分块（Meta-Chunking）" desc="用困惑度在逻辑断层处切分并做语义补全，解决“长文逻辑被切碎”问题，默认关闭、成本更高" checked={rule.metaChunkingEnabled} onChange={(v) => setRule({ metaChunkingEnabled: v })} />
                )}
              </div>
            </CardContent>
          </Card>

          {/* ② 入库前清洗与质量评估策略 */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">入库前清洗与质量评估策略</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <div className="p-2.5 rounded border bg-gray-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">隐私信息脱敏</div>
                    <div className="text-xs text-gray-400">
                      入库前识别内容中的隐私信息，命中后替换为占位符再入库，原文不落库、不进入向量索引
                    </div>
                  </div>
                  <Switch checked={cfg.privacyMaskEnabled} onCheckedChange={(v) => setCfg({ ...cfg, privacyMaskEnabled: v })} />
                </div>
                {cfg.privacyMaskEnabled && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="text-xs text-gray-500">去隐私策略 — 选择需要识别并脱敏的信息类型</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {PRIVACY_MASK_TYPES.map((t) => (
                        <label key={t} className="flex items-center gap-1.5 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={cfg.privacyMaskTypes.includes(t)}
                            onChange={() => setCfg({
                              ...cfg,
                              privacyMaskTypes: cfg.privacyMaskTypes.includes(t)
                                ? cfg.privacyMaskTypes.filter((x) => x !== t)
                                : [...cfg.privacyMaskTypes, t],
                            })}
                          />
                          {t}
                        </label>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 pt-1.5 border-t">
                      示例：原文"联系电话 13812345678，负责人张三" → 入库后 "联系电话 {'{手机号}'}，负责人 {'{姓名}'}"
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-2.5 rounded border bg-gray-50">
                <div className="flex-1">
                  <div className="text-sm text-gray-700">去重</div>
                  <div className="text-xs text-gray-400">按标题分词 + 标签重合度比对同板块内容，相似度 ≥60% 视为疑似重复</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={cfg.dedupStrategy} disabled={!cfg.dedupEnabled}
                    onChange={(e) => setCfg({ ...cfg, dedupStrategy: e.target.value })}
                    className="h-8 px-2 rounded-md border text-xs bg-white disabled:bg-gray-100 disabled:text-gray-400">
                    {DEDUP_STRATEGIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Switch checked={cfg.dedupEnabled} onCheckedChange={(v) => setCfg({ ...cfg, dedupEnabled: v })} />
                </div>
              </div>
              <div className="p-2.5 rounded border bg-gray-50">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-sm text-gray-700">打分策略 — 质量评分拦截阈值</div>
                    <div className="text-xs text-gray-400">质量打分 = 100 − 敏感词命中扣分(40) − 疑似重复扣分(20) − 切片解析问题占比扣分(最多30)；低于阈值时「入库前门禁检查」的"质量打分是否达标"项不通过</div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{cfg.qualityScoreThreshold}</span>
                </div>
                <input type="range" min={0} max={100} value={cfg.qualityScoreThreshold}
                  onChange={(e) => setCfg({ ...cfg, qualityScoreThreshold: +e.target.value })} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* ③ 检索策略 */}
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">检索策略</CardTitle>
              <span className="text-xs text-gray-400">系统已给出推荐默认值，仅在出现具体召回问题时再调整</span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <CfgField label="向量权重（0–1）">
                  <input type="number" min={0} max={1} step={0.1} value={cfg.vectorWeight}
                    onChange={(e) => setCfg({ ...cfg, vectorWeight: Math.min(1, Math.max(0, +e.target.value)) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                <CfgField label="相似度阈值（0–1）">
                  <input type="number" min={0} max={1} step={0.05} value={cfg.threshold}
                    onChange={(e) => setCfg({ ...cfg, threshold: Math.min(1, Math.max(0, +e.target.value)) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                <CfgField label="Top K（检索返回条数）">
                  <input type="number" min={1} max={20} value={cfg.topK}
                    onChange={(e) => setCfg({ ...cfg, topK: Math.max(1, +e.target.value) })}
                    className="h-9 w-full px-2 rounded-md border text-sm bg-white" />
                </CfgField>
                <CfgField label="Rerank 精排">
                  <div className="h-9 flex items-center gap-2">
                    <Switch checked={cfg.rerankOn} onCheckedChange={(v) => setCfg({ ...cfg, rerankOn: v })} />
                    <span className="text-xs text-gray-400">{board === 'faq' ? '建议关闭，防止语义漂移' : '建议开启，提升精排效果'}</span>
                  </div>
                </CfgField>
                {embeddingEligible(board) && (
                  <CfgField label="Embedding 模型">
                    <select value={cfg.embeddingModel} onChange={(e) => setCfg({ ...cfg, embeddingModel: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                      {EMBEDDING_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </CfgField>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button size="sm" className="bg-blue-600" onClick={saveCfg}>保存配置</Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/knowledge-config/retrieval')}>去问答测试验证效果</Button>
            {saved && <span className="text-xs text-green-600">已保存 — 新入库内容立即生效；已入库内容需「重新学习」后应用新配置</span>}
          </div>
        </>
      )}

      {/* 元数据生成设置（参考 RAGFlow：字段/描述/类型/值/操作） */}
      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>元数据生成设置</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-400 -mt-2">更改仅影响新的解析；已解析的知识需要重新学习才能应用新字段。</p>
          <div className="flex items-center gap-2 py-1">
            <span className="w-7 h-7 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-sm">{s.emoji}</span>
            <span className="text-sm text-gray-700">{s.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-gray-100 rounded-md p-0.5 w-fit">
              {(['生成', '内置'] as const).map((t) => (
                <button key={t} onClick={() => setMetaTab(t)}
                  className={`px-3 py-1 rounded text-xs ${metaTab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{t}</button>
              ))}
            </div>
            {metaTab === '生成' && <Button size="sm" variant="outline" onClick={addMetaField}>+ 添加</Button>}
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>字段</TableHead><TableHead>描述</TableHead><TableHead>类型</TableHead><TableHead>值</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {metaTab === '内置' ? (
                BUILTIN_METADATA_FIELDS.map((f) => (
                  <TableRow key={f.field}>
                    <TableCell className="text-sm font-mono text-gray-700">{f.field}</TableCell>
                    <TableCell className="text-sm text-gray-600">{f.desc}</TableCell>
                    <TableCell className="text-xs text-gray-400">{f.type}</TableCell>
                    <TableCell className="text-xs text-gray-300">—</TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : metaDraft.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-gray-400 py-8">暂无数据</TableCell></TableRow>
              ) : (
                metaDraft.map((f, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={f.field} onChange={(e) => updateMetaField(i, { field: e.target.value })} placeholder="如：author" className="h-8 text-xs font-mono" /></TableCell>
                    <TableCell><Input value={f.desc} onChange={(e) => updateMetaField(i, { desc: e.target.value })} placeholder="如：作者" className="h-8 text-xs" /></TableCell>
                    <TableCell>
                      <select value={f.type} onChange={(e) => updateMetaField(i, { type: e.target.value })} className="h-8 px-1.5 rounded border text-xs bg-white">
                        {META_FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="text-xs text-gray-300">解析后生成</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => removeMetaField(i)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setMetaOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={saveMeta}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增内容形式的切片方式：选一个尚未配置的内容形式，以「通用」为起点 */}
      <Dialog open={!isFaq && addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>新增内容形式的切片方式</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-400 -mt-2">
            仅当某类内容确实需要不同切片算法时新增专属规则；其余内容仍走「通用」。新规则以「通用」当前参数为起点，保存前可逐项调整。
          </p>
          <div>
            <div className="text-xs text-gray-500 mb-1">内容形式</div>
            <select value={newRuleFormat} onChange={(e) => setNewRuleFormat(e.target.value)}
              className="h-9 w-full px-2 rounded-md border text-sm bg-white">
              {availableFormats.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="mt-2 text-xs text-gray-400">
              此处与「元数据规范」使用同一套内容形式枚举；问答对和结构化记录由对应知识板块固定，不进入该枚举。
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAddRuleOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={addChunkRule}>新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function HelpIcon({ text }: { text: string }) {
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

function CfgField({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 inline-flex items-center gap-1">{label}{help && <HelpIcon text={help} />}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, help, checked, onChange, action }: { label: string; desc: string; help?: string; checked: boolean; onChange: (v: boolean) => void; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded border bg-gray-50">
      <div>
        <div className="text-sm text-gray-700 inline-flex items-center gap-1">{label}{help && <HelpIcon text={help} />}</div>
        <div className="text-xs text-gray-400">{desc}</div>
      </div>
      <div className="flex items-center gap-2">
        {action}
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}
