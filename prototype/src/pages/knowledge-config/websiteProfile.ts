// 字段状态：与智能体取数结果一致。只有 ready 的内容（含手动维护）提供给智能体。
export type ProfileFieldStatus = 'ready' | 'missing' | 'pending' | 'conflict' | 'error';
export interface ProfileConflictOption { value: string; source: string }
export interface ProfileField {
  id: string; group: string; label: string; value: string; sourceValue: string;
  maintenancePath: string; evidence: { assetId: string; chunkId?: string; recordIndex?: number; fields?: string[] }[]; manual: boolean; suggestion?: string;
  description: string; custom?: boolean; pendingRegeneration?: boolean;
  status?: ProfileFieldStatus;            // 未设置时按内容推断：有内容=ready，无内容=missing
  updatedAt?: string;                     // 该字段最近整理 / 同步 / 手动保存时间
  stale?: boolean;                        // 整理后依据又有变化，等待下一次增量更新
  conflict?: ProfileConflictOption[];     // 来源冲突时的候选值，用户选择后解决
  errorReason?: string;                   // 读取失败原因（不等于企业没有该信息）
  suggestionSource?: string;              // 手动字段的“建议更新”来自哪条依据变化
}

// 字段类型：直取 = 有后台位置的字段，只通过后台接口读取、实时同步，页面只读；
// 总结 = 由知识库内容总结；手动 = 总结字段被用户填写或修改后的内容。直取字段不能变为手动。
export type ProfileFieldKind = '直取' | '总结' | '手动';
export const PROFILE_FIELD_KIND_DESC: Record<ProfileFieldKind, string> = {
  直取: '通过后台接口读取（网站信息、企业网点、荣誉资质），后台保存后立即同步。画像中只读，需在后台修改。',
  总结: '由智能体根据当前门户已启用的知识总结；依据知识学习成功后自动增量更新。可手动填写或修改，修改后变为手动。',
  手动: '总结字段被用户填写或修改过，视为人工确认，系统不会自动覆盖；依据变化时只给出“建议更新”。',
};
export const isDirectField = (field: Pick<ProfileField, 'maintenancePath'>) => !!field.maintenancePath;
export const profileFieldKind = (field: ProfileField): ProfileFieldKind => isDirectField(field) ? '直取' : field.manual ? '手动' : '总结';
export const profileFieldStatus = (field: ProfileField): ProfileFieldStatus => field.status ?? (field.value ? 'ready' : 'missing');
export const PROFILE_STATUS_LABEL: Record<ProfileFieldStatus, { label: string; cls: string }> = {
  ready: { label: '可用', cls: 'bg-green-50 text-green-700' },
  missing: { label: '资料不足', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: '知识学习中', cls: 'bg-blue-50 text-blue-700' },
  conflict: { label: '来源冲突', cls: 'bg-red-50 text-red-600' },
  error: { label: '读取失败', cls: 'bg-red-50 text-red-600' },
};

