import { getKnowledgeAsset, mockAssetChunks, SECTIONS, STATUS_LABEL } from './data';
import type { ProfileField } from './websiteProfile';

export function resolveProfileEvidence(ref: ProfileField['evidence'][number], siteId: string) {
  const asset = getKnowledgeAsset(ref.assetId);
  if (!asset || (asset.portalSites.length > 0 && !asset.portalSites.includes(siteId))) return null;
  const chunk = ref.chunkId ? mockAssetChunks[asset.id]?.find(item => item.id === ref.chunkId) : undefined;
  const row = ref.recordIndex !== undefined ? asset.structuredRecords?.[ref.recordIndex] : undefined;
  const answer = asset.section === 'faq' && !ref.chunkId && asset.note?.startsWith('答案：') ? asset.note.slice(3).split('\n相似问法：')[0] : '';
  const rowId = ref.recordIndex !== undefined ? asset.structuredRecordIds?.[ref.recordIndex] || `${asset.id}:record:${ref.recordIndex}` : '';
  const enabled = chunk ? chunk.enabled && chunk.embedded : row ? asset.structuredRecordMetadata?.[rowId]?.enabled !== false : !!answer;
  const eligible = asset.status === 'published' && asset.validityStatus === '现行有效' && enabled;
  const excerpt = chunk?.text || answer || (row ? (ref.fields || Object.keys(row)).map(key => {
    const schema = asset.structuredSchema?.find(item => item.name === key);
    return `${schema?.label || key}：${row[key] ?? '—'}${schema?.unit ? ` ${schema.unit}` : ''}`;
  }).join('；') : '原依据已不存在');
  return { asset, excerpt, eligible, location: chunk ? `切片 ${chunk.index} · ${chunk.id}` : row ? `记录 ${ref.recordIndex! + 1} · ${rowId}` : answer ? '标准问答' : '依据不可用',
    section: SECTIONS.find(section => section.key === asset.section)?.name || asset.section,
    status: eligible ? '可用' : !enabled ? '切片 / 记录不可用' : STATUS_LABEL[asset.status].label,
  };
}

export function knowledgeMaintenance(asset: { connect: string; section: string; name: string; sourceRef: string }) {
  if (asset.connect === '平台') return '在行业知识中检查并重新导入平台资料，不自动覆盖企业已导入的内容。';
  if (asset.connect === '上传文件') return asset.section === 'structured' ? '更新原表格或 JSON/JSONL 文件，重新校验并学习记录。' : asset.section === 'faq' ? '编辑标准问答，或更新问答文件后重新学习。' : '更新文档，或在详情中修正切片；不提供立即同步。';
  if (asset.connect === '前台页面') return '在网站对应栏目修改并发布。正文修改实时同步；栏目新增 / 删除在接入与更新中处理。';
  if (asset.connect === '后台页面') return asset.section === 'structured' ? '在应用 / 数据源中维护业务记录与字段；产品规格在产品管理中维护并单独接入。' : '在对应后台应用维护内容；接入与更新中管理栏目新增 / 删除、自动更新和使用开关。';
  if (asset.connect === '外部网址') return '核对外部网址与网页内容，在接入与更新中重新抓取；无网站编辑权限时可上传补充资料。';
  return '在知识详情中编辑内容并重新学习。';
}
