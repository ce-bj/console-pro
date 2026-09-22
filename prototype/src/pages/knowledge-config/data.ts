// ╔══════════════════════════════════════════════════════════════════╗
// ║  知识库配置模块 · 共享类型 + Mock 数据（DataSlot 集中）               ║
// ║  依据《知识库体系架构方案》《通用检索系统产品方案》《后续工作方向全景图》 ║
// ║  所有页面从此处 import，避免重复；后端联调时按 DataSlot 替换。         ║
// ╚══════════════════════════════════════════════════════════════════╝

// ── 表单可选项（配置项下拉源）──────────────────────────────────────
export const EMBEDDING_MODELS = ['bge-large-zh-v1.5', 'bge-m3', 'text-embedding-3-large', 'gte-large-zh'];
export const CHUNK_METHODS = [
  { value: 'naive', label: 'naive（父子分块·通用文档/内容）' },
  { value: 'qa', label: 'qa（问答成对·FAQ）' },
  { value: 'presentation', label: 'presentation（版式文档/PPT）' },
  { value: 'laws', label: 'laws（法规/标准）' },
  { value: 'book', label: 'book（书籍/长报告·RAPTOR）' },
  { value: 'table', label: 'table（结构化表格）' },
];
export const BUSINESS_TAGS = ['售前', '售后', '营销', '通用'];
export const SCENES = ['客服', '内容生成', '客服/内容生成'];
export const ACCESS_LEVELS: AccessLevel[] = ['公开', '内部', '受限'];
export const TIMELINESS_OPTS: Timeliness[] = ['实时', '小时', '每日', '静态'];
// ── 行业体系（平台维护，两级：一级行业 → 二级行业）──────────────────
// 原型阶段按业务方给的示例填写。「家居建材」「服务类」为业务方提供的完整二级；
// 其余一级行业的二级为代表性示例，待平台正式行业表出来后替换。「其他」无二级，只选一级即可。
export const INDUSTRY_TREE: { primary: string; secondaries: string[] }[] = [
  { primary: '家居建材', secondaries: ['全屋定制', '卫浴', '商用家具', '场地塑胶', '建筑五金', '建筑工程', '建筑装饰', '智能家居', '民用家具'] },
  { primary: '服务类', secondaries: ['中华老字号', '会展', '公共设施管理', '写字楼管理', '医药流通', '医院', '协会商会', '园区管理', '图书出版', '学校'] },
  { primary: '机械设备', secondaries: ['数控机床', '工程机械', '包装机械', '纺织机械', '泵阀管件', '注塑机械', '农业机械'] },
  { primary: '材料化工', secondaries: ['涂料油漆', '胶粘剂', '塑料制品', '金属材料', '化工原料', '新材料'] },
  { primary: '消费品食品', secondaries: ['食品饮料', '休闲食品', '调味品', '日用百货', '母婴用品', '宠物用品'] },
  { primary: '电子电气', secondaries: ['电线电缆', '照明电器', '低压电器', '连接器', '传感器', '电池储能'] },
  { primary: '其他', secondaries: [] },
];
export const PRIMARY_INDUSTRIES = INDUSTRY_TREE.map((t) => t.primary);
export function secondaryIndustriesOf(primary: string): string[] {
  return INDUSTRY_TREE.find((t) => t.primary === primary)?.secondaries ?? [];
}
export const KNOWLEDGE_BASE_TYPES: KnowledgeBaseType[] = ['行业知识库', '企业公共知识库', '企业业务知识库'];
// 可配置内容形式只描述非结构化内容的组织形态；“问答对”“结构化记录”由知识板块固定，不进入该枚举。
export const CONTENT_FORMATS: ContentFormat[] = ['文章', '政策', '指南', '报告', '案例', '通知', '手册', '标准', '其他'];
export const VALIDITY_STATUSES: ValidityStatus[] = ['现行有效', '即将生效', '已失效', '待确认'];
export const AUDIENCE_OPTIONS = ['企业内部', '所有人'];
export const LANGUAGE_OPTIONS = ['简体中文', '繁体中文', '英语', '其他语言'];
export const PRIMARY_CATEGORIES: Record<KnowledgeBaseType, string[]> = {
  行业知识库: ['行业概览', '政策法规', '标准规范', '行业数据', '常见问题', '行业动态'],
  企业公共知识库: ['企业基础信息', '机构与组织', '用户服务', '企业通用问答', '联系与反馈', '网站使用帮助', '多语言与版本'],
  企业业务知识库: ['业务与服务', '产品与资源', '办事指南', '政策与制度', '数据与报告', '专业问答', '动态内容', 'Agent专用知识'],
};
export const SECONDARY_CATEGORIES: Record<string, string[]> = {
  '行业知识库::标准规范': ['国家标准', '行业标准'],
  '行业知识库::政策法规': ['国家政策', '地方政策'],
  '企业公共知识库::企业通用问答': ['账户与登录', '搜索与下载'],
  '企业公共知识库::用户服务': ['服务渠道', '投诉建议'],
  // 多语言配置：与营销话术同一套双来源模型——企业词条在 N3 编辑发布后同步写入此分类下的 Excel 副本；
  // 企业也可在此分类上传词条 Excel，经解析后在 N3 侧确认启用。本分类不支持在线编辑或切片编辑，仅供查看与深链回 N3。
  '企业公共知识库::多语言与版本': ['多语言配置'],
  '企业业务知识库::业务与服务': ['营销话术'],
  '企业业务知识库::产品与资源': ['产品信息', '产品手册'],
  '企业业务知识库::办事指南': ['申请材料', '办理流程'],
};
export const secondaryCategoriesOf = (type: KnowledgeBaseType, primary: string) => SECONDARY_CATEGORIES[`${type}::${primary}`] ?? [];

// ── 时间基准（原型固定"今天"，方便新鲜度/日期范围计算可复现）──────────
export const TODAY = '2026-07-02';
export function daysSince(dateStr: string, today: string = TODAY): number {
  const d1 = new Date(dateStr.slice(0, 10)).getTime();
  const d2 = new Date(today).getTime();
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}

// ── 企业行业配置：一个主行业 + 最多 N 个额外行业（§⑥行业知识配置）──────
// 每个行业都是"一级 + 二级"的一次完整选择；主行业代表企业自身所属行业，额外行业用于取用其它行业的行业知识。
// 未圈定的行业，其行业知识库内容本企业无法使用/导入；变更需遵守冷却期，见 canChangeEnterpriseIndustries。
export const MAX_EXTRA_INDUSTRIES = 2;
export const MAX_ENTERPRISE_INDUSTRIES = 1 + MAX_EXTRA_INDUSTRIES;
export const INDUSTRY_CHANGE_COOLDOWN_DAYS = 365;
export interface IndustrySelection { primary: string; secondary: string; }
export interface EnterpriseIndustryConfig {
  main: IndustrySelection | null;
  extras: IndustrySelection[];
  lastChangedAt: string;
}
export const mockEnterpriseIndustryConfig: EnterpriseIndustryConfig = {
  main: null,
  extras: [],
  lastChangedAt: '',
};
// 展示口径：选了二级就显示"一级 / 二级"，「其他」这类没有二级的只显示一级
export function industryLabel(sel: IndustrySelection): string {
  return sel.secondary ? `${sel.primary} / ${sel.secondary}` : sel.primary;
}
export function isSameIndustry(a: IndustrySelection, b: IndustrySelection): boolean {
  return a.primary === b.primary && a.secondary === b.secondary;
}
export function enterpriseIndustryList(cfg: EnterpriseIndustryConfig = mockEnterpriseIndustryConfig): IndustrySelection[] {
  return cfg.main ? [cfg.main, ...cfg.extras] : [...cfg.extras];
}
// 下游筛选/下拉的字符串口径：取选择中最细的一层
export function enterpriseIndustryValues(cfg: EnterpriseIndustryConfig = mockEnterpriseIndustryConfig): string[] {
  return enterpriseIndustryList(cfg).map((s) => s.secondary || s.primary);
}
export function canChangeEnterpriseIndustries(cfg: EnterpriseIndustryConfig = mockEnterpriseIndustryConfig): boolean {
  if (!cfg.main) return true; // 首次配置不受冷却期限制
  return daysSince(cfg.lastChangedAt) >= INDUSTRY_CHANGE_COOLDOWN_DAYS;
}
export function nextIndustryChangeDate(cfg: EnterpriseIndustryConfig = mockEnterpriseIndustryConfig): string {
  const d = new Date(cfg.lastChangedAt.slice(0, 10));
  d.setDate(d.getDate() + INDUSTRY_CHANGE_COOLDOWN_DAYS);
  return d.toISOString().slice(0, 10);
}
export function setEnterpriseIndustries(main: IndustrySelection, extras: IndustrySelection[]) {
  // ACTION: 更新企业行业配置（切换后原行业知识库不再从平台同步新版本，历史保留） [PUT] /api/kb/enterprise/industries
  mockEnterpriseIndustryConfig.main = main;
  mockEnterpriseIndustryConfig.extras = extras.slice(0, MAX_EXTRA_INDUSTRIES);
  mockEnterpriseIndustryConfig.lastChangedAt = TODAY;
}

// ── 新鲜度阈值：内容多久没更新算"过期"，按时效等级分级（天）───────────
export const FRESHNESS_DAYS: Record<Timeliness, number> = { 实时: 1, 小时: 3, 每日: 14, 静态: 180 };

// ── 日期范围筛选（事件计数类指标用：调用记录、引用次数等；"快照类"指标不用这个）──
export type DateRangeKey = 'today' | '7d' | '30d' | 'all';
export const DATE_RANGE_OPTS: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: '今天' }, { key: '7d', label: '近7天' }, { key: '30d', label: '近30天' }, { key: 'all', label: '全部' },
];
export function inDateRange(dateStr: string, range: DateRangeKey, today: string = TODAY): boolean {
  if (range === 'all') return true;
  const days = daysSince(dateStr, today);
  if (range === 'today') return days === 0;
  if (range === '7d') return days <= 7;
  return days <= 30;
}
export const PDF_PARSERS = ['DeepDOC', '朴素解析（Naive）', '纯文本提取', '不适用'];
export const DEDUP_STRATEGIES = ['关闭', '按标题+正文相似度', '按来源 URL', '按内容指纹（simhash）'];
// 去隐私策略：入库前可识别并脱敏的隐私信息类型
export const PRIVACY_MASK_TYPES = ['手机号', '身份证号', '邮箱地址', '银行卡号', '姓名', '家庭地址'];

// ── 自动元数据生成设置：可配置的自定义字段 schema（参考 RAGFlow） ──────
export interface MetadataFieldDef { field: string; desc: string; type: string; }
export const META_FIELD_TYPES = ['文本', '数字', '日期', '布尔'];
// 内置字段（系统固定提取，不可编辑，仅展示）
export const BUILTIN_METADATA_FIELDS: MetadataFieldDef[] = [
  { field: 'title', desc: '文档标题', type: '文本' },
  { field: 'source', desc: '来源方式', type: '文本' },
  { field: 'created_at', desc: '创建时间', type: '日期' },
];

// ── 门户网站（同一后台下的多个语言/地区站点，知识库共用、按需勾选适用站点）──
export interface PortalSite { id: string; name: string; lang: string; domain: string; }
export const mockPortalSites: PortalSite[] = [
  { id: 'site_cn', name: '中文站', lang: '中文', domain: 'www.anvil.com' },
  { id: 'site_en', name: '英文站', lang: 'English', domain: 'www.anvil.com/en' },
  { id: 'site_fr', name: '法文站', lang: 'Français', domain: 'www.anvil.com/fr' },
];
export const PORTAL_SITE_MAP: Record<string, PortalSite> = mockPortalSites.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }), {} as Record<string, PortalSite>,
);

// ── 基础枚举 ───────────────────────────────────────────────────────
export type SectionKey = 'document' | 'faq' | 'structured' | 'content' | 'web' | 'industry';
export type KnowledgeBaseType = '行业知识库' | '企业公共知识库' | '企业业务知识库';
export type ContentFormat = '文章' | '政策' | '指南' | '报告' | '案例' | '通知' | '手册' | '标准' | '其他' | '问答对' | '结构化记录';
export type ValidityStatus = '现行有效' | '即将生效' | '已失效' | '待确认';
export type KbStatus = 'draft' | 'published' | 'archived' | 'stale' | 'learning';
export type Timeliness = '实时' | '小时' | '每日' | '静态';
export type AccessLevel = '公开' | '内部' | '受限';
export type RetrievalMode = 'deterministic' | 'divergent'; // 确定性 / 发散

