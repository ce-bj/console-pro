import { KbAsset, SectionKey, mockAssets, upsertKnowledgeAssets } from './data';

export type SourceConnectionStatus = 'active' | 'paused' | 'syncing' | 'failed' | 'pending';
export type SourceFrequency = '实时' | '每小时' | '每日' | '每周';

export interface SourceChangeItem {
  id: string;
  name: string;
  path: string;
  detectedAt: string;
}

export interface SourceLogItem {
  id: string;
  time: string;
  action: string;
  result: '成功' | '失败';
  detail: string;
}

export interface SourceConnection {
  id: string;
  sourceId: string;
  name: string;
  kind: '前台页面' | '后台页面';
  section: SectionKey;
  count: number;
  added: number;
  removed: number;
  status: SourceConnectionStatus;
  autoUpdate: boolean;
  frequency: SourceFrequency;
  lastDetected: string;
  lastSync: string;
  nextSync: string;
  health: number;
  pausedIds: string[];
  addedItems: SourceChangeItem[];
  removedItems: SourceChangeItem[];
  logs: SourceLogItem[];
}

const log = (id: string, time: string, action: string, result: '成功' | '失败', detail: string): SourceLogItem => ({ id, time, action, result, detail });
const change = (id: string, name: string, path: string, detectedAt = '2026-09-29 09:30'): SourceChangeItem => ({ id, name, path, detectedAt });

// DataSlot: 栏目接入关系。栏目级差异只统计新增和来源删除；正文修改由发布事件实时同步并写入日志。
export const mockSourceConnectionsData: SourceConnection[] = [
  {
    id: 'products', sourceId: 'fp_products_cn', name: '中文站 / 产品中心 / 产品列表', kind: '前台页面', section: 'content',
    count: 48, added: 3, removed: 1, status: 'active', autoUpdate: true, frequency: '实时',
    lastDetected: '2026-09-29 09:30', lastSync: '2026-09-29 09:30', nextSync: '内容发布时', health: 92, pausedIds: [],
    addedItems: [change('p-51', 'KFR-51 高效滤芯', '/products/kfr-51'), change('p-52', 'KFR-52 长效滤芯', '/products/kfr-52'), change('p-53', 'KFR-53 空调滤芯', '/products/kfr-53')],
    removedItems: [change('p-18', 'KFR-18 旧款滤芯', '/products/kfr-18')],
    logs: [log('l-101', '2026-09-29 09:30', '自动更新', '成功', '发现新增 3 条、来源删除 1 条；正文修改已随发布事件实时更新。'), log('l-100', '2026-09-29 08:42', '实时更新', '成功', '产品 KFR-35 详情页发布后完成内容学习。')],
  },
  {
    id: 'product-detail', sourceId: 'fp_product_detail_cn', name: '中文站 / 产品中心 / 空气滤清器', kind: '前台页面', section: 'content',
    count: 26, added: 0, removed: 0, status: 'active', autoUpdate: true, frequency: '每日',
    lastDetected: '2026-09-29 09:26', lastSync: '2026-09-29 09:26', nextSync: '下次 00:00', health: 88, pausedIds: [], addedItems: [], removedItems: [],
    logs: [log('l-201', '2026-09-29 09:26', '实时更新', '成功', '栏目正文发布后自动完成学习，栏目数量无变化。')],
  },
  {
    id: 'city-products', sourceId: 'be_city_product', name: '城市产品分站 / 城市产品列表', kind: '后台页面', section: 'content',
    count: 318, added: 2, removed: 1, status: 'pending', autoUpdate: false, frequency: '每日',
    lastDetected: '2026-09-29 09:10', lastSync: '2026-09-28 02:00', nextSync: '自动更新已关闭', health: 76, pausedIds: [],
    addedItems: [change('city-yinchuan', '银川', '城市产品分站 / 银川'), change('city-hanzhong', '汉中', '城市产品分站 / 汉中')],
    removedItems: [change('city-old', '旧城市站', '城市产品分站 / 旧城市站')],
    logs: [log('l-301', '2026-09-29 09:10', '变化检测', '成功', '发现新增 2 条、来源删除 1 条；自动更新关闭，等待手动同步。'), log('l-300', '2026-09-28 02:00', '定时更新', '成功', '更新 318 条栏目知识。')],
  },
  {
    id: 'news', sourceId: 'be_news', name: '云资讯 / 资讯列表与详情', kind: '后台页面', section: 'content',
    count: 152, added: 4, removed: 2, status: 'paused', autoUpdate: false, frequency: '每小时',
    lastDetected: '2026-09-28 16:20', lastSync: '2026-09-28 16:20', nextSync: '已关闭使用', health: 68, pausedIds: [],
    addedItems: [change('n-1', '新品发布会回顾', '云资讯 / 企业动态'), change('n-2', '产品升级公告', '云资讯 / 产品资讯'), change('n-3', '秋季展会预告', '云资讯 / 市场活动'), change('n-4', '服务网点调整通知', '云资讯 / 服务公告')],
    removedItems: [change('n-5', '夏季活动预告', '云资讯 / 市场活动'), change('n-6', '临时维护通知', '云资讯 / 服务公告')],
    logs: [log('l-401', '2026-09-28 16:20', '关闭使用', '成功', '停止变化检测与内容学习，保留接入关系、已入库知识及历史日志。')],
  },
  {
    id: 'tender', sourceId: 'be_tender', name: '采购招标 / 采购招标列表', kind: '后台页面', section: 'content',
    count: 86, added: 0, removed: 0, status: 'failed', autoUpdate: true, frequency: '每小时',
    lastDetected: '2026-09-29 09:20', lastSync: '2026-09-29 08:20', nextSync: '连接恢复后重试', health: 54, pausedIds: [], addedItems: [], removedItems: [],
    logs: [log('l-501', '2026-09-29 09:20', '自动更新', '失败', '来源暂时无法访问，未把无法访问误判为来源删除。'), log('l-500', '2026-09-29 08:20', '自动更新', '成功', '同步完成，栏目数量无变化。')],
  },
];

