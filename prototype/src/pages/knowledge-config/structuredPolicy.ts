// 平台统一规则；客户后台读取已发布配置。
export const mockStructuredPolicyData = {
  version: 1, duplicate: 'update', invalid: 'reject', maxFileMB: 100,
  retrieval: 'hybrid', richText: 'plain', schemaChange: 'pause', limit: 10, childLimit: 5,
  recommendation: true, lowCardinality: 50, maxFields: 200,
};

export const CAPABILITIES = [
  { key: 'search', label: '搜索' }, { key: 'filter', label: '筛选' },
  { key: 'facet', label: '聚合' }, { key: 'sort', label: '排序' },
  { key: 'display', label: '展示' }, { key: 'ai', label: 'AI' },
] as const;
export type Capability = typeof CAPABILITIES[number]['key'];
export type FieldCapabilities = Record<Capability, boolean>;
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