// ── 6 大知识板块（§3.1 + §5.7 处理速查表）────────────────────────────
export interface KbSection {
  key: SectionKey;
  index: string;           // ①②③…
  name: string;            // 文档知识
  en: string;              // Documents
  emoji: string;
  define: string;          // 一句话定义
  sample: string;          // 典型内容
  ingest: string;          // 录入触发
  process: string;         // 加工方式
  update: string;          // 更新机制
  evaluate: string;        // 评估重点
  retrieval: string;       // 主检索方式
  retrievalCls: string;    // 检索方式徽标色
  chunkMethod: string;     // 分块模板 chunk_method
  vectorWeight: number;    // 向量权重
  threshold: number;       // 相似度阈值
  rerank: string;          // Rerank 策略
  source5: string;         // 对应检索方案 5 类数据源
  docCount: number;        // 知识条目数
  health: number;          // 板块平均健康度
  // ── 检索配置（可编辑，§8.4）─────────────────────────────────────
  embeddingModel: string;       // Embedding 模型（'—' 表示不适用）
  topK: number;                 // 检索返回条数（0 表示不适用）
  metaChunkingEnabled: boolean; // 语义感知分块 Meta-Chunking（默认关闭，见 §5.8）
  // ── 切片解析方式（参考 RAGFlow 通用切片方法）───────────────────
  taskPageSize: number;             // 任务页面大小
  pdfParser: string;                // PDF 解析器
  chunkTokenSize: number;           // 建议文本块大小
  chunkDelimiter: string;           // 文本分段标识符
  useSubChunksForRetrieval: boolean;// 子文本块用于检索
  pageIndexEnabled: boolean;        // PageIndex
  imageTableContextWindow: number;  // 图像与表格上下文窗口
  autoMetadataEnabled: boolean;     // 自动元数据
  autoMetadataFields: MetadataFieldDef[]; // 自动元数据 — 自定义生成字段 schema（"设置"弹窗里维护，字段/描述/类型）
  autoKeywordCount: number;         // 自动关键词提取（每块提取数量，0=关闭）
  autoQuestionCount: number;        // 自动问题提取 / 反向问题生成 Doc2Query（每块生成数量，0=关闭，见 §5.8）
  // ── 入库前清洗与质量评估策略 ────────────────────────────────────
  privacyMaskEnabled: boolean;      // 隐私信息脱敏
  privacyMaskTypes: string[];       // 去隐私策略 — 选中需要识别并脱敏的信息类型
  dedupEnabled: boolean;            // 去重
  dedupStrategy: string;            // 去重策略
  qualityScoreThreshold: number;    // 质量打分拦截阈值（0-100，低于则保留草稿并提示质量问题）
}

// 进阶增强能力按板块的可用性（架构 §5.8）
export const metaChunkingEligible = (k: SectionKey): boolean => k === 'document' || k === 'industry' || k === 'content';
export const doc2queryEligible = (k: SectionKey): boolean => k === 'faq' || k === 'content';
export const embeddingEligible = (k: SectionKey): boolean => k === 'document' || k === 'content' || k === 'web' || k === 'industry';

export const SECTIONS: KbSection[] = [
  {
    key: 'document', index: '①', name: '文档知识', en: 'Documents', emoji: '📄',
    define: '成篇的非结构化正式文档',
    sample: '公司介绍、发展历程、白皮书、产品手册、说明书、资质证书、制度规范',
    ingest: '手动上传 / 对象存储', process: 'DeepDoc 高保真 + 父子分块',
    update: '指纹比对（静态）', evaluate: '解析保真 / 去重 / 版权',
    retrieval: '向量 RAG', retrievalCls: 'bg-indigo-50 text-indigo-600',
    chunkMethod: 'naive / presentation（父子分块）', vectorWeight: 0.3, threshold: 0.2, rerank: '文档开启',
    source5: '①企业基础文档 + ④a 静态轨', docCount: 38, health: 88,
    embeddingModel: 'bge-large-zh-v1.5', topK: 5, metaChunkingEnabled: false,
    taskPageSize: 12, pdfParser: 'DeepDOC', chunkTokenSize: 512, chunkDelimiter: '\\n',
    useSubChunksForRetrieval: false, pageIndexEnabled: false, imageTableContextWindow: 1,
    autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 0, autoQuestionCount: 0,
    privacyMaskEnabled: true, privacyMaskTypes: ['手机号', '身份证号', '邮箱地址'], dedupEnabled: true, dedupStrategy: '按内容指纹（simhash）', qualityScoreThreshold: 60,
  },
  {
    key: 'faq', index: '②', name: '问答知识', en: 'FAQ', emoji: '💬',
    define: '一问一答的结构化问答对',
    sample: '客服高频问答、退换货流程、操作指引、政策解读',
    ingest: '批量导入 / 后台发布', process: 'qa 分块 + 人工标签',
    update: 'API 增量覆盖（秒级）', evaluate: '答案准确 / 近义覆盖 / 冲突',
    retrieval: '倒排强命中（高阈值）', retrievalCls: 'bg-emerald-50 text-emerald-600',
    chunkMethod: 'qa（成对，禁切散）', vectorWeight: 0.2, threshold: 0.3, rerank: '关闭（防漂移）',
    source5: '③FAQ 问答', docCount: 156, health: 92,
    embeddingModel: '—', topK: 3, metaChunkingEnabled: false,
    taskPageSize: 12, pdfParser: '纯文本提取', chunkTokenSize: 128, chunkDelimiter: '\\n',
    useSubChunksForRetrieval: false, pageIndexEnabled: false, imageTableContextWindow: 0,
    autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 3, autoQuestionCount: 0,
    privacyMaskEnabled: true, privacyMaskTypes: ['手机号', '姓名'], dedupEnabled: true, dedupStrategy: '按标题+正文相似度', qualityScoreThreshold: 70,
  },
  {
    key: 'structured', index: '③', name: '结构化数据', en: 'Structured', emoji: '🗄️',
    define: '数据库里的字段型记录',
    sample: '产品参数、价格、库存、SKU、上下架状态、订单、会员等级',
    ingest: '连库 / 配置 MCP 工具', process: '不分块，MCP 工具直查',
    update: '实时直查 + 游标增量', evaluate: 'Schema / 枚举 / 慢查询',
    retrieval: '数据库 MCP', retrievalCls: 'bg-amber-50 text-amber-600',
    chunkMethod: '不分块（参数化查询）', vectorWeight: 0, threshold: 0, rerank: '不适用',
    source5: '④a 门户结构化业务数据', docCount: 4, health: 95,
    embeddingModel: '—', topK: 0, metaChunkingEnabled: false,
    taskPageSize: 0, pdfParser: '不适用', chunkTokenSize: 0, chunkDelimiter: '',
    useSubChunksForRetrieval: false, pageIndexEnabled: false, imageTableContextWindow: 0,
    autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 0, autoQuestionCount: 0,
    privacyMaskEnabled: false, privacyMaskTypes: [], dedupEnabled: false, dedupStrategy: '关闭', qualityScoreThreshold: 0,
  },
  {
    key: 'content', index: '④', name: '内容资产', en: 'Content', emoji: '📰',
    define: '成段的长文本内容',
    sample: '文章正文、新闻稿、营销文案、产品图文详情、案例、博客',
    ingest: 'CDC / 钩子 / 手动', process: '净化富文本 + 父子分块',
    update: '钩子 push（秒级）+ 轮询兜底', evaluate: '质量 / 合规 / 洗稿 / 关联',
    retrieval: '向量 + 倒排混合', retrievalCls: 'bg-blue-50 text-blue-600',
    chunkMethod: 'naive（父子分块）+ 标题倒排', vectorWeight: 0.5, threshold: 0.2, rerank: '开启',
    source5: '④b 门户内容型数据', docCount: 72, health: 81,
    embeddingModel: 'bge-large-zh-v1.5', topK: 5, metaChunkingEnabled: false,
    taskPageSize: 12, pdfParser: 'DeepDOC', chunkTokenSize: 384, chunkDelimiter: '\\n',
    useSubChunksForRetrieval: true, pageIndexEnabled: false, imageTableContextWindow: 1,
    autoMetadataEnabled: true, autoMetadataFields: [], autoKeywordCount: 5, autoQuestionCount: 3,
    privacyMaskEnabled: true, privacyMaskTypes: ['手机号', '姓名', '家庭地址'], dedupEnabled: true, dedupStrategy: '按标题+正文相似度', qualityScoreThreshold: 65,
  },
  {
    key: 'web', index: '⑤', name: '网络知识', en: 'Web', emoji: '🌐',
    define: '来自外部网址的网页内容',
    sample: '行业动态、竞品官网、新闻资讯、政策公告',
    ingest: '配置 URL + 定时', process: 'Firecrawl 清洗为纯净 Markdown',
    update: '定时增量 + 指纹 diff', evaluate: '抓取率 / 正文完整 / 可信度',
    retrieval: '向量 RAG', retrievalCls: 'bg-indigo-50 text-indigo-600',
    chunkMethod: 'naive', vectorWeight: 0.4, threshold: 0.2, rerank: '开启',
    source5: '②Web 网页', docCount: 23, health: 76,
    embeddingModel: 'bge-m3', topK: 5, metaChunkingEnabled: false,
    taskPageSize: 12, pdfParser: '纯文本提取', chunkTokenSize: 512, chunkDelimiter: '\\n',
    useSubChunksForRetrieval: false, pageIndexEnabled: false, imageTableContextWindow: 0,
    autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 3, autoQuestionCount: 0,
    privacyMaskEnabled: true, privacyMaskTypes: ['手机号', '邮箱地址'], dedupEnabled: true, dedupStrategy: '按来源 URL', qualityScoreThreshold: 55,
  },
  {
    key: 'industry', index: '⑥', name: '行业知识', en: 'Industry', emoji: '📚',
    define: '深度专业、篇幅大、需多跳推理的行业资料',
    sample: '行业研究报告、国家/行业标准、专业书籍、技术规范',
    ingest: '上传 / 绑定外部源', process: 'RAPTOR 多级摘要 + GraphRAG 图谱',
    update: '外部源增量轮询', evaluate: '权威 / 时效 / 图谱准确',
    retrieval: '向量 + 图谱辅助', retrievalCls: 'bg-purple-50 text-purple-600',
    chunkMethod: 'laws / book（RAPTOR + GraphRAG）', vectorWeight: 0.5, threshold: 0.2, rerank: '开启',
    source5: '⑤行业知识库', docCount: 11, health: 84,
    embeddingModel: 'bge-large-zh-v1.5', topK: 8, metaChunkingEnabled: false,
    taskPageSize: 24, pdfParser: 'DeepDOC', chunkTokenSize: 768, chunkDelimiter: '\\n',
    useSubChunksForRetrieval: true, pageIndexEnabled: true, imageTableContextWindow: 2,
    autoMetadataEnabled: true, autoMetadataFields: [], autoKeywordCount: 5, autoQuestionCount: 0,
    privacyMaskEnabled: true, privacyMaskTypes: ['身份证号', '姓名'], dedupEnabled: true, dedupStrategy: '按内容指纹（simhash）', qualityScoreThreshold: 70,
  },
];

export const SECTION_MAP: Record<SectionKey, KbSection> = SECTIONS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s }), {} as Record<SectionKey, KbSection>,
);

// ── 按内容形式细分的切片解析方式 ────────────────────────────────────
// 一个板块不再只能用一种切片方式：板块下按「内容形式」挂多条规则，'通用'是兜底规则（不可删），
// 其余规则命中同名内容形式的知识时优先生效。结构化数据板块不走切片，见 MCP_ACTIONS。
export const GENERAL_CONTENT_FORMAT = '通用';
export interface ChunkRule {
  contentFormat: string;            // '通用' 或某个内容形式（取值来自 CONTENT_FORMATS）
  chunkMethod: string;
  taskPageSize: number;
  pdfParser: string;
  chunkTokenSize: number;
  chunkDelimiter: string;
  useSubChunksForRetrieval: boolean;
  pageIndexEnabled: boolean;
  imageTableContextWindow: number;
  autoMetadataEnabled: boolean;
  autoMetadataFields: MetadataFieldDef[];
  autoKeywordCount: number;
  autoQuestionCount: number;
  metaChunkingEnabled: boolean;
}
// 板块自带的参数即该板块「通用」规则的初始值
export function generalChunkRule(s: KbSection): ChunkRule {
  return {
    contentFormat: GENERAL_CONTENT_FORMAT,
    chunkMethod: s.chunkMethod, taskPageSize: s.taskPageSize, pdfParser: s.pdfParser,
    chunkTokenSize: s.chunkTokenSize, chunkDelimiter: s.chunkDelimiter,
    useSubChunksForRetrieval: s.useSubChunksForRetrieval, pageIndexEnabled: s.pageIndexEnabled,
    imageTableContextWindow: s.imageTableContextWindow, autoMetadataEnabled: s.autoMetadataEnabled,
    autoMetadataFields: s.autoMetadataFields, autoKeywordCount: s.autoKeywordCount,
    autoQuestionCount: s.autoQuestionCount, metaChunkingEnabled: s.metaChunkingEnabled,
  };
}
// DataSlot: 各板块已额外配置的内容形式规则（'通用'之外的部分）
export const mockExtraChunkRules: Partial<Record<SectionKey, ChunkRule[]>> = {
  document: [
    { contentFormat: '政策', chunkMethod: 'laws', taskPageSize: 12, pdfParser: 'DeepDOC', chunkTokenSize: 768, chunkDelimiter: '\\n第[一二三四五六七八九十]+条', useSubChunksForRetrieval: true, pageIndexEnabled: true, imageTableContextWindow: 0, autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 3, autoQuestionCount: 0, metaChunkingEnabled: false },
    { contentFormat: '手册', chunkMethod: 'book', taskPageSize: 18, pdfParser: 'DeepDOC', chunkTokenSize: 768, chunkDelimiter: '\\n', useSubChunksForRetrieval: true, pageIndexEnabled: true, imageTableContextWindow: 1, autoMetadataEnabled: false, autoMetadataFields: [], autoKeywordCount: 3, autoQuestionCount: 0, metaChunkingEnabled: false },
  ],
  industry: [
    { contentFormat: '政策', chunkMethod: 'laws', taskPageSize: 12, pdfParser: 'DeepDOC', chunkTokenSize: 768, chunkDelimiter: '\\n第[一二三四五六七八九十]+条', useSubChunksForRetrieval: true, pageIndexEnabled: true, imageTableContextWindow: 0, autoMetadataEnabled: true, autoMetadataFields: [], autoKeywordCount: 5, autoQuestionCount: 0, metaChunkingEnabled: false },
    { contentFormat: '报告', chunkMethod: 'book', taskPageSize: 24, pdfParser: 'DeepDOC', chunkTokenSize: 1024, chunkDelimiter: '\\n', useSubChunksForRetrieval: true, pageIndexEnabled: true, imageTableContextWindow: 2, autoMetadataEnabled: true, autoMetadataFields: [], autoKeywordCount: 5, autoQuestionCount: 0, metaChunkingEnabled: true },
  ],
};

