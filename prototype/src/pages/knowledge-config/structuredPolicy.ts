// 平台统一规则；客户后台读取已发布配置。
export const mockStructuredPolicyData = {
  version: 1,
  recommendation: true,
};

export const CAPABILITIES = [
  { key: 'search', label: '搜索' }, { key: 'filter', label: '筛选' },
  { key: 'facet', label: '聚合' }, { key: 'sort', label: '排序' },
  { key: 'display', label: '展示' }, { key: 'ai', label: 'AI' },
] as const;
export type Capability = typeof CAPABILITIES[number]['key'];
export type FieldCapabilities = Record<Capability, boolean>;
export function applyBatchFieldCapability(fields: { name: string; type: string }[], selected: string[], overrides: Record<string, Partial<FieldCapabilities>>, capability: Capability, enabled: boolean) {
  const next = { ...overrides };
  let skipped = 0;
  for (const field of fields.filter(field => selected.includes(field.name))) {
    if (!getFieldPolicy(field.type).supported.includes(capability)) { skipped++; continue; }
    next[field.name] = { ...next[field.name], [capability]: enabled };
  }
  return { overrides: next, skipped };
}
export type FieldPolicy = { type: string; group: string; supported: Capability[]; defaults: FieldCapabilities };
const flags = (keys: Capability[]): FieldCapabilities => Object.fromEntries(CAPABILITIES.map(c => [c.key, keys.includes(c.key)])) as FieldCapabilities;
const fieldPolicy = (type: string, group: string, defaults: Capability[], supported: Capability[] = defaults): FieldPolicy => ({ type, group, supported, defaults: flags(defaults) });
const TEXT: Capability[] = ['search', 'display', 'ai'];
const OPTIONS: Capability[] = ['filter', 'facet', 'display'];
const NUMBER: Capability[] = ['filter', 'sort', 'display'];
const ALL = CAPABILITIES.map(c => c.key);

// DataSlot: 平台按类型维护的默认能力；业务字段仍由客户自己的应用定义。
export const mockFieldPoliciesData: FieldPolicy[] = [
  fieldPolicy('单行文本', '基础字段', [...TEXT, 'filter'], ALL),
  ...['多行文本', '富文本（详情）', '富文本（简要）'].map(t => fieldPolicy(t, '基础字段', TEXT)),
  ...['单选框', '多选框', '下拉单选', '下拉多选'].map(t => fieldPolicy(t, '基础字段', OPTIONS, [...OPTIONS, 'search', 'ai'])),
  fieldPolicy('日期', '基础字段', NUMBER, [...NUMBER, 'facet']),
  fieldPolicy('日期区间', '基础字段', ['filter', 'display']),
  fieldPolicy('数值', '基础字段', NUMBER, [...NUMBER, 'facet']),
  ...['图片', '文件', '视频', '图片组'].map(t => fieldPolicy(t, '基础字段', ['display'])),
  fieldPolicy('标签', '基础字段', [...TEXT, 'filter', 'facet']),
  fieldPolicy('评分', '基础字段', [...NUMBER, 'facet']),
  fieldPolicy('滑动条', '基础字段', NUMBER, [...NUMBER, 'facet']),
  fieldPolicy('分类', '高级字段', ['search', 'filter', 'facet', 'display'], ['search', 'filter', 'facet', 'display', 'ai']),
  fieldPolicy('国家/地区', '高级字段', OPTIONS, [...OPTIONS, 'search']),
  fieldPolicy('地址', '高级字段', ['search', 'filter', 'display'], ALL),
  fieldPolicy('关联数据', '高级字段', ['display'], ['search', 'filter', 'facet', 'display', 'ai']),
  fieldPolicy('跳转链接', '高级字段', ['display']),
  fieldPolicy('子表单', '高级字段', ['display']),
  fieldPolicy('库存', '业务字段', NUMBER),
  fieldPolicy('布尔', '基础字段', ['filter', 'facet', 'display']),
];
const TYPE_ALIASES: Record<string, string> = { 文本: '单行文本', 富文本: '富文本（详情）', 选项: '单选框', 链接: '跳转链接', number: '数值', string: '单行文本', boolean: '布尔' };
export function getFieldPolicy(type: string): FieldPolicy {
  return mockFieldPoliciesData.find(p => p.type === (TYPE_ALIASES[type] || type)) || fieldPolicy(type, '待确认', ['display']);
}
export function resolveFieldCapabilities(type: string, overrides: Partial<FieldCapabilities> = {}): FieldCapabilities {
  const policy = getFieldPolicy(type);
  return Object.fromEntries(CAPABILITIES.map(({ key }) => [key, policy.supported.includes(key) && (overrides[key] ?? policy.defaults[key])])) as FieldCapabilities;
}

