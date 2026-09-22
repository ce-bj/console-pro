// 知识库配置 — 门户网站、统一元数据字段、字段详情与健康度评分
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  BUILTIN_SCHEMA_FIELDS, mockCustomSchemaFields, SchemaField, SchemaFieldGroup, mockPortalSites,
  TIMELINESS_OPTS,
  KNOWLEDGE_BASE_TYPES, KnowledgeBaseType, CONTENT_FORMATS, VALIDITY_STATUSES, AUDIENCE_OPTIONS, LANGUAGE_OPTIONS,
  PRIMARY_CATEGORIES, SECONDARY_CATEGORIES, mockAssets,
  SECTIONS, assetsOfBoard, mockCallLogs, mockAssetChunks, computeHealthBreakdown, computeHealth,
  mockHealthWeights, HealthBreakdown, DateRangeKey, inDateRange,
} from './data';
import { PageHeader, Hint, HealthValue, DateRangeChips } from './shared';

// 企业维护区域不包含行业知识库；行业知识库分类在“平台维护的字段”中统一编辑
const EDITABLE_CATEGORY_TYPES = KNOWLEDGE_BASE_TYPES.filter((t) => t !== '行业知识库');
const mockPlatformEnumGroupsData = [
  { title: '知识库类型', desc: '表示知识来源与权威归属，也是检索时不可绕过的主要范围。', items: KNOWLEDGE_BASE_TYPES },
  { title: '内容形式', desc: '描述非结构化知识本身是文章、政策、报告、手册等，并用于匹配切片解析规则；问答对和结构化记录由板块固定。', items: CONTENT_FORMATS },
  { title: '适用对象', desc: '描述知识面向的人群；字段可不填，但可选值由平台统一发布。', items: AUDIENCE_OPTIONS },
  { title: '有效状态', desc: '描述内容是否现行有效，与草稿、已发布等生命周期状态相互独立。', items: VALIDITY_STATUSES },
  { title: '语言标签', desc: '标识知识使用的语言，用于筛选与多语言识别，不作为业务分类层级。', items: LANGUAGE_OPTIONS },
  { title: '时效', desc: '用于同步频率和陈旧度判断；阈值由平台规则统一解释。', items: TIMELINESS_OPTS },
];

// ── 板块元数据总览：可排序表 ──────────────────────────────────────
type SortKey = 'docCount' | 'health' | 'refs' | 'updatedAt';
function boardRefs(key: string, range: DateRangeKey) {
  return mockCallLogs.filter((l) => l.hitBoard === key && inDateRange(l.date, range)).length;
}
function boardLastUpdated(key: (typeof SECTIONS)[number]['key']) {
  const dates = assetsOfBoard(key).map((a) => a.updatedAt);
  return dates.length === 0 ? '' : dates.reduce((a, b) => (a > b ? a : b));
}