// 某条知识实际生效的切片规则：先按内容形式找专属规则，找不到回落到「通用」
export function resolveChunkRule(section: KbSection, contentFormat: string): ChunkRule {
  return (mockExtraChunkRules[section.key] ?? []).find((r) => r.contentFormat === contentFormat)
    ?? generalChunkRule(section);
}

// ── ⑤结构化数据：MCP 动作清单 ───────────────────────────────────────
// 该板块不做切片、不进向量库，而是通过 MCP 服务参数化查询业务关系库实时取数。
// 运营侧只决定"这个动作开不开"，具体 SQL / 表映射由平台在接入时配置好。
export interface McpAction {
  id: string;
  name: string;
  desc: string;
  source: string;   // 关联的业务表/视图
  params: string;   // 主要入参
  returns: string;  // 返回内容
  enabled: boolean;
}
export const mockMcpActions: McpAction[] = [
  { id: 'mcp_sku_detail', name: '商品详情', desc: '按商品编号或名称返回规格、参数、卖点、适用场景', source: 'product / product_spec', params: 'sku_id 或 keyword', returns: '规格参数、卖点、图文详情链接', enabled: true },
  { id: 'mcp_stock', name: '库存查询', desc: '返回指定商品在各仓库/门店的可用库存与预计到货', source: 'inventory', params: 'sku_id、warehouse_id（可选）', returns: '可用库存、在途数量、预计到货日', enabled: true },
  { id: 'mcp_price', name: '价格与促销', desc: '返回当前挂牌价、阶梯价与生效中的促销活动', source: 'price / promotion', params: 'sku_id、quantity（可选）', returns: '单价、阶梯价、活动名称与有效期', enabled: true },
  { id: 'mcp_order_status', name: '订单状态', desc: '按订单号查询下单、支付、发货、签收各节点状态', source: 'sales_order', params: 'order_no + 手机号后四位', returns: '订单状态、金额、明细行', enabled: true },
  { id: 'mcp_logistics', name: '物流跟踪', desc: '按运单号返回承运商与最新轨迹节点', source: 'shipment / carrier_track', params: 'order_no 或 waybill_no', returns: '承运商、当前节点、轨迹明细', enabled: false },
  { id: 'mcp_store', name: '门店与网点', desc: '按城市或坐标返回最近的门店、服务网点及营业时间', source: 'store', params: 'city 或 lng/lat、radius', returns: '门店名称、地址、电话、营业时间', enabled: false },
  { id: 'mcp_after_sale', name: '售后工单', desc: '查询售后工单进度，或校验商品是否在保修期内', source: 'service_ticket / warranty', params: 'ticket_no 或 sn_code', returns: '工单状态、处理人、保修截止日', enabled: false },
  { id: 'mcp_invoice', name: '开票信息', desc: '查询订单开票状态与发票抬头信息', source: 'invoice', params: 'order_no', returns: '开票状态、发票类型、抬头', enabled: false },
  { id: 'mcp_booking', name: '可预约时段', desc: '返回上门安装/勘测的可预约时段与剩余名额', source: 'booking_slot', params: 'city、service_type、date_range', returns: '可选时段、剩余名额', enabled: false },
];

// 板块"怎么处理/检索"的运营白话（只读能力总览用）
export const BOARD_HOWTO: Record<SectionKey, { handle: string; retrieve: string }> = {
  document: { handle: '上传后自动识别版面与表格，按章节+段落切分学习', retrieve: '按语义找最相关的段落，带出处回答' },
  faq: { handle: '一问一答整条学习，可补近义问法', retrieve: '关键词强命中标准答案，准而稳' },
  structured: { handle: '不复制内容，连接数据库实时查询', retrieve: '按字段精确筛选/排序/计数，0 延迟' },
  content: { handle: '网站发布后自动同步，按段落学习', retrieve: '语义+标题混合匹配，适合问答与内容生成' },
  web: { handle: '按设定频率自动抓取外部网页正文', retrieve: '按语义找相关网页内容' },
  industry: { handle: '深度长资料做多级摘要，支持跨文档对比', retrieve: '多跳推理，适合行业分析' },
};

// ── 来源方式：资产直接携带"怎么来的"，不再单独建一层数据源实体 ──────────
// RAGFlow 的心智模型：知识库（=我们的板块，已配置好处理方式）里直接是一张扁平文件列表，
// 新增内容 = 在列表上选一种来源方式当场生成一行，不需要先建一个独立的"数据源"再挂内容。
export type ConnectType = '上传文件' | '前台页面' | '后台页面' | '外部网址' | '平台';
export const CONNECT_TYPES: ConnectType[] = ['上传文件', '前台页面', '后台页面', '外部网址', '平台'];
export const SYNC_TYPES = ['实时同步', '定时同步', '手动'];
export const DS_FREQ_OPTS = ['实时', '每小时', '每日', '每周', '手动'];

// 来源方式徽标配色
export const CONNECT_CLS: Record<ConnectType, string> = {
  上传文件: 'bg-gray-100 text-gray-600',
  前台页面: 'bg-blue-50 text-blue-600',
  后台页面: 'bg-green-50 text-green-600',
  外部网址: 'bg-indigo-50 text-indigo-600',
  平台: 'bg-fuchsia-50 text-fuchsia-600',
};

// 来源方式决定同步机制的建议值（新增内容时自动带出，可再改）
// 注：函数体在调用时才求值，故可安全引用下方声明的 boardSync/syncToFreq
export function defaultSyncForConnect(connect: ConnectType, board: SectionKey): { sync: string; freq: string } {
  switch (connect) {
    case '外部网址': return { sync: '定时同步', freq: '每日' };
    case '上传文件': return { sync: '手动', freq: '手动' };
    case '前台页面': { const sync = boardSync(board); return { sync, freq: syncToFreq(sync) }; }
    case '后台页面': return { sync: '手动', freq: '手动' };
    case '平台': return { sync: '手动', freq: '手动' };
    default: return { sync: '手动', freq: '手动' };
  }
}

export type SourceDataMode = '导航结构' | '页面正文' | '结构化字段' | '页面正文+结构化字段';
export interface FrontendStructuredField {
  field: string;
  label: string;
  type: string;
  example: string;
}

// ── DataSlot: 前台网站结构（站点 → 导航路径 → 页面）──────────────────
// 研发侧已提供前台网站结构；运营这里只看到可选择的前台页面。
export interface FrontendPageItem {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  route: string;
  navPath: string[];
  pageType: string;
  contentSource: string;
  sourceDataMode: SourceDataMode;
  board: SectionKey;     // 默认归属板块（运营可在添加时改成其它板块）
  structuredFields?: FrontendStructuredField[];
  bindings?: string[];
}
export interface FrontendNavGroup { siteId: string; siteName: string; navPath: string[]; pages: FrontendPageItem[]; }

// 入库方式跟着「归属板块」走：板块决定怎么处理/怎么更新
export const boardSync = (board: SectionKey): string =>
  board === 'document' ? '手动'
    : board === 'web' || board === 'industry' ? '定时同步'
    : '实时同步';
export const syncToFreq = (sync: string): string =>
  sync === '定时同步' ? '每日' : sync === '手动' ? '手动' : '实时';
export const syncToNext = (sync: string, structured?: boolean): string =>
  sync === '手动' ? '—' : sync === '定时同步' ? '次日' : structured ? '实时' : '内容更新时';

export const mockFrontendSiteTree: FrontendNavGroup[] = [
  { siteId: 'site_cn', siteName: '中文站', navPath: ['首页'], pages: [
    { id: 'fp_home_cn', siteId: 'site_cn', siteName: '中文站', title: '首页', route: '/', navPath: ['首页'], pageType: '首页', contentSource: '站点导航与首页模块', sourceDataMode: '导航结构', board: 'content', bindings: ['banner', 'featuredProducts', 'latestNews'] },
  ] },
  { siteId: 'site_cn', siteName: '中文站', navPath: ['企业概况'], pages: [
    { id: 'fp_intro_cn', siteId: 'site_cn', siteName: '中文站', title: '企业介绍', route: '/about', navPath: ['企业概况', '企业介绍'], pageType: '内容页', contentSource: '前台页面正文', sourceDataMode: '页面正文', board: 'content', bindings: ['article.body'] },
    { id: 'fp_history_cn', siteId: 'site_cn', siteName: '中文站', title: '发展历程', route: '/about/history', navPath: ['企业概况', '发展历程'], pageType: '时间轴页', contentSource: '前台页面正文', sourceDataMode: '页面正文+结构化字段', board: 'content', structuredFields: [
      { field: 'year', label: '年份', type: 'number', example: '2026' },
      { field: 'milestone', label: '里程碑', type: 'text', example: '新产线投产' },
    ], bindings: ['timeline.items'] },
    { id: 'fp_honor_cn', siteId: 'site_cn', siteName: '中文站', title: '荣誉资质', route: '/about/honor', navPath: ['企业概况', '荣誉资质'], pageType: '下载/证书页', contentSource: '前台附件与证书列表', sourceDataMode: '页面正文+结构化字段', board: 'document', structuredFields: [
      { field: 'certificate_name', label: '证书名称', type: 'text', example: 'ISO9001' },
      { field: 'valid_until', label: '有效期', type: 'date', example: '2028-12-31' },
    ], bindings: ['certificates.list'] },
  ] },
  { siteId: 'site_cn', siteName: '中文站', navPath: ['产品中心'], pages: [
    { id: 'fp_products_cn', siteId: 'site_cn', siteName: '中文站', title: '产品列表', route: '/products', navPath: ['产品中心', '产品列表'], pageType: '列表页', contentSource: '前台产品列表数据', sourceDataMode: '结构化字段', board: 'structured', structuredFields: [
      { field: 'sku', label: 'SKU', type: 'text', example: 'KFR-35' },
      { field: 'price', label: '价格', type: 'number', example: '1299' },
      { field: 'stock', label: '库存', type: 'number', example: '260' },
      { field: 'status', label: '上下架状态', type: 'text', example: '在售' },
    ], bindings: ['products.list', 'products.filters'] },
    { id: 'fp_product_detail_cn', siteId: 'site_cn', siteName: '中文站', title: 'KFR-35 空气滤清器详情', route: '/products/kfr-35', navPath: ['产品中心', '空气滤清器', 'KFR-35'], pageType: '详情页', contentSource: '前台产品详情页', sourceDataMode: '页面正文+结构化字段', board: 'content', structuredFields: [
      { field: 'model', label: '型号', type: 'text', example: 'KFR-35' },
      { field: 'fitment', label: '适配车型', type: 'text', example: 'Anvil A7' },
      { field: 'maintenance_cycle', label: '保养周期', type: 'text', example: '10000 公里 / 半年' },
    ], bindings: ['product.detail', 'product.specs', 'product.gallery'] },
  ] },
  { siteId: 'site_cn', siteName: '中文站', navPath: ['服务支持'], pages: [
    { id: 'fp_download_cn', siteId: 'site_cn', siteName: '中文站', title: '文件下载', route: '/support/downloads', navPath: ['服务支持', '文件下载'], pageType: '下载页', contentSource: '前台资料下载列表', sourceDataMode: '页面正文+结构化字段', board: 'document', structuredFields: [
      { field: 'file_name', label: '文件名', type: 'text', example: 'Anvil 产品白皮书.pdf' },
      { field: 'file_type', label: '文件类型', type: 'text', example: 'PDF' },
    ], bindings: ['downloads.files'] },
  ] },
  { siteId: 'site_cn', siteName: '中文站', navPath: ['新闻资讯'], pages: [
    { id: 'fp_news_cn', siteId: 'site_cn', siteName: '中文站', title: '新闻资讯', route: '/news', navPath: ['新闻资讯'], pageType: '列表页', contentSource: '前台新闻列表与详情', sourceDataMode: '页面正文+结构化字段', board: 'content', structuredFields: [
      { field: 'title', label: '标题', type: 'text', example: '新品发布' },
      { field: 'published_at', label: '发布时间', type: 'date', example: '2026-06-29' },
    ], bindings: ['news.list', 'news.detail'] },
  ] },
  { siteId: 'site_cn', siteName: '中文站', navPath: ['联系我们'], pages: [
    { id: 'fp_stores_cn', siteId: 'site_cn', siteName: '中文站', title: '企业网点', route: '/contact/stores', navPath: ['联系我们', '企业网点'], pageType: '网点页', contentSource: '前台网点列表', sourceDataMode: '结构化字段', board: 'structured', structuredFields: [
      { field: 'store_name', label: '网点名称', type: 'text', example: '上海服务中心' },
      { field: 'address', label: '地址', type: 'text', example: '上海市浦东新区...' },
      { field: 'phone', label: '电话', type: 'text', example: '400-800-0000' },
    ], bindings: ['stores.list', 'stores.map'] },
  ] },
];

// ── DataSlot: 企业后台页面（应用 → 页面）──────────────────────────
// 后台页面与前台页面一样，只能作为“内容资产”或“结构化数据”接入。
export interface BackendPageSource {
  id: string;
  applicationName: string;
  pageName: string;
  backendPath: string;
  frontendRoute: string;
  sourceDataMode: '页面正文' | '结构化字段' | '页面正文+结构化字段';
  contentCount: number;
  updatedAt: string;
}

