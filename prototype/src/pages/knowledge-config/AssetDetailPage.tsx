// 知识详情 — 运营视角：完整元数据 + 标签 + 健康度分解 + 原文/切片双栏预览（含切片编辑/批量操作）+ 入库前门禁 + 检索参数 + 来源
import { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  SECTION_MAP, CONNECT_CLS, mockPortalSites,
  mockAssetChunks, mockRawContent, mockCallLogs, healthSuggestion, evaluateGates, HealthBreakdown,
  AssetChunk, CHUNK_TYPES, mockAssetHistory, KbAsset, KbStatus,
  computeHealthBreakdown, computeHealth, mockHealthWeights, effectiveStatus, TODAY, mockCustomSchemaFields,
  getKnowledgeAsset, upsertKnowledgeAsset, resolveChunkRule, GENERAL_CONTENT_FORMAT,
} from './data';
import { SectionTag, StatusActions, HealthValue, MetricBar } from './shared';
import { mockPlatformIndustryKnowledgeData, PlatformIndustryKnowledge } from '../N14-IndustryKnowledgePlatformPage';

function platformIndustryToAsset(item: PlatformIndustryKnowledge): KbAsset {
  return {
    id: item.id, name: item.title, section: 'industry', connect: '平台', knowledgeBaseType: '行业知识库',
    industry: `${item.primaryIndustry} / ${item.secondaryIndustry}`,
    primaryCategory: item.primaryCategory, secondaryCategory: item.secondaryCategory, contentFormat: item.contentFormat,
    validityStatus: (item.validityStatus || '现行有效') as KbAsset['validityStatus'], source: item.source,
    audience: item.audience || '企业内部', language: item.language || '简体中文', portalSites: item.portalSites || [],
    businessTag: '行业知识运营', scene: '智能客服与内容生成', timeliness: item.timeliness || '静态', access: '内部',
    status: item.status, health: item.health ?? (item.status === 'published' ? 85 : 0), chunks: item.chunkCount,
    createdAt: item.createdAt || item.updatedAt, createdBy: item.createdBy || item.updatedBy, updatedAt: item.updatedAt,
    tags: item.tags, summary: item.summary, note: item.note, folderId: item.folderId, customFields: item.customFields,
    sourceRef: item.sourceRef || `${item.source} · v${item.currentVersion}`,
    industrySourceId: item.id, industrySourceVersion: item.currentVersion,
  };
}

// ACTION: 重新学习 [POST] /api/kb/assets/{id}/relearn
function relearn(id: string) { console.log('relearn knowledge asset', id); }

const HEALTH_TOOLTIPS: Record<keyof HealthBreakdown, string> = {
  quality: '质量 = 100 − 敏感词命中扣分（命中扣40） − 疑似重复扣分（命中扣20） − 有问题切片占比扣分（最多扣30）',
  timeliness: '时效 = 按"距上次更新天数 / 该时效等级的新鲜度阈值"算新鲜度比值，超阈值线性扣分',
  reuse: '复用 = 按被检索命中次数映射，0 次基础分 40，每命中一次 +12，封顶 100',
  feedback: '反馈 = 命中记录里 👍/(👍+👎) 的比例；暂无反馈记录时给基准分 75',
};

const LEVEL_LABEL: Record<string, { label: string; cls: string }> = {
  parent: { label: '父块', cls: 'bg-blue-50 text-blue-600' },
  child: { label: '子块', cls: 'bg-indigo-50 text-indigo-600' },
  qa: { label: '问答对', cls: 'bg-emerald-50 text-emerald-600' },
  row: { label: '字段行', cls: 'bg-amber-50 text-amber-600' },
};