const HEALTH_DIM_LABEL: Record<keyof HealthBreakdown, string> = { quality: '质量', timeliness: '时效', reuse: '复用', feedback: '反馈' };
const HEALTH_DIMS = Object.keys(HEALTH_DIM_LABEL) as (keyof HealthBreakdown)[];
interface HealthCalcParam {
  key: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  desc: string;
}
const DEFAULT_HEALTH_CALC_CONFIG: Record<keyof HealthBreakdown, HealthCalcParam[]> = {
  quality: [
    { key: 'sensitiveDeduct', label: '敏感词命中扣分', value: 40, unit: '分', min: 0, max: 100, desc: '资产名称或切片正文命中敏感词库时扣分' },
    { key: 'duplicateDeduct', label: '疑似重复扣分', value: 20, unit: '分', min: 0, max: 100, desc: '与同板块已有资产标题/标签高度相似时扣分' },
    { key: 'issueChunkMaxDeduct', label: '问题切片封顶扣分', value: 30, unit: '分', min: 0, max: 100, desc: '按有问题切片占比折算，最多扣这么多' },
    { key: 'issueChunkRatioWeight', label: '问题切片占比系数', value: 0.3, unit: '倍', min: 0, max: 2, step: 0.05, desc: '问题切片占比换算成扣分时使用的系数' },
    { key: 'qualityFloor', label: '质量最低保底分', value: 0, unit: '分', min: 0, max: 100, desc: '多项扣分叠加后不低于该分值' },
  ],
  timeliness: [
    { key: 'freshRealtimeDays', label: '实时内容新鲜阈值', value: 1, unit: '天', min: 1, max: 30, desc: '实时类内容超过该天数开始扣分' },
    { key: 'freshHourlyDays', label: '小时级内容新鲜阈值', value: 3, unit: '天', min: 1, max: 60, desc: '小时级内容超过该天数开始扣分' },
    { key: 'freshDailyDays', label: '每日内容新鲜阈值', value: 14, unit: '天', min: 1, max: 180, desc: '每日同步内容超过该天数开始扣分' },
    { key: 'freshStaticDays', label: '静态内容新鲜阈值', value: 180, unit: '天', min: 1, max: 720, desc: '静态资料超过该天数开始扣分' },
    { key: 'firstDecayScore', label: '一倍超期后目标分', value: 50, unit: '分', min: 0, max: 100, desc: '超过新鲜阈值一倍时线性扣到的分数' },
    { key: 'timelinessFloor', label: '时效最低保底分', value: 10, unit: '分', min: 0, max: 100, desc: '内容极度陈旧时的最低分' },
  ],
  reuse: [
    { key: 'reuseBaseScore', label: '零命中基础分', value: 40, unit: '分', min: 0, max: 100, desc: '没有任何检索命中时的基础分' },
    { key: 'reusePerHitScore', label: '单次命中加分', value: 12, unit: '分', min: 0, max: 50, desc: '每被检索命中一次增加的分数' },
    { key: 'reuseMaxScore', label: '复用最高分', value: 100, unit: '分', min: 1, max: 100, desc: '命中次数再高也不超过该分数' },
    { key: 'reuseWindowDays', label: '命中统计窗口', value: 30, unit: '天', min: 1, max: 365, desc: '统计近多少天的问答调用命中记录' },
    { key: 'lowReuseWarnScore', label: '低复用预警线', value: 60, unit: '分', min: 0, max: 100, desc: '低于该分值时提示补充常见问覆盖' },
  ],
  feedback: [
    { key: 'noFeedbackBaseline', label: '无反馈基准分', value: 75, unit: '分', min: 0, max: 100, desc: '没有赞踩反馈时使用的默认分' },
    { key: 'positiveFeedbackWeight', label: '正向反馈权重', value: 1, unit: '倍', min: 0, max: 5, step: 0.1, desc: '计算赞占比时，赞的计数权重' },
    { key: 'negativeFeedbackWeight', label: '负向反馈权重', value: 1, unit: '倍', min: 0, max: 5, step: 0.1, desc: '计算赞占比时，踩的计数权重' },
    { key: 'minFeedbackSamples', label: '最低反馈样本数', value: 3, unit: '条', min: 0, max: 100, desc: '低于该样本量时仍按无反馈基准分处理' },
    { key: 'badFeedbackWarnScore', label: '差评预警线', value: 60, unit: '分', min: 0, max: 100, desc: '低于该分值时提示查看差评对话' },
  ],
};

// 标准枚举由平台统一维护；企业控制台只展示当前可用值，不提供增删入口
// ACTION: 更新平台元数据枚举 [PUT] /api/kb/metadata/platform-enums/{field}
function handleUpdatePlatformEnum(payload: { field: string; values: readonly string[] }) {
  console.log('update platform enum', payload);
}