export const mockBackendPageSources: BackendPageSource[] = [
  { id: 'be_tender', applicationName: '采购招标', pageName: '采购招标列表', backendPath: 'tender.list', frontendRoute: '/tenders', sourceDataMode: '页面正文+结构化字段', contentCount: 86, updatedAt: '2026-08-12 16:20' },
  { id: 'be_tender_result', applicationName: '采购招标', pageName: '中标公告', backendPath: 'tender.result', frontendRoute: '/tenders/results', sourceDataMode: '页面正文', contentCount: 41, updatedAt: '2026-08-12 16:18' },
  { id: 'be_custom_page', applicationName: '说明页', pageName: '自定义内容页', backendPath: 'page.content', frontendRoute: '/pages/:slug', sourceDataMode: '页面正文', contentCount: 24, updatedAt: '2026-08-11 10:08' },
  { id: 'be_city_product', applicationName: '城市产品分站', pageName: '城市产品列表', backendPath: 'city_product.list', frontendRoute: '/city/:city/products', sourceDataMode: '结构化字段', contentCount: 318, updatedAt: '2026-08-13 09:12' },
  { id: 'be_news', applicationName: '云资讯', pageName: '资讯列表与详情', backendPath: 'news.list', frontendRoute: '/news', sourceDataMode: '页面正文+结构化字段', contentCount: 152, updatedAt: '2026-08-13 08:45' },
  { id: 'be_news_category', applicationName: '云资讯', pageName: '资讯分类', backendPath: 'news.category', frontendRoute: '/news/categories', sourceDataMode: '结构化字段', contentCount: 18, updatedAt: '2026-08-13 08:40' },
  { id: 'be_inner_collect', applicationName: '内页辅助收录', pageName: '内容收录列表', backendPath: 'content_collection.list', frontendRoute: '/content/:slug', sourceDataMode: '页面正文+结构化字段', contentCount: 43, updatedAt: '2026-08-10 14:30' },
];

// ── DataSlot: 知识资产目录（全部板块，跨门户网站共用检索，按需勾选适用站点）──
export interface KbAsset {
  id: string;
  name: string;
  section: SectionKey;
  connect: ConnectType;    // 来源方式（上传文件/前台页面/后台页面/外部网址/平台）
  sync?: string;           // 同步方式（无=一次性入库，如上传文件/后台页面录入）
  freq?: string;
  lastSync?: string;
  nextSync?: string;
  syncStatus?: 'ok' | 'running' | 'failed' | 'paused'; // 同步/抓取运行状态
  groupLabel?: string;     // 来源分组名（同一批网址/同一个 bucket 一次性录入时共享，仅用于列表里聚合展示，不是独立实体）
  note?: string;           // 运营备注（自由文本）
  summary?: string;        // 知识摘要（可由 AI 生成，用户编辑后以用户值为准）
  folderId?: string;       // 知识目录分组（人工手动归类用，纯分组作用，不参与处理方式；空=其它知识）
  frontendPageId?: string; // 前台页面 id（来自前台网站结构）
  frontendRoute?: string;  // 前台页面路由，用于用户提问时定位页面上下文
  frontendNavPath?: string;// 前台导航路径，如 产品中心 / 空气滤清器 / KFR-35
  backendPageId?: string;  // 后台应用/数据源页面 id
  backendPath?: string;    // 后台数据来源标识，如 news.list
  fileSize?: string;       // 文件大小（文档知识/上传文件类目使用，如"2.4 MB"）
  siteUrl?: string;        // 抓取来源网址（web 知识板块使用，用于展示"使用网站"并可点击跳转）
  sourceDataMode?: SourceDataMode; // 页面来源数据形态
  structuredFields?: string[]; // 页面结构化字段名，进入元数据过滤与工具调用提示
  knowledgeBaseType: KnowledgeBaseType; // 业务归属/复用范围，与 section（处理板块）独立
  industry: string;
  primaryCategory: string;
  secondaryCategory: string;
  contentFormat: ContentFormat;
  validityStatus: ValidityStatus; // 内容有效性，与生命周期 status 独立
  source: string;              // 业务可读来源；精确页码/URL/表名仍存 sourceRef
  audience?: string;
  language?: string;
  portalSites: string[];   // 适用门户网站（PortalSite id 列表；空数组=全部站点通用）
  businessTag: string;     // 业务用途
  scene: string;           // 适用场景
  timeliness: Timeliness;
  access: AccessLevel;
  status: KbStatus;
  health: number;
  chunks: number;          // 分块数
  createdAt: string;       // 创建时间
  createdBy: string;       // 创建人（人工上传为姓名，同步/抓取为系统来源）
  reviewed?: boolean;      // 答案准确性人工审核（仅②问答知识板块的门禁检查用到）
  customFields?: Record<string, string>; // 自定义元数据字段值（字段定义见 mockCustomSchemaFields，全部板块通用）
  updatedAt: string;       // 最近更新时间
  tags: string[];          // 标签（品牌/型号/关键词等，进倒排 meta_fields，架构 §5.4/§7.1）
  // 溯源
  sourceRef: string;       // 原文 URL / 文件名+页码 / 表名 / 标准号
  industrySourceId?: string;      // 若来自平台行业知识库导入，记录来源条目 id
  industrySourceVersion?: number; // 导入时对应的平台行业知识库版本号
}

// ── DataSlot: 平台行业知识库（由平台管理员统一维护，跨全部企业客户共享）──────
// 企业侧仅可浏览并导入到本企业知识资产目录，不支持直接新增或编辑原文。
export interface IndustryLibraryItem {
  id: string;
  industry: string;
  name: string;
  primaryCategory: string;
  secondaryCategory: string;
  contentFormat: ContentFormat;
  validityStatus: ValidityStatus;
  source: string;
  audience?: string;
  language?: string;
  version: number;
  updatedAt: string;
  chunks: number;
}

export const mockIndustryLibrary: IndustryLibraryItem[] = [
  { id: 'lib_energy_1', industry: '能源、矿产与资源', name: '《新能源行业白皮书 2026》', primaryCategory: '行业数据', secondaryCategory: '', contentFormat: '报告', validityStatus: '现行有效', source: '行业研究报告', audience: '从业人员', language: '简体中文', version: 1, updatedAt: '2026-05-30', chunks: 412 },
  { id: 'lib_energy_2', industry: '能源、矿产与资源', name: '新能源补贴政策汇编（2026）', primaryCategory: '政策法规', secondaryCategory: '', contentFormat: '政策', validityStatus: '现行有效', source: '国家能源局', audience: '企业', language: '简体中文', version: 1, updatedAt: '2026-06-10', chunks: 96 },
  { id: 'lib_mfg_1', industry: '制造业与工业', name: 'GB/T 18488 标准', primaryCategory: '标准规范', secondaryCategory: '国家标准', contentFormat: '政策', validityStatus: '现行有效', source: '国家标准资料库', audience: '企业', language: '简体中文', version: 2, updatedAt: '2026-06-25', chunks: 168 },
  { id: 'lib_mfg_2', industry: '制造业与工业', name: '制造业智能化转型白皮书', primaryCategory: '行业概览', secondaryCategory: '', contentFormat: '报告', validityStatus: '现行有效', source: '行业协会', audience: '从业人员', language: '简体中文', version: 1, updatedAt: '2026-06-18', chunks: 210 },
  { id: 'lib_mfg_3', industry: '制造业与工业', name: '制造业行业常见问题汇编', primaryCategory: '常见问题', secondaryCategory: '', contentFormat: '指南', validityStatus: '现行有效', source: '行业协会', audience: '从业人员', language: '简体中文', version: 1, updatedAt: '2026-06-05', chunks: 58 },
];

// PAGINATION: page,pageSize
export const mockAssets: KbAsset[] = [
  { id: 'k1', name: 'Anvil 产品白皮书.pdf', section: 'document', connect: '上传文件', sync: '手动', freq: '手动', lastSync: '2026-06-01', nextSync: '—', syncStatus: 'ok', fileSize: '4.8 MB', industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '产品与资源', secondaryCategory: '产品手册', contentFormat: '手册', validityStatus: '现行有效', source: '企业产品资料', audience: '企业', language: '简体中文', portalSites: ['site_cn', 'site_en'], businessTag: '售前', scene: '客服', timeliness: '静态', access: '公开', status: 'published', health: 91, chunks: 248, createdAt: '2026-05-20', createdBy: '王芳（内容运营）', updatedAt: '2026-06-01', tags: ['Anvil', '白皮书', '保修条款'], sourceRef: 'Anvil 产品白皮书.pdf · p.12 §3.2' },
  { id: 'k2', name: '常见问题 · 退换货流程 FAQ（120 条）', section: 'faq', connect: '后台页面', backendPageId: 'be_custom_page', backendPath: 'page.content', sync: '手动', freq: '手动', lastSync: '2026-06-29 09:15', nextSync: '—', syncStatus: 'ok', reviewed: true, sourceDataMode: '结构化字段', structuredFields: ['question', 'answer'], industry: '商业、零售与电子商务', knowledgeBaseType: '企业公共知识库', primaryCategory: '企业通用问答', secondaryCategory: '账户与登录', contentFormat: '问答对', validityStatus: '现行有效', source: '企业帮助中心', audience: '公众', language: '简体中文', portalSites: [], businessTag: '售后', scene: '客服', timeliness: '小时', access: '公开', status: 'published', health: 94, chunks: 120, createdAt: '2026-04-02', createdBy: '系统同步 · 后台发布', updatedAt: '2026-06-18', tags: ['退货', '换货', '售后流程'], sourceRef: '企业帮助中心 · 标准问：怎么退货' },
  { id: 'k3', name: '产品列表 · 规格/价格/库存', section: 'structured', connect: '前台页面', sync: '实时同步', freq: '实时', lastSync: '刚刚', nextSync: '实时', syncStatus: 'ok', frontendPageId: 'fp_products_cn', frontendRoute: '/products', frontendNavPath: '产品中心 / 产品列表', sourceDataMode: '结构化字段', structuredFields: ['sku', 'price', 'stock', 'status'], industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '数据与报告', secondaryCategory: '', contentFormat: '结构化记录', validityStatus: '现行有效', source: '企业产品数据库', audience: '企业', language: '简体中文', portalSites: [], businessTag: '售前', scene: '客服', timeliness: '实时', access: '公开', status: 'published', health: 96, chunks: 0, createdAt: '2026-01-07', createdBy: '系统同步 · 前台页面', updatedAt: '2026-06-29', tags: ['价格', '库存', 'SKU'], sourceRef: '前台页面 /products · MCP search_products' },
  { id: 'k4', name: 'KFR-35 空气滤清器图文详情', section: 'content', connect: '前台页面', sync: '实时同步', freq: '实时', lastSync: '2026-06-25 14:02', nextSync: '内容更新时', syncStatus: 'ok', frontendPageId: 'fp_product_detail_cn', frontendRoute: '/products/kfr-35', frontendNavPath: '产品中心 / 空气滤清器 / KFR-35', sourceDataMode: '页面正文+结构化字段', structuredFields: ['model', 'fitment', 'maintenance_cycle'], industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '产品与资源', secondaryCategory: '产品信息', contentFormat: '文章', validityStatus: '现行有效', source: '企业产品中心', audience: '企业', language: '简体中文', portalSites: ['site_cn', 'site_en'], businessTag: '售前', scene: '客服/内容生成', timeliness: '每日', access: '公开', status: 'published', health: 83, chunks: 36, createdAt: '2026-03-15', createdBy: '系统同步 · 前台页面', updatedAt: '2026-06-25', tags: ['KFR-35', '空气滤清器', '滤芯保养'], sourceRef: '前台页面 /products/kfr-35 · 发布于 06-25' },
  { id: 'k5', name: '竞品官网监控（每日抓取）', section: 'web', connect: '外部网址', sync: '定时同步', freq: '每日', lastSync: '2026-06-28 02:00', nextSync: '2026-06-30 02:00', syncStatus: 'failed', siteUrl: 'https://competitor.example/products', groupLabel: '行业资讯源', note: '重点关注竞品价格与新品发布', industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '产品与资源', secondaryCategory: '产品信息', contentFormat: '文章', validityStatus: '现行有效', source: '企业产品中心', audience: '企业', language: '简体中文', portalSites: ['site_cn'], businessTag: '营销', scene: '内容生成', timeliness: '每日', access: '内部', status: 'stale', health: 68, chunks: 54, createdAt: '2026-02-10', createdBy: '系统抓取 · 定时任务', updatedAt: '2026-06-20', tags: ['竞品', '行业动态', '营销素材'], sourceRef: 'https://competitor.example/products · 抓取于 06-20' },
  { id: 'k11', name: '行业协会官网监控（每日抓取）', section: 'web', connect: '外部网址', sync: '定时同步', freq: '每日', lastSync: '2026-06-29 02:00', nextSync: '2026-06-30 02:00', syncStatus: 'ok', siteUrl: 'https://auto.gasgoo.com/news', groupLabel: '行业资讯源', note: '重点关注竞品价格与新品发布', industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '产品与资源', secondaryCategory: '产品信息', contentFormat: '文章', validityStatus: '现行有效', source: '企业产品中心', audience: '企业', language: '简体中文', portalSites: ['site_cn'], businessTag: '营销', scene: '内容生成', timeliness: '每日', access: '内部', status: 'published', health: 79, chunks: 31, createdAt: '2026-06-29', createdBy: '系统抓取 · 定时任务', updatedAt: '2026-06-29', tags: ['行业协会', '行业动态'], sourceRef: 'https://auto.gasgoo.com/news · 抓取于 06-29' },
  { id: 'k6', name: '《新能源行业白皮书 2026》', section: 'industry', connect: '平台', sync: '定时同步', freq: '每周', lastSync: '2026-06-27', nextSync: '2026-07-04', syncStatus: 'ok', industry: '能源、矿产与资源', knowledgeBaseType: '行业知识库', primaryCategory: '行业数据', secondaryCategory: '', contentFormat: '报告', validityStatus: '现行有效', source: '行业研究报告', audience: '从业人员', language: '简体中文', portalSites: ['site_en', 'site_fr'], businessTag: '营销', scene: '内容生成', timeliness: '静态', access: '内部', status: 'published', health: 87, chunks: 412, createdAt: '2026-05-28', createdBy: '李明（内容运营）', updatedAt: '2026-05-30', tags: ['新能源', 'H2C', 'RAPTOR摘要'], sourceRef: '新能源行业白皮书 2026.pdf · RAPTOR 摘要节点', industrySourceId: 'lib_energy_1', industrySourceVersion: 1 },
  { id: 'k7', name: '618 大促营销落地页（待发布）', section: 'content', connect: '前台页面', frontendPageId: 'fp_campaign_618_cn', frontendRoute: '/campaign/618', frontendNavPath: '营销活动 / 618 大促', sourceDataMode: '页面正文', industry: '商业、零售与电子商务', knowledgeBaseType: '企业公共知识库', primaryCategory: '企业通用问答', secondaryCategory: '账户与登录', contentFormat: '通知', validityStatus: '现行有效', source: '企业前台网站', audience: '所有人', language: '简体中文', portalSites: ['site_cn'], businessTag: '营销', scene: '内容生成', timeliness: '小时', access: '公开', status: 'draft', health: 0, chunks: 0, createdAt: '2026-06-28', createdBy: '内容生成智能体', updatedAt: '2026-06-28', tags: ['618', '大促', '营销活动'], sourceRef: '前台页面 /campaign/618 · 内容生成智能体创建草稿' },
  { id: 'k8', name: '镀锌板工艺流程.pdf', section: 'document', connect: '上传文件', sync: '手动', freq: '手动', lastSync: '2026-06-09', nextSync: '—', syncStatus: 'failed', fileSize: '1.1 MB', industry: '制造业与工业', knowledgeBaseType: '企业业务知识库', primaryCategory: '产品与资源', secondaryCategory: '产品手册', contentFormat: '手册', validityStatus: '现行有效', source: '企业产品资料', audience: '企业', language: '简体中文', portalSites: ['site_cn'], businessTag: '售前', scene: '客服', timeliness: '静态', access: '内部', status: 'learning', health: 0, chunks: 0, createdAt: '2026-06-09', createdBy: '王芳（内容运营）', updatedAt: '2026-06-09', tags: ['镀锌板', '工艺流程', '正在学习'], sourceRef: '镀锌板工艺流程.pdf（正在解析和建立索引）' },
  { id: 'k9', name: '医疗站 · 导诊 FAQ', section: 'faq', connect: '后台页面', backendPageId: 'be_city_product', backendPath: 'city_product.list', sync: '手动', freq: '手动', lastSync: '2026-06-29 09:15', nextSync: '—', syncStatus: 'ok', sourceDataMode: '结构化字段', structuredFields: ['question', 'answer'], industry: '医疗、健康与养老', knowledgeBaseType: '企业公共知识库', primaryCategory: '用户服务', secondaryCategory: '服务渠道', contentFormat: '问答对', validityStatus: '现行有效', source: '医疗站帮助中心', audience: '个人', language: '简体中文', portalSites: ['site_cn'], businessTag: '售前', scene: '客服', timeliness: '小时', access: '公开', status: 'published', health: 90, chunks: 88, createdAt: '2026-01-09', createdBy: '系统同步 · 后台发布', updatedAt: '2026-06-15', tags: ['导诊', '挂号', '医疗流程'], sourceRef: '医疗站帮助中心 · 标准问：挂号流程' },
  { id: 'k10', name: '旧版 GB/T 18488 标准（已替代）', section: 'industry', connect: '平台', sync: '定时同步', freq: '每周', lastSync: '2026-06-20', nextSync: '2026-06-27', syncStatus: 'failed', industry: '制造业与工业', knowledgeBaseType: '行业知识库', primaryCategory: '标准规范', secondaryCategory: '国家标准', contentFormat: '政策', validityStatus: '已失效', source: '国家标准资料库', audience: '企业', language: '简体中文', portalSites: [], businessTag: '售前', scene: '内容生成', timeliness: '静态', access: '内部', status: 'archived', health: 41, chunks: 156, createdAt: '2025-08-01', createdBy: '张伟（内容运营）', updatedAt: '2026-03-12', tags: ['GB/T 18488', '已替代', '待归档'], sourceRef: 'GB/T 18488-2015（已被 2025 版替代）', industrySourceId: 'lib_mfg_1', industrySourceVersion: 1 },
  { id: 'k12', name: '制造业行业常见问题汇编', section: 'industry', connect: '平台', sync: '定时同步', freq: '每周', lastSync: '2026-06-06', nextSync: '2026-06-13', syncStatus: 'ok', industry: '制造业与工业', knowledgeBaseType: '行业知识库', primaryCategory: '常见问题', secondaryCategory: '', contentFormat: '指南', validityStatus: '现行有效', source: '行业协会', audience: '从业人员', language: '简体中文', portalSites: [], businessTag: '售前', scene: '客服', timeliness: '静态', access: '内部', status: 'published', health: 88, chunks: 58, createdAt: '2026-06-05', createdBy: '张伟（内容运营）', updatedAt: '2026-06-05', tags: ['制造业', 'FAQ', '行业知识库'], sourceRef: '行业知识库 · 制造业行业常见问题汇编（v1）', industrySourceId: 'lib_mfg_3', industrySourceVersion: 1 },
];