// 小型 chip 编辑器（关键词 / 问题 / 标签 共用），点 + 号内联加一个
function ChipAdder({ items, onChange, placeholder }: { items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
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
          {v}<button className="text-gray-400 hover:text-red-500" onClick={() => onChange(items.filter((x) => x !== v))}>✕</button>
        </Badge>
      ))}
      {adding ? (
        <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()} onBlur={add}
          placeholder={placeholder} className="h-6 w-32 px-1.5 text-xs border rounded" />
      ) : (
        <button onClick={() => setAdding(true)} className="w-6 h-6 flex items-center justify-center rounded border border-dashed text-gray-400 hover:text-blue-600 hover:border-blue-400 text-sm">+</button>
      )}
    </div>
  );
}

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const platformMode = location.pathname.startsWith('/platform/industry-knowledge/');
  const resolveAsset = () => {
    if (!platformMode) return assetId ? getKnowledgeAsset(assetId) : undefined;
    const item = mockPlatformIndustryKnowledgeData.find((row) => row.id === assetId);
    return item ? platformIndustryToAsset(item) : undefined;
  };
  const found = resolveAsset();

  const [asset, setAsset] = useState<KbAsset | undefined>(found);
  const [chunks, setChunks] = useState<AssetChunk[]>(mockAssetChunks[assetId ?? ''] ?? []);
  const [chunkQuery, setChunkQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingChunk, setEditingChunk] = useState<AssetChunk | null>(null);

  useEffect(() => {
    setAsset(resolveAsset());
    setChunks(mockAssetChunks[assetId ?? ''] ?? []);
    setSelected(new Set());
    setChunkQuery('');
    setEditingChunk(null);
  }, [assetId, platformMode]);

  if (!asset) return <Navigate to={platformMode ? '/platform/industry-knowledge' : '/knowledge-config/catalog'} replace />;
  const a = asset;
  const shownStatus = effectiveStatus(a);
  const sec = SECTION_MAP[a.section];
  const appliedChunkRule = resolveChunkRule(sec, a.contentFormat);
  const rawContent = mockRawContent[a.id];
  const breakdown = a.status === 'draft' || a.status === 'learning' ? undefined : computeHealthBreakdown(a, chunks, mockCallLogs);
  const gates = evaluateGates(a, chunks);
  const gateFails = gates.filter((g) => !g.pass);

  // ACTION: 状态流转 [PATCH] /api/kb/assets/{id}/status
  function handleTransition(to: KbStatus, label: string) {
    setAsset((prev) => {
      if (!prev) return prev;
      const next: KbAsset = { ...prev, status: to };
      if (to === 'published') next.updatedAt = TODAY;
      const nextBreakdown = to === 'draft' || to === 'learning' ? undefined : computeHealthBreakdown(next, chunks, mockCallLogs);
      next.health = nextBreakdown ? computeHealth(nextBreakdown, mockHealthWeights) : 0;
      upsertKnowledgeAsset(next);
      return next;
    });
    alert(to === 'learning' ? `「${a.name}」已进入学习中；学习成功后自动转为启用` : `「${a.name}」：${label}成功`);
  }

  // ACTION: 标记答案已人工审核 [PATCH] /api/kb/assets/{id}/reviewed
  function markReviewed() {
    setAsset((prev) => {
      if (!prev) return prev;
      const next = { ...prev, reviewed: true };
      upsertKnowledgeAsset(next);
      return next;
    });
  }

  const filteredChunks = chunks.filter((c) => {
    if (chunkQuery === '') return true;
    const q = chunkQuery.toLowerCase();
    return c.text.toLowerCase().includes(q) || c.keywords.some((k) => k.toLowerCase().includes(q)) || c.tags.some((t) => t.toLowerCase().includes(q));
  });

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function batchSetEnabled(v: boolean) {
    // ACTION: 批量启用/禁用切片 [PATCH] /api/kb/assets/{id}/chunks/batch
    setChunks((prev) => prev.map((c) => (selected.has(c.id) ? { ...c, enabled: v } : c)));
    setSelected(new Set());
  }
  function batchDelete() {
    // ACTION: 批量删除切片 [DELETE] /api/kb/assets/{id}/chunks/batch
    if (!confirm(`删除选中的 ${selected.size} 个切片？`)) return;
    setChunks((prev) => prev.filter((c) => !selected.has(c.id)));
    setSelected(new Set());
  }
  function saveChunk() {
    if (!editingChunk) return;
    // ACTION: 更新解析块 [PUT] /api/kb/assets/{id}/chunks/{chunk_id}
    setChunks((prev) => prev.map((c) => (c.id === editingChunk.id ? editingChunk : c)));
    setEditingChunk(null);
  }

  const metadataGroups: { title: string; items: { label: string; node: ReactNode }[] }[] = [
    {
      title: '基础信息与来源',
      items: [
        { label: '知识名称', node: <span className="text-sm text-gray-700">{a.name}</span> },
        { label: '知识板块', node: <SectionTag k={a.section} /> },
        { label: '来源方式', node: <Badge className={`text-xs ${CONNECT_CLS[a.connect]}`}>{a.connect}</Badge> },
        ...((a.section === 'content' || a.section === 'structured') ? [{ label: '前台路由', node: <span className="text-sm text-blue-600">{a.frontendRoute ?? '未指定'}</span> }] : []),
      ],
    },
    {
      title: '业务归类',
      items: [
        { label: '所属行业', node: <span className="text-sm text-gray-700">{a.industry}</span> },
        { label: '知识库类型', node: <Badge className="text-xs bg-indigo-50 text-indigo-600">{a.knowledgeBaseType}</Badge> },
        { label: '一级分类', node: <span className="text-sm text-gray-700">{a.primaryCategory}</span> },
        { label: '二级分类', node: <span className="text-sm text-gray-700">{a.secondaryCategory || '未指定'}</span> },
      ],
    },
    {
      title: '内容属性',
      items: [
        { label: '内容形式', node: <Badge className="text-xs bg-blue-50 text-blue-600">{a.contentFormat}</Badge> },
        { label: '适用对象', node: <span className="text-sm text-gray-700">{a.audience || '未指定'}</span> },
        { label: '有效状态', node: <span className={`text-sm ${a.validityStatus === '已失效' ? 'text-red-500' : a.validityStatus === '待确认' ? 'text-amber-600' : 'text-gray-700'}`}>{a.validityStatus}</span> },
        { label: '语言', node: <span className="text-sm text-gray-700">{a.language || '未指定'}</span> },
      ],
    },
    {
      title: '组织与适用范围',
      items: [
        { label: '所属分组', node: <span className="text-sm text-gray-700">{a.groupLabel || a.folderId || '未指定'}</span> },
        { label: '适用门户网站', node: a.portalSites.length === 0 ? <span className="text-sm text-gray-400">全部门户</span> : <div className="flex gap-1 flex-wrap">{a.portalSites.map((id) => <Badge key={id} className="text-xs bg-gray-100 text-gray-600 font-normal">{mockPortalSites.find((s) => s.id === id)?.name ?? id}</Badge>)}</div> },
      ],
    },
    {
      title: '内容说明',
      items: [
        { label: '文档标签', node: a.tags.length ? <div className="flex gap-1 flex-wrap">{a.tags.map((t) => <Badge key={t} className="text-xs bg-blue-50 text-blue-600 font-normal">{t}</Badge>)}</div> : <span className="text-sm text-gray-400">未指定</span> },
        { label: '知识摘要', node: <span className="text-sm text-gray-700">{a.summary || '未指定'}</span> },
        { label: '备注', node: <span className="text-sm text-gray-700">{a.note || '未指定'}</span> },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <button className="hover:text-blue-600" onClick={() => navigate(platformMode ? '/platform/industry-knowledge' : '/knowledge-config/catalog')}>{platformMode ? '行业知识运营' : '知识资产目录'}</button>
        <span>/</span><span className="text-gray-700 truncate max-w-md">{a.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{a.name}</h2>
          <p className="text-xs text-gray-400 mt-1">健康度 <HealthValue value={a.health} /> · 创建于 {a.createdAt}（{a.createdBy}） · 最近更新 {a.updatedAt}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shownStatus !== 'learning' && <Button size="sm" variant="outline" onClick={() => navigate(platformMode ? `/platform/industry-knowledge?edit=${a.id}` : `/knowledge-config/catalog?edit=${a.id}`)}>编辑</Button>}
          {(shownStatus === 'published' || shownStatus === 'stale') && <Button size="sm" variant="outline" onClick={() => {
            relearn(a.id);
            handleTransition('learning', '重新学习');
          }}>重新学习</Button>}
          <StatusActions status={shownStatus} onTransition={handleTransition} />
        </div>
      </div>

      {/* 文档级元数据：业务归类、内容描述与处理方式分开展示 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">文档级元数据</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {metadataGroups.map((group) => (
            <div key={group.title} className="rounded-md border border-gray-100 bg-gray-50/50 p-3">
              <div className="text-sm font-medium text-gray-700 mb-3">{group.title}</div>
              <div className="grid grid-cols-4 gap-y-4 gap-x-6">
                {group.items.map((f) => (
                  <div key={f.label} className={f.label.includes('引用') ? 'col-span-2' : ''}>
                    <div className="text-xs text-gray-400">{f.label}</div>
                    <div className="mt-1 break-words">{f.node}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {mockCustomSchemaFields.length > 0 && <div className="rounded-md border border-gray-100 bg-gray-50/50 p-3">
            <div className="text-sm font-medium text-gray-700 mb-3">自定义元数据</div>
            <div className="grid grid-cols-2 gap-3">
              {mockCustomSchemaFields.map((sf) => <div key={sf.field}><div className="text-xs text-gray-400">{sf.meaning || sf.field}</div><div className="mt-1 text-sm text-gray-700">{a.customFields?.[sf.field] || '未指定'}</div></div>)}
            </div>
          </div>}
        </CardContent>
      </Card>

      {/* 更新历史 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">更新历史</CardTitle></CardHeader>
        <CardContent>
          {(mockAssetHistory[a.id] ?? [{ time: a.createdAt, actor: a.createdBy, action: '创建' }]).slice().reverse().map((h, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5 text-sm">
              <span className="text-xs text-gray-400 w-32 shrink-0">{h.time}</span>
              <span className="text-gray-700 flex-1">{h.action}</span>
              <span className="text-xs text-gray-400 shrink-0">{h.actor}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 健康度分解（架构 §6.3.1，权重可在「元数据规范」页调整） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            健康度分解
            <span className="text-xs text-gray-400 font-normal"> — 质量×{mockHealthWeights.quality}% + 时效×{mockHealthWeights.timeliness}% + 复用×{mockHealthWeights.reuse}% + 反馈×{mockHealthWeights.feedback}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!breakdown ? (
            <p className="text-sm text-gray-400 py-2">尚未评估（该知识尚未启用，学习成功并启用后进入周期性健康度评分）。</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {(Object.keys(breakdown) as (keyof HealthBreakdown)[]).map((k) => (
                <MetricBar key={k}
                  label={{ quality: '质量', timeliness: '时效', reuse: '复用', feedback: '反馈' }[k]}
                  value={breakdown[k]}
                  hint={healthSuggestion(k, breakdown[k]) ?? undefined}
                  tooltip={HEALTH_TOOLTIPS[k]}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 来源更新状态（自动机制只读展示；人工刷新统一使用“重新学习”） */}
      {a.sync && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">来源更新状态</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><div className="text-xs text-gray-400">同步方式</div><div className="mt-1 text-gray-700">{a.sync} <span className="text-gray-400">· {a.freq}</span></div></div>
              <div><div className="text-xs text-gray-400">上次同步</div><div className="mt-1 text-gray-700">{a.lastSync}</div></div>
              <div><div className="text-xs text-gray-400">下次同步</div><div className="mt-1 text-gray-700">{a.nextSync}</div></div>
              <div>
                <div className="text-xs text-gray-400">状态</div>
                <div className="mt-1">
                  <Badge className={`text-xs ${a.syncStatus === 'ok' ? 'bg-green-50 text-green-600' : a.syncStatus === 'failed' ? 'bg-red-50 text-red-500' : a.syncStatus === 'running' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {a.syncStatus === 'ok' ? '正常' : a.syncStatus === 'failed' ? '失败' : a.syncStatus === 'running' ? '同步中' : '未启用'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 内容：原文（左） + 解析切片（右，可筛选/勾选/点击编辑/批量操作） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">内容 — 原文与解析切片 {chunks.length > 0 && <span className="text-xs text-gray-400 font-normal">（共 {a.chunks} 个可检索片段，下方为抽样）</span>}</CardTitle>
          <p className="text-xs text-gray-400 font-normal mt-1">正文或附件是文档级权威内容；右侧切片是学习后生成的子对象，继承上方业务归类、有效状态、来源、权限等检索元数据。</p>
        </CardHeader>
        <CardContent>
          {a.section === 'structured' ? (
            <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3">
              <div className="text-sm text-gray-700">结构化数据按字段与数据源实时查询，不生成通用向量切片或 embedding。</div>
              <div className="mt-2 flex gap-1.5 flex-wrap">{(a.structuredFields ?? []).map((field) => <Badge key={field} className="bg-white text-amber-700 font-normal">{field}</Badge>)}</div>
              <div className="mt-2 text-xs text-gray-500">数据源：{a.sourceRef}</div>
            </div>
          ) : chunks.length === 0 ? (
            <p className="text-sm text-gray-400">尚未学习完成（解析中或失败），暂无可预览内容。</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* 左：原文 */}
              <div>
                <div className="text-xs text-gray-400 mb-1.5">原文</div>
                <div className="h-[420px] overflow-y-auto rounded border bg-gray-50 p-3 text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {rawContent ?? '该来源方式暂无原文预览（如：外部结构化字段）'}
                </div>
              </div>

              {/* 右：切片列表 */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Input value={chunkQuery} onChange={(e) => setChunkQuery(e.target.value)} placeholder="🔍 筛选切片（文本/关键词/标签）" className="h-8 text-xs flex-1" />
                  {selected.size > 0 && (
                    <div className="flex gap-1 shrink-0">
                      <span className="text-xs text-gray-400 self-center mr-1">已选 {selected.size}</span>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => batchSetEnabled(true)}>启用</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => batchSetEnabled(false)}>禁用</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-500 hover:bg-red-50" onClick={batchDelete}>删除</Button>
                    </div>
                  )}
                </div>
                <div className="h-[420px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredChunks.length === 0 && <p className="text-xs text-gray-300 py-6 text-center">无匹配切片</p>}
                  {filteredChunks.map((c) => {
                    const lv = LEVEL_LABEL[c.level];
                    const hasIssue = !!c.issues?.length;
                    return (
                      <div key={c.id}
                        className={`p-2 rounded border cursor-pointer ${hasIssue ? 'bg-amber-50 border-amber-200' : c.enabled ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}
                        onClick={() => setEditingChunk({ ...c })}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <input type="checkbox" checked={selected.has(c.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelect(c.id)} className="accent-blue-600" />
                          <Badge className={`text-[11px] ${lv.cls}`}>{lv.label}{c.parentIndex ? ` · 属父块${c.parentIndex}` : ` · #${c.index}`}</Badge>
                          <Badge className="text-[11px] bg-gray-100 text-gray-500 font-normal">{c.type}</Badge>
                          <span className="text-[11px] text-gray-400">{c.tokens} tok</span>
                          {hasIssue && <Badge className="text-[11px] bg-red-50 text-red-500 ml-auto">⚠ 问题</Badge>}
                          {!hasIssue && !c.enabled && <span className="text-[11px] text-gray-400 ml-auto">已禁用</span>}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 whitespace-pre-line">{c.text}</p>
                        {(c.keywords.length > 0 || c.questions.length > 0 || c.tags.length > 0) && (
                          <div className="flex gap-2 mt-1">
                            {c.keywords.length > 0 && <span className="text-[10px] text-gray-400">🔑 {c.keywords.length}</span>}
                            {c.questions.length > 0 && <span className="text-[10px] text-gray-400">❓ {c.questions.length}</span>}
                            {c.tags.length > 0 && <span className="text-[10px] text-gray-400">🏷 {c.tags.length}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 入库前门禁检查（架构 §6.1/§6.1.1） */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            入库前门禁检查
            {gateFails.length > 0
              ? <Badge className="text-xs bg-red-50 text-red-500">{gateFails.length} 项未通过</Badge>
              : <Badge className="text-xs bg-green-50 text-green-600">全部通过</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {gates.map((g) => (
            <div key={g.check} className="px-2.5 py-1.5 rounded border bg-white text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={g.pass ? 'text-green-600' : 'text-red-500'}>{g.pass ? '✓' : '✗'}</span>
                  <span className="text-gray-700">{g.check}</span>
                </div>
                {g.check === '答案准确性人工审核' && !g.pass && (
                  <Button size="sm" variant="outline" className="h-6 text-xs" onClick={markReviewed}>标记已人工审核</Button>
                )}
              </div>
              <div className="text-xs text-gray-400 pl-6 mt-0.5">
                {g.detail}
                {!g.pass && g.advice && <span className="text-amber-600"> · 建议：{g.advice}</span>}
              </div>
            </div>
          ))}
          {gateFails.length > 0 && (
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={() => relearn(a.id)}>去修改后重新学习</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 检索参数（只读摘要，配置入口见板块详情） */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">检索参数（来源于该知识板块的统一配置）</CardTitle>
          <button className="text-xs text-blue-600 hover:underline" onClick={() => navigate(`/knowledge-config/sections/${a.section}`)}>去调整 →</button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">分块方式</div>
              <div className="mt-1 text-gray-700">{appliedChunkRule.chunkMethod}</div>
              {/* 板块下可按内容形式配多套切片方式，这里标出这条知识实际命中的是哪一套 */}
              <div className="mt-0.5 text-[11px] text-gray-400">
                按内容形式「{appliedChunkRule.contentFormat}」{appliedChunkRule.contentFormat === GENERAL_CONTENT_FORMAT ? '（兜底）' : ''}
              </div>
            </div>
            <div><div className="text-xs text-gray-400">向量权重</div><div className="mt-1 text-gray-700">{sec.vectorWeight}</div></div>
            <div><div className="text-xs text-gray-400">相似度阈值</div><div className="mt-1 text-gray-700">{sec.threshold}</div></div>
            <div><div className="text-xs text-gray-400">Rerank</div><div className="mt-1 text-gray-700">{sec.rerank}</div></div>
          </div>
        </CardContent>
      </Card>

      {/* 来源 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">来源（回答时作为出处展示给用户）</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">📎</span>
            <span className="text-blue-600">{a.sourceRef}</span>
            <Badge className={`text-xs ${sec.retrievalCls}`}>{sec.name}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 编辑解析块弹窗 */}
      <Dialog open={!!editingChunk} onOpenChange={(o) => !o && setEditingChunk(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>编辑解析块</DialogTitle></DialogHeader>
          {editingChunk && (
            <div className="space-y-3">
              <ChunkField label="解析块">
                <Textarea value={editingChunk.text} onChange={(e) => setEditingChunk({ ...editingChunk, text: e.target.value })} rows={6} className="text-sm" />
              </ChunkField>
              <ChunkField label="Type">
                <select value={editingChunk.type} onChange={(e) => setEditingChunk({ ...editingChunk, type: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                  {CHUNK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </ChunkField>
              <ChunkField label="关键词">
                <ChipAdder items={editingChunk.keywords} onChange={(v) => setEditingChunk({ ...editingChunk, keywords: v })} placeholder="回车添加" />
              </ChunkField>
              <ChunkField label="问题（可能的提问方式，用于反向问题生成）">
                <ChipAdder items={editingChunk.questions} onChange={(v) => setEditingChunk({ ...editingChunk, questions: v })} placeholder="回车添加" />
              </ChunkField>
              <ChunkField label="标签">
                <ChipAdder items={editingChunk.tags} onChange={(v) => setEditingChunk({ ...editingChunk, tags: v })} placeholder="回车添加" />
              </ChunkField>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-gray-700">启用</span>
                <Switch checked={editingChunk.enabled} onCheckedChange={(v) => setEditingChunk({ ...editingChunk, enabled: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setEditingChunk(null)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={saveChunk}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChunkField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
