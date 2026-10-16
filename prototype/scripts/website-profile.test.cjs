const { readFileSync } = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const source = readFileSync('src/pages/knowledge-config/websiteProfile.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} }; new Function('exports', 'module', compiled)(mod.exports, mod);
const { regenerateFields, reconcileWebsiteProfiles, PROFILE_GROUPS, PROFILE_MAINTENANCE_PATHS, mockWebsiteProfilesData,
  addProfileGroup, editProfileGroup, removeProfileGroup, addProfileField, editProfileField, removeProfileField,
  buildProfilePromptContext, saveManualProfileField } = mod.exports;
assert.deepEqual(PROFILE_GROUPS, ['公司信息', '品牌', '主营业务', '产品与服务优势', '联系方式与地址', '资质证书', '真实客户案例']);
const profileFields = mockWebsiteProfilesData[0].fields;
assert.deepEqual(profileFields.filter(field => field.group === '公司信息').map(field => field.label), ['公司名称', '公司介绍', '主营行业', '成立时间']);
assert.ok(mockWebsiteProfilesData[0].groups.every(group => group.title && group.description));
assert.ok(profileFields.every(field => field.label && field.description));
assert.equal(PROFILE_MAINTENANCE_PATHS.主营产品, undefined);
assert.deepEqual(profileFields.filter(field => field.group === '品牌').map(field => field.label), ['品牌名称', '品牌定位', '品牌口号', '核心卖点']);
assert.deepEqual(profileFields.filter(field => field.group === '联系方式与地址').map(field => field.label), ['联系电话', '咨询邮箱', '公司地址']);
assert.ok(profileFields.some(field => field.group === '资质证书' && field.label === '资质证书'));
assert.ok(profileFields.some(field => field.group === '真实客户案例'));
assert.ok(profileFields.some(field => field.group === '产品与服务优势' && field.label === '核心优势'));
assert.equal(new Set(profileFields.map(field => field.id)).size, profileFields.length);
assert.equal(PROFILE_MAINTENANCE_PATHS.联系电话, '网站管理 → 内容管理 → 企业网点');
assert.equal(PROFILE_MAINTENANCE_PATHS.公司地址, '网站管理 → 内容管理 → 企业网点');
assert.equal(PROFILE_MAINTENANCE_PATHS.资质证书, '网站管理 → 内容管理 → 荣誉资质');
for (const label of ['品牌名称', '核心卖点', '代表案例', '合作客户']) {
  assert.equal(profileFields.find(field => field.label === label).maintenancePath, '', `${label} 无固定后台直达位置`);
}
for (const group of PROFILE_GROUPS) {
  assert.ok(profileFields.some(field => field.group === group && field.value && field.evidence.length), `${group} 应有知识依据支持的总结示例`);
}
const oldProfile = { siteId: 'site_cn', updatedAt: 'old', fields: [{ ...profileFields.find(field => field.id === 'field_4'), group: '品牌信息', value: '用户修订的品牌名称', manual: true }] };
const reconciled = reconcileWebsiteProfiles([oldProfile], mockWebsiteProfilesData);
assert.equal(reconciled[0].fields.find(field => field.id === 'field_4').value, '用户修订的品牌名称');
assert.equal(reconciled[0].fields.find(field => field.id === 'field_4').group, '品牌');
assert.ok(reconciled[0].fields.some(field => field.id === 'field_brand_selling_points'));
const fields = [{ id: 'a', value: '人工内容', sourceValue: '来源更新', manual: true }, { id: 'b', value: '旧内容', sourceValue: '新内容', manual: false }, { id: 'c', value: '', sourceValue: '', manual: false }];
const result = regenerateFields(fields);
assert.equal(result[0].value, '人工内容');
assert.equal(result[0], fields[0], '默认生成不得改写手动内容或维护信息');
assert.equal(result[1].value, '新内容');
assert.equal(result[2].value, '');
assert.equal(fields[1].value, '旧内容');
assert.equal(regenerateFields(fields, 'b')[0].suggestion, undefined);
assert.equal(regenerateFields(fields, undefined, 'all')[0].value, '来源更新');
assert.equal(regenerateFields(fields, undefined, 'all')[0].manual, false);
assert.equal(regenerateFields(fields, 'a', 'all')[1].value, '旧内容', '单项覆盖不得影响其他项');
let customProfile = mockWebsiteProfilesData[0];
assert.throws(() => addProfileGroup(customProfile, 'group_custom', '', '用途'), /标题/);
assert.throws(() => addProfileGroup(customProfile, 'group_custom', '售后政策', ' '), /描述/);
customProfile = addProfileGroup(customProfile, 'group_custom', '售后政策', '整理已入库的售后承诺');
assert.equal(customProfile.groups.find(item => item.id === 'group_custom').description, '整理已入库的售后承诺');
assert.throws(() => addProfileGroup(customProfile, 'other', '售后政策', '重复'), /已存在/);
assert.throws(() => editProfileGroup(customProfile, customProfile.groups[0].id, '改名', '描述'), /预设/);
customProfile = addProfileField(customProfile, 'field_custom', '售后政策', '质保范围', '总结已入库的质保适用产品');
assert.equal(customProfile.fields.find(item => item.id === 'field_custom').description, '总结已入库的质保适用产品');
assert.equal(customProfile.fields.find(item => item.id === 'field_custom').value, '');
const manualProfile = saveManualProfileField(customProfile, 'field_1', '人工填写的公司介绍');
assert.equal(manualProfile.fields.find(item => item.id === 'field_1').manual, true);
assert.equal(manualProfile.fields.find(item => item.id === 'field_1').value, '人工填写的公司介绍');
assert.throws(() => saveManualProfileField(customProfile, 'field_1', ' '), /内容/);
const promptContext = buildProfilePromptContext(manualProfile, 'system');
assert.ok(!promptContext.targetFieldIds.includes('field_1'));
assert.ok(promptContext.targetFieldIds.includes('field_custom'), '用户创建但未手填的字段仍由系统生成');
assert.ok(promptContext.groups.flatMap(group => group.fields).some(field => field.id === 'field_1'), '完整结构保留手动字段定义');
assert.equal(promptContext.groups.find(group => group.title === '售后政策').fields[0].description, '总结已入库的质保适用产品');
assert.ok(buildProfilePromptContext(manualProfile, 'all').targetFieldIds.includes('field_1'));
assert.deepEqual(buildProfilePromptContext(manualProfile, 'all', 'field_1').targetFieldIds, ['field_1']);
assert.throws(() => addProfileField(customProfile, 'duplicate', '售后政策', '质保范围', '重复'), /已存在/);
assert.throws(() => editProfileField(customProfile, 'field_0', '新名称', '描述'), /预设/);
customProfile = editProfileField(customProfile, 'field_custom', '质保说明', '总结已入库的质保条款');
assert.equal(customProfile.fields.find(item => item.id === 'field_custom').pendingRegeneration, true);
customProfile = editProfileGroup(customProfile, 'group_custom', '服务政策', '整理服务承诺');
assert.equal(customProfile.fields.find(item => item.id === 'field_custom').group, '服务政策');
assert.equal(customProfile.fields.find(item => item.id === 'field_custom').label, '质保说明');
const restoredCustom = reconcileWebsiteProfiles([customProfile], mockWebsiteProfilesData);
assert.ok(restoredCustom[0].groups.some(item => item.title === '服务政策'));
assert.ok(restoredCustom[0].fields.some(item => item.id === 'field_custom'));
assert.equal(restoredCustom[0].fields.find(item => item.id === 'field_custom').pendingRegeneration, true);
assert.ok(!restoredCustom[1].groups.some(item => item.title === '服务政策'), '自定义分组不能跨门户');
const defaultGroupCustomField = addProfileField(mockWebsiteProfilesData[0], 'default_group_custom_field', '品牌', '品牌故事', '总结已入库的品牌发展历程');
const restoredDefaultGroup = reconcileWebsiteProfiles([defaultGroupCustomField], mockWebsiteProfilesData);
assert.ok(restoredDefaultGroup[0].fields.some(item => item.id === 'default_group_custom_field'));
assert.ok(!restoredDefaultGroup[1].fields.some(item => item.id === 'default_group_custom_field'));
assert.throws(() => removeProfileField(customProfile, 'field_0'), /预设/);
customProfile = removeProfileField(customProfile, 'field_custom');
assert.ok(!customProfile.fields.some(item => item.id === 'field_custom'));
customProfile = addProfileField(customProfile, 'field_again', '服务政策', '服务时效', '总结服务响应时间');
customProfile = removeProfileGroup(customProfile, 'group_custom');
assert.ok(!customProfile.groups.some(item => item.id === 'group_custom'));
assert.ok(!customProfile.fields.some(item => item.id === 'field_again'), '删除分组时清理分组内字段');
console.log('PASS: 手动保存、默认保护、全部/单项覆盖、动态描述组装、自定义字段与门户隔离');
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const code = ts.transpileModule(readFileSync(`src/pages/knowledge-config/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', 'require', code)(module.exports, module, path => load(path.replace('./', '')));
  cache[name] = module.exports;
  return module.exports;
}
const { resolveProfileEvidence, knowledgeMaintenance } = load('profileKnowledge');
for (const field of profileFields.filter(item => item.value)) {
  assert.ok(field.evidence.length > 0, `${field.label} 的总结需要知识依据`);
  for (const ref of field.evidence) {
    assert.equal(resolveProfileEvidence(ref, 'site_cn')?.eligible, true, `${field.label} 的依据必须是中文站可用知识`);
  }
}
assert.equal(resolveProfileEvidence({ assetId: 'structured-platform', recordIndex: 0, fields: ['name'] }, 'site_cn').eligible, true);
assert.equal(resolveProfileEvidence({ assetId: 'structured-excel', recordIndex: 1 }, 'site_cn').eligible, false);
assert.equal(resolveProfileEvidence({ assetId: 'k1', chunkId: 'k1c4' }, 'site_cn').eligible, false);
assert.equal(resolveProfileEvidence({ assetId: 'k1', chunkId: 'k1c1' }, 'site_fr'), null);
assert.equal(resolveProfileEvidence({ assetId: 'missing' }, 'site_cn'), null);
assert.match(knowledgeMaintenance({ connect: '后台页面', section: 'structured' }), /数据源/);
assert.match(knowledgeMaintenance({ connect: '上传文件', section: 'structured' }), /源|文件/);
console.log('PASS: 结构化记录、停用行、无效切片、门户隔离、删除依据及维护分流');
