import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AUDIENCE_OPTIONS, CONTENT_FORMATS, FrontendPageItem, KbAsset, KnowledgeBaseType,
  LANGUAGE_OPTIONS, PRIMARY_CATEGORIES, SectionKey, SECTIONS,
  VALIDITY_STATUSES, mockAssets, mockBackendPageSources, mockFrontendSiteTree,
  mockIndustryLibrary, secondaryCategoriesOf, upsertKnowledgeAssets, PRIMARY_INDUSTRIES,
  mockEnterpriseIndustryConfig, enterpriseIndustryList, industryLabel,
  generalChunkRule, mockExtraChunkRules, secondaryIndustriesOf,
} from './data';

type CreateAction = 'file' | 'faq' | 'url' | 'frontend' | 'backend' | 'platform';
type MetadataDraft = {
  industry: string; secondaryIndustry: string; knowledgeBaseType: string; primaryCategory: string; secondaryCategory: string;
  contentFormat: string; audience: string; validityStatus: string; language: string;
};

const ACTIONS: Array<{ key: CreateAction; icon: string; title: string; desc: string }> = [
  { key: 'file', icon: '📤', title: '上传文件', desc: '本地文件或对象存储中的文件' },
  { key: 'faq', icon: '💬', title: '录入问答', desc: '手工录入标准问答与相似问法' },
  { key: 'url', icon: '🔗', title: '学习外部网址', desc: '抓取并持续更新外部网页' },
  { key: 'frontend', icon: '🖥️', title: '选择前台页面', desc: '按站点导航树选择已发布页面' },
  { key: 'backend', icon: '🧩', title: '选择后台页面', desc: '按应用选择已接入的数据页面' },
  { key: 'platform', icon: '🏭', title: '导入平台知识', desc: '将平台行业知识导入企业自己的行业知识库' },
];

const BOARD_RULES: Record<CreateAction, SectionKey[]> = {
  file: ['document', 'faq', 'structured', 'web'], faq: ['faq'], url: ['web', 'document'],
  frontend: ['content', 'structured'], backend: ['content', 'structured'], platform: ['industry'],
};

const BOARD_CAPABILITIES: Record<SectionKey, string> = {
  document: '沉淀说明书、制度、报告等完整文档，供智能体检索并引用文档内容。',
  faq: '批量沉淀标准问题、答案和相似问法，供智能客服精准召回统一答案。',
  structured: '接入业务字段并上传结构化问答，供智能体按字段精准查询业务信息。',
  content: '学习网站前台与后台页面内容，供智能体检索、引用并定位来源页面。',
  web: '学习外部网站的公开页面内容，供智能体检索并引用网络资料。',
  industry: '导入平台统一维护的行业资料，供智能体按行业分类检索专业内容。',
};

const mockFrontendPageSourcesData = mockFrontendSiteTree;
const mockBackendPageSourcesData = mockBackendPageSources;
const mockPlatformKnowledgeSourcesData = mockIndustryLibrary;

// ACTION: 批量创建知识草稿 [POST] /api/kb/assets/batch
function handleCreateKnowledgeDrafts(payload: KbAsset[]) { upsertKnowledgeAssets(payload); }

// ACTION: 批量创建平台行业知识草稿 [POST] /api/platform/industry-knowledge/batch
function handleCreatePlatformIndustryKnowledgeDrafts(payload: { assets: KbAsset[]; chunkRule: string }) {
  console.log('create platform industry knowledge drafts', payload);
}

const emptyMetadata = (): MetadataDraft => ({
  industry: '请选择', secondaryIndustry: '请选择', knowledgeBaseType: '请选择', primaryCategory: '未指定', secondaryCategory: '未指定',
  contentFormat: '未指定', audience: '未指定', validityStatus: '未指定', language: '未指定',
});

function compatible(mode: string, board: SectionKey) {
  return board === 'content' ? mode !== '结构化字段' : mode === '结构化字段' || mode === '页面正文+结构化字段';
}

