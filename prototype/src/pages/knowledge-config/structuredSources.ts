export type SourceField = { name: string; label: string; type: string; unit?: string; searchable?: boolean; role?: 'identifier' };
export type StructuredSource = {
  id: string; siteId: string; application: string; name: string; count: number; schemaVersion: number;
  recordGrain?: string;
  fields: SourceField[]; status?: 'unavailable'; reason?: string;
  special?: { kind: 'product-specifications'; enabledProducts: number; totalProducts: number; origin: string };
  children?: { name: string; fields: SourceField[]; kind: 'subtable' | 'sku' };
};

// DataSlot: 当前网站应用设置提供的数据源及字段，不是平台统一业务模板。
export const mockStructuredSourcesData: StructuredSource[] = [
  { id: 'be_product_product', siteId: 'site_cn', application: '产品管理', name: '产品', count: 128, schemaVersion: 3, recordGrain: '一个产品', fields: [
    { name: 'product_id', label: '产品编号', type: '文本', role: 'identifier', searchable: true }, { name: 'name', label: '产品名称', type: '文本', searchable: true },
    { name: 'material', label: '材质', type: '文本', searchable: true }, { name: 'weight', label: '重量', type: '数值', unit: 'kg' },
    { name: 'description', label: '产品描述', type: '富文本' }, { name: 'image', label: '产品图片', type: '图片' },
  ], children: { name: '产品规格（SKU）', kind: 'sku', fields: [
    { name: 'sku', label: 'SKU', type: '文本', role: 'identifier', searchable: true }, { name: 'color', label: '颜色', type: '文本' },
    { name: 'size', label: '包装大小', type: '文本' }, { name: 'weight', label: '重量', type: '数值', unit: 'kg' }, { name: 'stock', label: '库存', type: '数值' },
  ] } },
  { id: 'be_product_details', siteId: 'site_cn', application: '产品管理', name: '产品明细', count: 64, schemaVersion: 2, fields: [
    { name: 'source', label: '来源', type: '文本', searchable: true }, { name: 'author', label: '作者', type: '文本' },
    { name: 'cover', label: '封面图', type: '图片' }, { name: 'detail', label: '详情', type: '富文本' },
    { name: 'summary', label: '概要', type: '多行文本', searchable: true }, { name: 'keywords', label: '关键词', type: '标签', searchable: true },
  ], children: { name: '详情图明细', kind: 'subtable', fields: [{ name: 'image', label: '详情图', type: '图片' }, { name: 'caption', label: '图片说明', type: '文本' }] } },
  { id: 'be_news', siteId: 'site_cn', application: '云资讯', name: '资讯列表与详情', count: 152, schemaVersion: 1, fields: [
    { name: 'title', label: '标题', type: '文本', searchable: true }, { name: 'published_at', label: '发布时间', type: '日期' }, { name: 'author', label: '作者', type: '文本' }, { name: 'body', label: '详情', type: '富文本' },
  ] },
  { id: 'be_news_category', siteId: 'site_cn', application: '云资讯', name: '资讯分类', count: 18, schemaVersion: 1, fields: [{ name: 'name', label: '分类名称', type: '文本', searchable: true }, { name: 'sort', label: '排序', type: '数值' }] },
  { id: 'be_tender', siteId: 'site_cn', application: '采购招标', name: '采购招标列表', count: 86, schemaVersion: 1, fields: [
    { name: 'title', label: '项目名称', type: '文本', searchable: true }, { name: 'budget', label: '预算', type: '数值', unit: '元' }, { name: 'deadline', label: '截止时间', type: '日期' }, { name: 'status', label: '状态', type: '选项' },
  ] },
  { id: 'be_tender_result', siteId: 'site_cn', application: '采购招标', name: '中标公告', count: 41, schemaVersion: 1, fields: [{ name: 'title', label: '公告标题', type: '文本', searchable: true }, { name: 'winner', label: '中标单位', type: '文本' }] },
  { id: 'be_custom_empty', siteId: 'site_cn', application: '自定义应用', name: 'qqq', count: 0, schemaVersion: 1, fields: [], status: 'unavailable', reason: '尚未配置可读取字段，请先在应用设置中维护' },
  { id: 'be_city_product', siteId: 'site_cn', application: '城市产品分站', name: '城市产品列表', count: 318, schemaVersion: 1, fields: [{ name: 'city', label: '城市', type: '文本', searchable: true }, { name: 'name', label: '产品名称', type: '文本', searchable: true }, { name: 'route', label: '页面路由', type: '链接' }] },
  { id: 'be_custom_page', siteId: 'site_cn', application: '说明页', name: '自定义内容页', count: 24, schemaVersion: 1, fields: [{ name: 'title', label: '标题', type: '文本', searchable: true }, { name: 'body', label: '正文', type: '富文本' }] },
  { id: 'be_inner_collect', siteId: 'site_cn', application: '内页辅助收录', name: '内容收录列表', count: 43, schemaVersion: 1, fields: [{ name: 'title', label: '标题', type: '文本', searchable: true }, { name: 'url', label: '来源地址', type: '链接' }] },
];

export type StructuredSelection = { sourceId: string; includeChildren: boolean };
export type StructuredDraft = { siteId: string; selections: StructuredSelection[] };
export type BackendTargetBoard = 'content' | 'structured';
export const initialStructuredDraft = (siteId = ''): StructuredDraft => ({ siteId, selections: [] });
export function plannedBackendBoards(selected: BackendTargetBoard[], existing: BackendTargetBoard[]): BackendTargetBoard[] {
  return selected.filter(board => !existing.includes(board));
}

// 特殊业务入口独立展示，不伪装成应用中的数据源。
const productSource = mockStructuredSourcesData.find(s => s.id === 'be_product_product')!;
const specificationFields = productSource.children!.fields;
productSource.children = undefined;
mockStructuredSourcesData.push({
  id: 'special_product_specs', siteId: 'site_cn', application: '产品管理', name: '产品规格', count: 72, schemaVersion: 3, recordGrain: '一个已开启规格的 SKU（关联一个产品）',
  special: { kind: 'product-specifications', enabledProducts: 36, totalProducts: 128, origin: '产品管理' },
  fields: [{ name: 'product_id', label: '所属产品编号', type: '文本', role: 'identifier' }, { name: 'name', label: '产品名称', type: '文本' }, ...specificationFields],
});

// 各站点拥有独立数据源标识；法文站用于演示暂无可接入应用的空状态。
mockStructuredSourcesData.push(
  { ...productSource, id: 'be_product_product_en', siteId: 'site_en', count: 46 },
  { ...mockStructuredSourcesData.find(s => s.id === 'be_news')!, id: 'be_news_en', siteId: 'site_en', count: 21 },
);
export function structuredSourcesForSite(siteId: string): StructuredSource[] {
  return mockStructuredSourcesData.filter(source => source.siteId === siteId);
}
