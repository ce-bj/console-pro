// 知识资产目录 — 知识库配置的内容管理主战场：用户只需要传东西；想改处理方式/检索参数，去对应「知识板块」详情页
// 出处：架构 §3.5/§7.1（元数据规范作为表单字段）
import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  mockAssets, SECTIONS, SECTION_MAP, SectionKey, KbStatus, KbAsset, Timeliness, AccessLevel,
  KnowledgeBaseType, ContentFormat, ValidityStatus,
  TIMELINESS_CLS, STATUS_LABEL, BUSINESS_TAGS,
  SCENES, ACCESS_LEVELS, TIMELINESS_OPTS, mockPortalSites,
  KNOWLEDGE_BASE_TYPES, CONTENT_FORMATS, VALIDITY_STATUSES, AUDIENCE_OPTIONS, LANGUAGE_OPTIONS,
  PRIMARY_CATEGORIES, secondaryCategoriesOf,
  ConnectType, CONNECT_TYPES,
  defaultSyncForConnect, mockFrontendSiteTree, mockBackendPageSources, BackendPageSource, boardSync, syncToFreq, syncToNext, FrontendPageItem,
  effectiveStatus, mockAssetChunks, mockCallLogs, computeHealthBreakdown, computeHealth, mockHealthWeights, TODAY,
  mockCustomSchemaFields, mockBlindSpots, FRESHNESS_DAYS, daysSince,
  upsertKnowledgeAsset, upsertKnowledgeAssets, removeKnowledgeAsset,
  mockIndustryLibrary, IndustryLibraryItem, enterpriseIndustryValues,
  PRIMARY_INDUSTRIES, secondaryIndustriesOf, IndustrySelection, industryLabel, isSameIndustry,
  MAX_EXTRA_INDUSTRIES, mockEnterpriseIndustryConfig, enterpriseIndustryList,
  canChangeEnterpriseIndustries, nextIndustryChangeDate, setEnterpriseIndustries,
} from './data';
import { SectionTag, StatusActions, PageHeader } from './shared';

type Row = KbAsset & { enabled: boolean };
const toRow = (a: KbAsset): Row => ({
  ...a,
  // 旧数据按原可见权限映射到新版两档适用对象，目录内不再暴露旧枚举。
  audience: a.access === '公开' ? '所有人' : '企业内部',
  // 待更新仍继续使用上一成功学习版本，因此保留原检索开关。
  enabled: a.status === 'published' || a.status === 'stale',
});
type DocumentMetadataDraft = {
  knowledgeBaseType: KnowledgeBaseType | '';
  industry: string;
  primaryCategory: string;
  secondaryCategory: string;
  contentFormat: ContentFormat | '';
  validityStatus: ValidityStatus | '';
  audience?: string;
  language?: string;
};

type BatchExtraField = 'folderId' | 'portalSites' | 'timeliness' | 'tags';
type BatchTagMode = 'add' | 'remove' | 'replace';

const defaultDocumentMetadata = (): DocumentMetadataDraft => ({
  knowledgeBaseType: '',
  industry: '',
  primaryCategory: '',
  secondaryCategory: '',
  contentFormat: '',
  validityStatus: '',
  audience: '',
  language: '',
});

function sourceLabelOf(connect: ConnectType, section: SectionKey): string {
  if (connect === '前台页面') return section === 'structured' ? '前台结构化数据' : '企业前台网站';
  if (connect === '外部网址') return '外部网站';
  if (connect === '平台') return '平台维护内容';
  if (connect === '后台页面') return '企业后台录入';
  return connect;
}

function resolveMetadataWithAi(value: DocumentMetadataDraft, section: SectionKey): Omit<DocumentMetadataDraft, 'knowledgeBaseType' | 'contentFormat' | 'validityStatus'> & {
  knowledgeBaseType: KnowledgeBaseType; contentFormat: ContentFormat; validityStatus: ValidityStatus;
} {
  const knowledgeBaseType: KnowledgeBaseType = value.knowledgeBaseType || (section === 'faq' ? '企业公共知识库' : '企业业务知识库');
  const primaryCategory = value.primaryCategory || PRIMARY_CATEGORIES[knowledgeBaseType][0];
  const secondaryOptions = secondaryCategoriesOf(knowledgeBaseType, primaryCategory);
  return {
    ...value,
    knowledgeBaseType,
    industry: value.industry || enterpriseIndustryValues()[0] || '未指定',
    primaryCategory,
    secondaryCategory: value.secondaryCategory || secondaryOptions[0] || '',
    contentFormat: value.contentFormat || (section === 'faq' ? '问答对' : section === 'structured' ? '结构化记录' : '文章'),
    validityStatus: value.validityStatus || '现行有效',
    audience: value.audience || (section === 'faq' ? '所有人' : '企业内部'),
    language: value.language || '简体中文',
  };
}

// 新建表单默认值（用于"编辑"弹窗，也用于批量新增后单条补充元数据）
const emptyForm = (): Row => ({
  id: '', name: '', section: 'document', connect: '上传文件', ...resolveMetadataWithAi(defaultDocumentMetadata(), 'document'), source: '上传文件', portalSites: [],
  businessTag: '通用', scene: '客服', timeliness: '静态',
  access: '公开', status: 'draft', health: 0, chunks: 0,
  createdAt: new Date().toISOString().slice(0, 10), createdBy: '当前登录用户',
  updatedAt: new Date().toISOString().slice(0, 10), tags: [], sourceRef: '', enabled: false,
});