// DataSlot: 画像自动更新记录（事件驱动的增量更新，按门户）
export interface ProfileUpdateLog { siteId: string; time: string; trigger: string; action: string; fields: string[] }
export const mockProfileUpdateLogsData: ProfileUpdateLog[] = [
  { siteId: 'site_cn', time: '2026-11-12 00:06', trigger: '知识《KFR-35 空气滤清器图文详情》重新学习成功', action: '按依据反查，只重新生成受影响字段', fields: ['主营产品'] },
  { siteId: 'site_cn', time: '2026-11-12 00:06', trigger: '依据《Anvil 产品白皮书.pdf》有更新', action: '“品牌定位”为手动维护，不覆盖，生成建议更新', fields: ['品牌定位'] },
  { siteId: 'site_cn', time: '2026-11-11 15:20', trigger: '后台“企业网点”保存', action: '通过后台接口立即同步直取字段', fields: ['联系电话', '公司地址'] },
  { siteId: 'site_cn', time: '2026-11-11 00:05', trigger: '新知识学习成功（3 条）', action: '只对资料不足的字段尝试补全；“成立时间”在两份知识中不一致，标记来源冲突', fields: ['成立时间', '定制能力'] },
];
export interface ProfileGroup { id: string; title: string; description: string; custom: boolean }
export interface WebsiteProfile { siteId: string; updatedAt: string; groups: ProfileGroup[]; fields: ProfileField[] }
// 同一原型会话中记录新增任务归属，不增加用户元数据字段。
export const profileSupplementAssets: Record<string, string[]> = {};
export function registerProfileSupplement(siteId: string, fieldId: string, assetIds: string[]) {
  const key = `${siteId}:${fieldId}`;
  profileSupplementAssets[key] = [...new Set([...(profileSupplementAssets[key] || []), ...assetIds])];
}
export const PROFILE_GROUPS = ['公司信息', '品牌', '主营业务', '产品与服务优势', '联系方式与地址', '资质证书', '真实客户案例'];
const GROUP_DESCRIPTIONS = [
  '整理企业名称、公司介绍、主营行业与成立时间。',
  '整理品牌名称、定位、口号和有依据的核心卖点。',
  '整理主营产品、服务内容与实际应用场景。',
  '总结产品与服务的核心优势、定制能力及服务地区。',
  '整理总部或已发布网点的联系电话、咨询邮箱与地址。',
  '整理属于本企业的资质、产品认证、专利与荣誉。',
  '整理有依据且允许展示的客户案例与合作客户。',
];
export const DEFAULT_PROFILE_GROUPS: ProfileGroup[] = PROFILE_GROUPS.map((title, index) => ({ id: `default_group_${index}`, title, description: GROUP_DESCRIPTIONS[index], custom: false }));
export const PROFILE_MAINTENANCE_PATHS: Record<string, string> = {
  公司名称: '网站管理 → 网站设置 → 网站信息',
  公司介绍: '网站管理 → 网站设置 → 网站信息',
  主营行业: '网站管理 → 网站设置 → 网站信息',
  资质证书: '网站管理 → 内容管理 → 荣誉资质',
  产品认证: '网站管理 → 内容管理 → 荣誉资质',
  专利与荣誉: '网站管理 → 内容管理 → 荣誉资质',
  联系电话: '网站管理 → 内容管理 → 企业网点',
  咨询邮箱: '网站管理 → 内容管理 → 企业网点',
  公司地址: '网站管理 → 内容管理 → 企业网点',
};
export const FIELD_DEFINITIONS: Pick<ProfileField, 'id' | 'group' | 'label' | 'description'>[] = [
  { id: 'field_0', group: '公司信息', label: '公司名称', description: '提取本网站所属企业的正式名称，不使用品牌简称替代。' },
  { id: 'field_1', group: '公司信息', label: '公司介绍', description: '根据公司介绍归纳企业主营方向与服务，不补造规模、历史和排名。' },
  { id: 'field_2', group: '公司信息', label: '主营行业', description: '提取企业已确认的主营行业，不把知识资产的行业分类当成企业事实。' },
  { id: 'field_3', group: '公司信息', label: '成立时间', description: '提取明确记载的成立日期或年份，不用发展历程的首条年份推测。' },
  { id: 'field_4', group: '品牌', label: '品牌名称', description: '提取本企业实际经营的品牌，不将客户或供应商品牌归给本企业。' },
  { id: 'field_5', group: '品牌', label: '品牌定位', description: '从品牌资料归纳目标客户和价值定位，不凭产品价格推导品牌档次。' },
  { id: 'field_6', group: '品牌', label: '品牌口号', description: '提取资料明确给出的正式口号，没有依据时不创作广告语。' },
  { id: 'field_brand_selling_points', group: '品牌', label: '核心卖点', description: '总结有品牌层面依据的差异化价值，不将单款产品参数泛化为品牌承诺。' },
  { id: 'field_7', group: '主营业务', label: '主营产品', description: '从企业和产品资料归纳主营品类，不将每个配件或 SKU 都列为主营品类。' },
  { id: 'field_8', group: '主营业务', label: '服务内容', description: '整理明确提供的服务及适用对象，不将行业惯例写成本企业承诺。' },
  { id: 'field_9', group: '主营业务', label: '应用场景', description: '从产品、解决方案和案例资料归纳已支持的场景，不扩写未验证用途。' },
  { id: 'field_10', group: '产品与服务优势', label: '核心优势', description: '归纳产品与服务的特点，并标明适用产品或服务范围。' },
  { id: 'field_11', group: '产品与服务优势', label: '定制能力', description: '整理明确支持的定制项目及限制，不将单次定制推导为所有规格均可定制。' },
  { id: 'field_12', group: '产品与服务优势', label: '服务地区', description: '整理明确说明的销售、交付或服务区域，不根据公司地址推测覆盖范围。' },
  { id: 'field_19', group: '联系方式与地址', label: '联系电话', description: '优先总部电话，否则按网点分别列出，保留区号、用途与所属网点。' },
  { id: 'field_20', group: '联系方式与地址', label: '咨询邮箱', description: '提取明确公布的咨询邮箱及所属网点，不根据域名拼接邮箱地址。' },
  { id: 'field_21', group: '联系方式与地址', label: '公司地址', description: '优先总部地址，否则按网点分别列出，不补写没有依据的门牌号或邮编。' },
  { id: 'field_13', group: '资质证书', label: '资质证书', description: '整理属于本企业的资质名称，编号和有效期不明确时不填写。' },
  { id: 'field_14', group: '资质证书', label: '产品认证', description: '整理认证名称及适用产品，不将某产品认证写成全产品或企业认证。' },
  { id: 'field_15', group: '资质证书', label: '专利与荣誉', description: '整理属于本企业的专利和荣誉名称，保留类型与归属。' },
  { id: 'field_17', group: '真实客户案例', label: '代表案例', description: '从有授权的真实案例归纳客户背景、交付内容与有依据的成效。' },
  { id: 'field_18', group: '真实客户案例', label: '合作客户', description: '提取明确存在合作关系且允许展示的客户名称，仅出现名称或 Logo 不代表合作。' },
];
// DataSlot: 画像示例与真实知识内容分离，正式由当前门户授权知识生成。
export const mockWebsiteProfilesData: WebsiteProfile[] = ['site_cn', 'site_en', 'site_fr'].map(siteId => ({
  siteId, updatedAt: siteId === 'site_cn' ? '2026-10-08 10:30' : '',
  groups: DEFAULT_PROFILE_GROUPS.map(group => ({ ...group })),
  fields: FIELD_DEFINITIONS.map(({ id, group, label, description }) => ({
    id, group, label, description, maintenancePath: PROFILE_MAINTENANCE_PATHS[label] || '', manual: false,
    evidence: [],
    value: '', sourceValue: '',
  })),
}));
// 生成结果为原型示例；依据指向共享知识资产的实际切片/记录，不能把摘要反写成证据。
const examples: Record<string, { value: string; evidence: ProfileField['evidence'] }> = {
  field_0: { value: 'Anvil 工业设备有限公司', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-company' }] },
  field_1: { value: '专注工业设备及配套产品，提供产品选型、应用支持与售后服务。', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-company' }] },
  field_2: { value: '制造业与工业', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-company' }] },
  field_4: { value: 'Anvil', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-brand' }] },
  field_5: { value: '面向企业采购的工业设备品牌', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-brand' }] },
  field_brand_selling_points: { value: '围绕工业设备选型提供可核对的技术资料、产品适配建议和持续服务支持。', evidence: [{ assetId: 'profile-site-cn', chunkId: 'profile-site-brand' }] },
  field_7: { value: 'KFR-35 空气滤清器；经典款与 2026 款包装产品。', evidence: [
    { assetId: 'k4', chunkId: 'k4c1' },
    { assetId: 'structured-platform', recordIndex: 0, fields: ['name', 'material'] },
    { assetId: 'structured-platform', recordIndex: 1, fields: ['name', 'material'] },
  ] },
  field_8: { value: '提供产品质保及退换货服务；各产品适用条款以对应知识为准。', evidence: [{ assetId: 'k1', chunkId: 'k1c2' }, { assetId: 'k2', chunkId: 'k2c1' }] },
  field_10: { value: 'KFR-35 采用三层复合滤纸；包装产品提供不同材质与规格，具体参数按型号查询。', evidence: [{ assetId: 'k4', chunkId: 'k4c1' }, { assetId: 'structured-platform', recordIndex: 0, fields: ['name', 'material'] }, { assetId: 'structured-platform', recordIndex: 1, fields: ['name', 'material'] }] },
  field_19: { value: '客户咨询电话：400-000-0000。', evidence: [{ assetId: 'profile-store-cn', chunkId: 'profile-store-contact' }] },
  field_20: { value: 'service@anvil.example', evidence: [{ assetId: 'profile-store-cn', chunkId: 'profile-store-contact' }] },
  field_21: { value: '宁夏银川市金凤区工业园（总部）。', evidence: [{ assetId: 'profile-store-cn', chunkId: 'profile-store-contact' }] },
  field_13: { value: '已通过 ISO 9001 质量管理体系认证。', evidence: [{ assetId: 'profile-honor-cn', chunkId: 'profile-honor-cert' }] },
  field_14: { value: 'Anvil 系列产品具有 CE 认证，具体适用产品以证书为准。', evidence: [{ assetId: 'k1', chunkId: 'k1c3' }, { assetId: 'profile-honor-cn', chunkId: 'profile-honor-cert' }] },
  field_17: { value: '原型示例：为银川星源机械的车间过滤设备提供产品选型与安装支持。', evidence: [{ assetId: 'profile-case-cn', chunkId: 'profile-case-project' }] },
  field_18: { value: '原型示例合作客户：银川星源机械。', evidence: [{ assetId: 'profile-case-cn', chunkId: 'profile-case-project' }] },
};
for (const field of mockWebsiteProfilesData[0].fields) {
  const example = examples[field.id];
  if (example) Object.assign(field, { value: example.value, sourceValue: example.value, evidence: example.evidence, updatedAt: field.maintenancePath ? '2026-11-11 15:20' : '2026-11-12 00:06' });
}
// 原型示例：覆盖各类字段状态（正式由增量更新任务写入）
const siteCn = mockWebsiteProfilesData[0].fields;
const patch = (id: string, value: Partial<ProfileField>) => Object.assign(siteCn.find(field => field.id === id)!, value);
patch('field_5', { manual: true, value: '面向中小制造企业的工业设备品牌，强调选型支持与长期服务。', updatedAt: '2026-10-20 14:02',
  suggestion: '面向企业采购的工业设备品牌，覆盖选型、交付与售后全流程服务。', suggestionSource: '《Anvil 产品白皮书.pdf》于 2026-11-12 重新学习' });
// 来源冲突只出现在总结字段：多份知识对同一事实说法不一致
patch('field_3', { status: 'conflict', updatedAt: '2026-11-11 00:05', conflict: [
  { value: '成立于 2008 年。', source: '知识库 · 《Anvil 产品白皮书.pdf》p.1 · 公司简介' },
  { value: '成立于 2010 年。', source: '知识库 · 前台页面“关于我们 / 发展历程”' },
] });
// 手动例子：知识库里没有正式口号，运营直接填写；系统不会覆盖
patch('field_6', { manual: true, value: '可核对的工业设备，长期可靠的服务伙伴。', updatedAt: '2026-11-08 09:40' });
patch('field_10', { stale: true, updatedAt: '2026-11-05 00:06' });
patch('field_9', { status: 'pending', updatedAt: '2026-11-12 00:06' });
patch('field_12', { status: 'error', errorReason: '知识检索服务超时', updatedAt: '2026-11-12 00:06' });
export function reconcileWebsiteProfiles(current: WebsiteProfile[], defaults: WebsiteProfile[]): WebsiteProfile[] {
  return defaults.map(template => {
    const existing = current.find(profile => profile.siteId === template.siteId);
    if (!existing) return { ...template, groups: template.groups.map(group => ({ ...group })), fields: template.fields.map(field => ({ ...field })) };
    const oldFields = new Map(existing.fields.map(field => [field.id, field]));
    const customGroups = (existing.groups || []).filter(group => group.custom && !template.groups.some(item => item.id === group.id || item.title === group.title));
    const customFields = existing.fields.filter(field => field.custom && customGroups.some(group => group.title === field.group));
    return {
      siteId: template.siteId,
      updatedAt: existing.updatedAt || template.updatedAt,
      groups: [...template.groups.map(group => ({ ...group })), ...customGroups],
      fields: [...template.fields.map(field => {
        const old = oldFields.get(field.id);
        if (!old) return { ...field };
        return { ...field, value: old.value, sourceValue: old.sourceValue, evidence: old.evidence, manual: old.manual, suggestion: old.suggestion, suggestionSource: old.suggestionSource, pendingRegeneration: old.pendingRegeneration, status: old.status, updatedAt: old.updatedAt, stale: old.stale, conflict: old.conflict, errorReason: old.errorReason };
      }), ...customFields, ...existing.fields.filter(field => field.custom && template.groups.some(group => group.title === field.group))],
    };
  });
}
function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`请填写${label}`);
  return normalized;
}
export function addProfileGroup(profile: WebsiteProfile, id: string, title: string, description: string): WebsiteProfile {
  const name = requiredText(title, '标题');
  const detail = requiredText(description, '描述');
  if (profile.groups.some(group => group.title === name)) throw new Error('该分组标题已存在');
  if (profile.groups.some(group => group.id === id)) throw new Error('分组标识已存在');
  return { ...profile, groups: [...profile.groups, { id, title: name, description: detail, custom: true }] };
}
export function editProfileGroup(profile: WebsiteProfile, id: string, title: string, description: string): WebsiteProfile {
  const target = profile.groups.find(group => group.id === id);
  if (!target?.custom) throw new Error('预设分组不可编辑');
  const name = requiredText(title, '标题');
  const detail = requiredText(description, '描述');
  if (profile.groups.some(group => group.id !== id && group.title === name)) throw new Error('该分组标题已存在');
  return { ...profile,
    groups: profile.groups.map(group => group.id === id ? { ...group, title: name, description: detail } : group),
    fields: profile.fields.map(field => field.group === target.title ? { ...field, group: name, pendingRegeneration: target.description !== detail || field.pendingRegeneration } : field),
  };
}
export function removeProfileGroup(profile: WebsiteProfile, id: string): WebsiteProfile {
  const target = profile.groups.find(group => group.id === id);
  if (!target?.custom) throw new Error('预设分组不可删除');
  return { ...profile, groups: profile.groups.filter(group => group.id !== id), fields: profile.fields.filter(field => field.group !== target.title) };
}
export function addProfileField(profile: WebsiteProfile, id: string, group: string, title: string, description: string): WebsiteProfile {
  if (!profile.groups.some(item => item.title === group)) throw new Error('画像分组不存在');
  const name = requiredText(title, '标题');
  const detail = requiredText(description, '描述');
  if (profile.fields.some(field => field.group === group && field.label === name)) throw new Error('该字段标题已存在');
  if (profile.fields.some(field => field.id === id)) throw new Error('字段标识已存在');
  return { ...profile, fields: [...profile.fields, { id, group, label: name, description: detail, custom: true, value: '', sourceValue: '', maintenancePath: '', evidence: [], manual: false }] };
}
export function editProfileField(profile: WebsiteProfile, id: string, title: string, description: string): WebsiteProfile {
  const target = profile.fields.find(field => field.id === id);
  if (!target?.custom) throw new Error('预设字段不可编辑');
  const name = requiredText(title, '标题');
  const detail = requiredText(description, '描述');
  if (profile.fields.some(field => field.id !== id && field.group === target.group && field.label === name)) throw new Error('该字段标题已存在');
  return { ...profile, fields: profile.fields.map(field => field.id === id ? { ...field, label: name, description: detail, pendingRegeneration: target.description !== detail || field.pendingRegeneration } : field) };
}
export function removeProfileField(profile: WebsiteProfile, id: string): WebsiteProfile {
  const target = profile.fields.find(field => field.id === id);
  if (!target?.custom) throw new Error('预设字段不可删除');
  return { ...profile, fields: profile.fields.filter(field => field.id !== id) };
}
export type ProfileGenerationScope = 'system' | 'all';
export function buildProfilePromptContext(profile: WebsiteProfile, scope: ProfileGenerationScope, fieldId?: string) {
  return {
    siteId: profile.siteId,
    scope,
    // 直取字段由业务服务通过后台接口同步，不进入画像智能体任务
    targetFieldIds: profile.fields.filter(field => !isDirectField(field) && (!fieldId || field.id === fieldId) && (scope === 'all' || !field.manual)).map(field => field.id),
    groups: profile.groups.map(group => ({
      id: group.id, title: group.title, description: group.description, origin: group.custom ? 'custom' : 'preset',
      fields: profile.fields.filter(field => field.group === group.title)
        .map(field => ({ id: field.id, title: field.label, description: field.description, origin: field.custom ? 'custom' : 'preset', maintenance: field.manual ? 'manual' : 'system' })),
    })),
  };
}
export function saveManualProfileField(profile: WebsiteProfile, id: string, value: string): WebsiteProfile {
  const content = requiredText(value, '内容');
  const target = profile.fields.find(field => field.id === id);
  if (!target) throw new Error('画像字段不存在');
  if (isDirectField(target)) throw new Error('直取字段只能在后台修改');
  return { ...profile, fields: profile.fields.map(field => field.id === id ? { ...field, value: content, manual: true, suggestion: undefined, suggestionSource: undefined, pendingRegeneration: false, status: 'ready', conflict: undefined, errorReason: undefined, stale: false, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : field) };
}
export function regenerateFields(fields: ProfileField[], fieldId?: string, scope: ProfileGenerationScope = 'system'): ProfileField[] {
  return fields.map(field => {
    if (fieldId && field.id !== fieldId) return field;
    if (field.manual && scope === 'system') return field;
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    return { ...field, value: field.sourceValue, manual: false, suggestion: undefined, suggestionSource: undefined, pendingRegeneration: false,
      status: field.sourceValue ? 'ready' : 'missing', stale: false, conflict: undefined, errorReason: undefined, updatedAt: now };
  });
}

// 来源冲突：用户选择采用的候选值，冲突解决后按系统维护继续增量更新
export function resolveProfileConflict(profile: WebsiteProfile, id: string, value: string): WebsiteProfile {
  return { ...profile, fields: profile.fields.map(field => field.id === id ? { ...field, value, sourceValue: value, status: 'ready', conflict: undefined, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : field) };
}
// 手动字段的建议更新：采纳则替换内容（仍为手动维护），忽略则保留原内容
export function applyProfileSuggestion(profile: WebsiteProfile, id: string, accept: boolean): WebsiteProfile {
  return { ...profile, fields: profile.fields.map(field => field.id !== id || !field.suggestion ? field
    : { ...field, value: accept ? field.suggestion : field.value, suggestion: undefined, suggestionSource: undefined, updatedAt: accept ? new Date().toLocaleString('zh-CN', { hour12: false }) : field.updatedAt }) };
}