function SelectField({ label, value, values, required, onChange }: { label: string; value: string; values: string[]; required?: boolean; onChange: (v: string) => void }) {
  return <label className="space-y-1.5 text-sm"><span className="text-gray-700">{label}{required && <b className="text-red-500 ml-1">*</b>}</span><select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{values.map((v) => <option key={v}>{v}</option>)}</select></label>;
}

export default function KnowledgeCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const platformEntry = location.pathname.startsWith('/platform/industry-knowledge/new');
  const initial = (platformEntry ? 'file' : params.get('action')) as CreateAction | null;
  const [action, setAction] = useState<CreateAction | null>(ACTIONS.some((a) => a.key === initial) ? initial : null);
  const [board, setBoard] = useState<SectionKey | null>(platformEntry ? 'industry' : initial ? BOARD_RULES[initial]?.[0] || null : null);
  const [metadata, setMetadata] = useState<MetadataDraft>(() => platformEntry ? { ...emptyMetadata(), knowledgeBaseType: '行业知识库', contentFormat: '报告', audience: '企业内部', validityStatus: '现行有效', language: '简体中文' } : emptyMetadata());
  const [selectedChunkRule, setSelectedChunkRule] = useState('通用');
  const [files, setFiles] = useState<File[]>([]);
  const [fileMode, setFileMode] = useState<'local' | 'object'>('local');
  const [objectName, setObjectName] = useState('');
  const [objectPath, setObjectPath] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [alternativeQuestions, setAlternativeQuestions] = useState('');
  const [urlText, setUrlText] = useState('');
  const [urlGroup, setUrlGroup] = useState('');
  const [pickedFrontend, setPickedFrontend] = useState<Set<string>>(new Set());
  const [pickedBackend, setPickedBackend] = useState<Set<string>>(new Set());
  const [pickedPlatform, setPickedPlatform] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['site_cn', 'app:采购招标', 'app:云资讯']));
  const [message, setMessage] = useState('');

  const boardOptions: SectionKey[] = platformEntry ? ['industry'] : action ? BOARD_RULES[action] : [];
  const visibleActions = platformEntry ? ACTIONS.filter((item) => item.key === 'file' || item.key === 'url') : ACTIONS;
  const industryChunkRules = [generalChunkRule(SECTIONS.find((item) => item.key === 'industry')!), ...(mockExtraChunkRules.industry || [])];
  const updateMeta = (key: keyof MetadataDraft, value: string) => setMetadata((m) => ({ ...m, [key]: value, ...(key === 'industry' ? { secondaryIndustry: '请选择' } : {}), ...(key === 'knowledgeBaseType' ? { primaryCategory: '未指定', secondaryCategory: '未指定' } : {}), ...(key === 'primaryCategory' ? { secondaryCategory: '未指定' } : {}) }));
  const setCreateAction = (next: CreateAction) => { setAction(next); setBoard(platformEntry ? 'industry' : BOARD_RULES[next].length === 1 ? BOARD_RULES[next][0] : null); setMessage(''); };
  const toggleExpanded = (key: string) => setExpanded((old) => { const next = new Set(old); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const togglePicked = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => setter((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const frontSites = useMemo(() => {
    const allowed = mockFrontendPageSourcesData.map((group) => ({ ...group, pages: group.pages.filter((p) => (p.board === 'content' || p.board === 'structured') && (!search || `${p.siteName}${p.navPath.join('')}${p.title}${p.route}`.toLowerCase().includes(search.toLowerCase()))) })).filter((g) => g.pages.length);
    return Array.from(new Set(allowed.map((g) => g.siteId))).map((siteId) => ({ siteId, siteName: allowed.find((g) => g.siteId === siteId)!.siteName, groups: allowed.filter((g) => g.siteId === siteId) }));
  }, [search]);
  const backendGroups = useMemo(() => Array.from(new Set(mockBackendPageSourcesData.map((p) => p.applicationName))).map((name) => ({ name, pages: mockBackendPageSourcesData.filter((p) => p.applicationName === name && (!search || `${p.applicationName}${p.pageName}${p.backendPath}`.toLowerCase().includes(search.toLowerCase()))) })).filter((g) => g.pages.length), [search]);
  const configuredIndustries = enterpriseIndustryList(mockEnterpriseIndustryConfig);
  const availablePlatformKnowledge = mockPlatformKnowledgeSourcesData;

  const commonAsset = (name: string, section: SectionKey): KbAsset => {
    const kbType = (metadata.knowledgeBaseType === '请选择' ? (section === 'industry' ? '行业知识库' : section === 'faq' ? '企业公共知识库' : '企业业务知识库') : metadata.knowledgeBaseType) as KnowledgeBaseType;
    const primary = metadata.primaryCategory === '未指定' ? PRIMARY_CATEGORIES[kbType][0] : metadata.primaryCategory;
    const secondaries = secondaryCategoriesOf(kbType, primary);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return {
      id: `kb_new_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, section, connect: action === 'frontend' ? '前台页面' : action === 'backend' || action === 'faq' ? '后台页面' : action === 'url' ? '外部网址' : action === 'platform' ? '平台' : '上传文件',
      knowledgeBaseType: kbType, industry: metadata.industry === '请选择' ? '通用' : platformEntry && metadata.secondaryIndustry !== '请选择' ? `${metadata.industry} / ${metadata.secondaryIndustry}` : metadata.industry,
      primaryCategory: primary, secondaryCategory: metadata.secondaryCategory === '未指定' ? secondaries[0] : metadata.secondaryCategory,
      contentFormat: (section === 'faq' ? '问答对' : section === 'structured' ? '结构化记录' : metadata.contentFormat === '未指定' ? '其他' : metadata.contentFormat) as KbAsset['contentFormat'],
      validityStatus: (metadata.validityStatus === '未指定' ? '待确认' : metadata.validityStatus) as KbAsset['validityStatus'],
      source: name, audience: metadata.audience === '未指定' ? '企业内部' : metadata.audience, language: metadata.language === '未指定' ? '中文' : metadata.language,
      portalSites: [], businessTag: '知识问答', scene: '通用', timeliness: section === 'structured' ? '实时' : '静态', access: '内部', status: 'draft', health: 0, chunks: 0,
      createdAt: now, updatedAt: now, createdBy: '当前用户', tags: [], sourceRef: name,
    };
  };

  const makeAssets = (): KbAsset[] => {
    if (!action || !board) return [];
    if (action === 'file') {
      const names = fileMode === 'local' ? files.map((f) => f.name) : objectName ? [objectName] : [];
      return names.map((name) => ({ ...commonAsset(name, board), sourceRef: fileMode === 'local' ? name : objectPath || name, fileSize: fileMode === 'local' ? `${Math.max(0.1, (files.find((f) => f.name === name)?.size || 0) / 1024 / 1024).toFixed(1)} MB` : undefined }));
    }
    if (action === 'faq') return question.trim() && answer.trim() ? [{ ...commonAsset(question.trim(), 'faq'), note: `答案：${answer.trim()}${alternativeQuestions.trim() ? `\n相似问法：${alternativeQuestions.trim()}` : ''}`, reviewed: false }] : [];
    if (action === 'url') return urlText.split(/\n|,/).map((v) => v.trim()).filter(Boolean).map((url) => ({ ...commonAsset(url.replace(/^https?:\/\//, '').slice(0, 60), board), siteUrl: url, sourceRef: url, groupLabel: urlGroup || undefined }));
    if (action === 'frontend') return mockFrontendPageSourcesData.flatMap((g) => g.pages).filter((p) => pickedFrontend.has(p.id) && compatible(p.sourceDataMode, board)).map((p) => ({ ...commonAsset(p.title, board), frontendPageId: p.id, frontendRoute: p.route, frontendNavPath: p.navPath.join(' / '), sourceDataMode: p.sourceDataMode, structuredFields: p.structuredFields?.map((f) => f.field), source: `${p.siteName} · ${p.title}`, sourceRef: p.route }));
    if (action === 'backend') return mockBackendPageSourcesData.filter((p) => pickedBackend.has(p.id) && compatible(p.sourceDataMode, board)).map((p) => ({ ...commonAsset(p.pageName, board), backendPageId: p.id, backendPath: p.backendPath, frontendRoute: p.frontendRoute, sourceDataMode: p.sourceDataMode, source: `${p.applicationName} · ${p.pageName}`, sourceRef: p.backendPath }));
    return availablePlatformKnowledge.filter((p) => pickedPlatform.has(p.id)).map((p) => {
      return {
        ...commonAsset(p.name, 'industry'), industry: p.industry, knowledgeBaseType: '行业知识库' as const,
        primaryCategory: p.primaryCategory, secondaryCategory: p.secondaryCategory, contentFormat: p.contentFormat,
        validityStatus: p.validityStatus, source: p.source, sourceRef: `平台行业知识 · ${p.name}`,
        industrySourceId: p.id, chunks: p.chunks, sync: '手动', freq: '不自动更新', nextSync: '—',
        note: '由平台行业知识导入，已成为企业行业知识库中的独立草稿',
      };
    });
  };

  const save = (continueCreate: boolean) => {
    const assets = makeAssets();
    if (!action) return setMessage('请先选择要做什么。');
    if (!board) return setMessage('请先选择知识板块。');
    if (action === 'platform' && !mockEnterpriseIndustryConfig.main) return setMessage('请先在知识资产目录选择企业所属行业。');
    if (action !== 'platform' && metadata.industry === '请选择') return setMessage('请选择所属行业。');
    if (platformEntry && secondaryIndustriesOf(metadata.industry).length > 0 && metadata.secondaryIndustry === '请选择') return setMessage('请选择二级行业。');
    if (!platformEntry && action !== 'platform' && metadata.knowledgeBaseType === '请选择') return setMessage('请选择知识库类型。');
    if (!assets.length) return setMessage('请完成当前来源要求的内容选择或填写。');
    if (platformEntry) handleCreatePlatformIndustryKnowledgeDrafts({ assets, chunkRule: selectedChunkRule });
    else handleCreateKnowledgeDrafts(assets);
    if (!continueCreate) return navigate(platformEntry ? '/platform/industry-knowledge' : '/knowledge-config/catalog?status=draft');
    setFiles([]); setObjectName(''); setObjectPath(''); setQuestion(''); setAnswer(''); setAlternativeQuestions(''); setUrlText(''); setPickedFrontend(new Set()); setPickedBackend(new Set()); setPickedPlatform(new Set()); setMessage(`已保存 ${assets.length} 条草稿，可继续创建。`);
  };

  const boardInfo = board ? SECTIONS.find((s) => s.key === board) : undefined;
  const existingFrontend = (p: FrontendPageItem) => mockAssets.some((a) => a.frontendPageId === p.id && a.section === board);

  return <div className="p-6 space-y-5 max-w-6xl mx-auto">
    <div className="flex items-center justify-between"><div><button className="text-sm text-blue-600 mb-2" onClick={() => navigate(platformEntry ? '/platform/industry-knowledge' : '/knowledge-config/catalog')}>{platformEntry ? '← 返回行业知识运营' : '← 返回知识资产目录'}</button><h1 className="text-2xl font-semibold">{platformEntry ? '新增平台行业知识' : '新增知识'}</h1><p className="text-sm text-gray-500 mt-1">{platformEntry ? '复用企业端新增知识的上传、元数据和校验逻辑，平台内容统一归入行业知识。' : '先选择要做什么，再选择知识归入哪个板块。不同来源保留各自的录入规则。'}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => save(false)}>保存</Button><Button onClick={() => save(true)}>保存并创建</Button></div></div>

    <div className="flex items-center gap-2 text-sm"><Badge className={action ? 'bg-blue-600' : ''}>1 选择动作</Badge><span className="text-gray-300">—</span><Badge className={board ? 'bg-blue-600' : 'bg-gray-200 text-gray-600'}>2 选择板块</Badge><span className="text-gray-300">—</span><Badge className={action && board ? 'bg-blue-600' : 'bg-gray-200 text-gray-600'}>3 添加内容</Badge></div>

    <Card><CardContent className="p-5"><h2 className="font-medium mb-3">1. 你要做什么？</h2><div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{visibleActions.map((item) => <button key={item.key} onClick={() => setCreateAction(item.key)} className={`text-left rounded-lg border p-4 transition ${action === item.key ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-blue-300'}`}><div className="flex gap-3"><span className="text-2xl">{item.icon}</span><div><div className="font-medium">{item.title}</div><div className="text-xs text-gray-500 mt-1">{item.desc}</div></div></div></button>)}</div></CardContent></Card>

    {action && <Card><CardContent className="p-5"><h2 className="font-medium mb-3">2. 归入哪个知识板块？</h2><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{boardOptions.map((key) => { const item = SECTIONS.find((s) => s.key === key)!; return <button key={key} onClick={() => { setBoard(key); setPickedFrontend(new Set()); setPickedBackend(new Set()); }} className={`rounded-lg border p-3 text-left ${board === key ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-blue-300'}`}><div className="font-medium">{item.emoji} {item.name}</div><div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.define}</div></button>; })}</div>{boardInfo && <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded p-3">{BOARD_CAPABILITIES[boardInfo.key]}</div>}</CardContent></Card>}

    {action && board && <Card><CardContent className="p-5 space-y-4"><div><h2 className="font-medium">3. 添加内容</h2><p className="text-xs text-gray-500 mt-1">只展示与当前动作、板块兼容的内容和字段。</p></div>
      {action === 'file' && <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="inline-flex rounded-md border p-1"><button className={`px-4 py-1.5 rounded text-sm ${fileMode === 'local' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setFileMode('local')}>本地上传</button><button className={`px-4 py-1.5 rounded text-sm ${fileMode === 'object' ? 'bg-blue-600 text-white' : ''}`} onClick={() => setFileMode('object')}>对象存储</button></div>{board === 'faq' && <div className="flex items-center gap-1 text-sm"><span className="text-gray-500 mr-1">下载模板</span><Button asChild size="sm" variant="ghost"><a href="/templates/问答知识导入模板.xlsx" download>XLSX</a></Button><Button asChild size="sm" variant="ghost"><a href="/templates/问答知识导入模板.csv" download>CSV</a></Button><Button asChild size="sm" variant="ghost"><a href="/templates/问答知识导入模板.json" download>JSON</a></Button><Button asChild size="sm" variant="ghost"><a href="/templates/问答知识导入模板.jsonl" download>JSONL</a></Button></div>}</div>{fileMode === 'local' ? <label className="block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"><div className="text-3xl">☁️</div><div className="font-medium mt-2">点击选择或拖拽文件到这里</div><div className="text-xs text-gray-500 mt-2">{board === 'structured' ? '支持 CSV、XLSX、JSON、JSONL；单个文件不超过 100 MB' : board === 'faq' ? '支持 XLSX、CSV、JSON、JSONL；单个文件不超过 100 MB' : '支持 PDF、DOC/DOCX、PPT/PPTX、XLS/XLSX；单个文件不超过 100 MB'}</div><input type="file" multiple className="hidden" accept={board === 'structured' ? '.csv,.xlsx,.json,.jsonl' : board === 'faq' ? '.xlsx,.csv,.json,.jsonl' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'} onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label> : <div className="grid grid-cols-2 gap-4"><label className="space-y-1 text-sm"><span>对象名称</span><Input value={objectName} onChange={(e) => setObjectName(e.target.value)} placeholder="例如：product-manual.pdf" /></label><label className="space-y-1 text-sm"><span>对象路径</span><Input value={objectPath} onChange={(e) => setObjectPath(e.target.value)} placeholder="oss://bucket/path/file.pdf" /></label></div>}{board === 'faq' && <div className="text-xs text-gray-500">模板字段：问题（必填）；答案（必填，支持富文本或普通文本）。</div>}{files.length > 0 && <div className="text-sm bg-gray-50 rounded p-3">已选择 {files.length} 个文件：{files.map((f) => f.name).join('、')}</div>}</div>}
      {action === 'faq' && <div className="space-y-4"><label className="space-y-1 text-sm block"><span>标准问题 <b className="text-red-500">*</b></span><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例如：产品支持多久退换货？" /></label><label className="space-y-1 text-sm block"><span>答案（富文本） <b className="text-red-500">*</b></span><div className="border rounded-t bg-gray-50 px-3 py-2 text-xs text-gray-500">B　I　U　• 列表　🔗 链接</div><Textarea className="rounded-t-none min-h-32" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="输入标准答案，可包含列表、链接等富文本内容" /></label><label className="space-y-1 text-sm block"><span>相似问法（选填，每行一个）</span><Textarea value={alternativeQuestions} onChange={(e) => setAlternativeQuestions(e.target.value)} placeholder={'退换货期限是多久？\n买错了可以退吗？'} /></label></div>}
      {action === 'url' && <div className="space-y-4"><label className="space-y-1 text-sm block"><span>网址 <b className="text-red-500">*</b></span><Textarea value={urlText} onChange={(e) => setUrlText(e.target.value)} placeholder={'https://example.com/page-1\nhttps://example.com/page-2'} /><span className="text-xs text-gray-500">每行一个网址，最多 100 条；仅抓取可公开访问的页面。</span></label><label className="space-y-1 text-sm block"><span>来源分组（选填）</span><Input value={urlGroup} onChange={(e) => setUrlGroup(e.target.value)} placeholder="例如：行业协会网站" /></label></div>}
      {(action === 'frontend' || action === 'backend') && <div className="space-y-3"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索站点、导航、应用或页面" />{action === 'frontend' ? <div className="border rounded-lg divide-y max-h-[440px] overflow-auto">{frontSites.map((site) => <div key={site.siteId}><button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 font-medium" onClick={() => toggleExpanded(site.siteId)}><span>{expanded.has(site.siteId) ? '▾' : '▸'}</span>🌐 {site.siteName}</button>{expanded.has(site.siteId) && site.groups.map((group) => { const groupKey = `${site.siteId}:${group.navPath.join('/')}`; return <div key={groupKey} className="pl-5"><button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700" onClick={() => toggleExpanded(groupKey)}><span>{expanded.has(groupKey) ? '▾' : '▸'}</span>📁 {group.navPath.join(' / ')}</button>{expanded.has(groupKey) && group.pages.map((p) => { const exists = existingFrontend(p); const disabled = !compatible(p.sourceDataMode, board) || exists; return <label key={p.id} className={`ml-7 flex items-start gap-3 border-l px-4 py-3 text-sm ${disabled ? 'opacity-55' : 'hover:bg-blue-50 cursor-pointer'}`}><input type="checkbox" className="mt-1" checked={pickedFrontend.has(p.id)} disabled={disabled} onChange={() => togglePicked(setPickedFrontend, p.id)} /><div className="flex-1"><div className="font-medium">{p.title} <Badge className="ml-1 bg-white text-gray-600 border">{p.sourceDataMode}</Badge> <Badge className={`ml-1 ${exists ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>{exists ? '已有' : '新增'}</Badge></div><div className="text-xs text-gray-500 mt-1">{p.route} · {p.contentSource}</div>{disabled && <div className="text-xs text-amber-600 mt-1">{exists ? '当前板块已有该页面' : `与${boardInfo?.name}不兼容`}</div>}</div></label>; })}</div>; })}</div>)}{frontSites.length === 0 && <div className="p-8 text-center text-sm text-gray-500">没有匹配的页面</div>}</div> : <div className="border rounded-lg divide-y max-h-[440px] overflow-auto">{backendGroups.map((group) => { const key = `app:${group.name}`; return <div key={key}><button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 font-medium" onClick={() => toggleExpanded(key)}><span>{expanded.has(key) ? '▾' : '▸'}</span>▦ {group.name}</button>{expanded.has(key) && group.pages.map((p) => { const exists = mockAssets.some((a) => a.backendPageId === p.id); const disabled = !compatible(p.sourceDataMode, board) || exists; return <label key={p.id} className={`flex items-center gap-3 pl-10 pr-4 py-3 text-sm ${disabled ? 'opacity-55' : 'hover:bg-blue-50 cursor-pointer'}`}><input type="checkbox" checked={pickedBackend.has(p.id)} disabled={disabled} onChange={() => togglePicked(setPickedBackend, p.id)} /><div className="flex-1"><div className="font-medium">{p.pageName} <Badge className="ml-1 bg-white text-gray-600 border">{p.sourceDataMode}</Badge> <Badge className={`ml-1 ${exists ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>{exists ? '已有' : '新增'}</Badge></div><div className="text-xs text-gray-500 mt-1">{p.backendPath} · {p.contentCount} 条 · 更新于 {p.updatedAt}</div>{exists && <div className="text-xs text-amber-600 mt-1">当前板块已有该页面</div>}</div></label>; })}</div>; })}</div>}</div>}
      {action === 'platform' && (!mockEnterpriseIndustryConfig.main ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="text-2xl">⚠️</div>
          <div className="mt-2 font-medium text-amber-800">请先选择企业所属行业</div>
          <p className="mt-1 text-sm text-amber-700">选择完成后，可以浏览并导入全部平台行业知识。</p>
          <Button className="mt-4" onClick={() => navigate('/knowledge-config/catalog?configureIndustry=1')}>去知识资产目录选择行业</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <div className="font-medium">当前行业：{configuredIndustries.map(industryLabel).join('、')}</div>
            <div className="mt-1">以下展示全部平台行业知识。导入后生成企业行业知识库中的独立草稿，不受平台版本限制，也不会自动覆盖企业内容。</div>
          </div>
          <div className="border rounded-lg divide-y max-h-[480px] overflow-auto">
            {availablePlatformKnowledge.map((item) => {
              const exists = mockAssets.some((asset) => asset.industrySourceId === item.id);
              return <div key={item.id} className={`flex gap-3 p-4 text-sm ${exists ? 'bg-gray-50' : 'hover:bg-blue-50'}`}>
                <input type="checkbox" className="mt-1" checked={pickedPlatform.has(item.id)} disabled={exists} onChange={() => togglePicked(setPickedPlatform, item.id)} />
                <div className="flex-1">
                  <div className="font-medium">{item.name} <Badge className={`ml-1 ${exists ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'}`}>{exists ? '已导入' : '可导入'}</Badge></div>
                  <div className="text-xs text-gray-500 mt-1">{item.industry} · {item.primaryCategory} / {item.secondaryCategory} · {item.source} · {item.chunks} 个切片</div>
                </div>
              </div>;
            })}
            {availablePlatformKnowledge.length === 0 && <div className="p-8 text-center text-sm text-gray-500">暂无可导入的平台行业知识</div>}
          </div>
        </div>
      ))}
    </CardContent></Card>}

    {action && board && action !== 'platform' && <Card><CardContent className="p-5"><div className="flex items-start justify-between mb-4"><div><h2 className="font-medium">元数据</h2><p className="text-xs text-gray-500 mt-1">{platformEntry ? "一级、二级行业需要选择；知识库类型固定为行业知识库，其余字段与企业端新增知识使用同一套枚举和规则。" : "所属行业、知识库类型需要用户选择；其余字段默认“未指定”，保存后由 AI 分析补全，用户填写值优先。"}</p></div><Badge className="bg-red-50 text-red-600 border border-red-100">"2 项必填"</Badge></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><SelectField required label={platformEntry ? "一级行业" : "所属行业"} value={metadata.industry} values={["请选择", ...PRIMARY_INDUSTRIES]} onChange={(v) => updateMeta("industry", v)} />{platformEntry && <SelectField required label="二级行业" value={metadata.secondaryIndustry} values={["请选择", ...secondaryIndustriesOf(metadata.industry)]} onChange={(v) => updateMeta("secondaryIndustry", v)} />}{platformEntry ? <label className="space-y-1.5 text-sm"><span className="text-gray-700">知识库类型</span><div className="flex h-9 items-center rounded-md border bg-gray-100 px-3 text-gray-600">行业知识库（平台固定）</div></label> : <SelectField required label="知识库类型" value={metadata.knowledgeBaseType} values={["请选择", "企业公共知识库", "企业业务知识库"]} onChange={(v) => updateMeta("knowledgeBaseType", v)} />}<SelectField label="一级分类" value={metadata.primaryCategory} values={['未指定', ...(metadata.knowledgeBaseType === '请选择' ? [] : PRIMARY_CATEGORIES[metadata.knowledgeBaseType as KnowledgeBaseType])]} onChange={(v) => updateMeta('primaryCategory', v)} /><SelectField label="二级分类" value={metadata.secondaryCategory} values={['未指定', ...(metadata.knowledgeBaseType === '请选择' || metadata.primaryCategory === '未指定' ? [] : secondaryCategoriesOf(metadata.knowledgeBaseType as KnowledgeBaseType, metadata.primaryCategory))]} onChange={(v) => updateMeta('secondaryCategory', v)} /><SelectField label="内容形式" value={metadata.contentFormat} values={board === 'faq' ? ['问答对'] : board === 'structured' ? ['结构化记录'] : ['未指定', ...CONTENT_FORMATS]} onChange={(v) => updateMeta('contentFormat', v)} /><SelectField label="适用对象" value={metadata.audience} values={['未指定', ...AUDIENCE_OPTIONS]} onChange={(v) => updateMeta('audience', v)} /><SelectField label="有效状态" value={metadata.validityStatus} values={['未指定', ...VALIDITY_STATUSES]} onChange={(v) => updateMeta('validityStatus', v)} /><SelectField label="语言" value={metadata.language} values={['未指定', ...LANGUAGE_OPTIONS]} onChange={(v) => updateMeta('language', v)} /></div></CardContent></Card>}

    {platformEntry && action && board && <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-medium">切片形式</h2><p className="mt-1 text-xs text-gray-500">这里只选择行业知识板块已经配置好的切片形式；解析器、块大小、清洗、质量和检索参数继续使用该规则的配置。</p></div><Badge className="bg-blue-50 text-blue-700">继承行业知识配置</Badge></div><div className="mt-4 grid grid-cols-3 gap-3">{industryChunkRules.map((rule) => <button key={rule.contentFormat} onClick={() => setSelectedChunkRule(rule.contentFormat)} className={`rounded-lg border p-3 text-left ${selectedChunkRule === rule.contentFormat ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:border-blue-300'}`}><div className="font-medium">{rule.contentFormat === '通用' ? '通用切片' : `${rule.contentFormat}切片`}</div><div className="mt-1 text-xs text-gray-500">{rule.chunkMethod} · {rule.chunkTokenSize} tokens</div><div className="mt-1 text-xs text-gray-400">{rule.pdfParser} · 自动关键词 {rule.autoKeywordCount}</div></button>)}</div></CardContent></Card>}

    {message && <div className={`rounded-md px-4 py-3 text-sm ${message.startsWith('已保存') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{message}</div>}
  </div>;
}