function newDraftAsset(name: string, section: SectionKey, connect: ConnectType, metadata: ReturnType<typeof resolveMetadataWithAi>, note?: string, groupLabel?: string, folderId?: string): KbAsset {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `k${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
    name, section, connect, note, groupLabel, folderId, ...metadata, source: sourceLabelOf(connect, section),
    portalSites: [], businessTag: '通用', scene: SCENES[0],
    timeliness: '静态', access: '公开', status: 'draft', health: 0, chunks: 0,
    createdAt: today, createdBy: '当前登录用户', updatedAt: today, tags: [], sourceRef: name,
  };
}

const STATUS_FILTERS: { key: 'all' | KbStatus; label: string }[] = [
  { key: 'all', label: '全部状态' },
  ...(['draft', 'published', 'archived', 'stale', 'learning'] as KbStatus[])
    .map((k) => ({ key: k, label: STATUS_LABEL[k].label })),
];

// ── DataSlot: 命中率统计（原 N5 知识库页）─────────────────────────────
const mockHitStats = { hitRate: 0.86, totalQueries: 1240, hitQueries: 1066, unansweredCount: 146 };

function CompactMetric({ label, value, sub, cls = 'text-gray-900' }: { label: string; value: ReactNode; sub?: string; cls?: string }) {
  return (
    <div className="min-w-0 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="truncate text-[11px] text-gray-500">{label}</div>
      <div className={`mt-1 truncate text-xl font-semibold ${cls}`}>{value}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-gray-400">{sub}</div>}
    </div>
  );
}

// 体检结论筛选芯片：数量直接印在筛选入口上，"筛出一批有问题的文档"一次点击即可完成
const CHECK_CHIP_TONE = {
  neutral: { idle: 'bg-gray-100 text-gray-600 hover:bg-gray-200', active: 'bg-gray-700 text-white' },
  defect: { idle: 'bg-orange-50 text-orange-700 hover:bg-orange-100', active: 'bg-orange-600 text-white' },
  signal: { idle: 'bg-amber-50 text-amber-700 hover:bg-amber-100', active: 'bg-amber-600 text-white' },
  ok: { idle: 'bg-green-50 text-green-700 hover:bg-green-100', active: 'bg-green-600 text-white' },
};
function CheckChip({ label, count, active, tone = 'neutral', onClick }: {
  label: string; count: number; active: boolean; tone?: keyof typeof CHECK_CHIP_TONE; onClick: () => void;
}) {
  const cls = CHECK_CHIP_TONE[tone];
  return (
    <button onClick={onClick} className={`rounded px-2.5 py-1 text-xs transition-colors ${active ? cls.active : cls.idle}`}>
      {label} <span className="font-semibold">{count}</span>
    </button>
  );
}

// ── DataSlot: 知识目录文件夹（原 N5 知识库页；仅起分组作用，与板块处理方式无关）──
const DEFAULT_DIRS = [
  { dirId: 'all', name: '全部内容' },
  { dirId: 'brand', name: '品牌知识' },
  { dirId: 'product', name: '产品知识' },
  { dirId: 'policy', name: '政策制度' },
  { dirId: 'faq', name: '常见问题' },
  { dirId: 'other', name: '其它知识' },
];

// ── DataSlot: 未回答问题 → 转移入库（原 N5 知识库页，知识沉淀飞轮）──────
interface UnansweredItem { qId: string; question: string; askedAt: string; count: number; }
const CURRENT_CUSTOMER = { id: 'cust_001', name: '某科技公司' };
const mockUnansweredData: UnansweredItem[] = [
  { qId: 'q1', question: 'H2C 技术相比传统技术有哪些优势特点？', askedAt: '2026-06-11', count: 7 },
  { qId: 'q2', question: '镀锌板的工艺流程是什么？', askedAt: '2026-06-10', count: 4 },
  { qId: 'q3', question: '能否支持私有化部署？', askedAt: '2026-06-09', count: 12 },
  { qId: 'q4', question: '多语言客服支持哪些语种？', askedAt: '2026-06-08', count: 3 },
];

type CheckStatus = 'useful' | 'low_reuse' | 'stale' | 'no_hit' | 'missing_route' | 'missing_fields';
const CHECK_STATUS_CONFIG: Record<CheckStatus, { label: string; cls: string; advice: string }> = {
  useful: { label: '有用', cls: 'bg-green-50 text-green-600', advice: '继续保留并参与检索' },
  low_reuse: { label: '低复用', cls: 'bg-amber-50 text-amber-600', advice: '补充推荐问或合并到高频页面' },
  stale: { label: '需更新', cls: 'bg-orange-50 text-orange-600', advice: '检查来源内容后重新学习' },
  no_hit: { label: '无命中', cls: 'bg-red-50 text-red-600', advice: '确认是否仍需参与检索' },
  missing_route: { label: '缺路由', cls: 'bg-red-50 text-red-600', advice: '补齐前台页面路由后再发布' },
  missing_fields: { label: '缺字段', cls: 'bg-purple-50 text-purple-600', advice: '补齐页面结构化字段，便于精准问答' },
};
// 体检结论分两档：硬缺陷是内容本身有问题、必须修；运营信号只说明没人用，是否处理要人工判断，不该混为一谈
const DEFECT_STATUSES: CheckStatus[] = ['stale', 'missing_route', 'missing_fields'];
const SIGNAL_STATUSES: CheckStatus[] = ['no_hit', 'low_reuse'];
// 'defect' 是聚合档：一键筛出全部硬缺陷，对应"筛出一批有问题的文档"这个主诉求
type CheckFilter = 'all' | 'defect' | CheckStatus;
type HealthFixAction = 'relearn' | 'archive' | 'edit_metadata' | 'fill_route' | 'fill_fields';
const HEALTH_FIX_CONFIG: Record<HealthFixAction, { label: string; desc: string }> = {
  relearn: { label: '重新学习', desc: '重跑解析、切片、向量和索引。' },
  archive: { label: '停用知识', desc: '停止参与检索，保留历史记录。' },
  edit_metadata: { label: '编辑元数据', desc: '补充标签、业务用途、页面信息和权限。' },
  fill_route: { label: '补齐路由', desc: '写入前台页面路由和导航路径。' },
  fill_fields: { label: '补齐字段', desc: '写入结构化字段，提升精确问答。' },
};
// 体检结论由 buildKnowledgeCheckResult 按当前资产实时算出，不落库、不需要异步任务
interface KnowledgeCheckResult {
  assetId: string;
  assetName: string;
  status: CheckStatus;
  reason: string;
  advice: string;
  healthBefore?: number;
  pageContext?: string;
  repairActions?: HealthFixAction[];
}
// 修复流水：诊断是实时的没有留存价值，真正要沉淀的是"谁在什么时候修了什么"
interface RepairLogEntry {
  id: string;
  assetId: string;
  assetName: string;
  action: HealthFixAction;
  fromStatus: CheckStatus;
  healthBefore: number;
  healthAfter: number;
  operator: string;
  at: string;
}

const mockKnowledgeAssetsData = mockAssets;
const mockFrontendSiteStructureData = mockFrontendSiteTree;
// DataSlot: 修复流水（最近一段时间的体检修复动作，供运营回看与汇报）
const mockRepairLogData: RepairLogEntry[] = [
  { id: 'fix_003', assetId: 'k5', assetName: '竞品官网监控（每日抓取）', action: 'relearn', fromStatus: 'stale', healthBefore: 55, healthAfter: 82, operator: '王运营', at: '2026-07-29 14:12' },
  { id: 'fix_002', assetId: 'k10', assetName: '旧版 GB/T 18488 标准（已替代）', action: 'archive', fromStatus: 'no_hit', healthBefore: 42, healthAfter: 42, operator: '李运营', at: '2026-07-28 09:40' },
  { id: 'fix_001', assetId: 'k4', assetName: 'KFR-35 空气滤清器图文详情', action: 'relearn', fromStatus: 'low_reuse', healthBefore: 71, healthAfter: 83, operator: '当前登录用户', at: '2026-07-24 16:05' },
];

// 知识资产操作日志：记录每条知识的启停检索历史（谁在什么时候把它启用/禁用了、执行结果如何）
interface AssetOpLog {
  id: string;
  categoryPath: string; // 业务归类路径（一级分类/二级分类），跟列表「业务归类」列对齐
  result: '执行成功' | '执行失败';
  successCount: number;
  failCount: number;
  at: string;
  action: '启用' | '禁用';
  operator: string;
}
// DataSlot: 知识资产操作日志（按资产 ID 索引，最新一条在前）
const mockAssetOpLogsData: Record<string, AssetOpLog[]> = {
  k1: [
    { id: '2026072216313205368', categoryPath: '酒店预订/客房管理', result: '执行成功', successCount: 0, failCount: 0, at: '2026-07-22 16:31:32', action: '禁用', operator: '设计师' },
    { id: '2026072216312428312', categoryPath: '酒店预订/客房管理', result: '执行成功', successCount: 0, failCount: 0, at: '2026-07-22 16:31:24', action: '启用', operator: '设计师' },
  ],
};

// ACTION: 获取知识资产列表 [GET] /api/kb/assets
function handleFetchKnowledgeAssets(params: { section?: SectionKey | 'all'; status?: KbStatus | 'all'; connect?: ConnectType | 'all'; knowledgeBaseType?: KnowledgeBaseType | 'all'; industry?: string; primaryCategory?: string; secondaryCategory?: string; contentFormat?: ContentFormat | 'all'; validityStatus?: ValidityStatus | 'all'; timeliness?: Timeliness | 'all'; audience?: string; language?: string; tag?: string; keyword?: string }) {
  console.log('fetch knowledge assets', params);
}

// ACTION: 获取前台网站结构 [GET] /api/kb/frontend-site-structure
function handleFetchFrontendSiteStructure(params: { siteIds?: string[] }) {
  console.log('fetch frontend site structure', params);
}

// ACTION: 从前台页面批量加入知识库 [POST] /api/kb/assets/from-frontend-pages
function handleCreateAssetsFromFrontendPages(pageIds: string[]) {
  console.log('create assets from frontend pages', pageIds);
}

// ACTION: 获取可接入的后台页面 [GET] /api/kb/source-pages/backend
function handleFetchBackendPageSources(params: { section: SectionKey; keyword?: string }) {
  console.log('fetch backend page sources', params);
}

// ACTION: 从后台页面批量创建知识草稿 [POST] /api/kb/assets/from-backend-pages
function handleCreateAssetsFromBackendPages(payload: { pageIds: string[]; section: SectionKey }) {
  console.log('create assets from backend pages', payload);
}

// ACTION: 更新知识资产 [PUT] /api/kb/assets/{id}
function handleUpdateKnowledgeAssetMetadata(assetId: string, form: Row) {
  console.log('update knowledge asset metadata', assetId, form);
}

// ACTION: 获取知识修复流水 [GET] /api/kb/repair-logs
function handleFetchRepairLogs(params: { assetId?: string; limit?: number }) {
  console.log('fetch repair logs', params);
}

// ACTION: 记录一次健康修复 [POST] /api/kb/repair-logs
function handleCreateRepairLog(entry: { assetId: string; action: HealthFixAction; fromStatus: CheckStatus }) {
  console.log('create repair log', entry);
}

// ACTION: 重新学习 [POST] /api/kb/assets/{id}/relearn
function handleRelearnKnowledgeAsset(assetId: string) {
  console.log('relearn knowledge asset', assetId);
}

// ACTION: 删除知识资产 [DELETE] /api/kb/assets/{id}
function handleDeleteKnowledgeAsset(assetId: string) {
  console.log('delete knowledge asset', assetId);
}

// ACTION: 批量修改知识资产 [PATCH] /api/kb/assets/batch-metadata
function handleBatchUpdateKnowledgeAssets(payload: { assetIds: string[]; fields: Record<string, unknown> }) {
  console.log('batch update knowledge assets', payload);
}

// ACTION: 批量变更知识状态 [PATCH] /api/kb/assets/batch-status
function handleBatchTransitionKnowledgeAssets(payload: { assetIds: string[]; status: KbStatus }) {
  console.log('batch transition knowledge assets', payload);
}

// ACTION: 批量重新学习 [POST] /api/kb/assets/batch-relearn
function handleBatchRelearnKnowledgeAssets(assetIds: string[]) {
  console.log('batch relearn knowledge assets', assetIds);
}

// ACTION: 批量启停检索 [PATCH] /api/kb/assets/batch-enabled
function handleBatchToggleKnowledgeAssets(payload: { assetIds: string[]; enabled: boolean }) {
  console.log('batch toggle knowledge assets', payload);
}

// ACTION: 批量删除知识资产 [DELETE] /api/kb/assets/batch
function handleBatchDeleteKnowledgeAssets(assetIds: string[]) {
  console.log('batch delete knowledge assets', assetIds);
}

// ACTION: 更新企业行业配置 [PUT] /api/kb/enterprise/industries
function handleUpdateEnterpriseIndustries(payload: { main: IndustrySelection; extras: IndustrySelection[] }) {
  setEnterpriseIndustries(payload.main, payload.extras);
}

type AddMode = null | '上传文件' | '外部网址' | '对象存储' | '手动输入' | '后台页面';
const EXTRA_BOARD_OPTS: SectionKey[] = ['document'];

// DataSlot: 企业后台已经接入的应用/数据源页面；选择开关仅代表新增为知识草稿。
const mockBackendPageSourcesData: BackendPageSource[] = mockBackendPageSources;

// 前台页面树：站点 → 导航层级（逐级） → 页面
interface PageTreeNode { key: string; label: string; children: PageTreeNode[]; pages: FrontendPageItem[]; }

function buildPageTree(pages: FrontendPageItem[]): PageTreeNode[] {
  const roots: PageTreeNode[] = [];
  const siteMap = new Map<string, PageTreeNode>();
  for (const p of pages) {
    let cur: PageTreeNode | undefined = siteMap.get(p.siteId);
    if (!cur) {
      cur = { key: p.siteId, label: p.siteName, children: [], pages: [] };
      siteMap.set(p.siteId, cur);
      roots.push(cur);
    }
    let pathKey = p.siteId;
    for (const seg of p.navPath) {
      pathKey += `/${seg}`;
      let child: PageTreeNode | undefined = cur.children.find((c) => c.key === pathKey);
      if (!child) {
        child = { key: pathKey, label: seg, children: [], pages: [] };
        cur.children.push(child);
      }
      cur = child;
    }
    cur.pages.push(p);
  }
  return roots;
}

function collectPages(node: PageTreeNode): FrontendPageItem[] {
  return [...node.pages, ...node.children.flatMap(collectPages)];
}

// 原型阶段无真实文件体积，按文件名长度生成一个稳定的示意大小
function mockFileSize(name: string): string {
  const kb = 80 + (name.length * 53) % 4000;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') as SectionKey | null);
  const initialStatus = (searchParams.get('status') as KbStatus | null);
  const [rows, setRows] = useState<Row[]>(mockAssets.map(toRow));
  const [q, setQ] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | SectionKey>(initialSection && SECTION_MAP[initialSection] ? initialSection : 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | KbStatus>(initialStatus && STATUS_LABEL[initialStatus] ? initialStatus : 'all');
  const [connectFilter, setConnectFilter] = useState<'all' | ConnectType>('all');
  const [knowledgeBaseTypeFilter, setKnowledgeBaseTypeFilter] = useState<'all' | KnowledgeBaseType>('all');
  const [industryFilter, setIndustryFilter] = useState<'all' | string>('all');
  const [primaryCategoryFilter, setPrimaryCategoryFilter] = useState<'all' | string>('all');
  const [secondaryCategoryFilter, setSecondaryCategoryFilter] = useState<'all' | string>('all');
  const [contentFormatFilter, setContentFormatFilter] = useState<'all' | ContentFormat>('all');
  const [validityStatusFilter, setValidityStatusFilter] = useState<'all' | ValidityStatus>('all');
  const [timelinessFilter, setTimelinessFilter] = useState<'all' | Timeliness>('all');
  const [audienceFilter, setAudienceFilter] = useState<'all' | string>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | string>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [dirs, setDirs] = useState(DEFAULT_DIRS);
  const [activeDir, setActiveDir] = useState('all');
  const [dirMenuOpen, setDirMenuOpen] = useState<string | null>(null);

  // 多选与批量操作
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkFilter, setCheckFilter] = useState<CheckFilter>('all');
  const [repairLogs, setRepairLogs] = useState<RepairLogEntry[]>(mockRepairLogData);
  const [repairLogOpen, setRepairLogOpen] = useState(false);
  const [activeCheckResult, setActiveCheckResult] = useState<KnowledgeCheckResult | null>(null);

  // 单条知识的操作日志（启停检索历史）
  const [opLogs, setOpLogs] = useState<Record<string, AssetOpLog[]>>(mockAssetOpLogsData);
  const [opLogAssetId, setOpLogAssetId] = useState<string | null>(null);

  // 批量修改元数据（入库时由大模型自动匹配，允许运营批量纠正；只在所选知识板块一致时可用，避免跨板块乱套字段）
  const [batchMetaOpen, setBatchMetaOpen] = useState(false);
  const [batchMeta, setBatchMeta] = useState<DocumentMetadataDraft>(defaultDocumentMetadata());
  const [batchMetaEnabled, setBatchMetaEnabled] = useState<Record<keyof DocumentMetadataDraft, boolean>>({
    knowledgeBaseType: false, industry: false, primaryCategory: false, secondaryCategory: false,
    contentFormat: false, validityStatus: false, audience: false, language: false,
  });
  const [batchExtraEnabled, setBatchExtraEnabled] = useState<Record<BatchExtraField, boolean>>({
    folderId: false, portalSites: false, timeliness: false, tags: false,
  });
  const [batchFolderId, setBatchFolderId] = useState('other');
  const [batchPortalSites, setBatchPortalSites] = useState<string[]>([]);
  const [batchTimeliness, setBatchTimeliness] = useState<Timeliness>('静态');
  const [batchTags, setBatchTags] = useState('');
  const [batchTagMode, setBatchTagMode] = useState<BatchTagMode>('add');


  // 编辑（单条完整元数据）弹窗
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Row>(emptyForm());
  const isEdit = !!form.id;

  // DataSlot 初始化：列表、前台结构和修复流水
  useEffect(() => {
    handleFetchKnowledgeAssets({ section: sectionFilter, status: statusFilter, connect: connectFilter, knowledgeBaseType: knowledgeBaseTypeFilter, industry: industryFilter, primaryCategory: primaryCategoryFilter, secondaryCategory: secondaryCategoryFilter, contentFormat: contentFormatFilter, validityStatus: validityStatusFilter, timeliness: timelinessFilter, audience: audienceFilter, language: languageFilter, tag: tagFilter, keyword: q });
    handleFetchFrontendSiteStructure({ siteIds: [] });
    handleFetchRepairLogs({ limit: 20 });
    if (searchParams.get('check') === '1') setCheckFilter('defect');
    if (searchParams.get('configureIndustry') === '1') openIndustryConfig();
    const sourceTraceId = searchParams.get('fromTrace') ?? searchParams.get('fromBlindspot');
    if (sourceTraceId && initialSection === 'faq') {
      setAddBoard('faq');
      setAddMode('手动输入');
      setQaQuestion(searchParams.get('prefillQuestion') ?? '');
      setQaAnswer(searchParams.get('prefillAnswer') ?? '');
      setAddOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 深链：详情页点击编辑后，查询参数变化时同步打开对应资产；关闭时不重复打开。
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const r = rows.find((x) => x.id === editId);
    if (r) { setForm({ ...r }); setOpen(true); }
  }, [searchParams, rows]);

  function addDir() {
    const name = prompt('新建分组名称');
    if (!name?.trim()) return;
    // ACTION: 新建知识目录分组 [POST] /api/kb/folders
    const dirId = `dir_${Date.now().toString().slice(-5)}`;
    setDirs((p) => [...p, { dirId, name: name.trim() }]);
    setActiveDir(dirId);
  }

  function renameDir(dirId: string) {
    const current = dirs.find((d) => d.dirId === dirId);
    if (!current) return;
    const name = prompt('重命名分组', current.name);
    if (!name?.trim() || name.trim() === current.name) return;
    // ACTION: 重命名知识目录分组 [PATCH] /api/kb/folders/{dirId}
    setDirs((p) => p.map((d) => (d.dirId === dirId ? { ...d, name: name.trim() } : d)));
  }

  function removeDir(dirId: string) {
    const current = dirs.find((d) => d.dirId === dirId);
    if (!current || dirId === 'all' || dirId === 'other') return;
    const affected = rows.filter((r) => (r.folderId ?? 'other') === dirId).length;
    const msg = affected > 0
      ? `确认删除分组「${current.name}」？其下 ${affected} 条知识将转入「其它知识」，知识本身不会被删除。`
      : `确认删除分组「${current.name}」？`;
    if (!confirm(msg)) return;
    // ACTION: 删除知识目录分组 [DELETE] /api/kb/folders/{dirId}
    setRows((prev) => prev.map((r) => ((r.folderId ?? 'other') === dirId ? { ...r, folderId: undefined } : r)));
    setDirs((p) => p.filter((d) => d.dirId !== dirId));
    if (activeDir === dirId) setActiveDir('all');
    setDirMenuOpen(null);
  }

  // + 新增知识：上传文件 / 外部网址 / 对象存储 / 从前台页面选择
  const [addOpen, setAddOpen] = useState(false);
  const [addBoard, setAddBoard] = useState<SectionKey>(sectionFilter !== 'all' ? sectionFilter : 'document');
  // Tab模式：根据板块类型计算默认tab
  function getDefaultTab(board: SectionKey): AddMode {
    if (board === 'faq') return '手动输入';
    if (board === 'web') return '外部网址';
    if (board === 'industry') return null; // 行业知识库无 tab，直接跳转到平台库导入
    if (board === 'content') return null; // 内容资产要接前台页面，无通用上传tab，直接跳转
    return '上传文件';
  }
  const [addMode, setAddMode] = useState<AddMode>(getDefaultTab(addBoard));
  const [files, setFiles] = useState<string[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState('');
  const [groupLabelDraft, setGroupLabelDraft] = useState('');
  const [structuredFieldsDraft, setStructuredFieldsDraft] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [bucketPath, setBucketPath] = useState('');
  const [extraBoards, setExtraBoards] = useState<SectionKey[]>([]);
  const [addMetadata, setAddMetadata] = useState<DocumentMetadataDraft>(defaultDocumentMetadata());
  const [backendPageQuery, setBackendPageQuery] = useState('');
  const [backendPagePicked, setBackendPagePicked] = useState<Set<string>>(new Set());

  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [boardChoice, setBoardChoice] = useState<Record<string, SectionKey[]>>({});
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // 从行业知识库导入（行业知识库由平台维护，企业侧仅可浏览导入）
  const [industryStatusFilter, setIndustryStatusFilter] = useState<'all' | '可导入' | '已导入'>('all');
  const [industryPrimaryFilter, setIndustryPrimaryFilter] = useState<string>('all');
  const [industrySecondaryFilter, setIndustrySecondaryFilter] = useState<string>('all');
  const [industryPicked, setIndustryPicked] = useState<Set<string>>(new Set());

  // 行业知识使用范围由知识资产目录统一维护，不再放在知识板块配置中。
  const [industryConfig, setIndustryConfig] = useState(() => ({
    ...mockEnterpriseIndustryConfig,
    main: mockEnterpriseIndustryConfig.main ? { ...mockEnterpriseIndustryConfig.main } : null,
    extras: mockEnterpriseIndustryConfig.extras.map((item) => ({ ...item })),
  }));
  const [industryConfigOpen, setIndustryConfigOpen] = useState(false);
  const [industryConfirmOpen, setIndustryConfirmOpen] = useState(false);
  const [mainIndustryDraft, setMainIndustryDraft] = useState<IndustrySelection>({ primary: '', secondary: '' });
  const [extraIndustryDrafts, setExtraIndustryDrafts] = useState<IndustrySelection[]>([]);

  // 问答知识手动输入
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');

  const industryChangeAllowed = canChangeEnterpriseIndustries(industryConfig);
  function openIndustryConfig() {
    setMainIndustryDraft(industryConfig.main ? { ...industryConfig.main } : { primary: '', secondary: '' });
    setExtraIndustryDrafts(industryConfig.extras.map((item) => ({ ...item })));
    setIndustryConfigOpen(true);
  }
  function pickIndustryPrimary(target: 'main' | number, primary: string) {
    const next: IndustrySelection = { primary, secondary: '' };
    if (target === 'main') setMainIndustryDraft(next);
    else setExtraIndustryDrafts((prev) => prev.map((item, index) => index === target ? next : item));
  }
  function pickIndustrySecondary(target: 'main' | number, secondary: string) {
    if (target === 'main') setMainIndustryDraft((prev) => ({ ...prev, secondary }));
    else setExtraIndustryDrafts((prev) => prev.map((item, index) => index === target ? { ...item, secondary } : item));
  }
  function isIndustrySelectionComplete(selection: IndustrySelection) {
    return !!selection.primary && (secondaryIndustriesOf(selection.primary).length === 0 || !!selection.secondary);
  }
  function saveIndustryConfigDraft() {
    if (!isIndustrySelectionComplete(mainIndustryDraft)) { alert('请先选择主行业的一级行业和二级行业'); return; }
    if (extraIndustryDrafts.some((item) => !isIndustrySelectionComplete(item))) { alert('请完善或删除未选择完整的额外行业'); return; }
    const all = [mainIndustryDraft, ...extraIndustryDrafts];
    if (all.some((item, index) => all.some((other, otherIndex) => index !== otherIndex && isSameIndustry(item, other)))) { alert('主行业与额外行业不能重复'); return; }
    const before = enterpriseIndustryList(industryConfig).map(industryLabel).join('|');
    const after = all.map(industryLabel).join('|');
    if (industryConfig.main && before !== after) {
      setIndustryConfigOpen(false);
      setIndustryConfirmOpen(true);
      return;
    }
    applyIndustryConfig();
  }
  function applyIndustryConfig() {
    handleUpdateEnterpriseIndustries({ main: mainIndustryDraft, extras: extraIndustryDrafts });
    setIndustryConfig({
      ...mockEnterpriseIndustryConfig,
      main: mockEnterpriseIndustryConfig.main ? { ...mockEnterpriseIndustryConfig.main } : null,
      extras: mockEnterpriseIndustryConfig.extras.map((item) => ({ ...item })),
    });
    setIndustryConfigOpen(false);
    setIndustryConfirmOpen(false);
  }

  function openEdit(r: Row) { setForm({ ...r }); setOpen(true); }
  function clearEditQuery() {
    if (!searchParams.has('edit')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    navigate({ pathname: '/knowledge-config/catalog', search: next.toString() }, { replace: true });
  }
  function closeEdit() { setOpen(false); clearEditQuery(); }
  function validateDocumentMetadata(value: DocumentMetadataDraft, title?: string) {
    if (title !== undefined && !title.trim()) return '请填写知识标题';
    if (!value.knowledgeBaseType) return '请选择知识库类型';
    if (value.knowledgeBaseType === '行业知识库' && !value.industry.trim()) return '请选择所属行业';
    if (!value.primaryCategory.trim()) return '请选择一级分类';
    if (!value.contentFormat) return '请选择内容形式';
    if (!value.validityStatus) return '请选择有效状态';
    return '';
  }
  function changeKnowledgeBaseType(value: KnowledgeBaseType | '', current: DocumentMetadataDraft, apply: (next: DocumentMetadataDraft) => void) {
    apply({ ...current, knowledgeBaseType: value, primaryCategory: '', secondaryCategory: '' });
  }
  function save() {
    const error = validateDocumentMetadata(form, form.name);
    if (error) { alert(error); return; }
    if ((form.section === 'content' || form.section === 'structured') && !form.frontendRoute?.trim()) {
      alert('内容资产和结构化数据必须填写前台路由');
      return;
    }
    const original = rows.find((r) => r.id === form.id);
    const relearnKeys: (keyof Row)[] = ['knowledgeBaseType', 'industry', 'primaryCategory', 'secondaryCategory', 'contentFormat', 'validityStatus', 'audience', 'language', 'timeliness', 'tags'];
    const needsRelearn = !!original && relearnKeys.some((key) => JSON.stringify(original[key]) !== JSON.stringify(form[key]));
    const updated: Row = {
      ...form,
      status: needsRelearn && effectiveStatus(form) === 'published' ? 'stale' : form.status,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    handleUpdateKnowledgeAssetMetadata(form.id, updated);
    upsertKnowledgeAsset(updated);
    setRows((prev) => prev.map((r) => (r.id === form.id ? updated : r)));
    closeEdit();
    if (needsRelearn && updated.status === 'stale') alert('修改已保存，该知识已进入“待更新”，请重新学习；成功后自动恢复启用。');
  }

  // ACTION: 状态流转 [PATCH] /api/kb/assets/{id}/status
  function handleFormTransition(to: KbStatus, label: string) {
    setForm((prev) => {
      const next: Row = { ...prev, status: to };
      if (to === 'published') next.updatedAt = TODAY;
      const chunks = mockAssetChunks[prev.id] ?? [];
      const breakdown = to === 'draft' || to === 'learning' ? undefined : computeHealthBreakdown(next, chunks, mockCallLogs);
      next.health = breakdown ? computeHealth(breakdown, mockHealthWeights) : 0;
      next.enabled = to === 'published';
      return next;
    });
    alert(`「${form.name}」：${label} 成功（保存后生效）`);
  }

  function openOpLog(id: string) {
    setOpLogAssetId(id);
  }

  function remove(r: Row) {
    // ACTION: 删除知识资产 [DELETE] /api/kb/assets/{id}
    if (confirm(`确认删除「${r.name}」？将清理其向量与倒排索引。`)) {
      handleDeleteKnowledgeAsset(r.id);
      removeKnowledgeAsset(r.id);
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    }
  }

  function relearn(r: Row) {
    // ACTION: 重新学习 [POST] /api/kb/assets/{id}/relearn
    handleRelearnKnowledgeAsset(r.id);
    const next: Row = { ...r, status: 'learning', enabled: false, updatedAt: TODAY };
    upsertKnowledgeAsset(next);
    setRows((prev) => prev.map((x) => (x.id === r.id ? next : x)));
    alert(`「${r.name}」已进入学习中；学习成功后自动转为启用`);
  }

  function transitionRow(r: Row, to: KbStatus, label: string) {
    const next: Row = {
      ...r,
      status: to,
      enabled: to === 'published',
      updatedAt: to === 'published' ? TODAY : r.updatedAt,
      health: to === 'draft' ? 0 : r.health,
    };
    upsertKnowledgeAsset(next);
    setRows((prev) => prev.map((x) => (x.id === r.id ? next : x)));
    alert(to === 'learning' ? `「${r.name}」已进入学习中；成功后自动转为启用` : `「${r.name}」已${label}`);
  }

  function transferUnanswered(qId: string) {
    // ACTION: 未回答转移入知识库 [POST] /api/knowledge/from-unanswered
    alert(`问题 ${qId} 已转移，待补充答案后入库（知识沉淀飞轮）`);
  }

  // 体检结论实时计算：诊断依据（健康度、命中数、路由、结构化字段）都是现成数据，随时可算，不需要预先建任务
  function checkStatusOf(r: Row): CheckStatus {
    return buildKnowledgeCheckResult(r).status;
  }
  function matchesCheckFilter(r: Row): boolean {
    if (checkFilter === 'all') return true;
    const status = checkStatusOf(r);
    return checkFilter === 'defect' ? DEFECT_STATUSES.includes(status) : status === checkFilter;
  }

  // 先按常规筛选缩小范围，体检结论作为最后一层：这样问题分布条上的数量与点开后的列表条数始终一致
  const scopedRows = rows.filter((r) =>
    (q === '' || r.name.toLowerCase().includes(q.toLowerCase())) &&
    (sectionFilter === 'all' || r.section === sectionFilter) &&
    (statusFilter === 'all' || effectiveStatus(r) === statusFilter) &&
    (connectFilter === 'all' || r.connect === connectFilter) &&
    (knowledgeBaseTypeFilter === 'all' || r.knowledgeBaseType === knowledgeBaseTypeFilter) &&
    (industryFilter === 'all' || r.industry === industryFilter) &&
    (primaryCategoryFilter === 'all' || r.primaryCategory === primaryCategoryFilter) &&
    (secondaryCategoryFilter === 'all' || r.secondaryCategory === secondaryCategoryFilter) &&
    (contentFormatFilter === 'all' || r.contentFormat === contentFormatFilter) &&
    (validityStatusFilter === 'all' || r.validityStatus === validityStatusFilter) &&
    (timelinessFilter === 'all' || r.timeliness === timelinessFilter) &&
    (audienceFilter === 'all' || r.audience === audienceFilter) &&
    (languageFilter === 'all' || r.language === languageFilter) &&
    (tagFilter.trim() === '' || r.tags.some((tag) => tag.toLowerCase().includes(tagFilter.trim().toLowerCase()))) &&
    (activeDir === 'all' || (r.folderId ?? 'other') === activeDir),
  );
  const filtered = scopedRows.filter(matchesCheckFilter);

  const checkCounts = scopedRows.reduce((acc, r) => {
    const status = checkStatusOf(r);
    acc[status] += 1;
    return acc;
  }, { useful: 0, low_reuse: 0, stale: 0, no_hit: 0, missing_route: 0, missing_fields: 0 } as Record<CheckStatus, number>);
  const defectCount = DEFECT_STATUSES.reduce((sum, s) => sum + checkCounts[s], 0);

  const existingNames = new Set(rows.map((r) => r.name));
  // 行业筛选项取数据里实际出现过的行业：原型阶段行业不作为内容门槛，下拉不能因为企业没配行业就空掉
  const industryFilterOpts = Array.from(new Set(rows.map((r) => r.industry).filter(Boolean))).sort();
  // 一级分类筛选项跟知识库类型筛选联动：选中某类型只展示该类型的一级分类，选"全部"才展示全量去重列表
  const primaryCategoryFilterOpts = knowledgeBaseTypeFilter === 'all'
    ? Array.from(new Set(Object.values(PRIMARY_CATEGORIES).flat()))
    : PRIMARY_CATEGORIES[knowledgeBaseTypeFilter];
  // 二级分类跟随知识库类型和一级分类联动；上级变化时筛选值会被清空。
  const secondaryCategoryFilterOpts = Array.from(new Set(rows
    .filter((r) => knowledgeBaseTypeFilter === 'all' || r.knowledgeBaseType === knowledgeBaseTypeFilter)
    .filter((r) => primaryCategoryFilter === 'all' || r.primaryCategory === primaryCategoryFilter)
    .map((r) => r.secondaryCategory)
    .filter(Boolean))).sort();

  const staleAssets = rows.filter((a) => {
    if (a.section === 'structured' || a.status === 'draft') return false;
    const threshold = FRESHNESS_DAYS[a.timeliness];
    return daysSince(a.updatedAt, TODAY) > threshold && a.health < 60;
  });
  const totalDocs = rows.length;
  const publishedDocs = rows.filter((a) => effectiveStatus(a) === 'published').length;
  const staleDocs = staleAssets.length;
  const lastUpdate = rows.reduce((latest, a) => (a.updatedAt > latest ? a.updatedAt : latest), '');
  const customerCallLogs = mockCallLogs.filter((l) => l.customer_id === CURRENT_CUSTOMER.id);
  const totalCalls = customerCallLogs.length;
  const hitCalls = customerCallLogs.filter((l) => l.hitBoard !== null).length;
  const recallRate = totalCalls === 0 ? 0 : Math.round((hitCalls / totalCalls) * 100);
  const customerBlindspots = mockBlindSpots
    .map((blindspot) => ({
      blindspot,
      impact: blindspot.customer_impacts.find((impact) => impact.customer_id === CURRENT_CUSTOMER.id),
    }))
    .filter((item) => item.blindspot.handling_status === 'pending' && item.impact);
  const pendingFaqCount = customerBlindspots.filter((item) => item.blindspot.suggestBoard === 'faq').length;

  // 多选操作
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((r) => r.id));
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !filteredIds.has(id))));
    } else {
      setSelectedIds((prev) => new Set([...Array.from(prev), ...filtered.map((r) => r.id)]));
    }
  }

  function selectAllAcrossPages() {
    setSelectedIds(new Set(filtered.map((r) => r.id)));
    alert(`已跨页选择当前筛选结果中的 ${filtered.length} 条知识`);
  }

  // 批量状态变更（只对状态一致的选中项可用）
  function batchTransition(to: KbStatus, label: string) {
    if (selectedIds.size === 0) return;
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));

    handleBatchTransitionKnowledgeAssets({ assetIds: selectedRows.map((r) => r.id), status: to });
    const updated = rows.map((r) => {
      if (!selectedIds.has(r.id)) return r;
      const next: Row = { ...r, status: to };
      if (to === 'published') next.updatedAt = TODAY;
      const chunks = mockAssetChunks[r.id] ?? [];
      const breakdown = to === 'draft' || to === 'learning' ? undefined : computeHealthBreakdown(next, chunks, mockCallLogs);
      next.health = breakdown ? computeHealth(breakdown, mockHealthWeights) : 0;
      next.enabled = to === 'published';
      return next;
    });
    upsertKnowledgeAssets(updated.filter((r) => selectedIds.has(r.id)));
    setRows(updated);
    setSelectedIds(new Set());
    alert(`已将 ${selectedRows.length} 条知识${label}`);
  }

  // 获取选中项共同可执行的状态变更；不同状态只返回共同合法操作。
  function getAvailableBatchActions(): { to: KbStatus; label: string }[] {
    if (selectedIds.size === 0) return [];
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));
    const statuses = new Set(selectedRows.map((r) => effectiveStatus(r)));
    if (statuses.size === 1 && statuses.has('draft')) return [{ to: 'learning', label: '启用' }];
    if (Array.from(statuses).every((status) => status === 'published' || status === 'stale')) return [{ to: 'archived', label: '停用' }];
    if (statuses.size === 1 && statuses.has('archived')) return [{ to: 'published', label: '启用' }];
    return [];
  }

  // 获取选中项所在的唯一知识板块（跨板块选择时返回 null，禁止批量改元数据）
  function getSelectedSection(): SectionKey | null {
    if (selectedIds.size === 0) return null;
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));
    const sections = new Set(selectedRows.map((r) => r.section));
    if (sections.size !== 1) return null; // 跨知识板块，不支持批量改元数据
    return Array.from(sections)[0];
  }

  function openBatchMeta() {
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));
    const common = <K extends keyof DocumentMetadataDraft>(key: K): DocumentMetadataDraft[K] => {
      const values = Array.from(new Set(selectedRows.map((r) => r[key])));
      return (values.length === 1 ? values[0] : defaultDocumentMetadata()[key]) as DocumentMetadataDraft[K];
    };
    setBatchMeta({
      knowledgeBaseType: common('knowledgeBaseType'), industry: common('industry'), primaryCategory: common('primaryCategory'),
      secondaryCategory: common('secondaryCategory'), contentFormat: common('contentFormat'), validityStatus: common('validityStatus'),
      audience: common('audience'), language: common('language'),
    });
    setBatchMetaEnabled({
      knowledgeBaseType: false, industry: false, primaryCategory: false, secondaryCategory: false,
      contentFormat: false, validityStatus: false, audience: false, language: false,
    });
    setBatchExtraEnabled({ folderId: false, portalSites: false, timeliness: false, tags: false });
    setBatchFolderId('other');
    setBatchPortalSites([]);
    setBatchTimeliness('静态');
    setBatchTags('');
    setBatchTagMode('add');
    setBatchMetaOpen(true);
  }

  function toggleBatchMetaField(key: keyof DocumentMetadataDraft) {
    setBatchMetaEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleBatchExtraField(key: BatchExtraField) {
    setBatchExtraEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // 批量修改元数据：只覆盖运营勾选启用的字段，其余字段保持每条知识原值不变
  function applyBatchMeta() {
    if (selectedIds.size === 0) return;
    const enabledKeys = (Object.keys(batchMetaEnabled) as (keyof DocumentMetadataDraft)[]).filter((k) => batchMetaEnabled[k]);
    const enabledExtraKeys = (Object.keys(batchExtraEnabled) as BatchExtraField[]).filter((k) => batchExtraEnabled[k]);
    if (enabledKeys.length === 0 && enabledExtraKeys.length === 0) { setBatchMetaOpen(false); return; }
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));
    if (batchMetaEnabled.knowledgeBaseType && !batchMeta.knowledgeBaseType) { alert('批量修改知识库类型时请选择明确值'); return; }
    if (batchMetaEnabled.primaryCategory && !batchMeta.primaryCategory) { alert('批量修改一级分类时请选择明确值'); return; }
    if (batchMetaEnabled.contentFormat && !canBatchContentFormat) { alert('跨板块或问答/结构化知识不能批量修改内容形式'); return; }

    const fields: Record<string, unknown> = {};
    enabledKeys.forEach((key) => { fields[key] = batchMeta[key]; });
    if (batchExtraEnabled.folderId) fields.folderId = batchFolderId === 'other' ? null : batchFolderId;
    if (batchExtraEnabled.portalSites) fields.portalSites = batchPortalSites;
    if (batchExtraEnabled.timeliness) fields.timeliness = batchTimeliness;
    if (batchExtraEnabled.tags) fields.tags = { mode: batchTagMode, values: batchTags.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean) };
    handleBatchUpdateKnowledgeAssets({ assetIds: selectedRows.map((r) => r.id), fields });

    const updated = rows.map((r) => {
      if (!selectedIds.has(r.id)) return r;
      const patch: Partial<DocumentMetadataDraft> = {};
      enabledKeys.forEach((k) => { patch[k] = batchMeta[k] as never; });
      const tagValues = batchTags.split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean);
      const nextTags = !batchExtraEnabled.tags ? r.tags
        : batchTagMode === 'replace' ? Array.from(new Set(tagValues))
        : batchTagMode === 'remove' ? r.tags.filter((tag) => !tagValues.includes(tag))
        : Array.from(new Set([...r.tags, ...tagValues]));
      const retrievalMetadataChanged = enabledKeys.length > 0 || batchExtraEnabled.timeliness || batchExtraEnabled.tags;
      return {
        ...r,
        ...patch,
        folderId: batchExtraEnabled.folderId ? (batchFolderId === 'other' ? undefined : batchFolderId) : r.folderId,
        portalSites: batchExtraEnabled.portalSites ? batchPortalSites : r.portalSites,
        timeliness: batchExtraEnabled.timeliness ? batchTimeliness : r.timeliness,
        tags: nextTags,
        status: retrievalMetadataChanged && effectiveStatus(r) === 'published' ? 'stale' : r.status,
      } as Row;
    });
    upsertKnowledgeAssets(updated.filter((r) => selectedIds.has(r.id)));
    setRows(updated);
    setSelectedIds(new Set());
    setBatchMetaOpen(false);
    alert(`已为 ${selectedRows.length} 条知识批量修改 ${enabledKeys.length + enabledExtraKeys.length} 个字段${enabledKeys.length > 0 || batchExtraEnabled.timeliness || batchExtraEnabled.tags ? '；启用中的知识进入待更新，请重新学习' : ''}`);
  }

  function batchRelearn() {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0 || !targets.every((r) => ['published', 'stale'].includes(effectiveStatus(r)))) return;
    handleBatchRelearnKnowledgeAssets(targets.map((r) => r.id));
    const updated = rows.map((r) => selectedIds.has(r.id)
      ? { ...r, status: 'learning' as KbStatus, enabled: false, updatedAt: TODAY }
      : r);
    upsertKnowledgeAssets(updated.filter((r) => selectedIds.has(r.id)));
    setRows(updated);
    setSelectedIds(new Set());
    alert(`已对 ${targets.length} 条知识执行重新学习；全部进入学习中，成功后自动转为启用`);
  }

  function batchDelete() {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0 || !targets.every((r) => ['draft', 'archived'].includes(effectiveStatus(r)))) return;
    if (!confirm(`确认删除选中的 ${targets.length} 条草稿/停用知识？`)) return;
    handleBatchDeleteKnowledgeAssets(targets.map((r) => r.id));
    targets.forEach((r) => removeKnowledgeAsset(r.id));
    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  }

  // ── + 新增知识 ────────────────────────────────────────────────────
  function openAdd() {
    const board = sectionFilter !== 'all' ? sectionFilter : 'document';
    setAddOpen(true);
    setAddBoard(board);
    setAddMode(getDefaultTab(board)); // 根据板块设置默认tab
    setFiles([]); setUrls([]); setUrlDraft(''); setGroupLabelDraft(''); setStructuredFieldsDraft('');
    setBucketName(''); setBucketPath(''); setExtraBoards([]); setAddMetadata(defaultDocumentMetadata());
    setBackendPageQuery(''); setBackendPagePicked(new Set());
    setQaQuestion(''); setQaAnswer('');
  }
  function closeAdd() { setAddOpen(false); setAddMode(getDefaultTab(addBoard)); }

  function finishDraftSave(count: number, continueCreating: boolean) {
    const noun = count > 1 ? `${count} 条知识` : '知识';
    if (continueCreating) {
      setFiles([]); setUrls([]); setUrlDraft(''); setBucketName(''); setBucketPath('');
      setQaQuestion(''); setQaAnswer(''); setStructuredFieldsDraft('');
      alert(`${noun}已保存为草稿，可继续创建下一批知识。`);
      return;
    }
    alert(`${noun}已保存为草稿。可筛选“草稿”，点击“全选当前筛选（跨页）”后批量发布。`);
    closeAdd();
  }

  function createFromFiles(continueCreating: boolean) {
    if (files.length === 0) { alert('请先选择文件'); return; }
    const metadata = resolveMetadataWithAi(addBoard === 'structured' ? { ...addMetadata, contentFormat: '结构化记录' as ContentFormat } : addMetadata, addBoard);
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const structuredFields = structuredFieldsDraft.split(/[,，、]/).map((t) => t.trim()).filter(Boolean);
    const news = files.map((f) => ({
      ...newDraftAsset(f, addBoard, '上传文件', metadata, undefined, undefined, folderId),
      ...(addBoard === 'structured'
        ? { sourceDataMode: '结构化字段' as const, structuredFields }
        : { fileSize: mockFileSize(f) }),
    }));
    upsertKnowledgeAssets(news);
    setRows((p) => [...news.map(toRow), ...p]);
    finishDraftSave(news.length, continueCreating);
  }

  function createFromQa(continueCreating: boolean) {
    if (!qaQuestion.trim() || !qaAnswer.trim()) { alert('请填写问题和答案'); return; }
    const metadata = resolveMetadataWithAi({ ...addMetadata, contentFormat: '问答对' }, 'faq');
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const name = qaQuestion.trim();
    const note = `答案：${qaAnswer.trim()}`;
    const asset = newDraftAsset(name, 'faq', '后台页面', metadata, note, undefined, folderId);
    upsertKnowledgeAsset(asset);
    setRows((p) => [toRow(asset), ...p]);
    finishDraftSave(1, continueCreating);
  }
  function addUrlDraft() {
    const v = urlDraft.trim();
    if (!v || urls.includes(v)) { setUrlDraft(''); return; }
    setUrls((p) => [...p, v]); setUrlDraft('');
  }
  function removeUrlDraft(i: number) { setUrls((p) => p.filter((_, idx) => idx !== i)); }
  function createFromUrls(continueCreating: boolean) {
    if (urls.length === 0) { alert('请至少添加一个网址'); return; }
    const metadata = resolveMetadataWithAi(addMetadata, addBoard);
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const { sync, freq } = defaultSyncForConnect('外部网址', addBoard);
    const news: KbAsset[] = urls.map((u) => ({
      ...newDraftAsset(u, addBoard, '外部网址', metadata, undefined, groupLabelDraft || undefined, folderId),
      status: 'draft' as KbStatus, sync, freq, lastSync: '刚刚', nextSync: syncToNext(sync), syncStatus: 'ok', siteUrl: u,
    }));
    upsertKnowledgeAssets(news);
    setRows((p) => [...news.map(toRow), ...p]);
    finishDraftSave(news.length, continueCreating);
  }
  function createFromBucket(continueCreating: boolean) {
    if (!bucketName.trim() || !bucketPath.trim()) { alert('请填写名称与 Bucket 路径'); return; }
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const boards = [addBoard, ...extraBoards.filter((b) => b !== addBoard)];
    const news: KbAsset[] = boards.map((board) => {
      const metadata = resolveMetadataWithAi(addMetadata, board);
      const { sync, freq } = defaultSyncForConnect('上传文件', board);
      return {
        ...newDraftAsset(bucketName, board, '上传文件', metadata, undefined, groupLabelDraft || undefined, folderId),
        status: 'draft', sync, freq, lastSync: '刚刚', nextSync: syncToNext(sync), syncStatus: 'ok', sourceRef: bucketPath,
      };
    });
    upsertKnowledgeAssets(news);
    setRows((p) => [...news.map(toRow), ...p]);
    finishDraftSave(news.length, continueCreating);
  }

  const backendPageRows = mockBackendPageSourcesData.filter((page) => {
    const keyword = backendPageQuery.trim().toLowerCase();
    if (!keyword) return true;
    return `${page.applicationName} ${page.pageName} ${page.backendPath} ${page.frontendRoute}`.toLowerCase().includes(keyword);
  });

  function changeBackendPageQuery(value: string) {
    setBackendPageQuery(value);
    handleFetchBackendPageSources({ section: addBoard, keyword: value });
  }

  function toggleBackendPage(pageId: string) {
    setBackendPagePicked((prev) => {
      const next = new Set(prev);
      next.has(pageId) ? next.delete(pageId) : next.add(pageId);
      return next;
    });
  }

  function backendPageRestriction(page: BackendPageSource): string {
    if (rows.some((row) => row.backendPageId === page.id && row.section === addBoard)) return '已加入';
    if (addBoard === 'content' && page.sourceDataMode === '结构化字段') return '仅支持结构化数据';
    if (addBoard === 'structured' && page.sourceDataMode === '页面正文') return '仅支持内容资产';
    return '';
  }

  function createFromBackendPages(continueCreating: boolean) {
    const chosen = mockBackendPageSourcesData.filter((page) => backendPagePicked.has(page.id) && !backendPageRestriction(page));
    if (chosen.length === 0) { alert('请至少选择一个后台页面'); return; }
    if (addBoard !== 'content' && addBoard !== 'structured') { alert('后台页面仅支持新增到内容资产或结构化数据'); return; }
    handleCreateAssetsFromBackendPages({ pageIds: chosen.map((page) => page.id), section: addBoard });
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const metadata = resolveMetadataWithAi({
      ...addMetadata,
      contentFormat: addBoard === 'structured' ? '结构化记录' : addMetadata.contentFormat,
    }, addBoard);
    const news: KbAsset[] = chosen.map((page) => ({
      ...newDraftAsset(`${page.applicationName} / ${page.pageName}`, addBoard, '后台页面', metadata, undefined, undefined, folderId),
      backendPageId: page.id,
      backendPath: page.backendPath,
      frontendRoute: page.frontendRoute,
      frontendNavPath: `${page.applicationName} / ${page.pageName}`,
      sourceDataMode: page.sourceDataMode,
      structuredFields: page.sourceDataMode === '结构化字段' || page.sourceDataMode === '页面正文+结构化字段' ? ['title', 'content', 'updated_at'] : [],
      sourceRef: `后台数据源 ${page.backendPath} · 前台路由 ${page.frontendRoute}`,
      status: 'draft',
    }));
    upsertKnowledgeAssets(news);
    setRows((prev) => [...news.map(toRow), ...prev]);
    if (continueCreating) setBackendPagePicked(new Set());
    finishDraftSave(news.length, continueCreating);
  }

  function renderBackendPageSelector() {
    return (
      <div className="space-y-3 text-left">
        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          开关表示把该后台页面新增为知识草稿。学习、自动更新和是否参与检索沿用知识资产原有流程，不在这里重复配置。
        </div>
        <Input value={backendPageQuery} onChange={(e) => changeBackendPageQuery(e.target.value)} placeholder="搜索应用、页面或数据来源" />
        <div className="max-h-[32vh] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>应用/数据源</TableHead><TableHead>内容范围</TableHead><TableHead>来源标识</TableHead><TableHead>前台路由</TableHead><TableHead>内容数</TableHead><TableHead className="text-right">加入知识库</TableHead></TableRow></TableHeader>
            <TableBody>
              {backendPageRows.map((page) => (
                <TableRow key={page.id} className={backendPageRestriction(page) ? 'bg-gray-50 opacity-60' : ''}>
                  <TableCell className="text-sm font-medium">{page.applicationName}</TableCell>
                  <TableCell className="text-sm">{page.pageName}</TableCell>
                  <TableCell className="text-xs text-gray-500">{page.backendPath}</TableCell>
                  <TableCell className="text-xs text-blue-600">{page.frontendRoute}</TableCell>
                  <TableCell className="text-xs text-gray-500">{page.contentCount}</TableCell>
                  <TableCell className="text-right">
                    {backendPageRestriction(page)
                      ? <span className="text-xs text-gray-400">{backendPageRestriction(page)}</span>
                      : <Switch checked={backendPagePicked.has(page.id)} onCheckedChange={() => toggleBackendPage(page.id)} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-xs text-gray-400">已选择 {backendPagePicked.size} 个后台页面</div>
      </div>
    );
  }

  // ── 从前台页面选择：仅面向内容资产/结构化数据两个板块的页面，可同时勾选两个归属 ──
  const frontendPagesAll = mockFrontendSiteTree.flatMap((g) => g.pages).filter((it) => it.board === 'content' || it.board === 'structured');
  const pageTree = buildPageTree(frontendPagesAll);
  const addedFrontendPageIds = new Set(rows.map((r) => r.frontendPageId).filter((id): id is string => Boolean(id)));
  function pageIsAdded(it: FrontendPageItem) {
    return addedFrontendPageIds.has(it.id) || existingNames.has(`${it.navPath.join(' / ')} · ${it.title}`);
  }
  function pickableCount(node: PageTreeNode): { total: number; pickedCount: number } {
    let total = 0;
    let pickedCount = 0;
    for (const p of node.pages) {
      if (pageIsAdded(p)) continue;
      total += 1;
      if (picked.has(p.id)) pickedCount += 1;
    }
    for (const c of node.children) {
      const r = pickableCount(c);
      total += r.total;
      pickedCount += r.pickedCount;
    }
    return { total, pickedCount };
  }
  function toggleSubtree(node: PageTreeNode) {
    const pages = collectPages(node).filter((p) => !pageIsAdded(p));
    if (pages.length === 0) return;
    const allPicked = pages.every((p) => picked.has(p.id));
    setPicked((prev) => {
      const next = new Set(prev);
      pages.forEach((p) => (allPicked ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }
  function toggleCollapse(key: string) {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function togglePick(key: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  function confirmFrontendPages() {
    // ACTION: 从前台页面批量加入知识库 [POST] /api/kb/assets/from-frontend-pages
    const chosen = frontendPagesAll.filter((it) => picked.has(it.id) && !pageIsAdded(it));
    handleCreateAssetsFromFrontendPages(chosen.map((it) => it.id));
    if (chosen.length > 0) {
      const folderId = activeDir !== 'all' ? activeDir : undefined;
      const news: KbAsset[] = chosen.flatMap((it) => {
        const key = `${it.navPath.join(' / ')} · ${it.title}`;
        const boards = boardChoice[key]?.length ? boardChoice[key] : [it.board];
        return boards.map((board) => {
          const isStructured = board === 'structured';
          const sync = boardSync(board);
          const freq = syncToFreq(sync);
          const metadata = resolveMetadataWithAi({ ...addMetadata, contentFormat: isStructured ? '结构化记录' : addMetadata.contentFormat }, board);
          return {
            ...newDraftAsset(key, board, '前台页面', metadata, undefined, undefined, folderId),
            source: it.siteName,
            status: 'draft', health: 0,
            sync, freq, lastSync: sync === '手动' ? '—' : '刚刚', nextSync: syncToNext(sync, isStructured), syncStatus: 'ok',
            frontendPageId: it.id,
            frontendRoute: it.route,
            frontendNavPath: it.navPath.join(' / '),
            sourceDataMode: it.sourceDataMode,
            structuredFields: it.structuredFields?.map((f) => f.field) ?? [],
            portalSites: [it.siteId],
            sourceRef: `前台页面 ${it.route} · ${it.contentSource}`,
          };
        });
      });
      upsertKnowledgeAssets(news);
      setRows((p) => [...news.map(toRow), ...p]);
    }
    setPicked(new Set());
    setBoardChoice({});
    setPagePickerOpen(false);
  }

  function togglePageBoard(key: string, defaultBoard: SectionKey, board: SectionKey) {
    setBoardChoice((prev) => {
      const current = prev[key]?.length ? prev[key] : [defaultBoard];
      const next = current.includes(board) ? current.filter((b) => b !== board) : [...current, board];
      return { ...prev, [key]: next.length ? next : [defaultBoard] };
    });
  }

  function renderPageRow(it: FrontendPageItem, depth: number) {
    const key = `${it.navPath.join(' / ')} · ${it.title}`;
    const added = pageIsAdded(it);
    const checked = added || picked.has(it.id);
    const selectedBoards = boardChoice[key]?.length ? boardChoice[key] : [it.board];
    return (
      <div key={it.id} className={`grid grid-cols-[24px_1.6fr_1fr_160px] gap-3 items-center px-3 py-2 border-b last:border-b-0 ${added ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`} style={{ paddingLeft: depth * 16 + 12 }}>
        <input type="checkbox" checked={checked} disabled={added} onChange={() => togglePick(it.id)} className="accent-blue-600" />
        <div className="min-w-0">
          <div className="text-sm text-gray-800 truncate">{it.title}</div>
          <div className="text-[11px] text-gray-400 truncate">{it.contentSource}</div>
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge className="text-xs bg-gray-100 text-gray-600">{it.pageType}</Badge>
          <Badge className="text-xs bg-blue-50 text-blue-600">{it.sourceDataMode}</Badge>
          {(it.structuredFields?.length ?? 0) > 0 && <Badge className="text-xs bg-amber-50 text-amber-600">{it.structuredFields?.length} 字段</Badge>}
        </div>
        {!added ? (
          <div className="flex flex-col gap-0.5 text-xs text-gray-600">
            {(['content', 'structured'] as SectionKey[]).map((b) => (
              <label key={b} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={selectedBoards.includes(b)} onChange={() => togglePageBoard(key, it.board, b)} className="accent-blue-600" />
                {SECTION_MAP[b].name}
              </label>
            ))}
          </div>
        ) : <span className="text-xs text-gray-400 text-right">已添加</span>}
      </div>
    );
  }

  function renderTreeNode(node: PageTreeNode, depth: number) {
    const collapsed = collapsedNodes.has(node.key);
    const { total, pickedCount } = pickableCount(node);
    const status: 'all' | 'none' | 'partial' = total === 0 ? 'none' : pickedCount === total ? 'all' : pickedCount === 0 ? 'none' : 'partial';
    return (
      <div key={node.key} className="border-b last:border-b-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50" style={{ paddingLeft: depth * 16 + 12 }}>
          <button type="button" onClick={() => toggleCollapse(node.key)} className="w-4 text-xs text-gray-400 shrink-0">
            {collapsed ? '▶' : '▼'}
          </button>
          <input
            type="checkbox"
            ref={(el) => { if (el) el.indeterminate = status === 'partial'; }}
            checked={status === 'all'}
            disabled={total === 0}
            onChange={() => toggleSubtree(node)}
            className="accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">{node.label}</span>
          <span className="text-xs text-gray-400">({pickedCount}/{total})</span>
        </div>
        {!collapsed && (
          <div>
            {node.children.map((c) => renderTreeNode(c, depth + 1))}
            {node.pages.map((it) => renderPageRow(it, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  // 企业选择行业后可浏览全部平台行业知识，不再按主行业和额外行业限制列表。
  const industryLibraryByIndustry = mockIndustryLibrary;
  function getIndustryItemStatus(item: IndustryLibraryItem): '可导入' | '已导入' {
    const importedAsset = rows.find((r) => r.industrySourceId === item.id);
    return importedAsset ? '已导入' : '可导入';
  }
  const industryPrimaryOpts = Array.from(new Set(industryLibraryByIndustry.map((it) => it.primaryCategory)));
  const industrySecondaryOpts = Array.from(new Set(industryLibraryByIndustry
    .filter((it) => industryPrimaryFilter === 'all' || it.primaryCategory === industryPrimaryFilter)
    .map((it) => it.secondaryCategory).filter(Boolean)));
  const industryLibraryFiltered = industryLibraryByIndustry.filter((it) =>
    (industryStatusFilter === 'all' || getIndustryItemStatus(it) === industryStatusFilter) &&
    (industryPrimaryFilter === 'all' || it.primaryCategory === industryPrimaryFilter) &&
    (industrySecondaryFilter === 'all' || it.secondaryCategory === industrySecondaryFilter));
  function toggleIndustryPick(id: string) {
    setIndustryPicked((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function confirmIndustryImport() {
    // ACTION: 从行业知识库导入 [POST] /api/kb/assets/from-industry-library
    const chosen = industryLibraryFiltered.filter((it) => industryPicked.has(it.id));
    const folderId = activeDir !== 'all' ? activeDir : undefined;
    const news: KbAsset[] = [];
    chosen.forEach((item) => {
      const metadata = resolveMetadataWithAi({
        knowledgeBaseType: '行业知识库', industry: item.industry, primaryCategory: item.primaryCategory,
        secondaryCategory: item.secondaryCategory, contentFormat: item.contentFormat, validityStatus: item.validityStatus,
        audience: '企业内部', language: item.language,
      }, 'industry');
      const existing = rows.find((r) => r.industrySourceId === item.id);
      if (!existing) {
        news.push({
          ...newDraftAsset(item.name, 'industry', '平台', metadata, undefined, undefined, folderId),
          source: item.source,
          industrySourceId: item.id, chunks: item.chunks, sync: '手动', freq: '不自动更新', nextSync: '—',
          status: 'draft', sourceRef: `平台行业知识 · ${item.name}`,
          note: '由平台行业知识导入，已成为企业行业知识库中的独立草稿',
        });
      }
    });
    if (news.length) { upsertKnowledgeAssets(news); setRows((p) => [...news.map(toRow), ...p]); }
    setIndustryPicked(new Set());
    closeAdd();
  }

  function buildKnowledgeCheckResult(r: Row): KnowledgeCheckResult {
    const hitCount = mockCallLogs.filter((l) => l.assetId === r.id).length;
    const pageContext = r.frontendRoute ? `${r.frontendNavPath ?? '前台页面'} · ${r.frontendRoute}` : (r.connect === '前台页面' ? '前台页面缺少路由' : r.sourceRef || r.connect);
    const base = { assetId: r.id, assetName: r.name, healthBefore: r.health, pageContext };
    if (r.connect === '前台页面' && !r.frontendRoute) {
      return { ...base, status: 'missing_route', reason: '缺少前台页面路由，无法判断用户问题属于哪个页面', advice: CHECK_STATUS_CONFIG.missing_route.advice, repairActions: ['fill_route', 'edit_metadata', 'relearn'] };
    }
    if ((r.section === 'structured' || r.sourceDataMode === '结构化字段' || r.sourceDataMode === '页面正文+结构化字段') && (r.structuredFields?.length ?? 0) === 0) {
      return { ...base, status: 'missing_fields', reason: '页面数据需要按字段保存，但当前没有结构化字段', advice: CHECK_STATUS_CONFIG.missing_fields.advice, repairActions: ['fill_fields', 'edit_metadata', 'relearn'] };
    }
    if (effectiveStatus(r) === 'stale' || r.health < 60) {
      return { ...base, status: 'stale', reason: `健康度 ${r.health || '—'}，或已超过时效要求`, advice: CHECK_STATUS_CONFIG.stale.advice, repairActions: ['relearn'] };
    }
    if (hitCount === 0) {
      return { ...base, status: 'no_hit', reason: '近期对话没有命中该知识', advice: CHECK_STATUS_CONFIG.no_hit.advice, repairActions: ['edit_metadata', 'relearn', 'archive'] };
    }
    if (hitCount <= 1 || r.health < 75) {
      return { ...base, status: 'low_reuse', reason: `近期命中 ${hitCount} 次，复用不足`, advice: CHECK_STATUS_CONFIG.low_reuse.advice, repairActions: ['edit_metadata', 'relearn'] };
    }
    return { ...base, status: 'useful', reason: `近期命中 ${hitCount} 次，健康度 ${r.health}`, advice: CHECK_STATUS_CONFIG.useful.advice, repairActions: ['relearn'] };
  }

  function viewCheckResult(r: Row) {
    setActiveCheckResult(buildKnowledgeCheckResult(r));
  }

  // 修复动作的实际改动，单条与批量共用
  function computeFixedRow(current: Row, action: HealthFixAction): Row {
    let next: Row = { ...current, updatedAt: TODAY };
    if (action === 'fill_route') {
      next = {
        ...next,
        frontendRoute: next.frontendRoute || `/pages/${next.id}`,
        frontendNavPath: next.frontendNavPath || '前台页面 / 待确认页面',
        sourceDataMode: next.sourceDataMode || '页面正文',
        health: Math.max(next.health, 72),
      };
      handleUpdateKnowledgeAssetMetadata(next.id, next);
    }
    if (action === 'fill_fields') {
      next = {
        ...next,
        structuredFields: next.structuredFields?.length ? next.structuredFields : ['title', 'summary', 'content', 'updated_at'],
        sourceDataMode: next.sourceDataMode || '页面正文+结构化字段',
        health: Math.max(next.health, 78),
      };
      handleUpdateKnowledgeAssetMetadata(next.id, next);
    }
    if (action === 'relearn') {
      handleRelearnKnowledgeAsset(next.id);
      next = { ...next, status: 'published', enabled: true, health: Math.min(100, Math.max(next.health + 12, 80)) };
    }
    if (action === 'archive') {
      next = { ...next, status: 'archived', enabled: false };
    }
    return next;
  }

  function logRepair(before: Row, after: Row, action: HealthFixAction) {
    const fromStatus = buildKnowledgeCheckResult(before).status;
    handleCreateRepairLog({ assetId: before.id, action, fromStatus });
    setRepairLogs((prev) => [{
      id: `fix_${Date.now().toString().slice(-6)}${prev.length}`,
      assetId: before.id, assetName: before.name, action, fromStatus,
      healthBefore: before.health, healthAfter: after.health,
      operator: '当前登录用户', at: '刚刚',
    }, ...prev]);
  }

  function applyHealthFix(assetId: string, action: HealthFixAction) {
    const current = rows.find((r) => r.id === assetId);
    if (!current) return;
    if (action === 'edit_metadata') {
      openEdit(current);
      setActiveCheckResult(null);
      return;
    }
    const next = computeFixedRow(current, action);
    logRepair(current, next, action);
    upsertKnowledgeAsset(next);
    setRows((prev) => prev.map((r) => (r.id === assetId ? next : r)));
    // 结论实时重算，但保留进入弹窗时的健康度作为对照，让这次修复的效果可见
    setActiveCheckResult((prev) => ({ ...buildKnowledgeCheckResult(next), healthBefore: prev?.healthBefore ?? current.health }));
  }

  // 批量修复：只在所选知识体检结论一致时给动作，避免把不同性质的问题按同一种方式处理
  function getBatchFixActions(): HealthFixAction[] {
    if (selectedIds.size === 0) return [];
    const results = rows.filter((r) => selectedIds.has(r.id)).map(buildKnowledgeCheckResult);
    if (results.length === 0) return [];
    if (new Set(results.map((x) => x.status)).size !== 1) return [];
    // 取交集；编辑元数据是逐条操作，不进批量。
    return (results[0].repairActions ?? []).filter((action) => action !== 'edit_metadata'
      && results.every((x) => (x.repairActions ?? []).includes(action)));
  }

  function batchApplyHealthFix(action: HealthFixAction) {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    if (targets.length === 0) return;
    const label = HEALTH_FIX_CONFIG[action].label;
    if (!confirm(`确认对 ${targets.length} 条知识执行「${label}」？`)) return;
    const fixedById = new Map(targets.map((r) => [r.id, computeFixedRow(r, action)]));
    targets.forEach((before) => logRepair(before, fixedById.get(before.id)!, action));
    upsertKnowledgeAssets(Array.from(fixedById.values()));
    setRows((prev) => prev.map((r) => fixedById.get(r.id) ?? r));
    setSelectedIds(new Set());
    alert(`已对 ${targets.length} 条知识执行「${label}」`);
  }

  const activeCheckAsset = activeCheckResult ? rows.find((r) => r.id === activeCheckResult.assetId) : undefined;
  const activeCheckConfig = activeCheckResult ? CHECK_STATUS_CONFIG[activeCheckResult.status] : undefined;
  const activeRepairActions = activeCheckResult?.repairActions ?? [];
  const batchFixActions = getBatchFixActions();
  const selectedRowsForActions = rows.filter((r) => selectedIds.has(r.id));
  const selectedLifecycleStatuses = new Set(selectedRowsForActions.map((r) => effectiveStatus(r)));
  const canBatchRelearn = selectedRowsForActions.length > 0 && selectedRowsForActions.every((r) => ['published', 'stale'].includes(effectiveStatus(r)));
  const canBatchDelete = selectedRowsForActions.length > 0 && selectedRowsForActions.every((r) => ['draft', 'archived'].includes(effectiveStatus(r)));
  const canBatchContentFormat = !!getSelectedSection() && !['faq', 'structured'].includes(getSelectedSection()!);

  // 按知识板块 Tab 决定列表列的显隐："全部" Tab 保持统一列集；6 个板块 Tab 各自裁剪掉无意义的列
  const emptyColSpan = 16;

  return (
    <div className="space-y-4">
      <PageHeader
        title="知识资产目录"
        desc="全门户全板块的内容管理主战场——上传/新增内容、选择前台页面入库、做知识健康体检都在这里。前台页面会带入路由、导航路径、页面数据类型和结构化字段，让用户提问时能定位到具体页面信息。"
        actions={
          <div className="flex gap-2">
            <Button size="sm" className="bg-blue-600" onClick={() => navigate('/knowledge-config/catalog/new')}>+ 新增知识</Button>
          </div>
        }
      />

      <Card className={industryConfig.main ? 'border-blue-100 bg-blue-50/30' : 'border-amber-200 bg-amber-50/40'}>
        <CardHeader className="pb-2 flex-row items-start justify-between">
          <div>
            <CardTitle className="text-sm">行业知识使用范围</CardTitle>
            <p className="mt-1 text-xs text-gray-500">企业选择的行业决定可查看、导入和持续接收更新的平台行业知识。</p>
          </div>
          <div className="text-right">
            <Button size="sm" variant="outline" disabled={!industryChangeAllowed} onClick={openIndustryConfig}>{industryConfig.main ? '更改行业' : '选择行业'}</Button>
            {!industryChangeAllowed && <div className="mt-1 text-[11px] text-gray-400">下次可更改：{nextIndustryChangeDate(industryConfig)}</div>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {industryConfig.main ? (
            <div className="flex flex-wrap gap-2"><Badge className="bg-blue-600 text-white">主行业：{industryLabel(industryConfig.main)}</Badge>{industryConfig.extras.map((item) => <Badge key={industryLabel(item)} className="bg-white text-gray-600 border">额外行业：{industryLabel(item)}</Badge>)}</div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-white px-4 py-3 text-sm text-amber-700">尚未选择行业。新增平台行业知识时将提醒先选择行业。</div>
          )}
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="rounded border bg-white p-2"><div className="font-medium text-gray-700">可见范围</div><div className="mt-1">仅展示与主行业、额外行业匹配的平台行业知识。</div></div>
            <div className="rounded border bg-white p-2"><div className="font-medium text-gray-700">导入规则</div><div className="mt-1">导入后成为企业行业知识库中的独立知识，不受平台版本限制。</div></div>
            <div className="rounded border bg-white p-2"><div className="font-medium text-gray-700">更改规则</div><div className="mt-1">更改后保留已导入知识，原行业知识停止接收后续更新。</div></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex-row items-start justify-between">
          <div>
            <CardTitle className="text-sm">知识库概览</CardTitle>
            <p className="mt-0.5 text-xs text-gray-500">{CURRENT_CUSTOMER.name} · 内容库存、检索命中与前台问答效果合并查看。</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setRepairLogOpen(true)}>修复流水 {repairLogs.length}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="mb-2 text-[11px] font-medium text-gray-400">内容库存</div>
            <div className="grid grid-cols-4 gap-2">
              <CompactMetric label="文档总数" value={totalDocs} sub={`启用 ${publishedDocs} 篇`} />
              <CompactMetric label="过期文档数" value={staleDocs} sub="健康度 < 60" cls="text-orange-600" />
              <CompactMetric label="最近更新时间" value={lastUpdate} cls="text-blue-600" />
              <CompactMetric label="待补 FAQ" value={pendingFaqCount} cls="text-amber-600" />
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-medium text-gray-400">前台问答效果</div>
            <div className="grid grid-cols-4 gap-2">
              <CompactMetric label="知识库召回率" value={`${recallRate}%`} sub="命中知识轮次 / 对话轮次" cls="text-green-600" />
              <CompactMetric label="总检索次数" value={mockHitStats.totalQueries} />
              <CompactMetric label="命中次数" value={mockHitStats.hitQueries} cls="text-blue-600" />
              <CompactMetric label="未回答" value={mockHitStats.unansweredCount} cls="text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 知识健康体检：结论实时算出，点一下就筛出这批文档，勾选后批量修 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">知识健康体检</CardTitle>
          <p className="mt-0.5 text-xs text-gray-500">体检结论按当前内容实时判定。点下方任一结论即可筛出这批知识，勾选后批量修复；结论口径随上方筛选条件同步。</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1.5 flex-wrap">
            <CheckChip active={checkFilter === 'all'} label="全部" count={scopedRows.length} onClick={() => setCheckFilter('all')} />
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <span className="text-[11px] text-gray-400">待修复缺陷</span>
            <CheckChip active={checkFilter === 'defect'} label="全部缺陷" count={defectCount} tone="defect" onClick={() => setCheckFilter('defect')} />
            {DEFECT_STATUSES.map((s) => (
              <CheckChip key={s} active={checkFilter === s} label={CHECK_STATUS_CONFIG[s].label} count={checkCounts[s]} tone="defect" onClick={() => setCheckFilter(s)} />
            ))}
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <span className="text-[11px] text-gray-400">运营信号（不一定要改）</span>
            {SIGNAL_STATUSES.map((s) => (
              <CheckChip key={s} active={checkFilter === s} label={CHECK_STATUS_CONFIG[s].label} count={checkCounts[s]} tone="signal" onClick={() => setCheckFilter(s)} />
            ))}
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <CheckChip active={checkFilter === 'useful'} label="健康" count={checkCounts.useful} tone="ok" onClick={() => setCheckFilter('useful')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {/* 知识目录文件夹（人工分组，仅起归类作用，与板块处理方式无关） */}
        <div className="w-44 shrink-0">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">知识目录</CardTitle>
              <button className="text-blue-600 text-lg leading-none" onClick={addDir} title="新建分组">+</button>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {dirs.map((d) => (
                <div key={d.dirId} onClick={() => setActiveDir(d.dirId)}
                  className={`group relative flex items-center justify-between px-2 py-2 rounded cursor-pointer text-sm ${activeDir === d.dirId ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <span className="truncate">📁 {d.name}</span>
                  {d.dirId !== 'all' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDirMenuOpen((p) => (p === d.dirId ? null : d.dirId)); }}
                      className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 data-[open=true]:opacity-100"
                      data-open={dirMenuOpen === d.dirId}
                    >⋯</button>
                  )}
                  {dirMenuOpen === d.dirId && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-8 z-10 w-28 rounded-md border bg-white shadow-md py-1 text-xs">
                      <button className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700" onClick={() => { renameDir(d.dirId); setDirMenuOpen(null); }}>重命名</button>
                      {d.dirId !== 'other' && (
                        <button className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-500" onClick={() => removeDir(d.dirId)}>删除</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* 工具条：搜索 + 筛选 */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 按名称搜索…" className="max-w-xs h-9" />
                <select value={connectFilter} onChange={(e) => setConnectFilter(e.target.value as 'all' | ConnectType)}
                  className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部来源方式</option>
                  {CONNECT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={knowledgeBaseTypeFilter} onChange={(e) => { setKnowledgeBaseTypeFilter(e.target.value as 'all' | KnowledgeBaseType); setPrimaryCategoryFilter('all'); setSecondaryCategoryFilter('all'); }} className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部知识库类型</option>
                  {KNOWLEDGE_BASE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
                  className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部行业</option>
                  {industryFilterOpts.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                <select value={primaryCategoryFilter} onChange={(e) => { setPrimaryCategoryFilter(e.target.value); setSecondaryCategoryFilter('all'); }} className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部一级分类</option>
                  {primaryCategoryFilterOpts.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={secondaryCategoryFilter} onChange={(e) => setSecondaryCategoryFilter(e.target.value)} className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部二级分类</option>
                  {secondaryCategoryFilterOpts.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={contentFormatFilter} onChange={(e) => setContentFormatFilter(e.target.value as 'all' | ContentFormat)} className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部内容形式</option>
                  {CONTENT_FORMATS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={validityStatusFilter} onChange={(e) => setValidityStatusFilter(e.target.value as 'all' | ValidityStatus)} className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部有效状态</option>
                  {VALIDITY_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={timelinessFilter} onChange={(e) => setTimelinessFilter(e.target.value as 'all' | Timeliness)}
                  className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部时效</option>
                  {TIMELINESS_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)}
                  className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部适用对象</option>
                  {AUDIENCE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
                  className="h-9 px-2 rounded-md border text-sm bg-white">
                  <option value="all">全部语言</option>
                  {LANGUAGE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <Input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="🔍 模糊搜索标签…" className="h-9 w-44" />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button key={f.key} onClick={() => setStatusFilter(f.key)}
                    className={`px-2.5 py-1 rounded text-xs ${statusFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f.label}</button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedIds.size > 0 && (
            <Card className="border-gray-200">
              <CardContent className="py-2.5 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-50 text-blue-600">已选 {selectedIds.size} 条知识</Badge>
                  {getAvailableBatchActions().map((action) => (
                    <Button key={action.to} size="sm" variant="outline" className="h-8" onClick={() => batchTransition(action.to, action.label)}>批量{action.label}</Button>
                  ))}
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
                  {canBatchRelearn && <Button size="sm" variant="outline" className="h-8" onClick={batchRelearn}>批量重新学习</Button>}
                  {canBatchDelete && <Button size="sm" variant="outline" className="h-8 text-red-500 hover:bg-red-50" onClick={batchDelete}>批量删除</Button>}
                  {selectedIds.size > 1 && getAvailableBatchActions().length === 0 && selectedLifecycleStatuses.size > 1 && <span className="text-xs text-gray-400">不同状态只显示共同合法的批量操作</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap border-t pt-2">
                  <span className="text-xs text-gray-400">批量修复</span>
                  {batchFixActions.map((action) => (
                    <Button key={action} size="sm" variant="outline"
                      className={`h-8 ${action === 'archive' ? 'text-red-500 hover:bg-red-50' : ''}`}
                      title={HEALTH_FIX_CONFIG[action].desc}
                      onClick={() => batchApplyHealthFix(action)}>
                      批量{HEALTH_FIX_CONFIG[action].label}
                    </Button>
                  ))}
                  {batchFixActions.length === 0 && (
                    <span className="text-xs text-gray-400">所选知识的体检结论不一致，请先按上方结论筛选后再批量修复</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap border-t pt-2">
                  <span className="text-xs text-gray-400">批量修改</span>
                  <Button size="sm" variant="outline" className="h-8" onClick={openBatchMeta}>批量修改知识目录与元数据</Button>
                  {!getSelectedSection() && <span className="text-xs text-gray-400">已跨知识板块：内容形式不可批量覆盖，其余公共字段可修改</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 列表 */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 flex-wrap mb-3 border-b pb-3">
                <button onClick={() => setSectionFilter('all')}
                  className={`px-3 py-1.5 rounded text-xs font-medium ${sectionFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  全部 <span className="opacity-70">{rows.length}</span>
                </button>
                {SECTIONS.map((s) => (
                  <button key={s.key} onClick={() => setSectionFilter(s.key)}
                    className={`px-3 py-1.5 rounded text-xs font-medium ${sectionFilter === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s.index} {s.emoji} {s.name} <span className="opacity-70">{rows.filter((r) => r.section === s.key).length}</span>
                  </button>
                ))}
              </div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">共 {filtered.length} 条（{rows.length} 总）</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={filtered.length === 0} onClick={selectAllAcrossPages}>
                  全选当前筛选（跨页）
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))} onChange={toggleSelectAll} className="cursor-pointer" />
                    </TableHead>
                    <TableHead>知识资产</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>知识板块</TableHead>
                    <TableHead>行业</TableHead>
                    <TableHead>知识库类型</TableHead>
                    <TableHead>一级分类</TableHead>
                    <TableHead>二级分类</TableHead>
                    <TableHead>内容形式</TableHead>
                    <TableHead>有效状态</TableHead>
                    <TableHead>时效</TableHead>
                    <TableHead>适用对象</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>更新时间</TableHead>
                    <TableHead>体检结论</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const check = buildKnowledgeCheckResult(r);
                    const checkConfig = CHECK_STATUS_CONFIG[check.status];
                    const lifecycleStatus = effectiveStatus(r);
                    const lifecycleConfig = STATUS_LABEL[lifecycleStatus];
                    return (
                    <TableRow key={r.id} className={selectedIds.has(r.id) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="cursor-pointer" />
                      </TableCell>
                      <TableCell className="text-sm">
                        <button className="hover:text-blue-600 text-left" onClick={() => navigate(r.id)}>{r.name}</button>
                      </TableCell>
                      <TableCell><Badge className={`text-xs font-normal ${lifecycleConfig.cls}`}>{lifecycleConfig.label}</Badge></TableCell>
                      <TableCell><SectionTag k={r.section} /></TableCell>
                      <TableCell className="text-xs text-gray-600">{r.industry || '未指定'}</TableCell>
                      <TableCell className="text-xs text-gray-700 min-w-[120px]">{r.knowledgeBaseType}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.primaryCategory || '未指定'}</TableCell>
                      <TableCell className="text-xs text-gray-600">{r.secondaryCategory || '未指定'}</TableCell>
                      <TableCell><Badge className="bg-blue-50 text-blue-600 font-normal">{r.contentFormat}</Badge></TableCell>
                      <TableCell className={`text-xs ${r.validityStatus === '已失效' ? 'text-red-500' : r.validityStatus === '待确认' ? 'text-amber-600' : 'text-gray-600'}`}>{r.validityStatus}</TableCell>
                      <TableCell><Badge className={`text-xs ${TIMELINESS_CLS[r.timeliness]}`}>{r.timeliness}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-600">{r.audience || '未指定'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap max-w-[160px]">
                          {r.tags.length === 0 ? <span className="text-xs text-gray-300">—</span> : r.tags.map((t) => (
                            <Badge key={t} className="text-[11px] bg-gray-100 text-gray-600 font-normal">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400" title={`创建人：${r.createdBy}`}>{r.createdAt}</TableCell>
                      <TableCell className="text-xs text-gray-400">{r.updatedAt}</TableCell>
                      <TableCell>
                        <button title={`${check.reason} · 点击查看并修复`} onClick={() => viewCheckResult(r)}>
                          <Badge className={`text-xs cursor-pointer hover:opacity-80 ${checkConfig.cls}`}>{checkConfig.label}</Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end flex-wrap">
                          {lifecycleStatus !== 'archived' && lifecycleStatus !== 'learning' && check.status !== 'useful' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => viewCheckResult(r)}>修复</Button>}
                          {lifecycleStatus !== 'learning' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(r)}>编辑</Button>}
                          {lifecycleStatus === 'draft' && <Button size="sm" className="h-7 bg-blue-600 text-xs" onClick={() => transitionRow(r, 'learning', '启用')}>启用</Button>}
                          {(lifecycleStatus === 'published' || lifecycleStatus === 'stale') && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => relearn(r)}>重新学习</Button>}
                          {(lifecycleStatus === 'published' || lifecycleStatus === 'stale') && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => transitionRow(r, 'archived', '停用')}>停用</Button>}
                          {lifecycleStatus === 'archived' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => transitionRow(r, 'published', '启用')}>启用</Button>}
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openOpLog(r.id)}>日志</Button>
                          {(lifecycleStatus === 'draft' || lifecycleStatus === 'archived') && <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => remove(r)}>删除</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={emptyColSpan} className="text-center text-sm text-gray-400 py-8">无匹配结果</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 未回答问题 → 转移入库（原 N5 知识库页，知识沉淀飞轮） */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                未回答问题
                <Badge className="text-xs bg-orange-50 text-orange-600">{mockUnansweredData.length} 待处理</Badge>
                <span className="text-xs text-gray-400 font-normal">— 转移补答后入库，形成知识沉淀飞轮</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>问题</TableHead><TableHead>提问次数</TableHead><TableHead>最近提问</TableHead><TableHead>操作</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {mockUnansweredData.map((q2) => (
                    <TableRow key={q2.qId}>
                      <TableCell className="text-sm">{q2.question}</TableCell>
                      <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{q2.count} 次</Badge></TableCell>
                      <TableCell className="text-sm text-gray-400">{q2.askedAt}</TableCell>
                      <TableCell><Button size="sm" className="h-7 text-xs bg-blue-600" onClick={() => transferUnanswered(q2.qId)}>转移入库</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 修复流水：诊断实时可算无需留存，真正有回看价值的是修复动作本身 */}
      <Dialog open={repairLogOpen} onOpenChange={setRepairLogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>知识修复流水</DialogTitle></DialogHeader>
          <div className="text-xs text-gray-500">记录每次体检修复：谁、在什么时候、对哪条知识做了什么处理，以及健康度变化。</div>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <Table>
              <TableHeader>
                <TableRow><TableHead>知识资产</TableHead><TableHead>修复前结论</TableHead><TableHead>处理动作</TableHead><TableHead>健康度变化</TableHead><TableHead>操作人</TableHead><TableHead>时间</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {repairLogs.map((log) => {
                  const config = CHECK_STATUS_CONFIG[log.fromStatus];
                  const delta = log.healthAfter - log.healthBefore;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        <button className="text-left hover:text-blue-600" onClick={() => { setRepairLogOpen(false); navigate(log.assetId); }}>{log.assetName}</button>
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${config.cls}`}>{config.label}</Badge></TableCell>
                      <TableCell className="text-xs text-gray-600">{HEALTH_FIX_CONFIG[log.action].label}</TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {log.healthBefore} → {log.healthAfter}
                        {delta !== 0 && <span className={`ml-1 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>{delta > 0 ? `+${delta}` : delta}</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{log.operator}</TableCell>
                      <TableCell className="text-xs text-gray-400">{log.at}</TableCell>
                    </TableRow>
                  );
                })}
                {repairLogs.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-gray-400">暂无修复记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setRepairLogOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 知识资产操作日志：单条知识的启停检索历史，谁在什么时候启用/禁用了它 */}
      <Dialog open={!!opLogAssetId} onOpenChange={(o) => !o && setOpLogAssetId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>操作日志{opLogAssetId ? ` — ${rows.find((r) => r.id === opLogAssetId)?.name ?? ''}` : ''}</DialogTitle></DialogHeader>
          <div className="text-xs text-gray-500">记录该条知识每一次启用/禁用检索的执行结果，最新一条在前。</div>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日志 ID</TableHead>
                  <TableHead>业务归类</TableHead>
                  <TableHead>执行结果</TableHead>
                  <TableHead>成功/失败数</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>操作人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(opLogAssetId ? opLogs[opLogAssetId] ?? [] : []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-500 font-mono">{log.id}</TableCell>
                    <TableCell className="text-xs text-gray-600">{log.categoryPath}</TableCell>
                    <TableCell><Badge className={`text-xs ${log.result === '执行成功' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{log.result}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-500">{log.successCount} / {log.failCount}</TableCell>
                    <TableCell className="text-xs text-gray-400">{log.at}</TableCell>
                    <TableCell><Badge className={`text-xs ${log.action === '启用' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{log.action}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-500">{log.operator}</TableCell>
                  </TableRow>
                ))}
                {opLogAssetId && (opLogs[opLogAssetId] ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-gray-400">暂无操作日志</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setOpLogAssetId(null)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeCheckResult} onOpenChange={(o) => !o && setActiveCheckResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>知识健康体检详情</DialogTitle></DialogHeader>
          {activeCheckResult && activeCheckConfig && (
            <div className="space-y-4">
              <div className="rounded-md border bg-gray-50 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{activeCheckResult.assetName}</div>
                    <div className="mt-1 text-xs text-gray-500 truncate">{activeCheckResult.pageContext ?? '未绑定页面上下文'}</div>
                  </div>
                  <Badge className={`text-xs shrink-0 ${activeCheckConfig.cls}`}>{activeCheckConfig.label}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400">判定时间</div>
                    <div className="mt-1 text-gray-700">{TODAY} · 实时</div>
                  </div>
                  <div>
                    <div className="text-gray-400">修复前健康度</div>
                    <div className="mt-1 text-gray-700">{activeCheckResult.healthBefore ?? activeCheckAsset?.health ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">当前健康度</div>
                    <div className="mt-1 text-gray-700">{activeCheckAsset?.health ?? '—'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border px-3 py-3">
                  <div className="text-xs font-medium text-gray-500">问题原因</div>
                  <p className="mt-2 text-sm text-gray-700 leading-6">{activeCheckResult.reason}</p>
                </div>
                <div className="rounded-md border px-3 py-3">
                  <div className="text-xs font-medium text-gray-500">处理建议</div>
                  <p className="mt-2 text-sm text-gray-700 leading-6">{activeCheckResult.advice}</p>
                </div>
              </div>

              <div className="rounded-md border px-3 py-3">
                <div className="text-xs font-medium text-gray-500">让这条知识变健康</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {activeRepairActions.map((action) => {
                    const fix = HEALTH_FIX_CONFIG[action];
                    return (
                      <button key={action} disabled={!activeCheckAsset}
                        className={`rounded-md border px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 ${action === 'archive' ? 'border-red-100 text-red-600' : 'border-gray-200 text-gray-700'}`}
                        onClick={() => activeCheckResult && applyHealthFix(activeCheckResult.assetId, action)}>
                        <div className="text-sm font-medium">{fix.label}</div>
                        <div className="mt-1 text-xs text-gray-400">{fix.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setActiveCheckResult(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* + 新增知识：上传文件 / 外部网址 / 对象存储 */}
      <Dialog open={addOpen} onOpenChange={(o) => (o ? setAddOpen(true) : closeAdd())}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>新增知识</DialogTitle></DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3">
          <Field label="知识板块">
            <select value={addBoard} onChange={(e) => { const board = e.target.value as SectionKey; setAddBoard(board); setAddMode(getDefaultTab(board)); setBackendPagePicked(new Set()); setBackendPageQuery(''); }} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
              {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.index} {s.name}</option>)}
            </select>
            <div className="mt-1 text-[11px] text-gray-400">知识板块决定处理方式；下方知识库类型决定业务归属，两者独立。</div>
          </Field>

          {/* 内容资产保留原“从前台页面选择”交互，只新增“后台页面”这一种来源 */}
          {addBoard === 'content' ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-600">内容资产从企业已有页面接入，不支持直接上传文件或填写外部网址。</p>
              <div className="flex gap-2">
                <Button variant={addMode === null ? 'default' : 'outline'} onClick={() => { closeAdd(); setPagePickerOpen(true); }}>从前台页面选择</Button>
                <Button variant={addMode === '后台页面' ? 'default' : 'outline'} onClick={() => setAddMode('后台页面')}>从后台页面选择</Button>
              </div>
              {addMode === '后台页面' && renderBackendPageSelector()}
            </div>
          ) : addBoard === 'industry' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">平台维护，仅可浏览导入</p>
              <div className="grid grid-cols-3 gap-2">
                <Field label="导入状态">
                  <select value={industryStatusFilter} onChange={(e) => setIndustryStatusFilter(e.target.value as typeof industryStatusFilter)} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                    <option value="all">全部状态</option>
                    <option value="可导入">可导入</option>
                    <option value="已导入">已导入</option>
                  </select>
                </Field>
                <Field label="一级分类">
                  <select value={industryPrimaryFilter} onChange={(e) => { setIndustryPrimaryFilter(e.target.value); setIndustrySecondaryFilter('all'); }} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                    <option value="all">全部一级分类</option>
                    {industryPrimaryOpts.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="二级分类">
                  <select value={industrySecondaryFilter} onChange={(e) => setIndustrySecondaryFilter(e.target.value)} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                    <option value="all">全部二级分类</option>
                    {industrySecondaryOpts.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
              </div>
              <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                {industryLibraryFiltered.length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-6">没有匹配筛选条件的行业知识库内容</div>
                )}
                {industryLibraryFiltered.map((item) => {
                  const status = getIndustryItemStatus(item);
                  const disabled = status === '已导入';
                  const checked = disabled || industryPicked.has(item.id);
                  return (
                    <div key={item.id} className={`grid grid-cols-[24px_1.6fr_1fr_1fr_90px] gap-3 items-center border rounded-md px-3 py-2 ${disabled ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleIndustryPick(item.id)} className="accent-blue-600" />
                      <div className="min-w-0">
                        <div className="text-sm text-gray-800 truncate">{item.name}</div>
                        <div className="text-xs text-gray-400 truncate">{item.industry} · {item.primaryCategory}{item.secondaryCategory ? ` / ${item.secondaryCategory}` : ''}</div>
                      </div>
                      <div className="text-xs text-gray-500">{item.contentFormat} · 平台当前内容</div>
                      <div className="text-xs text-gray-400">{item.chunks} 切片 · {item.updatedAt}</div>
                      <div className="text-right">
                        {status === '可导入' && <Badge className="text-xs bg-blue-50 text-blue-600">可导入</Badge>}
                        {status === '已导入' && <Badge className="text-xs bg-gray-100 text-gray-500">已导入</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Tab导航：根据板块显示不同的tab选项 */}
              <div className="flex gap-1 border-b">
                {addBoard === 'faq' && (
                  <>
                    <button onClick={() => setAddMode('手动输入')} className={`px-3 py-2 text-sm ${addMode === '手动输入' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      ✍️ 手动输入问答 <span className="text-xs text-blue-500">推荐</span>
                    </button>
                    <button onClick={() => setAddMode('上传文件')} className={`px-3 py-2 text-sm ${addMode === '上传文件' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      📤 批量上传FAQ
                    </button>
                  </>
                )}
                {addBoard === 'web' && (
                  <>
                    <button onClick={() => setAddMode('外部网址')} className={`px-3 py-2 text-sm ${addMode === '外部网址' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      🔗 外部网址 <span className="text-xs text-blue-500">推荐</span>
                    </button>
                    <button onClick={() => setAddMode('上传文件')} className={`px-3 py-2 text-sm ${addMode === '上传文件' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      📤 上传文件
                    </button>
                    <button onClick={() => setAddMode('对象存储')} className={`px-3 py-2 text-sm ${addMode === '对象存储' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      🗄️ 对象存储
                    </button>
                  </>
                )}
                {addBoard === 'document' && (
                  <>
                    <button onClick={() => setAddMode('上传文件')} className={`px-3 py-2 text-sm ${addMode === '上传文件' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      📤 上传文件 <span className="text-xs text-blue-500">推荐</span>
                    </button>
                    <button onClick={() => setAddMode('外部网址')} className={`px-3 py-2 text-sm ${addMode === '外部网址' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      🔗 外部网址
                    </button>
                    <button onClick={() => setAddMode('对象存储')} className={`px-3 py-2 text-sm ${addMode === '对象存储' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      🗄️ 对象存储
                    </button>
                  </>
                )}
                {addBoard === 'structured' && (
                  <>
                    <button onClick={() => setAddMode('上传文件')} className={`px-3 py-2 text-sm ${addMode === '上传文件' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      📤 上传结构化数据 <span className="text-xs text-blue-500">推荐</span>
                    </button>
                    <button onClick={() => setAddMode('后台页面')} className={`px-3 py-2 text-sm ${addMode === '后台页面' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                      🧩 后台页面
                    </button>
                  </>
                )}
              </div>

              {/* Tab内容区 */}
              <div className="space-y-3 pt-3">
                {/* 手动输入问答 */}
                {addMode === '手动输入' && (
                  <>
                    <Field label="问题">
                      <Input value={qaQuestion} onChange={(e) => setQaQuestion(e.target.value)} placeholder="用户可能会这样问…" className="h-9" />
                    </Field>
                    <Field label="答案">
                      <Textarea value={qaAnswer} onChange={(e) => setQaAnswer(e.target.value)} placeholder="标准答案…" rows={4} className="text-sm" />
                    </Field>
                    <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2">
                      💡 提示：保存后可在知识详情页继续添加"可能的提问方式"和"关键词"，提高命中率
                    </div>
                  </>
                )}

                {/* 上传文件 */}
                {addMode === '上传文件' && (
                  <>
                    <Field label="选择文件">
                      <div className="flex gap-1.5 flex-wrap mb-2">
                        {files.length === 0 && <span className="text-xs text-gray-300">尚未选择文件</span>}
                        {files.map((f, i) => (
                          <Badge key={`${f}-${i}`} className="text-xs bg-gray-100 text-gray-600 font-normal gap-1.5 pr-1.5">
                            {f}<button className="text-gray-400 hover:text-red-500" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                          </Badge>
                        ))}
                      </div>
                      <input type="file" multiple accept={addBoard === 'structured' ? '.json,.jsonl,.csv,.xlsx' : undefined} className="hidden" id="cat-file-input"
                        onChange={(e) => { setFiles((p) => [...p, ...Array.from(e.target.files ?? []).map((f) => f.name)]); e.target.value = ''; }} />
                      <label htmlFor="cat-file-input" className="inline-flex items-center h-8 px-3 rounded-md border text-xs cursor-pointer hover:bg-gray-50 text-gray-600">
                        📤 选择文件（{addBoard === 'structured' ? 'JSON/JSONL/CSV/XLSX' : 'PDF/DOCX/PPTX/XLSX'}）
                      </label>
                      {addBoard === 'structured' && (
                        <div className="mt-1.5 text-[11px] text-gray-400">
                          也可以<button type="button" className="text-blue-600 hover:underline mx-0.5" onClick={() => { closeAdd(); setPagePickerOpen(true); }}>从前台页面选择</button>直接接入页面的结构化字段
                        </div>
                      )}
                    </Field>
                    {addBoard === 'structured' && (
                      <Field label="字段（逗号分隔，如 sku、price、stock）">
                        <Input value={structuredFieldsDraft} onChange={(e) => setStructuredFieldsDraft(e.target.value)} placeholder="如：sku、price、stock、status" />
                      </Field>
                    )}
                  </>
                )}

                {/* 外部网址 */}
                {addMode === '外部网址' && (
                  <>
                    <Field label="网址（可添加多个，各自独立抓取）">
                      <div className="space-y-1 mb-2">
                        {urls.length === 0 && <span className="text-xs text-gray-300">尚未添加网址</span>}
                        {urls.map((u, i) => (
                          <div key={`${u}-${i}`} className="flex items-center gap-1.5 text-xs bg-gray-50 border rounded px-2 py-1">
                            <span className="flex-1 truncate text-gray-600">{u}</span>
                            <button className="text-gray-400 hover:text-red-500" onClick={() => removeUrlDraft(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrlDraft()} placeholder="如：https://example.com/news" className="h-8 text-sm" />
                        <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={addUrlDraft}>+ 添加</Button>
                      </div>
                    </Field>
                    <Field label="来源分组名称（可选，多个网址算同一来源时填写）">
                      <Input value={groupLabelDraft} onChange={(e) => setGroupLabelDraft(e.target.value)} placeholder="如：行业资讯源" />
                    </Field>
                  </>
                )}

                {/* 对象存储 */}
                {addMode === '对象存储' && (
                  <>
                    <Field label="名称">
                      <Input value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="如：行业报告库" />
                    </Field>
                    <Field label="Bucket / 路径前缀">
                      <Input value={bucketPath} onChange={(e) => setBucketPath(e.target.value)} placeholder="如：s3://kb-assets/docs/" />
                    </Field>
                    <Field label="同时归入其它板块（一个 bucket 同时喂多个板块）">
                      <div className="flex gap-4 h-9 items-center">
                        {EXTRA_BOARD_OPTS.filter((b) => b !== addBoard).map((b) => (
                          <label key={b} className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input type="checkbox" checked={extraBoards.includes(b)}
                              onChange={() => setExtraBoards((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
                              className="accent-blue-600" />
                            {SECTION_MAP[b].name}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </>
                )}

                {addMode === '后台页面' && addBoard === 'structured' && renderBackendPageSelector()}

              </div>
            </>
          )}

          {addBoard !== 'structured' && addBoard !== 'industry' && (
            <div className="border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">文档级元数据</div>
                <div className="text-xs text-blue-600">保存后 AI 自动补全“未指定”字段</div>
              </div>
              <DocumentMetadataFields value={addMetadata} onChange={setAddMetadata} onTypeChange={changeKnowledgeBaseType} section={addBoard} compact showRequiredLabels={false} />
            </div>
          )}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={closeAdd}>取消</Button>
            {addMode === '手动输入' && <><Button size="sm" variant="outline" onClick={() => createFromQa(false)}>保存</Button><Button size="sm" className="bg-blue-600" onClick={() => createFromQa(true)}>保存并创建</Button></>}
            {addMode === '上传文件' && <><Button size="sm" variant="outline" onClick={() => createFromFiles(false)}>保存</Button><Button size="sm" className="bg-blue-600" onClick={() => createFromFiles(true)}>保存并创建</Button></>}
            {addMode === '外部网址' && <><Button size="sm" variant="outline" onClick={() => createFromUrls(false)}>保存</Button><Button size="sm" className="bg-blue-600" onClick={() => createFromUrls(true)}>保存并创建</Button></>}
            {addMode === '对象存储' && <><Button size="sm" variant="outline" onClick={() => createFromBucket(false)}>保存</Button><Button size="sm" className="bg-blue-600" onClick={() => createFromBucket(true)}>保存并创建</Button></>}
            {addMode === '后台页面' && <><Button size="sm" variant="outline" onClick={() => createFromBackendPages(false)}>保存</Button><Button size="sm" className="bg-blue-600" onClick={() => createFromBackendPages(true)}>保存并创建</Button></>}
            {addBoard === 'industry' && <Button size="sm" className="bg-blue-600" disabled={industryPicked.size === 0} onClick={confirmIndustryImport}>导入所选（{industryPicked.size}）</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 从前台页面选择（网站树形结构，仅内容资产/结构化数据两个归属可选，可同选） */}
      <Dialog open={pagePickerOpen} onOpenChange={setPagePickerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>从前台页面选择</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">
            这里只展示适合接入「内容资产」「结构化数据」两个板块的前台页面（其它类型知识请用各板块自己的录入方式），按站点与导航层级展开，可勾选整个分支批量选中。每个页面可同时勾选内容资产、结构化数据两个归属（有正文也有结构化字段的页面可以两者都要），已加入知识库的页面会灰显禁用。
          </p>
          <DocumentMetadataFields value={addMetadata} onChange={setAddMetadata} onTypeChange={changeKnowledgeBaseType} compact />
          <div className="max-h-[58vh] overflow-y-auto border rounded-md bg-white">
            {pageTree.map((node) => renderTreeNode(node, 0))}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => { setPicked(new Set()); setBoardChoice({}); setPagePickerOpen(false); }}>取消</Button>
            <Button size="sm" className="bg-blue-600" disabled={picked.size === 0} onClick={confirmFrontendPages}>添加所选（{picked.size}）</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗（单条完整元数据） */}
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeEdit())}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>编辑知识资产</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-400 -mt-2">创建于 {form.createdAt} · {form.createdBy} · 最近更新 {form.updatedAt}</p>
          <div className="grid grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="hidden">
              <div className="text-sm font-medium text-gray-800 mb-2">文档级信息与业务归类</div>
              <DocumentMetadataFields value={form} onChange={(next) => setForm({ ...form, ...next } as Row)} onTypeChange={changeKnowledgeBaseType} section={form.section} />
            </div>
            <Field label="状态" className="col-span-2">
              <StatusActions status={effectiveStatus(form)} onTransition={handleFormTransition} />
            </Field>
            {form.section === 'faq' && (
              <Field label="答案准确性人工审核（问答知识板块的入库门禁项）" className="col-span-2">
                <label className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input type="checkbox" checked={form.reviewed === true} onChange={(e) => setForm({ ...form, reviewed: e.target.checked })} className="accent-blue-600" />
                  已人工审核确认答案准确
                </label>
              </Field>
            )}
            <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50/50 p-3">
              <div className="mb-3 text-sm font-medium text-gray-800">基础信息与来源</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="知识名称" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：退换货流程 FAQ" /></Field>
                <Field label="知识板块"><select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as SectionKey })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">{SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.index} {s.name}</option>)}</select></Field>
                <Field label="来源方式"><select value={form.connect} onChange={(e) => setForm({ ...form, connect: e.target.value as ConnectType })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">{CONNECT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
                {(form.section === 'content' || form.section === 'structured') && <Field label="前台路由（必填）" className="col-span-2"><Input value={form.frontendRoute ?? ''} onChange={(e) => setForm({ ...form, frontendRoute: e.target.value || undefined })} placeholder="如：/products/kfr-35" /></Field>}
              </div>
            </div>

            <div className="col-span-2"><DocumentMetadataFields value={form} onChange={(next) => setForm({ ...form, ...next } as Row)} onTypeChange={changeKnowledgeBaseType} section={form.section} /></div>

            <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50/50 p-3">
              <div className="mb-3 text-sm font-medium text-gray-800">治理属性</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="时效"><select value={form.timeliness} onChange={(e) => setForm({ ...form, timeliness: e.target.value as Timeliness })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">{TIMELINESS_OPTS.map((v) => <option key={v} value={v}>{v}</option>)}</select></Field>
              </div>
            </div>

            <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50/50 p-3">
              <div className="mb-3 text-sm font-medium text-gray-800">组织与适用范围</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="所属分组"><select value={form.folderId ?? ''} onChange={(e) => setForm({ ...form, folderId: e.target.value || undefined })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{dirs.filter((d) => d.dirId !== 'all').map((d) => <option key={d.dirId} value={d.dirId}>{d.name}</option>)}</select></Field>
                <Field label="适用门户网站" className="col-span-2"><div className="flex gap-4 min-h-9 items-center flex-wrap"><span className="text-xs text-gray-400">未勾选表示全部门户</span>{mockPortalSites.map((s) => <label key={s.id} className="flex items-center gap-1.5 text-sm text-gray-700"><input type="checkbox" checked={form.portalSites.includes(s.id)} onChange={() => setForm({ ...form, portalSites: form.portalSites.includes(s.id) ? form.portalSites.filter((x) => x !== s.id) : [...form.portalSites, s.id] })} className="accent-blue-600" />{s.name}</label>)}</div></Field>
              </div>
            </div>

            <div className="col-span-2 rounded-md border border-gray-200 bg-gray-50/50 p-3">
              <div className="mb-3 text-sm font-medium text-gray-800">内容说明</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="文档标签" className="col-span-2"><Input value={form.tags.join('、')} onChange={(e) => setForm({ ...form, tags: e.target.value.split(/[,，、]/).map((t) => t.trim()).filter(Boolean) })} placeholder="如：KFR-35、空气滤清器、售后" /></Field>
                <Field label="知识摘要" className="col-span-2"><Textarea value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value || undefined })} rows={2} placeholder="可由 AI 自动生成；用户编辑后以用户内容为准" /></Field>
                <Field label="备注" className="col-span-2"><Textarea value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value || undefined })} rows={2} placeholder="仅用于运营说明" /></Field>
              </div>
            </div>

            <div className="hidden">
            <Field label="知识名称" className="col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：退换货流程 FAQ" />
            </Field>
            <Field label="知识板块（决定处理方式）">
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value as SectionKey })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.index} {s.name}</option>)}
              </select>
              <div className="text-[11px] text-gray-400 mt-1">{chunkOf(form)} · 自动套用该板块处理方式</div>
            </Field>
            <Field label="来源方式">
              <select value={form.connect} onChange={(e) => setForm({ ...form, connect: e.target.value as ConnectType })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {CONNECT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="前台页面路由">
              <Input value={form.frontendRoute ?? ''} onChange={(e) => setForm({ ...form, frontendRoute: e.target.value || undefined })} placeholder="如：/products/kfr-35" />
            </Field>
            <Field label="前台导航路径">
              <Input value={form.frontendNavPath ?? ''} onChange={(e) => setForm({ ...form, frontendNavPath: e.target.value || undefined })} placeholder="如：产品中心 / 空气滤清器 / KFR-35" />
            </Field>
            <Field label="页面数据类型">
              <select value={form.sourceDataMode ?? '页面正文'} onChange={(e) => setForm({ ...form, sourceDataMode: e.target.value as Row['sourceDataMode'] })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {['导航结构', '页面正文', '结构化字段', '页面正文+结构化字段'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="所属分组（知识目录，仅归类用）">
              <select value={form.folderId ?? 'other'} onChange={(e) => setForm({ ...form, folderId: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {dirs.filter((d) => d.dirId !== 'all').map((d) => <option key={d.dirId} value={d.dirId}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="适用门户网站（不选=全部站点通用）" className="col-span-2">
              <div className="flex gap-4 h-9 items-center flex-wrap">
                {mockPortalSites.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.portalSites.includes(s.id)}
                      onChange={() => setForm({
                        ...form,
                        portalSites: form.portalSites.includes(s.id)
                          ? form.portalSites.filter((x) => x !== s.id)
                          : [...form.portalSites, s.id],
                      })}
                      className="accent-blue-600"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="业务用途">
              <select value={form.businessTag} onChange={(e) => setForm({ ...form, businessTag: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {BUSINESS_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="适用场景">
              <select value={form.scene} onChange={(e) => setForm({ ...form, scene: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {SCENES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="时效">
              <select value={form.timeliness} onChange={(e) => setForm({ ...form, timeliness: e.target.value as Timeliness })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {TIMELINESS_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="权限">
              <select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value as AccessLevel })} className="h-9 w-full px-2 rounded-md border text-sm bg-white">
                {ACCESS_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="标签（逗号分隔，进倒排索引辅助精确命中）" className="col-span-2">
              <Input
                value={form.tags.join('、')}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(/[,，、]/).map((t) => t.trim()).filter(Boolean) })}
                placeholder="如：KFR-35、空气滤清器、售后"
              />
            </Field>
            <Field label="页面结构化字段（逗号分隔）" className="col-span-2">
              <Input
                value={(form.structuredFields ?? []).join('、')}
                onChange={(e) => setForm({ ...form, structuredFields: e.target.value.split(/[,，、]/).map((t) => t.trim()).filter(Boolean) })}
                placeholder="如：sku、price、stock、status"
              />
            </Field>
            <Field label="精确出处 / 来源引用" className="col-span-2">
              <Textarea value={form.sourceRef} onChange={(e) => setForm({ ...form, sourceRef: e.target.value })} placeholder="如：退换货流程.pdf · p.3 / MCP products 表 / https://…" rows={2} />
            </Field>
            <Field label="备注（可选）" className="col-span-2">
              <Textarea value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value || undefined })} rows={2} placeholder="补充说明，如重点关注内容、注意事项等" />
            </Field>
            </div>
            {mockCustomSchemaFields.length > 0 && (
              <Field label="自定义元数据（元数据管理中配置）" className="col-span-2 rounded-md border border-gray-200 bg-gray-50/50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {mockCustomSchemaFields.map((sf) => (
                    <div key={sf.field}>
                      <label className="text-[11px] text-gray-400">{sf.meaning || sf.field}</label>
                      <Input
                        value={form.customFields?.[sf.field] ?? ''}
                        onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [sf.field]: e.target.value } })}
                        placeholder={sf.example || sf.field}
                        className="mt-0.5"
                      />
                    </div>
                  ))}
                </div>
              </Field>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={closeEdit}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={save}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量修改元数据：入库时元数据由大模型自动匹配，难免出错，这里允许运营勾选字段批量纠正；未勾选的字段保持每条知识原值不变 */}
      <Dialog open={batchMetaOpen} onOpenChange={setBatchMetaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>批量修改知识目录与元数据</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">
            已选 {selectedIds.size} 条知识{getSelectedSection() ? `，均属于「${SECTION_MAP[getSelectedSection()!].name}」板块` : '，包含多个知识板块'}。勾选字段后才会覆盖；未勾选字段保持各自原值。
          </p>
          <div className="grid grid-cols-2 gap-3 rounded-md border border-blue-100 bg-blue-50/40 p-3">
            <div className="col-span-2 text-sm font-medium text-gray-800">组织与适用范围</div>
            <Field label={<label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={batchExtraEnabled.folderId} onChange={() => toggleBatchExtraField('folderId')} className="accent-blue-600" />知识目录</label>}>
              <select value={batchFolderId} onChange={(e) => setBatchFolderId(e.target.value)} disabled={!batchExtraEnabled.folderId} className="h-9 w-full rounded-md border bg-white px-2 text-sm disabled:opacity-40">
                {dirs.filter((dir) => dir.dirId !== 'all').map((dir) => <option key={dir.dirId} value={dir.dirId}>{dir.name}</option>)}
              </select>
            </Field>
            <Field label={<label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={batchExtraEnabled.timeliness} onChange={() => toggleBatchExtraField('timeliness')} className="accent-blue-600" />时效</label>}>
              <select value={batchTimeliness} onChange={(e) => setBatchTimeliness(e.target.value as Timeliness)} disabled={!batchExtraEnabled.timeliness} className="h-9 w-full rounded-md border bg-white px-2 text-sm disabled:opacity-40">
                {TIMELINESS_OPTS.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label={<label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={batchExtraEnabled.portalSites} onChange={() => toggleBatchExtraField('portalSites')} className="accent-blue-600" />适用门户网站</label>} className="col-span-2">
              <div className={`flex min-h-9 items-center gap-4 rounded-md border bg-white px-3 ${batchExtraEnabled.portalSites ? '' : 'pointer-events-none opacity-40'}`}>
                {mockPortalSites.map((site) => <label key={site.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={batchPortalSites.includes(site.id)} onChange={() => setBatchPortalSites((prev) => prev.includes(site.id) ? prev.filter((id) => id !== site.id) : [...prev, site.id])} className="accent-blue-600" />{site.name}</label>)}
                <span className="text-xs text-gray-400">不选表示全部门户</span>
              </div>
            </Field>
            <Field label={<label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={batchExtraEnabled.tags} onChange={() => toggleBatchExtraField('tags')} className="accent-blue-600" />文档标签</label>} className="col-span-2">
              <div className={`grid grid-cols-[140px_1fr] gap-2 ${batchExtraEnabled.tags ? '' : 'pointer-events-none opacity-40'}`}>
                <select value={batchTagMode} onChange={(e) => setBatchTagMode(e.target.value as BatchTagMode)} className="h-9 rounded-md border bg-white px-2 text-sm"><option value="add">追加标签</option><option value="remove">移除标签</option><option value="replace">替换全部标签</option></select>
                <Input value={batchTags} onChange={(e) => setBatchTags(e.target.value)} placeholder="输入标签，使用逗号分隔" />
              </div>
            </Field>
          </div>
          <DocumentMetadataFields
            value={batchMeta}
            onChange={setBatchMeta}
            onTypeChange={changeKnowledgeBaseType}
            section={getSelectedSection() ?? undefined}
            enabledMap={batchMetaEnabled}
            onToggleField={toggleBatchMetaField}
            disabledFields={canBatchContentFormat ? [] : ['contentFormat']}
          />
          {!canBatchContentFormat && <p className="text-xs text-amber-600">内容形式由知识板块决定：跨板块选择，或选中问答知识/结构化数据时，不允许批量覆盖。</p>}
          {(Object.values(batchMetaEnabled).some(Boolean) || batchExtraEnabled.timeliness || batchExtraEnabled.tags) && <p className="rounded bg-orange-50 px-3 py-2 text-xs text-orange-700">分类、内容属性、时效或标签发生变化后，启用中的知识将进入“待更新”，需要重新学习；仅调整知识目录或适用门户时立即生效，不触发重新学习。</p>}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setBatchMetaOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" disabled={!Object.values(batchMetaEnabled).some(Boolean) && !Object.values(batchExtraEnabled).some(Boolean)} onClick={applyBatchMeta}>
              批量应用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={industryConfigOpen} onOpenChange={setIndustryConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>选择行业知识使用范围</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">主行业必填，额外行业最多 {MAX_EXTRA_INDUSTRIES} 个。</p>
          <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            <CatalogIndustryPicker label="主行业" required value={mainIndustryDraft} onPrimary={(value) => pickIndustryPrimary('main', value)} onSecondary={(value) => pickIndustrySecondary('main', value)} />
            {extraIndustryDrafts.map((item, index) => <CatalogIndustryPicker key={index} label={`额外行业 ${index + 1}`} value={item} onPrimary={(value) => pickIndustryPrimary(index, value)} onSecondary={(value) => pickIndustrySecondary(index, value)} onRemove={() => setExtraIndustryDrafts((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} />)}
            {extraIndustryDrafts.length < MAX_EXTRA_INDUSTRIES && <Button size="sm" variant="outline" onClick={() => setExtraIndustryDrafts((prev) => [...prev, { primary: '', secondary: '' }])}>+ 新增额外行业（{extraIndustryDrafts.length}/{MAX_EXTRA_INDUSTRIES}）</Button>}
          </div>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setIndustryConfigOpen(false)}>取消</Button><Button size="sm" className="bg-blue-600" onClick={saveIndustryConfigDraft}>保存行业</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={industryConfirmOpen} onOpenChange={setIndustryConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>确认更改行业？</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm text-gray-600"><p>更改行业会产生以下影响：</p><ul className="list-disc space-y-1 pl-5"><li>已导入的行业知识继续保留。</li><li>原行业知识停止接收平台后续版本。</li><li>新行业匹配的平台知识将进入可查看、可导入范围。</li><li>行业更改周期将从本次确认时间重新计算。</li></ul></div>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setIndustryConfirmOpen(false)}>取消</Button><Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={applyIndustryConfig}>确认更改</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatalogIndustryPicker({ label, value, required, onPrimary, onSecondary, onRemove }: {
  label: string; value: IndustrySelection; required?: boolean;
  onPrimary: (value: string) => void; onSecondary: (value: string) => void; onRemove?: () => void;
}) {
  const secondaries = secondaryIndustriesOf(value.primary);
  return <div className="rounded-md border bg-gray-50 p-3"><div className="mb-2 flex items-center justify-between"><div className="text-sm font-medium text-gray-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</div>{onRemove && <button className="text-xs text-gray-400 hover:text-red-500" onClick={onRemove}>删除</button>}</div><div className="grid grid-cols-2 gap-2"><label className="text-xs text-gray-500">一级行业<select value={value.primary} onChange={(event) => onPrimary(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-sm"><option value="">请选择</option>{PRIMARY_INDUSTRIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-xs text-gray-500">二级行业<select value={value.secondary} onChange={(event) => onSecondary(event.target.value)} disabled={!value.primary || secondaries.length === 0} className="mt-1 h-9 w-full rounded-md border bg-white px-2 text-sm disabled:bg-gray-100"><option value="">{!value.primary ? '请先选择一级行业' : secondaries.length ? '请选择' : '该行业无二级'}</option>{secondaries.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div></div>;
}

// 分块方式按板块默认（只读展示，配置在板块详情统一改）
function chunkOf(r: Row): string {
  return ({ document: 'naive', faq: 'qa', structured: 'table', content: 'naive', web: 'naive', industry: 'book' } as Record<SectionKey, string>)[r.section];
}

function DocumentMetadataFields({ value, onChange, onTypeChange, section, compact = false, enabledMap, onToggleField, disabledFields = [], showRequiredLabels = true }: {
  value: DocumentMetadataDraft;
  onChange: (next: DocumentMetadataDraft) => void;
  onTypeChange: (type: KnowledgeBaseType | '', current: DocumentMetadataDraft, apply: (next: DocumentMetadataDraft) => void) => void;
  section?: SectionKey;
  compact?: boolean;
  // 批量修改模式：每个字段一个启用开关，只有勾选的字段才会覆盖所选知识的原值
  enabledMap?: Record<keyof DocumentMetadataDraft, boolean>;
  onToggleField?: (key: keyof DocumentMetadataDraft) => void;
  disabledFields?: (keyof DocumentMetadataDraft)[];
  showRequiredLabels?: boolean;
}) {
  const primaryOptions = value.knowledgeBaseType ? PRIMARY_CATEGORIES[value.knowledgeBaseType] : [];
  const secondaryOptions = value.knowledgeBaseType ? secondaryCategoriesOf(value.knowledgeBaseType, value.primaryCategory) : [];
  const setValue = (next: Partial<DocumentMetadataDraft>) => onChange({ ...value, ...next });
  const batch = !!enabledMap && !!onToggleField;
  const isOn = (key: keyof DocumentMetadataDraft) => !batch || !!enabledMap![key];
  const isDisabled = (key: keyof DocumentMetadataDraft) => disabledFields.includes(key);
  const BF = ({ fieldKey, label, className, children }: { fieldKey: keyof DocumentMetadataDraft; label: string; className?: string; children: ReactNode }) => (
    <Field
      label={batch ? (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={enabledMap![fieldKey]} disabled={isDisabled(fieldKey)} onChange={() => onToggleField!(fieldKey)} className="accent-blue-600 disabled:opacity-40" />
          {label}
          {isDisabled(fieldKey) && <span className="text-[11px] font-normal text-gray-400">（当前选择不可批量修改）</span>}
        </label>
      ) : label}
      className={className}
    >
      <div className={isOn(fieldKey) && !isDisabled(fieldKey) ? '' : 'opacity-40 pointer-events-none'}>{children}</div>
    </Field>
  );
  const fields = (
    <>
      <div className="col-span-2 text-sm font-medium text-gray-800">业务归类</div>
      <BF fieldKey="industry" label={showRequiredLabels && value.knowledgeBaseType === '行业知识库' ? '所属行业（必填）' : '所属行业'}><select value={value.industry} onChange={(e) => setValue({ industry: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{Array.from(new Set([...enterpriseIndustryValues(), ...(value.industry ? [value.industry] : [])])).map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <BF fieldKey="knowledgeBaseType" label={showRequiredLabels ? '知识库类型（必填）' : '知识库类型'}><select value={value.knowledgeBaseType} onChange={(e) => onTypeChange(e.target.value as KnowledgeBaseType | '', value, onChange)} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{KNOWLEDGE_BASE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <BF fieldKey="primaryCategory" label={showRequiredLabels ? '一级分类（必填）' : '一级分类'}><select value={value.primaryCategory} onChange={(e) => setValue({ primaryCategory: e.target.value, secondaryCategory: '' })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{primaryOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <BF fieldKey="secondaryCategory" label="二级分类"><select value={value.secondaryCategory} onChange={(e) => setValue({ secondaryCategory: e.target.value })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{secondaryOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <div className="col-span-2 mt-1 border-t pt-3 text-sm font-medium text-gray-800">内容属性</div>
      <BF fieldKey="contentFormat" label={showRequiredLabels ? '内容形式（必填）' : '内容形式'}>
        {section === 'faq' || section === 'structured' ? (
          <div className="h-9 w-full px-2 rounded-md border border-gray-200 bg-gray-100 text-sm text-gray-600 flex items-center">
            {section === 'faq' ? '问答对（由问答知识板块固定）' : '结构化记录（由结构化数据板块固定）'}
          </div>
        ) : (
          <select value={value.contentFormat} onChange={(e) => setValue({ contentFormat: e.target.value as ContentFormat | '' })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{CONTENT_FORMATS.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        )}
      </BF>
      <BF fieldKey="audience" label="适用对象"><select value={value.audience ?? ''} onChange={(e) => setValue({ audience: e.target.value || undefined })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{AUDIENCE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <BF fieldKey="validityStatus" label={showRequiredLabels ? '有效状态（必填）' : '有效状态'}><select value={value.validityStatus} onChange={(e) => setValue({ validityStatus: e.target.value as ValidityStatus | '' })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{VALIDITY_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
      <BF fieldKey="language" label="语言"><select value={value.language ?? ''} onChange={(e) => setValue({ language: e.target.value || undefined })} className="h-9 w-full px-2 rounded-md border text-sm bg-white"><option value="">未指定</option>{LANGUAGE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select></BF>
    </>
  );
  return <div className={`grid grid-cols-2 gap-3 rounded-md border ${compact ? 'border-blue-100 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50'} p-3`}>{fields}</div>;
}

function Field({ label, children, className = '' }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