function PlatformEnumCard({ title, desc, items, onChange }: {
  title: string; desc: string; items: string[]; onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function addItem() {
    const value = draft.trim();
    if (!value || items.includes(value)) { setDraft(''); return; }
    const next = [...items, value];
    handleUpdatePlatformEnum({ field: title, values: next });
    onChange(next);
    setDraft('');
  }

  function removeItem(value: string) {
    const count = mockAssets.filter((asset) => {
      if (title === '知识库类型') return asset.knowledgeBaseType === value;
      if (title === '内容形式') return asset.contentFormat === value;
      if (title === '适用对象') return asset.audience === value;
      if (title === '有效状态') return asset.validityStatus === value;
      if (title === '语言标签') return asset.language === value;
      if (title === '时效') return asset.timeliness === value;
      return false;
    }).length;
    if (count > 0) { alert(`“${value}”已被 ${count} 条知识资产使用，请先迁移或清空引用。`); return; }
    const next = items.filter((item) => item !== value);
    handleUpdatePlatformEnum({ field: title, values: next });
    onChange(next);
  }

  return (
    <div className="rounded-md border bg-gray-50 p-3 space-y-3">
      <div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <p className="mt-1 text-xs leading-5 text-gray-500">{desc}</p>
      </div>
      <div>
        <div className="mb-1 text-xs text-gray-400">枚举值</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge className="text-xs border border-dashed border-gray-300 bg-white text-gray-400 font-normal">未指定（系统）</Badge>
          {items.map((v) => (
            <Badge key={v} className="text-xs bg-white text-gray-600 font-normal gap-1.5 pr-1.5">
              {v}
              <button className="text-gray-400 hover:text-red-500" onClick={() => removeItem(v)}>✕</button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addItem()} placeholder={`新增${title}选项`} className="h-7 text-xs max-w-[180px]" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addItem}>+ 添加</Button>
        </div>
      </div>
    </div>
  );
}

// 一级/二级分类配置：按知识库类型分组，一级分类可增删，二级分类挂在选中的一级分类下
function CategoryConfigCard({ type, primaryCats, onPrimaryChange, secondaryMap, onSecondaryChange }: {
  type: KnowledgeBaseType;
  primaryCats: string[];
  onPrimaryChange: (next: string[]) => void;
  secondaryMap: Record<string, string[]>;
  onSecondaryChange: (primary: string, next: string[]) => void;
}) {
  const [primaryDraft, setPrimaryDraft] = useState('');
  const [activePrimary, setActivePrimary] = useState(primaryCats[0] ?? '');
  const [secondaryDraft, setSecondaryDraft] = useState('');

  function addPrimary() {
    const v = primaryDraft.trim();
    if (!v || primaryCats.includes(v)) { setPrimaryDraft(''); return; }
    // ACTION: 新增一级分类 [POST] /api/kb/metadata/primary-category
    onPrimaryChange([...primaryCats, v]);
    setPrimaryDraft('');
  }
  function removePrimary(v: string) {
    const count = mockAssets.filter((a) => a.knowledgeBaseType === type && a.primaryCategory === v).length;
    if (count > 0) { alert(`“${v}”已被 ${count} 条知识资产使用，请先迁移或清空引用。`); return; }
    // ACTION: 删除一级分类 [DELETE] /api/kb/metadata/primary-category/{value}
    const next = primaryCats.filter((x) => x !== v);
    onPrimaryChange(next);
    if (activePrimary === v) setActivePrimary(next[0] ?? '');
  }
  const secondaryCats = secondaryMap[`${type}::${activePrimary}`] ?? [];
  function addSecondary() {
    const v = secondaryDraft.trim();
    if (!v || !activePrimary || secondaryCats.includes(v)) { setSecondaryDraft(''); return; }
    // ACTION: 新增二级分类 [POST] /api/kb/metadata/secondary-category
    onSecondaryChange(activePrimary, [...secondaryCats, v]);
    setSecondaryDraft('');
  }
  function removeSecondary(v: string) {
    const count = mockAssets.filter((a) => a.knowledgeBaseType === type && a.primaryCategory === activePrimary && a.secondaryCategory === v).length;
    if (count > 0) { alert(`“${v}”已被 ${count} 条知识资产使用，请先迁移或清空引用。`); return; }
    // ACTION: 删除二级分类 [DELETE] /api/kb/metadata/secondary-category/{value}
    onSecondaryChange(activePrimary, secondaryCats.filter((x) => x !== v));
  }

  return (
    <div className="rounded-md border bg-gray-50 p-3 space-y-3">
      <div className="text-sm font-medium text-gray-700">{type}</div>
      <div>
        <div className="text-xs text-gray-400 mb-1">一级分类</div>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {primaryCats.map((v) => (
            <Badge key={v} onClick={() => setActivePrimary(v)}
              className={`text-xs font-normal gap-1.5 pr-1.5 cursor-pointer ${v === activePrimary ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
              {v}
              <button className={v === activePrimary ? 'text-blue-100 hover:text-red-200' : 'text-gray-400 hover:text-red-500'} onClick={(e) => { e.stopPropagation(); removePrimary(v); }}>✕</button>
            </Badge>
          ))}
          {primaryCats.length === 0 && <span className="text-xs text-gray-300">暂无</span>}
        </div>
        <div className="flex gap-2">
          <Input value={primaryDraft} onChange={(e) => setPrimaryDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPrimary()} placeholder="新增一级分类" className="h-7 text-xs max-w-[160px]" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addPrimary}>+ 添加</Button>
        </div>
      </div>
      {activePrimary && (
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-400 mb-1">「{activePrimary}」的二级分类</div>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {secondaryCats.map((v) => (
              <Badge key={v} className="text-xs bg-white text-gray-600 font-normal gap-1.5 pr-1.5">
                {v}
                <button className="text-gray-400 hover:text-red-500" onClick={() => removeSecondary(v)}>✕</button>
              </Badge>
            ))}
            {secondaryCats.length === 0 && <span className="text-xs text-gray-300">暂无</span>}
          </div>
          <div className="flex gap-2">
            <Input value={secondaryDraft} onChange={(e) => setSecondaryDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSecondary()} placeholder="新增二级分类" className="h-7 text-xs max-w-[160px]" />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addSecondary}>+ 添加</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MetadataPage() {
  const navigate = useNavigate();
  const [primaryCategories, setPrimaryCategories] = useState<Record<KnowledgeBaseType, string[]>>({ ...PRIMARY_CATEGORIES });
  const [secondaryCategories, setSecondaryCategories] = useState<Record<string, string[]>>({ ...SECONDARY_CATEGORIES });
  const [platformEnumGroups, setPlatformEnumGroups] = useState(() => mockPlatformEnumGroupsData.map((group) => ({ ...group, items: [...group.items] })));
  const [selectedPortalSites, setSelectedPortalSites] = useState<string[]>([]);
  const [portalPickerOpen, setPortalPickerOpen] = useState(false);

  // ACTION: 更新元数据规范适用门户网站 [PATCH] /api/kb/metadata/portal-scope
  function handleChangePortalScope(next: string[]) {
    setSelectedPortalSites(next);
  }
  function togglePortalSite(id: string) {
    const next = selectedPortalSites.includes(id)
      ? selectedPortalSites.filter((x) => x !== id)
      : [...selectedPortalSites, id];
    handleChangePortalScope(next);
  }
  const portalScopeLabel = selectedPortalSites.length === 0
    ? '全部门户网站'
    : mockPortalSites.filter((s) => selectedPortalSites.includes(s.id)).map((s) => s.name).join('、');

  const [customSchema, setCustomSchema] = useState<SchemaField[]>(mockCustomSchemaFields);
  const [schemaDraft, setSchemaDraft] = useState<SchemaField>({ field: '', meaning: '', group: '内容说明', category: '输入', required: '可选', example: '' });
  function addSchemaField() {
    const key = schemaDraft.field.trim();
    if (!key) { alert('请填写字段名'); return; }
    if (customSchema.some((f) => f.field === key)) { alert('字段名已存在'); return; }
    // ACTION: 新增自定义元数据字段 [POST] /api/kb/schema/custom-fields
    setCustomSchema((p) => [...p, { field: key, meaning: schemaDraft.meaning.trim(), group: '内容说明', category: schemaDraft.category, required: schemaDraft.required.trim() || '可选', example: schemaDraft.example.trim() }]);
    setSchemaDraft({ field: '', meaning: '', group: '内容说明', category: '输入', required: '可选', example: '' });
  }
  function removeSchemaField(field: string) {
    // ACTION: 删除自定义元数据字段 [DELETE] /api/kb/schema/custom-fields/{field}
    setCustomSchema((p) => p.filter((f) => f.field !== field));
  }
  const [sortKey, setSortKey] = useState<SortKey>('refs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [refRange, setRefRange] = useState<DateRangeKey>('all'); // 引用次数默认看全部，避免把长期重要但近期没被问的板块埋没
  function toggleSort(k: SortKey) {
    if (k === sortKey) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return; }
    setSortKey(k);
    setSortDir('desc');
  }
  const boardRows = SECTIONS.map((s) => ({
    s, refs: boardRefs(s.key, refRange), fieldCount: s.autoMetadataFields.length, lastUpdated: boardLastUpdated(s.key),
  })).sort((a, b) => {
    const va = sortKey === 'docCount' ? a.s.docCount : sortKey === 'health' ? a.s.health : sortKey === 'refs' ? a.refs : a.lastUpdated;
    const vb = sortKey === 'docCount' ? b.s.docCount : sortKey === 'health' ? b.s.health : sortKey === 'refs' ? b.refs : b.lastUpdated;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
  const SORT_COLS: { key: SortKey; label: string }[] = [
    { key: 'docCount', label: '知识条数' }, { key: 'health', label: '平均健康度' },
    { key: 'refs', label: '引用次数' }, { key: 'updatedAt', label: '最近更新' },
  ];

  // ── 健康度评分权重 ─────────────────────────────────────────────
  const [weights, setWeights] = useState<HealthBreakdown>({ ...mockHealthWeights });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [healthCalcConfig, setHealthCalcConfig] = useState<Record<keyof HealthBreakdown, HealthCalcParam[]>>({ ...DEFAULT_HEALTH_CALC_CONFIG });
  const weightSum = weights.quality + weights.timeliness + weights.reuse + weights.feedback;
  function setWeight(dim: keyof HealthBreakdown, v: number) {
    setWeights((p) => ({ ...p, [dim]: Math.max(0, Math.min(100, v)) }));
  }
  function getParamValue(dim: keyof HealthBreakdown, key: string) {
    return healthCalcConfig[dim].find((p) => p.key === key)?.value ?? 0;
  }
  function updateHealthCalcParam(dim: keyof HealthBreakdown, key: string, value: number) {
    setHealthCalcConfig((p) => ({
      ...p,
      [dim]: p[dim].map((item) => {
        if (item.key !== key) return item;
        const nextValue = Math.max(item.min, Math.min(item.max, value));
        return { ...item, value: Number.isNaN(nextValue) ? item.value : nextValue };
      }),
    }));
  }
  function healthConfigSummary(dim: keyof HealthBreakdown) {
    if (dim === 'quality') return `敏感词扣 ${getParamValue(dim, 'sensitiveDeduct')} 分 / 重复扣 ${getParamValue(dim, 'duplicateDeduct')} 分 / 切片问题最多扣 ${getParamValue(dim, 'issueChunkMaxDeduct')} 分`;
    if (dim === 'timeliness') return `实时 ${getParamValue(dim, 'freshRealtimeDays')} 天 / 每日 ${getParamValue(dim, 'freshDailyDays')} 天 / 静态 ${getParamValue(dim, 'freshStaticDays')} 天后开始扣分`;
    if (dim === 'reuse') return `零命中 ${getParamValue(dim, 'reuseBaseScore')} 分 / 每命中 +${getParamValue(dim, 'reusePerHitScore')} 分 / 窗口 ${getParamValue(dim, 'reuseWindowDays')} 天`;
    return `无反馈 ${getParamValue(dim, 'noFeedbackBaseline')} 分 / 最低样本 ${getParamValue(dim, 'minFeedbackSamples')} 条 / 差评预警 ${getParamValue(dim, 'badFeedbackWarnScore')} 分`;
  }
  function healthCalcDetail(dim: keyof HealthBreakdown) {
    if (dim === 'quality') {
      const sensitive = getParamValue(dim, 'sensitiveDeduct');
      const duplicate = getParamValue(dim, 'duplicateDeduct');
      const maxIssue = getParamValue(dim, 'issueChunkMaxDeduct');
      const ratioWeight = getParamValue(dim, 'issueChunkRatioWeight');
      const floor = getParamValue(dim, 'qualityFloor');
      return {
        trigger: '入库评估或重新解析后开始计算；只要命中敏感词、疑似重复、存在问题切片，就进入扣分。',
        formula: `质量分 = max(${floor}, 100 - 敏感词命中×${sensitive} - 疑似重复×${duplicate} - min(${maxIssue}, 问题切片占比×100×${ratioWeight}))。`,
        example: `例：命中敏感词且 20% 切片有问题，不重复，则质量分 = 100 - ${sensitive} - min(${maxIssue}, 20×${ratioWeight})。`,
      };
    }
    if (dim === 'timeliness') {
      const realtime = getParamValue(dim, 'freshRealtimeDays');
      const daily = getParamValue(dim, 'freshDailyDays');
      const staticDays = getParamValue(dim, 'freshStaticDays');
      const firstDecayScore = getParamValue(dim, 'firstDecayScore');
      const floor = getParamValue(dim, 'timelinessFloor');
      return {
        trigger: `超过该资产时效等级的新鲜阈值后开始扣分；实时 ${realtime} 天、每日 ${daily} 天、静态 ${staticDays} 天。`,
        formula: `未超期 = 100；超期到 2 倍阈值之间线性扣到 ${firstDecayScore}；超过 2 倍阈值继续扣，但不低于 ${floor}。结构化数据实时直查，固定 100。`,
        example: `例：每日内容阈值 ${daily} 天，距离上次更新 21 天，超期比例 21/${daily}=1.5，分数在 100 到 ${firstDecayScore} 之间线性下降。`,
      };
    }
    if (dim === 'reuse') {
      const base = getParamValue(dim, 'reuseBaseScore');
      const perHit = getParamValue(dim, 'reusePerHitScore');
      const maxScore = getParamValue(dim, 'reuseMaxScore');
      const windowDays = getParamValue(dim, 'reuseWindowDays');
      return {
        trigger: `按近 ${windowDays} 天问答调用记录统计；没有命中不扣到 0，而是给基础分。`,
        formula: `复用分 = min(${maxScore}, ${base} + 命中次数×${perHit})。`,
        example: `例：近 ${windowDays} 天命中 4 次，则复用分 = min(${maxScore}, ${base} + 4×${perHit})。`,
      };
    }
    const baseline = getParamValue(dim, 'noFeedbackBaseline');
    const positiveWeight = getParamValue(dim, 'positiveFeedbackWeight');
    const negativeWeight = getParamValue(dim, 'negativeFeedbackWeight');
    const minSamples = getParamValue(dim, 'minFeedbackSamples');
    return {
      trigger: `带赞踩的反馈样本达到 ${minSamples} 条后开始按真实反馈计算；不足样本用无反馈基准分。`,
      formula: `反馈分 = 赞数×${positiveWeight} / (赞数×${positiveWeight} + 踩数×${negativeWeight}) × 100；样本不足时 = ${baseline}。`,
      example: `例：赞 8、踩 2，则反馈分 = 8×${positiveWeight} / (8×${positiveWeight}+2×${negativeWeight}) × 100。`,
    };
  }
  function saveWeights() {
    if (weightSum !== 100) { alert('四项权重之和须为 100，当前为 ' + weightSum); return; }
    // ACTION: 保存健康度评分权重 [PUT] /api/kb/health-weights
    alert('健康度评分权重已保存，将在下次评估周期生效');
  }
  function saveAdvancedConfig() {
    // ACTION: 保存健康度高级计算参数 [PUT] /api/kb/health-calculation-config
    alert('健康度高级计算参数已保存，将用于后续健康度评估');
    setAdvancedOpen(false);
  }
  const weightPreview = SECTIONS.map((s) => {
    const boardAssets = assetsOfBoard(s.key).filter((a) => a.status !== 'draft');
    const avg = boardAssets.length === 0 ? s.health : Math.round(
      boardAssets.reduce((sum, a) => sum + computeHealth(computeHealthBreakdown(a, mockAssetChunks[a.id] ?? [], mockCallLogs), weights), 0) / boardAssets.length,
    );
    return { s, avg };
  });
  const contributionPreviewAsset = assetsOfBoard('document').find((a) => a.status !== 'draft');
  const contributionBreakdown = contributionPreviewAsset
    ? computeHealthBreakdown(contributionPreviewAsset, mockAssetChunks[contributionPreviewAsset.id] ?? [], mockCallLogs)
    : ({ quality: 0, timeliness: 0, reuse: 0, feedback: 0 } as HealthBreakdown);
  const contributionRows = HEALTH_DIMS.map((dim) => ({
    dim,
    score: contributionBreakdown[dim],
    weight: weights[dim],
    contribution: Math.round(contributionBreakdown[dim] * weights[dim]) / 100,
  }));
  const contributionTotal = Math.round(contributionRows.reduce((sum, r) => sum + r.contribution, 0));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="知识库配置"
        desc="统一定义知识文档可填写的字段、字段含义和下拉选项，并配置适用门户与健康度规则。具体字段值仍在每份知识资产上填写。"
      />

      {/* 门户网站范围：元数据规范优先选择适用站点，不在这里新建站点 */}
      <Card className="order-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            门户网站选择
            <Badge className="text-xs bg-gray-100 text-gray-600">{selectedPortalSites.length === 0 ? '全部' : `${selectedPortalSites.length} 个`}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <button
              type="button"
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 shadow-sm hover:bg-gray-50"
              onClick={() => setPortalPickerOpen((v) => !v)}
            >
              <span>{portalScopeLabel}</span>
              <span className="float-right text-gray-400">⌄</span>
            </button>
            {portalPickerOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
                <label className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedPortalSites.length === 0}
                    onChange={() => handleChangePortalScope([])}
                    className="accent-blue-600"
                  />
                  全部门户网站
                </label>
                <div className="my-1 border-t" />
                {mockPortalSites.map((s) => (
                  <label key={s.id} className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPortalSites.includes(s.id)}
                        onChange={() => togglePortalSite(s.id)}
                        className="accent-blue-600"
                      />
                      {s.name}
                    </span>
                    <span className="text-xs text-gray-400">{s.domain}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">选择后，本页维护的枚举、字段与健康度规则优先作用于所选门户网站；不选则默认全部站点通用。</p>
        </CardContent>
      </Card>

      <div className="order-2">
        <h2 className="text-base font-semibold text-gray-900">统一元数据字段</h2>
      </div>

      <div className="order-5">
        <h2 className="text-base font-semibold text-gray-900">健康度评分</h2>
      </div>

      {/* 板块元数据总览：哪个板块常用/被引用多，一目了然，可排序 */}
      <Card className="order-5">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">健康度板块概览</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">引用次数统计范围</span>
            <DateRangeChips value={refRange} onChange={setRefRange} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>板块</TableHead>
                {SORT_COLS.map((c) => (
                  <TableHead key={c.key}>
                    <button className="inline-flex items-center gap-1 hover:text-gray-900" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      <span className="text-[10px] text-gray-400">{sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  </TableHead>
                ))}
                <TableHead>自定义元数据字段</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardRows.map(({ s, refs, fieldCount, lastUpdated }) => (
                <TableRow key={s.key}>
                  <TableCell className="text-sm text-gray-800">{s.emoji} {s.name}</TableCell>
                  <TableCell className="text-sm text-gray-700">{s.docCount}</TableCell>
                  <TableCell><HealthValue value={s.health} className="text-sm" /></TableCell>
                  <TableCell className="text-sm text-gray-700">{refs}</TableCell>
                  <TableCell className="text-xs text-gray-400">{lastUpdated || '—'}</TableCell>
                  <TableCell className="text-xs text-gray-500">{fieldCount > 0 ? `${fieldCount} 个` : '未配置'}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-xs text-blue-600 hover:underline" onClick={() => navigate(`/knowledge-config/sections/${s.key}`)}>查看配置 →</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-[11px] text-gray-400 mt-2">引用次数来自最近问答调用记录，仅供板块运营排序参考。</p>
        </CardContent>
      </Card>

      {/* 健康度评分权重：质量/时效/复用/反馈四维怎么算、占比多少 */}
      <Card className="order-6">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">健康度评分权重</CardTitle>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAdvancedOpen(true)}>高级配置</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-400">健康度先计算质量、时效、复用、反馈四个维度的 0–100 分，再按权重折算：维度贡献 = 维度分 × 权重%，四项贡献相加为最终健康度。</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {HEALTH_DIMS.map((dim) => (
              <div key={dim}>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>{HEALTH_DIM_LABEL[dim]}</span>
                  <span className="text-gray-700 font-medium">最高贡献 {weights[dim]} 分</span>
                </div>
                <input type="range" min={0} max={100} value={weights[dim]} onChange={(e) => setWeight(dim, +e.target.value)} className="w-full accent-blue-600" />
                <p className="text-[11px] text-gray-400 mt-0.5">权重 {weights[dim]}% · {healthConfigSummary(dim)}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className={`text-sm font-medium ${weightSum === 100 ? 'text-green-600' : 'text-red-500'}`}>当前合计 {weightSum}%{weightSum !== 100 && '（须为 100 才能保存）'}</span>
            <Button size="sm" className="bg-blue-600" disabled={weightSum !== 100} onClick={saveWeights}>保存权重</Button>
          </div>

          <div className="rounded-md border bg-gray-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">权重贡献预览{contributionPreviewAsset ? ` — 以「${contributionPreviewAsset.name}」为例` : ''}</div>
              <div className="text-sm font-semibold text-gray-800">总分 {contributionTotal}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {contributionRows.map((r) => (
                <div key={r.dim} className="rounded border bg-white p-2">
                  <div className="text-xs text-gray-500">{HEALTH_DIM_LABEL[r.dim]}</div>
                  <div className="text-sm text-gray-800 mt-1">{r.score} × {r.weight}% = <span className="font-semibold">{r.contribution}</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* 实时预览：按当前滑块权重重算的板块平均健康度 */}
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-400 mb-2">预览 — 按当前权重重算的板块平均健康度</div>
            <div className="grid grid-cols-6 gap-2">
              {weightPreview.map(({ s, avg }) => (
                <div key={s.key} className="p-2 rounded border bg-gray-50 text-center">
                  <div className="text-xs text-gray-500">{s.emoji} {s.name}</div>
                  <HealthValue value={avg} className="text-lg" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统一元数据字段（Knowledge Schema）：内置字段只读 + 自定义字段可增删改，全部板块通用 */}
      <Card className="order-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">统一元数据字段（Knowledge Schema）</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">系统字段 <span className="text-gray-300">— 知识库通用的文档级元数据，按字段分组统一展示</span></div>
            <div className="space-y-3">
              {(['基础信息与来源', '业务归类', '内容属性', '组织与适用范围', '内容说明'] as SchemaFieldGroup[]).map((group) => (
                <div key={group} className="rounded-md border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">{group}</div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>字段</TableHead><TableHead>说明</TableHead><TableHead>类别</TableHead><TableHead>必填状态</TableHead><TableHead>示例</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {BUILTIN_SCHEMA_FIELDS.filter((f) => f.group === group).map((f) => (
                        <TableRow key={f.field}>
                          <TableCell className="text-sm font-mono text-gray-700">{f.field}</TableCell>
                          <TableCell className="text-sm text-gray-600">{f.meaning}</TableCell>
                          <TableCell className="text-xs text-gray-500">{f.category}</TableCell>
                          <TableCell className="text-xs text-gray-500">{f.required}</TableCell>
                          <TableCell className="text-xs text-gray-400">{f.category === '选项' ? f.example : ''}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500 mb-1.5">自定义字段 <span className="text-gray-300">— 全部板块通用，加入后会在知识新增、编辑与详情中展示</span></div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>字段</TableHead><TableHead>说明</TableHead><TableHead>类别</TableHead><TableHead>必填状态</TableHead><TableHead>示例</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {customSchema.map((f) => (
                  <TableRow key={f.field}>
                    <TableCell className="text-sm font-mono text-gray-700">{f.field}</TableCell>
                    <TableCell className="text-sm text-gray-600">{f.meaning}</TableCell>
                    <TableCell className="text-xs text-gray-500">{f.category}</TableCell>
                    <TableCell className="text-xs text-gray-500">{f.required}</TableCell>
                    <TableCell className="text-xs text-gray-400">{f.category === '选项' ? f.example : ''}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => removeSchemaField(f.field)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><Input value={schemaDraft.field} onChange={(e) => setSchemaDraft({ ...schemaDraft, field: e.target.value })} placeholder="字段名，如 competitor_ref" className="h-8 text-xs font-mono" /></TableCell>
                  <TableCell><Input value={schemaDraft.meaning} onChange={(e) => setSchemaDraft({ ...schemaDraft, meaning: e.target.value })} placeholder="说明" className="h-8 text-xs" /></TableCell>
                  <TableCell>
                    <select value={schemaDraft.category} onChange={(e) => setSchemaDraft({ ...schemaDraft, category: e.target.value as '选项' | '输入' })} className="h-8 w-full px-2 rounded-md border text-xs bg-white">
                      <option value="输入">输入</option>
                      <option value="选项">选项</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <select value={schemaDraft.required} onChange={(e) => setSchemaDraft({ ...schemaDraft, required: e.target.value })} className="h-8 w-full px-2 rounded-md border text-xs bg-white">
                      <option value="可选">可选</option>
                      <option value="必填">必填</option>
                    </select>
                  </TableCell>
                  <TableCell><Input value={schemaDraft.example} onChange={(e) => setSchemaDraft({ ...schemaDraft, example: e.target.value })} placeholder="示例（选填）" className="h-8 text-xs" /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addSchemaField}>+ 添加</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 平台维护字段：企业侧仅查看可用枚举，避免租户自行改写系统语义 */}
      <section className="order-2 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">平台维护的字段</h2>
          </div>
          <Badge className="shrink-0 bg-violet-50 text-violet-600 font-normal">平台权限</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {platformEnumGroups.map((group) => (
            <PlatformEnumCard key={group.title} title={group.title} desc={group.desc} items={group.items}
              onChange={(next) => setPlatformEnumGroups((groups) => groups.map((item) => item.title === group.title ? { ...item, items: next } : item))} />
          ))}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">行业知识库分类</h3>
              <p className="mt-1 text-xs text-gray-500">平台统一维护一级分类及其下属二级分类。</p>
            </div>
            <Badge className="bg-violet-50 text-violet-600 font-normal">平台维护</Badge>
          </div>
          <CategoryConfigCard
            type="行业知识库"
            primaryCats={primaryCategories['行业知识库']}
            onPrimaryChange={(next) => setPrimaryCategories((p) => ({ ...p, 行业知识库: next }))}
            secondaryMap={secondaryCategories}
            onSecondaryChange={(primary, next) => setSecondaryCategories((p) => ({ ...p, [`行业知识库::${primary}`]: next }))}
          />
        </div>
      </section>

      {/* 分类体系：企业自有知识库由企业维护；行业知识库沿用平台发布的分类 */}
      <Card className="order-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between gap-2">
            <span>企业维护的字段</span>
            <Badge className="bg-blue-50 text-blue-600 font-normal">企业可编辑</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {EDITABLE_CATEGORY_TYPES.map((type) => (
              <CategoryConfigCard
                key={type}
                type={type}
                primaryCats={primaryCategories[type]}
                onPrimaryChange={(next) => setPrimaryCategories((p) => ({ ...p, [type]: next }))}
                secondaryMap={secondaryCategories}
                onSecondaryChange={(primary, next) => setSecondaryCategories((p) => ({ ...p, [`${type}::${primary}`]: next }))}
              />
            ))}
          </div>
        </CardContent>
      </Card>


      {/* 健康度高级配置弹窗 */}
      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>健康度高级配置</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-400 -mt-2">按维度配置健康度计算参数。这里改的是扣分、阈值、基准分和统计窗口；四个维度的占比仍在主卡片中调整。</p>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {HEALTH_DIMS.map((dim) => (
              <div key={dim} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-800">{HEALTH_DIM_LABEL[dim]}</div>
                  <Badge className="text-xs bg-blue-50 text-blue-600 font-normal">最高贡献 {weights[dim]} 分</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([
                    ['开始扣分/计分', healthCalcDetail(dim).trigger],
                    ['怎么计算', healthCalcDetail(dim).formula],
                    ['当前示例', healthCalcDetail(dim).example],
                  ] as [string, string][]).map(([label, text]) => (
                    <div key={label} className="rounded bg-gray-50 border p-2">
                      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
                      <div className="text-xs text-gray-600 leading-relaxed">{text}</div>
                    </div>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">参数项</TableHead>
                      <TableHead className="w-[150px]">数值</TableHead>
                      <TableHead className="w-[80px]">单位</TableHead>
                      <TableHead>说明</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {healthCalcConfig[dim].map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="text-sm text-gray-700">{item.label}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={item.min}
                            max={item.max}
                            step={item.step ?? 1}
                            value={item.value}
                            onChange={(e) => updateHealthCalcParam(dim, item.key, Number(e.target.value))}
                            className="h-8 w-28 text-sm"
                          />
                          <div className="text-[11px] text-gray-300 mt-1">范围 {item.min} - {item.max}</div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{item.unit}</TableCell>
                        <TableCell className="text-xs text-gray-400">{item.desc}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setAdvancedOpen(false)}>取消</Button>
            <Button size="sm" className="bg-blue-600" onClick={saveAdvancedConfig}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
