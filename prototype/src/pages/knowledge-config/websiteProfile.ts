export interface ProfileField {
  id: string; group: string; label: string; value: string; sourceValue: string;
  maintenancePath: string; evidence: { assetId: string; chunkId?: string; recordIndex?: number; fields?: string[] }[]; manual: boolean; suggestion?: string;
}
export interface WebsiteProfile { siteId: string; updatedAt: string; fields: ProfileField[] }
// 同一原型会话中记录新增任务归属，不增加用户元数据字段。
export const profileSupplementAssets: Record<string, string[]> = {};
export function registerProfileSupplement(siteId: string, fieldId: string, assetIds: string[]) {
  const key = `${siteId}:${fieldId}`;
  profileSupplementAssets[key] = [...new Set([...(profileSupplementAssets[key] || []), ...assetIds])];
}
export const PROFILE_GROUPS = ['公司信息', '品牌信息', '主营业务', '产品与服务优势', '荣誉与资质', '企业实力', '案例与客户', '联系与咨询', '网站导航'];
export const PROFILE_MAINTENANCE_PATHS: Record<string, string> = {
  公司名称: '网站管理 → 网站设置 → 网站信息',
  公司简介: '网站管理 → 网站设置 → 网站信息；网站管理 → 内容管理 → 介绍内容',
  所属行业: '网站管理 → 网站设置 → 网站信息',
  成立时间: '网站管理 → 内容管理 → 发展历程',
  主营产品: '网站管理 → 网站设置 → 网站信息',
  企业资质: '网站管理 → 内容管理 → 荣誉资质；网站管理 → 内容管理 → 介绍内容',
  产品认证: '网站管理 → 内容管理 → 荣誉资质；网站管理 → 内容管理 → 介绍内容',
  专利与荣誉: '网站管理 → 内容管理 → 荣誉资质',
  联系电话: '网站管理 → 内容管理 → 企业网点',
  公司地址: '网站管理 → 内容管理 → 企业网点',
  网站栏目: '网站管理 → 网站设置 → 导航管理',
};
const FIELD_DEFINITIONS = [
  ['公司信息', '公司名称', '网站设置 / 公司信息', 'Anvil 工业设备有限公司'],
  ['公司信息', '公司简介', '网站内容 / 关于我们', '专注工业设备与配套产品，为企业提供产品选型与应用服务。'],
  ['公司信息', '所属行业', '网站设置 / 公司信息', '制造业与工业'],
  ['公司信息', '成立时间', '网站设置 / 公司信息', ''],
  ['品牌信息', '品牌名称', '网站内容 / 品牌介绍', 'Anvil'],
  ['品牌信息', '品牌定位', '网站内容 / 品牌介绍', '面向企业采购的工业设备品牌'],
  ['品牌信息', '品牌口号', '网站内容 / 品牌介绍', ''],
  ['主营业务', '主营产品', '产品管理 / 产品', '工业空气滤清器\n工业设备配件'],
  ['主营业务', '服务内容', '网站内容 / 服务介绍', '产品选型咨询\n产品应用指导'],
  ['主营业务', '应用场景', '产品管理 / 产品', '工业生产\n设备维护'],
  ['产品与服务优势', '核心优势', '网站内容 / 产品优势', '提供产品技术资料与选型支持'],
  ['产品与服务优势', '定制能力', '网站内容 / 服务介绍', ''],
  ['产品与服务优势', '服务地区', '网站内容 / 服务介绍', ''],
  ['荣誉与资质', '企业资质', '网站内容 / 荣誉资质', ''],
  ['荣誉与资质', '产品认证', '网站内容 / 荣誉资质', ''],
  ['荣誉与资质', '专利与荣誉', '网站内容 / 荣誉资质', ''],
  ['企业实力', '生产能力', '网站内容 / 工厂介绍', ''],
  ['企业实力', '研发与质控', '网站内容 / 研发与质量', ''],
  ['案例与客户', '代表案例', '网站内容 / 客户案例', ''],
  ['案例与客户', '合作客户', '网站内容 / 客户案例', ''],
  ['联系与咨询', '联系电话', '网站设置 / 联系方式', ''],
  ['联系与咨询', '咨询邮箱', '网站设置 / 联系方式', ''],
  ['联系与咨询', '公司地址', '网站设置 / 联系方式', ''],
  ['网站导航', '网站栏目', '', ''],
];
// DataSlot: 画像示例与真实知识内容分离，正式由当前门户授权知识生成。
export const mockWebsiteProfilesData: WebsiteProfile[] = ['site_cn', 'site_en', 'site_fr'].map(siteId => ({
  siteId, updatedAt: siteId === 'site_cn' ? '2026-10-08 10:30' : '',
  fields: FIELD_DEFINITIONS.map(([group, label, maintenancePath, sample], index) => ({
    id: `field_${index}`, group, label, maintenancePath: PROFILE_MAINTENANCE_PATHS[label] || '', manual: false,
    evidence: [],
    value: '', sourceValue: '',
  })),
}));
// 生成结果为原型示例；依据指向共享知识资产的实际切片/记录，不能把摘要反写成证据。
const examples: Record<string, { value: string; evidence: ProfileField['evidence'] }> = {
  field_4: { value: 'Anvil', evidence: [{ assetId: 'k1', chunkId: 'k1c1' }] },
  field_7: { value: 'KFR-35 空气滤清器；经典款与 2026 款包装产品。', evidence: [
    { assetId: 'k4', chunkId: 'k4c1' },
    { assetId: 'structured-platform', recordIndex: 0, fields: ['name', 'material'] },
    { assetId: 'structured-platform', recordIndex: 1, fields: ['name', 'material'] },
  ] },
  field_8: { value: '提供产品质保及退换货服务；各产品适用条款以对应知识为准。', evidence: [{ assetId: 'k1', chunkId: 'k1c2' }, { assetId: 'k2', chunkId: 'k2c1' }] },
  field_10: { value: 'KFR-35 采用三层复合滤纸；包装产品提供不同颜色与包装规格，具体参数按型号查询。', evidence: [{ assetId: 'k4', chunkId: 'k4c1' }, { assetId: 'structured-excel', recordIndex: 0, fields: ['name', 'color', 'size', 'weight'] }] },
};
for (const field of mockWebsiteProfilesData[0].fields) {
  const example = examples[field.id];
  if (example) Object.assign(field, { value: example.value, sourceValue: example.value, evidence: example.evidence });
}
export function regenerateFields(fields: ProfileField[], fieldId?: string): ProfileField[] {
  return fields.map(field => {
    if (fieldId && field.id !== fieldId) return field;
    if (field.manual) return { ...field, suggestion: field.sourceValue !== field.value && field.sourceValue ? field.sourceValue : undefined };
    return { ...field, value: field.sourceValue, suggestion: undefined };
  });
}