export function sourceAssets(source: SourceConnection): KbAsset[] {
  return mockAssets.filter((asset) => asset.section === source.section && (source.kind === '前台页面' ? asset.frontendPageId : asset.backendPageId) === source.sourceId);
}

// ACTION: 注册栏目接入 [POST] /api/kb/source-connections
export function handleRegisterSource(asset: KbAsset, count: number, options: { enabled?: boolean } = {}) {
  const sourceId = asset.frontendPageId || asset.backendPageId;
  if (!sourceId || mockSourceConnectionsData.some((source) => source.sourceId === sourceId && source.section === asset.section)) return;
  const enabled = options.enabled !== false;
  mockSourceConnectionsData.push({
    id: `${sourceId}:${asset.section}`, sourceId, name: asset.source, kind: asset.frontendPageId ? '前台页面' : '后台页面', section: asset.section,
    count: 0, added: count, removed: 0, status: enabled ? 'pending' : 'paused', autoUpdate: false, frequency: '每日', lastDetected: enabled ? '刚刚' : '—', lastSync: '尚未学习', nextSync: enabled ? '自动更新已关闭' : '已关闭使用', health: 0,
    pausedIds: [], addedItems: [], removedItems: [], logs: [log(`${sourceId}-created`, '刚刚', '新增接入', '成功', enabled ? `已选择 ${count} 条内容并启用学习，等待首次同步。` : `已选择 ${count} 条内容，学习未启用。`)],
  });
}

// ACTION: 停止栏目学习 [POST] /api/kb/source-connections/{id}/pause
export function handlePauseSource(source: SourceConnection) {
  const targets = sourceAssets(source).filter((asset) => asset.status !== 'archived' && asset.status !== 'draft');
  source.pausedIds = targets.map((asset) => asset.id);
  upsertKnowledgeAssets(targets.map((asset) => ({ ...asset, status: 'archived' })));
  source.status = 'paused';
  source.autoUpdate = false;
  source.nextSync = '已关闭使用';
  source.logs.unshift(log(`${source.id}-${Date.now()}`, '刚刚', '关闭使用', '成功', `已停用关联知识 ${source.count} 条，保留接入关系、内容和配置。`));
}

// 既有页面知识补齐接入关系，草稿不计入已入库数量。
mockAssets.filter((asset) => (asset.section === 'content' || asset.section === 'structured') && (asset.frontendPageId || asset.backendPageId)).forEach((asset) => {
  if (!mockSourceConnectionsData.some((source) => source.sourceId === (asset.frontendPageId || asset.backendPageId) && source.section === asset.section)) {
    handleRegisterSource(asset, 1);
    const source = mockSourceConnectionsData[mockSourceConnectionsData.length - 1];
    if (asset.status !== 'draft') {
      source.count = 1;
      source.added = 0;
      source.status = asset.status === 'archived' ? 'paused' : 'active';
      source.frequency = asset.section === 'structured' ? '每周' : '每日';
      source.autoUpdate = asset.status !== 'archived';
      source.lastSync = asset.lastSync || asset.updatedAt;
      source.nextSync = source.status === 'paused' ? '已关闭使用' : source.frequency === '每周' ? '下周一 00:00' : '下次 00:00';
      source.health = asset.health;
    }
  }
});