// 原型内的轻量共享仓库：让目录新增/编辑后，详情页能读取到同一份 mock 数据。
export const getKnowledgeAsset = (id: string) => mockAssets.find((a) => a.id === id);
export function upsertKnowledgeAsset(asset: KbAsset) {
  const index = mockAssets.findIndex((a) => a.id === asset.id);
  if (index === -1) mockAssets.unshift(asset);
  else mockAssets[index] = asset;
}
export function removeKnowledgeAsset(id: string) {
  const index = mockAssets.findIndex((a) => a.id === id);
  if (index >= 0) mockAssets.splice(index, 1);
}
export function upsertKnowledgeAssets(assets: KbAsset[]) {
  assets.forEach(upsertKnowledgeAsset);
}

export const assetsOfBoard = (board: SectionKey) => mockAssets.filter((a) => a.section === board);
export const syncableAssets = mockAssets.filter((a) => !!a.sync);

// ── DataSlot: 分块级预览（内容预览 + 切片问题标记，架构 §5/§6.1）──────
export const CHUNK_TYPES = ['Text', 'Table', 'QA', 'Image'];
export interface AssetChunk {
  id: string;
  index: number;              // 父块序号（qa/row 各自独立编号）
  level: 'parent' | 'child' | 'qa' | 'row';
  parentIndex?: number;       // 子块所属的父块序号
  type: string;                // 解析块类型（Text/Table/QA/Image）
  text: string;
  tokens: number;
  embedded: boolean;          // 是否已生成向量
  enabled: boolean;           // 是否启用（参与检索）
  keywords: string[];         // 关键词（人工/自动关键词提取补充）
  questions: string[];        // 可能的提问方式（人工/自动问题提取补充，即 Doc2Query）
  tags: string[];              // 标签
  issues?: string[];          // 该切片的问题（表格切碎/空块/待重新解析等）
}