export const AGGREGATIONS = [
  { key: 'distinct', label: '去重计数' }, { key: 'min', label: '最小值' },
  { key: 'max', label: '最大值' }, { key: 'sum', label: '求和' }, { key: 'avg', label: '平均值' },
] as const;
export type Aggregation = typeof AGGREGATIONS[number]['key'];
export type AggregationPolicy = { key: string; label: string; types: string[]; supported: Aggregation[]; defaults: Aggregation[] };
// 默认是初始化值，不是租户权限；supported 是不可绕过的类型边界。
export const mockAggregationPoliciesData: AggregationPolicy[] = [
  { key: 'text', label: '单行文本', types: ['单行文本'], supported: ['distinct'], defaults: ['distinct'] },
  { key: 'option', label: '单值选项 / 分类 / 地区 / 布尔', types: ['单选框', '下拉单选', '分类', '国家/地区', '布尔'], supported: ['distinct'], defaults: ['distinct'] },
  { key: 'number', label: '数值 / 评分 / 滑动条 / 库存', types: ['数值', '评分', '滑动条', '库存'], supported: ['distinct', 'min', 'max', 'sum', 'avg'], defaults: ['min', 'max'] },
  { key: 'date', label: '日期', types: ['日期'], supported: ['distinct', 'min', 'max'], defaults: ['min', 'max'] },
];
export function getAggregationPolicy(field: { type: string; role?: 'identifier' }): AggregationPolicy {
  if (field.role === 'identifier') return { key: 'identifier', label: '标识字段', types: [], supported: ['distinct'], defaults: ['distinct'] };
  return mockAggregationPoliciesData.find(p => p.types.includes(getFieldPolicy(field.type).type)) || { key: 'none', label: '不支持统计', types: [], supported: [], defaults: [] };
}
export function resolveAggregations(field: { type: string; role?: 'identifier' }, selected?: Aggregation[]): Aggregation[] {
  const rule = getAggregationPolicy(field);
  return (selected ?? rule.defaults).filter((op, index, values) => rule.supported.includes(op) && values.indexOf(op) === index);
}
export type StructuredQueryContext = { purpose: string; recordGrain: string };
export type FieldStatistics = { operations: Aggregation[]; note: string };
export function statisticsError(fields: Array<{ name: string; type: string; role?: 'identifier' }>, statistics: Record<string, FieldStatistics>, context: StructuredQueryContext): string {
  for (const field of fields) {
    const settings = statistics[field.name];
    if (settings?.operations.some(op => op === 'sum' || op === 'avg') && (!settings.note.trim() || !context.recordGrain.trim())) return '开启求和或平均值前，请填写每行代表什么，以及该字段的统计口径。';
  }
  return '';
}

export function initializeStructuredDefaults(asset: {
  id: string; structuredRecords?: Array<Record<string, string | number>>; structuredRecordIds?: string[];
  structuredCapabilityDefaults?: Record<string, FieldCapabilities>; structuredStatistics?: Record<string, FieldStatistics>;
}, fields: Array<{ name: string; type: string; role?: 'identifier' }>) {
  // 演示数据的行号标识不用于生产；重新取得对象或增加字段也要初始化，不能只依赖组件首次挂载。
  asset.structuredRecordIds ??= (asset.structuredRecords || []).map((_, index) => asset.id + ':record:' + index);
  asset.structuredCapabilityDefaults ??= {};
  asset.structuredStatistics ??= {};
  fields.forEach(field => {
    asset.structuredCapabilityDefaults![field.name] ??= resolveFieldCapabilities(field.type);
    asset.structuredStatistics![field.name] ??= { operations: resolveAggregations(field), note: '' };
  });
}

// 当前客户网站属性模板示例，由网站产品后台提供，不属于平台全局配置。
export const mockWebsiteProductTemplateData = {
  siteId: 'site_cn', name: '当前网站 · 产品属性模板', version: 1,
  fields: [
    { name: 'product_id', label: '产品编号', type: '文本', unit: '', searchable: true, role: '产品关联' },
    { name: 'sku', label: 'SKU 编号', type: '文本', unit: '', searchable: true, role: '唯一标识' },
    { name: 'name', label: '产品名称', type: '文本', unit: '', searchable: true, role: '普通字段' },
    { name: 'color', label: '颜色', type: '文本', unit: '', searchable: true, role: '普通字段' },
    { name: 'size', label: '包装大小', type: '文本', unit: '', searchable: true, role: '普通字段' },
    { name: 'weight', label: '重量', type: '数值', unit: 'kg', searchable: false, role: '普通字段' },
    { name: 'material', label: '材质', type: '文本', unit: '', searchable: true, role: '普通字段' },
  ],
};