export const mockAssetChunks: Record<string, AssetChunk[]> = {
  k1: [
    { id: 'k1c1', index: 1, level: 'parent', type: 'Text', text: '第三章 产品规格与技术参数：本章介绍 Anvil 系列产品的核心技术指标，包括承重、耐候、防护等级等国标测试数据……', tokens: 612, embedded: true, enabled: true, keywords: ['技术参数', '国标测试'], questions: ['Anvil 产品有哪些技术指标？'], tags: ['规格'] },
    { id: 'k1c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '3.2 保修条款：产品自购买之日起提供 24 个月质保，涉及非人为损坏的核心部件终身维保。', tokens: 118, embedded: true, enabled: true, keywords: ['保修', '质保'], questions: ['保修期是多久？', '核心部件坏了怎么办？'], tags: ['售后'] },
    { id: 'k1c3', index: 2, level: 'parent', type: 'Text', text: '第四章 认证与资质：本公司产品已通过 ISO9001、CE 认证，具体证书编号见附录表格。', tokens: 340, embedded: true, enabled: true, keywords: ['ISO9001', 'CE 认证'], questions: [], tags: [] },
    { id: 'k1c4', index: 2, level: 'child', parentIndex: 2, type: 'Table', text: '（附录认证编号表格）', tokens: 12, embedded: false, enabled: false, keywords: [], questions: [], tags: [], issues: ['表格跨页未正确合并，识别为近似空块，建议改用 presentation 模板重切'] },
  ],
  k2: [
    { id: 'k2c1', index: 1, level: 'qa', type: 'QA', text: '问：可以退货吗？多久内？\n答：自签收之日起 7 天内，商品完好可无理由退货。', tokens: 60, embedded: true, enabled: true, keywords: ['退货'], questions: ['多久内可以退货？', '退货有什么条件？'], tags: ['退货政策'] },
    { id: 'k2c2', index: 2, level: 'qa', type: 'QA', text: '问：退货运费谁承担？\n答：非质量问题由买家承担，质量问题由卖家承担。', tokens: 52, embedded: true, enabled: true, keywords: ['运费'], questions: ['退货运费怎么算？'], tags: ['退货政策'] },
    { id: 'k2c3', index: 3, level: 'qa', type: 'QA', text: '问：换货需要多久到货？\n答：换货商品在收到退回件后 3 个工作日内寄出。', tokens: 48, embedded: true, enabled: true, keywords: ['换货', '到货时间'], questions: [], tags: [] },
  ],
  k4: [
    { id: 'k4c1', index: 1, level: 'parent', type: 'Text', text: 'KFR-35 空气滤清器采用三层复合滤纸，过滤效率达 99.7%，适配多种车型。', tokens: 180, embedded: true, enabled: true, keywords: ['KFR-35', '过滤效率'], questions: ['KFR-35 的过滤效率是多少？'], tags: ['产品卖点'] },
    { id: 'k4c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '建议每行驶 1 万公里或半年更换一次，多尘环境应缩短至 5000 公里。', tokens: 64, embedded: true, enabled: true, keywords: ['更换周期'], questions: ['多久换一次滤芯？'], tags: ['保养建议'] },
  ],
  k6: [
    { id: 'k6c1', index: 0, level: 'parent', type: 'Text', text: '【RAPTOR 摘要节点】本报告对比了六种新能源技术路线的效率与成本，H2C 在综合成本上具备优势……', tokens: 220, embedded: true, enabled: true, keywords: ['H2C', '成本对比'], questions: ['H2C 技术相比传统技术有哪些优势？'], tags: ['摘要'] },
    { id: 'k6c2', index: 1, level: 'parent', type: 'Text', text: '第二章 技术路线对比：详细数据与图表见原文 12–45 页，图谱标注了各路线的关键实体关系。', tokens: 410, embedded: true, enabled: true, keywords: [], questions: [], tags: [] },
  ],
  k7: [
    { id: 'k7c1', index: 1, level: 'parent', type: 'Text', text: '（AI 生成草稿）618 大促来袭！Anvil 全系产品限时立减，性能不打折，价格打骨折……', tokens: 96, embedded: false, enabled: false, keywords: [], questions: [], tags: [], issues: ['前台页面草稿，待人工审核通过后才发布'] },
  ],
  k8: [
    { id: 'k8c1', index: 1, level: 'parent', type: 'Table', text: '（解析异常：本页表格跨越 3 页，未能正确合并，内容缺失）', tokens: 0, embedded: false, enabled: false, keywords: [], questions: [], tags: [], issues: ['表格未完整识别，内容缺失', '解析质量门禁未通过'] },
    { id: 'k8c2', index: 2, level: 'parent', type: 'Text', text: '2 工艺流程概述：镀锌前处理包括脱脂、酸洗、助镀……', tokens: 280, embedded: false, enabled: false, keywords: [], questions: [], tags: [], issues: ['等待重新解析后生成向量'] },
  ],
  k9: [
    { id: 'k9c1', index: 1, level: 'qa', type: 'QA', text: '问：挂号需要提前多久？\n答：建议提前 1 天在线预约，急诊可现场挂号。', tokens: 48, embedded: true, enabled: true, keywords: ['挂号'], questions: [], tags: [] },
    { id: 'k9c2', index: 2, level: 'qa', type: 'QA', text: '问：可以帮家人代挂号吗？\n答：可以，需提供代挂号人的有效证件信息。', tokens: 44, embedded: true, enabled: true, keywords: ['代挂号'], questions: [], tags: [] },
  ],
  k10: [
    { id: 'k10c1', index: 1, level: 'parent', type: 'Text', text: 'GB/T 18488-2015 电动汽车用驱动电机系统 技术要求（已被 2025 版替代）', tokens: 300, embedded: true, enabled: false, keywords: [], questions: [], tags: [], issues: ['标准已被新版替代，建议保持归档，不参与检索'] },
  ],
  pik_001: [
    { id: 'pik001c1', index: 1, level: 'parent', type: 'Text', text: 'GB/T 18488—2026 规定了新能源汽车驱动电机系统的环境条件、技术要求、试验方法和检验规则，适用于电动汽车驱动电机及其控制器。', tokens: 486, embedded: true, enabled: true, keywords: ['GB/T 18488', '驱动电机', '技术要求'], questions: ['新能源汽车驱动电机需要满足哪些国家标准？', 'GB/T 18488 适用于哪些产品？'], tags: ['国家标准', '适用范围'] },
    { id: 'pik001c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '环境适应性要求：驱动电机系统应在规定的高温、低温、湿热、振动及盐雾环境试验后保持绝缘性能和功能安全。', tokens: 132, embedded: true, enabled: true, keywords: ['环境适应性', '高低温', '盐雾'], questions: ['驱动电机要做哪些环境试验？'], tags: ['试验要求'] },
    { id: 'pik001c3', index: 2, level: 'parent', type: 'Table', text: '表 6 驱动电机系统主要性能指标：峰值功率、持续功率、峰值转矩、最高工作转速、系统效率及温升限值。', tokens: 278, embedded: true, enabled: true, keywords: ['性能指标', '峰值功率', '系统效率'], questions: ['驱动电机性能指标包含哪些项目？', '电机系统效率怎么评估？'], tags: ['参数表'] },
    { id: 'pik001c4', index: 2, level: 'child', parentIndex: 2, type: 'Text', text: '型式检验应覆盖安全性、输入输出特性、温升、超速、耐久性及电磁兼容性项目，具体样品数量和判定规则见第 8 章。', tokens: 154, embedded: true, enabled: true, keywords: ['型式检验', '耐久性', '电磁兼容'], questions: ['驱动电机型式检验有哪些项目？'], tags: ['检验规则'] },
  ],
  pik_002: [
    { id: 'pik002c1', index: 1, level: 'parent', type: 'Text', text: '制造业智能化转型应从战略、组织、数据、技术和运营五个维度建立成熟度评估体系，并形成分阶段建设路线图。', tokens: 330, embedded: true, enabled: true, keywords: ['智能制造', '成熟度模型'], questions: ['制造企业如何规划智能化转型？'], tags: ['转型路径'] },
    { id: 'pik002c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '起步阶段优先完成关键设备联网、主数据治理和核心业务流程数字化，避免一次性建设过多孤立系统。', tokens: 126, embedded: true, enabled: true, keywords: ['设备联网', '主数据治理'], questions: ['智能化转型第一阶段应该先做什么？'], tags: ['实施建议'] },
    { id: 'pik002c3', index: 2, level: 'parent', type: 'Table', text: '智能制造成熟度分为规划级、规范级、集成级、优化级和引领级，各等级对应不同的数据贯通与智能决策能力。', tokens: 240, embedded: true, enabled: true, keywords: ['成熟度等级', '数据贯通'], questions: ['智能制造成熟度分几级？'], tags: ['评估模型'] },
  ],
  pik_003: [
    { id: 'pik003c1', index: 1, level: 'parent', type: 'Text', text: '医院智慧服务分级评估围绕诊前、诊中、诊后和全程服务，对患者就医便利性、服务协同性与信息可及性进行评价。', tokens: 304, embedded: true, enabled: true, keywords: ['智慧服务', '分级评估'], questions: ['医院智慧服务主要评估什么？'], tags: ['评估范围'] },
    { id: 'pik003c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '诊前服务包括智能导诊、预约挂号、候诊提醒、检查预约及就医准备指引等能力。', tokens: 112, embedded: true, enabled: true, keywords: ['智能导诊', '预约挂号'], questions: ['智慧医院诊前服务包括哪些功能？'], tags: ['诊前服务'] },
    { id: 'pik003c3', index: 2, level: 'parent', type: 'Text', text: '评估材料应能够追溯到实际业务系统和服务记录，演示功能但未形成稳定服务闭环的，不计入相应等级能力。', tokens: 168, embedded: true, enabled: true, keywords: ['评估材料', '服务闭环'], questions: ['智慧服务评级需要准备什么证明材料？'], tags: ['申报要求'] },
  ],
  pik_004: [
    { id: 'pik004c1', index: 1, level: 'parent', type: 'Text', text: '建筑装饰工程常见问题包括基层空鼓、饰面开裂、防水节点处理不完整及材料进场验收记录缺失。', tokens: 188, embedded: false, enabled: false, keywords: ['空鼓', '开裂', '防水节点'], questions: ['建筑装饰工程常见质量问题有哪些？'], tags: ['施工质量'], issues: ['草稿尚未发布，未生成向量'] },
    { id: 'pik004c2', index: 1, level: 'child', parentIndex: 1, type: 'Text', text: '施工前应核验基层强度、平整度和含水率，并保留隐蔽工程验收影像与签字记录。', tokens: 106, embedded: false, enabled: false, keywords: ['基层验收', '隐蔽工程'], questions: ['装饰施工前需要检查什么？'], tags: ['验收要点'], issues: ['等待发布后生成向量'] },
  ],
  pik_005: [
    { id: 'pik005c1', index: 1, level: 'parent', type: 'Text', text: '低压电器选型应综合额定电压、电流、短路分断能力、使用类别、安装环境及上下级保护配合关系。', tokens: 260, embedded: true, enabled: false, keywords: ['低压电器', '选型参数'], questions: ['低压电器选型要看哪些参数？'], tags: ['选型'], issues: ['知识已下线，不参与检索'] },
    { id: 'pik005c2', index: 1, level: 'child', parentIndex: 1, type: 'Table', text: '常用断路器选型表：按负载类型列出推荐使用类别、额定电流区间及短路分断能力。', tokens: 146, embedded: true, enabled: false, keywords: ['断路器', '分断能力'], questions: ['断路器额定电流怎么选？'], tags: ['参数表'], issues: ['知识已下线，不参与检索'] },
  ],
};

// ── DataSlot: 原文预览（内容详情左侧原文栏，仅示例几条）───────────────
export const mockRawContent: Record<string, string> = {
  k1: '# Anvil 产品白皮书\n\n## 第三章 产品规格与技术参数\n本章介绍 Anvil 系列产品的核心技术指标，包括承重、耐候、防护等级等国标测试数据。\n\n### 3.2 保修条款\n产品自购买之日起提供 24 个月质保，涉及非人为损坏的核心部件终身维保。\n\n## 第四章 认证与资质\n本公司产品已通过 ISO9001、CE 认证，具体证书编号见附录表格。\n\n（附录：认证编号表格，因跨页排版，解析时可能识别不完整）',
  k2: 'Q: 可以退货吗？多久内？\nA: 自签收之日起 7 天内，商品完好可无理由退货。\n\nQ: 退货运费谁承担？\nA: 非质量问题由买家承担，质量问题由卖家承担。\n\nQ: 换货需要多久到货？\nA: 换货商品在收到退回件后 3 个工作日内寄出。',
  k4: '# KFR-35 空气滤清器\n\nKFR-35 空气滤清器采用三层复合滤纸，过滤效率达 99.7%，适配多种车型。\n\n建议每行驶 1 万公里或半年更换一次，多尘环境应缩短至 5000 公里。',
  k6: '# 新能源行业白皮书 2026\n\n【摘要】本报告对比了六种新能源技术路线的效率与成本，H2C 在综合成本上具备优势……\n\n## 第二章 技术路线对比\n详细数据与图表见原文 12–45 页，图谱标注了各路线的关键实体关系。',
  k7: '（AI 生成草稿，待审核）\n\n618 大促来袭！Anvil 全系产品限时立减，性能不打折，价格打骨折……',
  k8: '2 工艺流程概述\n镀锌前处理包括脱脂、酸洗、助镀……\n\n（本页表格跨越 3 页，未能正确合并，内容缺失）',
  k9: 'Q: 挂号需要提前多久？\nA: 建议提前 1 天在线预约，急诊可现场挂号。\n\nQ: 可以帮家人代挂号吗？\nA: 可以，需提供代挂号人的有效证件信息。',
  k10: 'GB/T 18488-2015 电动汽车用驱动电机系统 技术要求\n（已被 2025 版替代，建议保持归档，不参与检索）',
  pik_001: '# GB/T 18488—2026 新能源汽车驱动电机系统\n\n## 1 范围\n本标准规定了新能源汽车驱动电机系统的环境条件、技术要求、试验方法和检验规则。\n\n## 6 技术要求\n驱动电机系统应满足安全性、环境适应性、输入输出特性、温升、超速及耐久性要求。\n\n### 表 6 主要性能指标\n包括峰值功率、持续功率、峰值转矩、最高工作转速、系统效率及温升限值。\n\n## 8 检验规则\n型式检验覆盖安全性、耐久性及电磁兼容性等项目。',
  pik_002: '# 制造业智能化转型白皮书\n\n## 转型总体框架\n从战略、组织、数据、技术和运营五个维度建立成熟度评估体系。\n\n## 分阶段实施路径\n起步阶段优先完成关键设备联网、主数据治理和核心业务流程数字化。\n\n## 成熟度模型\n分为规划级、规范级、集成级、优化级和引领级。',
  pik_003: '# 医院智慧服务分级评估指南\n\n## 评估范围\n围绕诊前、诊中、诊后和全程服务开展评价。\n\n## 诊前服务\n包括智能导诊、预约挂号、候诊提醒、检查预约及就医准备指引。\n\n## 申报与佐证\n评估材料应能够追溯到实际业务系统和服务记录。',
  pik_004: '# 建筑装饰工程常见问题汇编（草稿）\n\n包括基层空鼓、饰面开裂、防水节点处理不完整及材料进场验收记录缺失等问题。\n\n施工前应核验基层强度、平整度和含水率。',
  pik_005: '# 低压电器产品选型手册\n\n低压电器选型应综合额定电压、电流、短路分断能力、使用类别、安装环境及上下级保护配合关系。\n\n当前版本已下线，仅供历史版本追溯。',
};

// ── DataSlot: 更新历史（创建/编辑/重新学习/状态变更等操作记录）──────────
export interface AssetHistoryEntry { time: string; actor: string; action: string; }
export const mockAssetHistory: Record<string, AssetHistoryEntry[]> = {
  k1: [
    { time: '2026-05-20 10:12', actor: '王芳（内容运营）', action: '创建，上传 Anvil 产品白皮书.pdf' },
    { time: '2026-05-20 10:15', actor: '系统', action: '解析完成，生成 248 个片段' },
    { time: '2026-06-01 09:30', actor: '王芳（内容运营）', action: '补充标签「保修条款」，重新学习' },
  ],
  k2: [
    { time: '2026-04-02 14:00', actor: '系统同步 · CMS', action: '从帮助中心栏目创建' },
    { time: '2026-06-18 16:40', actor: '客服主管', action: '新增 8 条问答，更新至 120 条' },
  ],
  k4: [
    { time: '2026-03-15 09:00', actor: '系统同步 · CMS', action: '从产品详情栏目创建' },
    { time: '2026-06-25 14:02', actor: '系统同步 · CMS', action: '产品详情页内容更新，自动重新学习' },
  ],
  k8: [
    { time: '2026-06-09 11:20', actor: '王芳（内容运营）', action: '创建，上传 镀锌板工艺流程.pdf' },
    { time: '2026-06-09 11:22', actor: '系统', action: '解析失败：表格未完整识别，待重新解析' },
  ],
  k10: [
    { time: '2025-08-01 09:00', actor: '张伟（内容运营）', action: '创建，绑定 GB/T 18488-2015 标准' },
    { time: '2026-03-12 15:00', actor: '张伟（内容运营）', action: '标准已被 2025 版替代，归档下线' },
  ],
  pik_001: [
    { time: '2026-02-18 09:20', actor: '平台运营-张伟', action: '创建，上传 GB-T18488-2025-v1.pdf' },
    { time: '2026-05-20 10:10', actor: '平台运营-林岚', action: '发布 v2，按行业知识切片规则重新解析' },
    { time: '2026-08-12 16:30', actor: '平台运营-林岚', action: '发布 v3，补充 2026 年参数修订与试验方法' },
  ],
  pik_002: [
    { time: '2026-03-18 14:00', actor: '平台运营-王芳', action: '创建并发布 v1' },
    { time: '2026-08-10 09:20', actor: '平台运营-王芳', action: '发布 v2，新增 12 个实践案例并重新学习' },
  ],
  pik_003: [
    { time: '2026-08-08 11:05', actor: '平台运营-李明', action: '创建并发布 v1，生成 98 个切片' },
  ],
};

// ── DataSlot: 健康度四维分解（架构 §6.3/§6.3.1）── 权重可配，见 mockHealthWeights
export interface HealthBreakdown { quality: number; timeliness: number; reuse: number; feedback: number; }

// 默认权重（可在「元数据规范」页调整，四项之和应为 100）
export const mockHealthWeights: HealthBreakdown = { quality: 30, timeliness: 25, reuse: 25, feedback: 20 };

// 健康度分维度建议（低分时提示怎么改善，衔接 §6.3.1）
export function healthSuggestion(dim: keyof HealthBreakdown, v: number): string | null {
  if (v >= 80) return null;
  const tips: Record<keyof HealthBreakdown, string> = {
    quality: '解析/准确性偏低，建议检查分块问题或重新解析',
    timeliness: '内容已陈旧，建议触发一次同步或更新原文',
    reuse: '被调用频次低，建议检查是否覆盖了常见问题',
    feedback: '用户反馈偏差，建议查看「对话质量运营」里的差评对话',
  };
  return tips[dim];
}

// ── 敏感词库（合规检查用，「元数据规范」页可维护）───────────────────
export const mockSensitiveWords: string[] = ['最好', '第一', '国家级', '内部机密', '保证', '绝对', '唯一指定'];
export function checkSensitiveWords(text: string, words: string[] = mockSensitiveWords): string[] {
  return words.filter((w) => text.includes(w));
}
function assetText(asset: KbAsset, chunks: AssetChunk[]): string {
  return [asset.name, ...chunks.map((c) => c.text)].join('\n');
}

// ── 去重检测：标题分词 Jaccard 相似度 + 标签交集加成（原型简化算法，非真实 NLP/simhash）──
export function titleSimilarity(a: KbAsset, b: KbAsset): number {
  const tokenize = (s: string) => new Set(s.split(/[\s·・/／\-—(（）)·、,，。.]+/).filter(Boolean));
  const ta = tokenize(a.name);
  const tb = tokenize(b.name);
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  const tagOverlap = a.tags.filter((t) => b.tags.includes(t)).length;
  return Math.min(1, jaccard + tagOverlap * 0.1);
}
export function findDuplicate(asset: KbAsset, pool: KbAsset[] = mockAssets, threshold = 0.6): { target: KbAsset; similarity: number } | null {
  let best: { target: KbAsset; similarity: number } | null = null;
  for (const other of pool) {
    if (other.id === asset.id || other.section !== asset.section) continue;
    const sim = titleSimilarity(asset, other);
    if (sim >= threshold && (!best || sim > best.similarity)) best = { target: other, similarity: sim };
  }
  return best;
}

// ── DataSlot: 入库前准入门禁检查项（§6.1）────────────────────────────
export const mockGateChecks = [
  { check: '解析质量（无串页 / 表格未碎）', sections: '①④⑥', fail: '退回，换分块模板重试' },
  { check: '重复 / 洗稿检测', sections: '①④', fail: '合并或拒绝' },
  { check: '合规与敏感信息过滤', sections: '全部', fail: '脱敏或拒绝' },
  { check: '答案准确性人工审核', sections: '②', fail: '打回修改' },
  { check: 'Schema / 枚举合法性', sections: '③', fail: '修正配置' },
  { check: '版权 / 来源可信度', sections: '⑤⑥', fail: '标注或拒绝' },
  { check: '质量打分是否达标', sections: '全部', fail: '按板块清洗策略里的处理建议修正后重新学习' },
];

// ── DataSlot: 入库前门禁检查结果 —— 每项都有具体依据，不是和状态挂钩的黑箱判断（架构 §6.1/§6.1.1）
export interface GateResult { check: string; pass: boolean; detail: string; advice?: string; }
export function evaluateGates(a: KbAsset, chunks: AssetChunk[]): GateResult[] {
  const idx = SECTION_MAP[a.section].index;
  const applicable = mockGateChecks.filter((g) => g.sections === '全部' || g.sections.includes(idx));
  const dup = findDuplicate(a);
  const hits = checkSensitiveWords(assetText(a, chunks));
  const issueChunks = chunks.filter((c) => c.issues && c.issues.length > 0).length;
  const quality = computeQuality(a, chunks);
  const threshold = SECTION_MAP[a.section].qualityScoreThreshold;

  return applicable.map((g) => {
    switch (g.check) {
      case '解析质量（无串页 / 表格未碎）': {
        const pass = issueChunks === 0;
        return { check: g.check, pass, detail: pass ? `${chunks.length}/${chunks.length} 个切片解析正常` : `${issueChunks}/${chunks.length} 个切片解析有问题`, advice: pass ? undefined : g.fail };
      }
      case '重复 / 洗稿检测': {
        const pass = !dup;
        return { check: g.check, pass, detail: pass ? '未发现相似内容' : `与「${dup!.target.name}」相似度 ${Math.round(dup!.similarity * 100)}%`, advice: pass ? undefined : g.fail };
      }
      case '合规与敏感信息过滤': {
        const pass = hits.length === 0;
        return { check: g.check, pass, detail: pass ? `未命中敏感词库（共 ${mockSensitiveWords.length} 词）` : `命中：${hits.join('、')}`, advice: pass ? undefined : g.fail };
      }
      case '答案准确性人工审核': {
        const pass = a.reviewed === true;
        return { check: g.check, pass, detail: pass ? '已人工审核通过' : '尚未人工审核', advice: pass ? undefined : g.fail };
      }
      case 'Schema / 枚举合法性':
        return { check: g.check, pass: true, detail: '字段来自受控枚举，天然合法' };
      case '版权 / 来源可信度': {
        const pass = !!a.sourceRef.trim();
        return { check: g.check, pass, detail: pass ? `已标注来源：${a.sourceRef}` : '缺少来源标注', advice: pass ? undefined : g.fail };
      }
      case '质量打分是否达标': {
        const pass = quality >= threshold;
        return { check: g.check, pass, detail: `质量打分 ${quality}，阈值 ${threshold}，${pass ? '达标' : '未达标'}`, advice: pass ? undefined : g.fail };
      }
      default:
        return { check: g.check, pass: true, detail: '—' };
    }
  });
}

// ── 健康度四维分项计算（纯函数，输入现有数据结构，输出 0-100）──────────
// 质量：扣敏感词命中（合规红线，命中扣40）+ 疑似重复（扣20）+ 有问题切片占比（最多扣30）
export function computeQuality(asset: KbAsset, chunks: AssetChunk[]): number {
  const sensitiveDeduct = checkSensitiveWords(assetText(asset, chunks)).length > 0 ? 40 : 0;
  const dupDeduct = findDuplicate(asset) ? 20 : 0;
  const issueChunks = chunks.filter((c) => c.issues && c.issues.length > 0).length;
  const issueRatio = chunks.length === 0 ? 0 : issueChunks / chunks.length;
  const issueDeduct = Math.min(30, Math.round(issueRatio * 100 * 0.3));
  return Math.max(0, 100 - sensitiveDeduct - dupDeduct - issueDeduct);
}

// 时效：按"距上次更新天数 / 该时效等级的新鲜度阈值"算比值，超阈值线性扣分；结构化数据实时直查、无过期概念，恒 100
export function computeTimeliness(asset: KbAsset, today: string = TODAY): number {
  if (asset.section === 'structured') return 100;
  const threshold = FRESHNESS_DAYS[asset.timeliness];
  const ratio = daysSince(asset.updatedAt, today) / threshold;
  if (ratio <= 1) return 100;
  if (ratio <= 2) return Math.round(100 - (ratio - 1) * 50);
  return Math.max(10, Math.round(50 - (ratio - 2) * 10));
}

// 复用：按被检索命中次数映射，0 次给基础分 40，每命中一次 +12，封顶 100
export function computeReuse(asset: KbAsset, callLogs: CallLog[]): number {
  const hits = callLogs.filter((l) => l.assetId === asset.id).length;
  return Math.min(100, 40 + hits * 12);
}

// 反馈：命中记录里 👍/(👍+👎) 的比例；没有反馈记录时给基准分 75（不是"差"，是"还不知道"）
export function computeFeedback(asset: KbAsset, callLogs: CallLog[]): number {
  const logs = callLogs.filter((l) => l.assetId === asset.id && l.feedback);
  if (logs.length === 0) return 75;
  const up = logs.filter((l) => l.feedback === 'up').length;
  return Math.round((up / logs.length) * 100);
}

export function computeHealthBreakdown(asset: KbAsset, chunks: AssetChunk[], callLogs: CallLog[], today: string = TODAY): HealthBreakdown {
  return {
    quality: computeQuality(asset, chunks),
    timeliness: computeTimeliness(asset, today),
    reuse: computeReuse(asset, callLogs),
    feedback: computeFeedback(asset, callLogs),
  };
}

export function computeHealth(breakdown: HealthBreakdown, weights: HealthBreakdown = mockHealthWeights): number {
  const wt = weights.quality + weights.timeliness + weights.reuse + weights.feedback || 1;
  return Math.round(
    (breakdown.quality * weights.quality + breakdown.timeliness * weights.timeliness
      + breakdown.reuse * weights.reuse + breakdown.feedback * weights.feedback) / wt,
  );
}

// ── DataSlot: 覆盖盲区（无结果/低分丢弃聚类，反推缺口）──────────────────
// 智能客服 Pro 对齐：运营任务化
export interface BlindSpot {
  id: string;
  cluster: string;        // 问题聚类描述
  count: number;          // 出现次数
  lastAsked: string;      // 最近提问时间
  suggestBoard: SectionKey; // 建议补到哪个板块
  suggest: string;        // 建议描述（向后兼容）
  // 智能客服 Pro 对齐新增字段
  affected_customer_count: number; // 兼容聚合字段；当前客户后台展示本客户自己的 occurrence/session
  customer_impacts: {
    customer_id: string;
    occurrence_count: number;
    session_count: number;
    lastAsked: string;
  }[];                    // 按客户拆分的影响明细（客户后台只读自身，产品后台可聚合）
  handling_status: 'pending' | 'recorded' | 'ignored'; // 处理状态
  priority: number;       // 优先级（当前客户后台按本客户出现次数/会话数展示，1-5）
}

export const mockBlindSpots: BlindSpot[] = [
  {
    id: 'b1', cluster: 'H2C 技术优势对比', count: 7, lastAsked: '2026-07-01',
    suggestBoard: 'industry' as SectionKey, suggest: '④内容资产 / ⑥行业知识',
    affected_customer_count: 2,
    customer_impacts: [
      { customer_id: 'cust_001', occurrence_count: 3, session_count: 2, lastAsked: '2026-07-01' },
      { customer_id: 'cust_002', occurrence_count: 4, session_count: 3, lastAsked: '2026-06-30' },
    ],
    handling_status: 'pending', priority: 3,
  },
  {
    id: 'b2', cluster: '私有化部署支持', count: 12, lastAsked: '2026-06-30',
    suggestBoard: 'faq' as SectionKey, suggest: '②问答知识',
    affected_customer_count: 5,
    customer_impacts: [
      { customer_id: 'cust_001', occurrence_count: 2, session_count: 2, lastAsked: '2026-06-29' },
      { customer_id: 'cust_002', occurrence_count: 2, session_count: 1, lastAsked: '2026-06-28' },
      { customer_id: 'cust_003', occurrence_count: 4, session_count: 3, lastAsked: '2026-06-30' },
      { customer_id: 'cust_006', occurrence_count: 2, session_count: 2, lastAsked: '2026-06-27' },
      { customer_id: 'cust_007', occurrence_count: 2, session_count: 2, lastAsked: '2026-06-26' },
    ],
    handling_status: 'pending', priority: 5,
  },
  {
    id: 'b3', cluster: '多语言客服语种范围', count: 3, lastAsked: '2026-06-25',
    suggestBoard: 'faq' as SectionKey, suggest: '②问答知识',
    affected_customer_count: 1,
    customer_impacts: [
      { customer_id: 'cust_003', occurrence_count: 3, session_count: 2, lastAsked: '2026-06-25' },
    ],
    handling_status: 'pending', priority: 2,
  },
];

// ── DataSlot: 双模检索参数（§5.2）────────────────────────────────────
export interface DualMode {
  mode: RetrievalMode;
  label: string;
  consumer: string;
  vectorWeight: number;
  threshold: number;
  rerank: string;
  temperature: number;
  goal: string;
}

export const DUAL_MODES: DualMode[] = [
  { mode: 'deterministic', label: '确定性模式', consumer: '前台智能客服', vectorWeight: 0.3, threshold: 0.3, rerank: 'FAQ 关闭 / 文档开', temperature: 0.1, goal: '准、稳、可溯源' },
  { mode: 'divergent', label: '发散模式', consumer: '后台内容生成', vectorWeight: 0.5, threshold: 0.2, rerank: '开启', temperature: 0.85, goal: '广覆盖、富素材、有创意' },
];

// ── DataSlot: 检索测试台示例命中（mock）──────────────────────────────
export const mockRetrievalHits = [
  { rank: 1, chunk: '空气滤清器建议每行驶 1 万公里或半年更换一次……', section: 'content' as SectionKey, score: 0.91, source: 'KFR-35 图文详情 · /p/kfr-35' },
  { rank: 2, chunk: '在多尘环境下应缩短更换周期至 5000 公里。', section: 'document' as SectionKey, score: 0.84, source: '产品手册.pdf · p.8' },
  { rank: 3, chunk: '问：滤清器多久换一次 答：常规 1 万公里 / 半年。', section: 'faq' as SectionKey, score: 0.79, source: '标准问 · 帮助中心' },
];

// ── DataSlot: 统一元数据规范 Knowledge Schema（§7.1）─────────────────
// category: 选项 = 下拉/枚举选择；输入 = 自由文本。示例仅对"选项"类展示，"输入"类留空。
export type SchemaFieldGroup = '基础信息与来源' | '业务归类' | '内容属性' | '组织与适用范围' | '内容说明';
export interface SchemaField { field: string; meaning: string; group: SchemaFieldGroup; category: '选项' | '输入'; required: string; example: string; }

// 内置字段：知识库通用级（跨知识板块）的文档级元数据；只读展示，不支持增删改。
// 前台页面路由/导航路径/页面类型/结构化字段等属于知识板块级字段，在「知识资产目录」对应资产里维护，不在此展示。
export const BUILTIN_SCHEMA_FIELDS: SchemaField[] = [
  { field: 'name', meaning: '知识名称', group: '基础信息与来源', category: '输入', required: '必填', example: '' },
  { field: 'section', meaning: '知识板块', group: '基础信息与来源', category: '选项', required: '必填', example: '文档知识 / 问答知识 / 结构化数据 / 内容资产 / 网络知识' },
  { field: 'connect', meaning: '来源方式', group: '基础信息与来源', category: '选项', required: '必填', example: '上传文件 / 前台页面 / 后台页面 / 外部网址 / 平台' },
  { field: 'frontend_route', meaning: '前台路由', group: '基础信息与来源', category: '输入', required: '内容资产、结构化数据条件必填', example: '' },
  { field: 'industry', meaning: '所属行业', group: '业务归类', category: '选项', required: '行业知识库条件必填', example: '制造业与工业' },
  { field: 'knowledge_base_type', meaning: '知识库类型', group: '业务归类', category: '选项', required: '必填', example: '行业知识库 / 企业公共知识库 / 企业业务知识库' },
  { field: 'primary_category', meaning: '一级分类', group: '业务归类', category: '选项', required: '必填', example: '产品与资源' },
  { field: 'secondary_category', meaning: '二级分类', group: '业务归类', category: '选项', required: '可选', example: '产品手册' },
  { field: 'content_format', meaning: '内容形式', group: '内容属性', category: '选项', required: '必填', example: '文章 / 政策 / 指南 / 报告 / 手册 / 标准' },
  { field: 'audience', meaning: '适用对象', group: '内容属性', category: '选项', required: '可选', example: '企业内部 / 所有人' },
  { field: 'validity_status', meaning: '有效状态', group: '内容属性', category: '选项', required: '必填', example: '现行有效 / 即将生效 / 已失效 / 待确认' },
  { field: 'language', meaning: '语言', group: '内容属性', category: '选项', required: '可选', example: '简体中文 / 英语' },
  { field: 'folder_id', meaning: '所属分组', group: '组织与适用范围', category: '选项', required: '可选', example: '品牌知识 / 产品知识 / 其它知识' },
  { field: 'portal_sites', meaning: '适用门户网站', group: '组织与适用范围', category: '选项', required: '可选；未指定表示全部门户', example: '中文站 / 英文站' },
  { field: 'tags', meaning: '文档标签', group: '内容说明', category: '输入', required: '可选', example: '' },
  { field: 'summary', meaning: '知识摘要', group: '内容说明', category: '输入', required: '可选', example: '' },
  { field: 'note', meaning: '备注', group: '内容说明', category: '输入', required: '可选', example: '' },
];

// 自定义字段：全部板块通用，运营可增删改；一旦加入，会在「知识资产目录」编辑弹窗的"自定义字段"区
// 出现对应输入框，值存进 KbAsset.customFields，逐条知识单独填
export const mockCustomSchemaFields: SchemaField[] = [
  { field: 'competitor_ref', meaning: '关联竞品型号（选填，便于对比问答引用）', group: '内容说明', category: '输入', required: '可选', example: '' },
];

// ── 生命周期阶段 & 状态机（§4）─────────────────────────────────────
export const STATUS_LABEL: Record<KbStatus, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-500' },
  published: { label: '启用', cls: 'bg-green-50 text-green-600' },
  archived: { label: '停用', cls: 'bg-gray-100 text-gray-500' },
  stale: { label: '待更新', cls: 'bg-orange-50 text-orange-600' },
  learning: { label: '学习中', cls: 'bg-blue-50 text-blue-600' },
};

// 状态转移规则：人工触发的合法下一步（"published→stale"是系统自动判定，不在这里，见 effectiveStatus）
export const STATUS_TRANSITIONS: Record<KbStatus, { to: KbStatus; label: string }[]> = {
  draft: [{ to: 'learning', label: '启用' }],
  published: [{ to: 'archived', label: '停用' }],
  stale: [{ to: 'archived', label: '停用' }],
  archived: [{ to: 'published', label: '启用' }],
  learning: [],
};

// 唯一的自动转移：已发布内容超过"2倍新鲜度阈值"未更新，展示态自动降级为"待更新"
// （发布/下线/归档都需要人工决策，不做自动化；只有"是否过期"是客观事实，可以自动判定）
export function effectiveStatus(asset: KbAsset, today: string = TODAY): KbStatus {
  if (asset.status === 'published' && asset.section !== 'structured') {
    const threshold = FRESHNESS_DAYS[asset.timeliness];
    if (daysSince(asset.updatedAt, today) > threshold * 2) return 'stale';
  }
  return asset.status;
}

export const TIMELINESS_CLS: Record<Timeliness, string> = {
  实时: 'bg-red-50 text-red-500', 小时: 'bg-amber-50 text-amber-600',
  每日: 'bg-blue-50 text-blue-600', 静态: 'bg-gray-100 text-gray-500',
};

// ── helper ─────────────────────────────────────────────────────────
export function healthCls(h: number): string {
  if (h === 0) return 'text-gray-300';
  if (h >= 80) return 'text-green-600';
  if (h >= 60) return 'text-amber-600';
  return 'text-red-500';
}

// 全局聚合（供概览 KPI 复用）

// ── DataSlot: 知识库调用记录（质量分析：场景/命中/原始对话/反馈）──────
// 全景 §4 监测；架构 §6 运行期反馈
// 智能客服 Pro 对齐：增加客户维度 + AI 质量字段
export interface CallLog {
  id: string;
  date: string;            // YYYY-MM-DD HH:mm
  scene: string;          // 在线客服 / 网站搜索 / 内容生成
  tool: string;           // 调用的工具
  query: string;          // 用户问题
  hitBoard: SectionKey | null; // 命中板块（null=未命中）
  hitDoc: string;         // 命中的知识（展示用文本）
  assetId?: string;       // 命中的具体知识资产 id（关联 mockAssets，驱动复用/反馈健康度计算与按文档搜索）
  score: number;          // 相似度（0=未命中/不适用）
  feedback: 'up' | 'down' | null;
  dialog: string;         // 原始对话片段
  // 智能客服 Pro 对齐新增字段
  customer_id?: string;   // 客户标识（支撑客户维度分析）
  is_replied: boolean;    // AI 是否给出回复
  no_reply_reason?: 'knowledge_missing' | 'low_recall' | 'rule_blocked' | 'model_refused' | 'system_error' | null; // 未回复原因
  is_handoff: boolean;    // 是否转人工
  cited_chunks?: string[]; // 引用片段 ID 列表（支撑 RAG 准确率）
  blindspotId?: string;    // 关联覆盖盲区聚类（未命中/未回复/低召回样本可回溯）
}

// 日期分布在近 30 天内（相对 TODAY），用于演示日期范围筛选：today 2 条 / 近7天 4 条 / 近30天 5 条 / 全部 6 条
export const mockCallLogs: CallLog[] = [
  { id: 'l1', date: '2026-07-02 14:32', scene: '在线客服', tool: '知识问答', query: '空气滤清器多久换一次', hitBoard: 'content', hitDoc: 'KFR-35 图文详情', assetId: 'k4', score: 0.91, feedback: 'up', dialog: '用户：空气滤清器多久换一次？\n机器人：建议每行驶 1 万公里或半年更换一次……', customer_id: 'cust_001', is_replied: true, no_reply_reason: null, is_handoff: false, cited_chunks: ['k4c2'] },
  { id: 'l2', date: '2026-07-02 14:20', scene: '网站搜索', tool: '产品查询', query: 'KFR-35 还有货吗', hitBoard: 'structured', hitDoc: 'products 表 · 库存字段', assetId: 'k3', score: 0.99, feedback: null, dialog: '用户：KFR-35 还有货吗\n系统：KFR-35 当前库存 32 件，¥128', customer_id: 'cust_001', is_replied: true, no_reply_reason: null, is_handoff: false, cited_chunks: [] },
  { id: 'l3', date: '2026-07-01 13:58', scene: '内容生成', tool: '营销文案生成', query: '写一段 KFR-35 的卖点文案', hitBoard: 'content', hitDoc: 'KFR-35 图文详情 + 行业报告', assetId: 'k4', score: 0.84, feedback: 'up', dialog: '运营：写一段 KFR-35 卖点文案\n助手：高效过滤·长效耐用……（已引用产品详情与行业数据）', customer_id: 'cust_002', is_replied: true, no_reply_reason: null, is_handoff: false, cited_chunks: ['k4c1', 'k6c1'] },
  { id: 'l4', date: '2026-06-28 13:40', scene: '在线客服', tool: '知识问答', query: '你们支持私有化部署吗', hitBoard: null, hitDoc: '—（未命中，已记入盲区）', score: 0, feedback: 'down', dialog: '用户：你们支持私有化部署吗？\n机器人：抱歉，暂时没有找到相关信息……', customer_id: 'cust_003', is_replied: false, no_reply_reason: 'knowledge_missing', is_handoff: true, cited_chunks: [] },
  { id: 'l5', date: '2026-06-20 11:12', scene: '在线客服', tool: '知识问答', query: '退货怎么操作', hitBoard: 'faq', hitDoc: '退换货流程 FAQ', assetId: 'k2', score: 0.95, feedback: 'up', dialog: '用户：退货怎么操作？\n机器人：1) 进入订单… 2) 申请退货…', customer_id: 'cust_001', is_replied: true, no_reply_reason: null, is_handoff: false, cited_chunks: ['k2c1'] },
  { id: 'l6', date: '2026-06-05 10:05', scene: '在线客服', tool: '知识问答', query: 'H2C 技术比传统好在哪', hitBoard: 'industry', hitDoc: '新能源行业白皮书（相似度偏低）', assetId: 'k6', score: 0.61, feedback: 'down', dialog: '用户：H2C 技术比传统好在哪？\n机器人：（回答较泛，用户点了不满意）', customer_id: 'cust_002', is_replied: true, no_reply_reason: null, is_handoff: false, cited_chunks: ['k6c1'] },
  { id: 'l7', date: '2026-07-01 16:48', scene: '在线客服', tool: '知识问答', query: 'H2C 技术和传统方案比优势是什么', hitBoard: null, hitDoc: '—（低召回，已记入盲区）', score: 0.42, feedback: 'down', dialog: '用户：H2C 技术和传统方案比优势是什么？\n机器人：抱歉，暂时没有找到足够相关的信息。\n用户：我想看和传统方案的对比点。', customer_id: 'cust_001', is_replied: false, no_reply_reason: 'low_recall', is_handoff: true, cited_chunks: [], blindspotId: 'b1' },
  { id: 'l8', date: '2026-06-29 09:35', scene: '在线客服', tool: '知识问答', query: '你们支持私有化部署吗，需要多久', hitBoard: null, hitDoc: '—（未命中，已记入盲区）', score: 0, feedback: 'down', dialog: '用户：你们支持私有化部署吗，需要多久？\n机器人：抱歉，暂时没有找到相关信息。\n用户：那帮我转人工。', customer_id: 'cust_001', is_replied: false, no_reply_reason: 'knowledge_missing', is_handoff: true, cited_chunks: [], blindspotId: 'b2' },
];

// 调用场景统计（质量看板）
export const mockSceneStats = [
  { scene: '在线客服', calls: 1862, hitRate: 0.88 },
  { scene: '网站搜索', calls: 940, hitRate: 0.93 },
  { scene: '内容生成', calls: 213, hitRate: 0.79 },
];

// ── DataSlot: 问答测试多维评分（RAGFlow 式来源评分）──────────────────
export interface ScoredHit {
  doc: string;
  board: SectionKey;
  snippet: string;
  similarity: number;   // 相似度
  relevance: number;    // 相关性
  authority: number;    // 权威性
  freshness: number;    // 时效性
  source: string;       // 出处
}

export const mockScoredHits: ScoredHit[] = [
  { doc: 'KFR-35 图文详情', board: 'content', snippet: '空气滤清器建议每行驶 1 万公里或半年更换一次，多尘环境应缩短至 5000 公里。', similarity: 0.91, relevance: 0.94, authority: 0.85, freshness: 0.90, source: '产品详情页 /p/kfr-35 · 06-25 更新' },
  { doc: '产品手册.pdf', board: 'document', snippet: '滤清器为易损件，需定期检查滤芯积尘情况并按周期更换。', similarity: 0.84, relevance: 0.80, authority: 0.95, freshness: 0.60, source: 'KFR-35 产品手册.pdf · 第 8 页' },
  { doc: '退换货/保养 FAQ', board: 'faq', snippet: '问：滤清器多久换一次？答：常规 1 万公里 / 半年。', similarity: 0.79, relevance: 0.88, authority: 0.90, freshness: 0.85, source: '标准问 · 帮助中心' },
];

// ── 健康度：从"两组手填数字"改成"从信号算出来" ──────────────────────
// 草稿尚未发布，健康度显示"—"（0）；published/stale/archived 才有实际评分。
// 用当前 mockHealthWeights 权重，在模块加载时算好赋回 mockAssets[].health / SECTIONS[].health，
// 外部所有读取 a.health / s.health 的地方完全不用改，只是这个数字的"来路"从手填变成了公式算出。
mockAssets.forEach((a) => {
  if (a.status === 'draft') { a.health = 0; return; }
  const chunks = mockAssetChunks[a.id] ?? [];
  a.health = computeHealth(computeHealthBreakdown(a, chunks, mockCallLogs), mockHealthWeights);
});
SECTIONS.forEach((s) => {
  const boardAssets = assetsOfBoard(s.key);
  if (boardAssets.length > 0) {
    s.health = Math.round(boardAssets.reduce((sum, a) => sum + a.health, 0) / boardAssets.length);
  }
});

// 资产健康度分解（供 UI 展示，替代原先手填的 mockHealthBreakdown 静态表）
export function assetHealthBreakdown(assetId: string): HealthBreakdown | undefined {
  const a = mockAssets.find((x) => x.id === assetId);
  if (!a || a.status === 'draft') return undefined;
  return computeHealthBreakdown(a, mockAssetChunks[assetId] ?? [], mockCallLogs);
}

// 全局聚合（供概览 KPI 复用）—— 放在文件最后，确保 SECTIONS[].health / mockAssets[].health
// 已经被上面的健康度计算补丁过（而不是用补丁前的手填旧值）
export const KB_TOTALS = {
  totalDocs: SECTIONS.reduce((s, x) => s + x.docCount, 0),
  avgHealth: Math.round(SECTIONS.reduce((s, x) => s + x.health, 0) / SECTIONS.length),
  published: mockAssets.filter((a) => effectiveStatus(a) === 'published').length,
  drafts: mockAssets.filter((a) => a.status === 'draft').length,
  stale: mockAssets.filter((a) => effectiveStatus(a) === 'stale').length,
  archived: mockAssets.filter((a) => a.status === 'archived').length,
};
