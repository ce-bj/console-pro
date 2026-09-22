import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AUDIENCE_OPTIONS, ContentFormat as KnowledgeContentFormat, CONTENT_FORMATS as KB_CONTENT_FORMATS,
  INDUSTRY_TREE, LANGUAGE_OPTIONS, PRIMARY_CATEGORIES, SECTION_MAP, VALIDITY_STATUSES,
  TIMELINESS_OPTS, Timeliness, mockPortalSites, mockCustomSchemaFields,
  generalChunkRule, mockExtraChunkRules, secondaryIndustriesOf,
} from './knowledge-config/data';

type KnowledgeStatus = 'draft' | 'published' | 'archived';
type PushStatus = 'not_pushed' | 'partial' | 'synced';
type ContentFormat = Exclude<KnowledgeContentFormat, '问答对' | '结构化记录'>;
type BatchEditField = 'folderId' | 'primaryCategory' | 'secondaryCategory' | 'contentFormat' | 'validityStatus' | 'timeliness' | 'audience' | 'language' | 'tags';

export interface PlatformIndustryKnowledge {
  id: string;
  title: string;
  primaryIndustry: string;
  secondaryIndustry: string;
  primaryCategory: string;
  secondaryCategory: string;
  contentFormat: ContentFormat;
  audience?: string;
  validityStatus?: string;
  language?: string;
  currentVersion: number;
  status: KnowledgeStatus;
  pushStatus: PushStatus;
  pushedTenants: number;
  matchedTenants: number;
  source: string;
  summary: string;
  tags: string[];
  chunkCount: number;
  timeliness?: Timeliness;
  enabled?: boolean;
  health?: number;
  createdAt?: string;
  createdBy?: string;
  folderId?: string;
  portalSites?: string[];
  note?: string;
  sourceRef?: string;
  customFields?: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
}

interface IndustryKnowledgeVersion {
  id: string;
  knowledgeId: string;
  version: number;
  status: 'current' | 'history' | 'draft';
  changeSummary: string;
  fileName: string;
  chunkCount: number;
  createdAt: string;
  createdBy: string;
}

interface TenantPushTarget {
  tenantId: string;
  tenantName: string;
  industry: string;
  currentVersion: number | null;
  receiveMode: 'follow_latest' | 'fixed_version' | 'not_adopted';
}

interface KnowledgeDraft {
  title: string;
  primaryIndustry: string;
  secondaryIndustry: string;
  primaryCategory: string;
  secondaryCategory: string;
  contentFormat: ContentFormat;
  audience: string;
  validityStatus: string;
  language: string;
  source: string;
  summary: string;
  tags: string;
  fileName: string;
  timeliness: Timeliness;
  enabled: boolean;
  folderId: string;
  portalSites: string[];
  note: string;
  sourceRef: string;
  customFields: Record<string, string>;
}

const STATUS_CONFIG: Record<KnowledgeStatus, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
  published: { label: '已发布', cls: 'bg-green-50 text-green-700' },
  archived: { label: '已下线', cls: 'bg-red-50 text-red-600' },
};
const PUSH_CONFIG: Record<PushStatus, { label: string; cls: string }> = {
  not_pushed: { label: '未推送', cls: 'bg-gray-100 text-gray-600' },
  partial: { label: '部分企业', cls: 'bg-amber-50 text-amber-700' },
  synced: { label: '已同步', cls: 'bg-blue-50 text-blue-700' },
};
const CONTENT_FORMATS: ContentFormat[] = KB_CONTENT_FORMATS.filter(
  (item): item is ContentFormat => item !== '问答对' && item !== '结构化记录',
);

// PAGINATION: page,pageSize
export const mockPlatformIndustryKnowledgeData: PlatformIndustryKnowledge[] = [
  { id: 'pik_001', title: 'GB/T 18488 新能源汽车电机标准', primaryIndustry: '机械设备', secondaryIndustry: '工程机械', primaryCategory: '标准规范', secondaryCategory: '国家标准', contentFormat: '标准', currentVersion: 3, status: 'published', pushStatus: 'synced', pushedTenants: 18, matchedTenants: 18, source: '国家标准资料库', summary: '新能源汽车驱动电机系统相关国家标准及关键参数说明。', tags: ['新能源汽车', '电机', '国家标准'], chunkCount: 186, updatedAt: '2026-08-12 16:30', updatedBy: '平台运营-林岚' },
  { id: 'pik_002', title: '制造业智能化转型白皮书', primaryIndustry: '机械设备', secondaryIndustry: '数控机床', primaryCategory: '行业概览', secondaryCategory: '', contentFormat: '报告', currentVersion: 2, status: 'published', pushStatus: 'partial', pushedTenants: 9, matchedTenants: 15, source: '行业协会', summary: '制造企业智能化转型路径、成熟度模型与实践案例。', tags: ['智能制造', '数字化转型'], chunkCount: 224, updatedAt: '2026-08-10 09:20', updatedBy: '平台运营-王芳' },
  { id: 'pik_003', title: '医院智慧服务分级评估指南', primaryIndustry: '服务类', secondaryIndustry: '医院', primaryCategory: '政策法规', secondaryCategory: '行业政策', contentFormat: '指南', currentVersion: 1, status: 'published', pushStatus: 'not_pushed', pushedTenants: 0, matchedTenants: 7, source: '国家卫生健康委', summary: '医院智慧服务建设、评估指标与分级要求。', tags: ['医院', '智慧服务', '评估'], chunkCount: 98, updatedAt: '2026-08-08 11:05', updatedBy: '平台运营-李明' },
  { id: 'pik_004', title: '建筑装饰工程常见问题汇编', primaryIndustry: '家居建材', secondaryIndustry: '建筑装饰', primaryCategory: '常见问题', secondaryCategory: '', contentFormat: '指南', currentVersion: 1, status: 'draft', pushStatus: 'not_pushed', pushedTenants: 0, matchedTenants: 12, source: '内部行业研究', summary: '建筑装饰项目售前、施工与验收高频问题。', tags: ['建筑装饰', 'FAQ'], chunkCount: 0, updatedAt: '2026-08-13 10:15', updatedBy: '平台运营-王芳' },
  { id: 'pik_005', title: '低压电器产品选型手册', primaryIndustry: '电子电气', secondaryIndustry: '低压电器', primaryCategory: '行业数据', secondaryCategory: '', contentFormat: '手册', currentVersion: 4, status: 'archived', pushStatus: 'partial', pushedTenants: 4, matchedTenants: 11, source: '产品标准委员会', summary: '低压电器型号、参数、适用场景和选型建议。', tags: ['低压电器', '选型'], chunkCount: 142, updatedAt: '2026-07-28 15:40', updatedBy: '平台管理员' },
];

const mockIndustryKnowledgeVersionsData: IndustryKnowledgeVersion[] = [
  { id: 'ver_001_3', knowledgeId: 'pik_001', version: 3, status: 'current', changeSummary: '补充 2026 年参数修订与测试方法', fileName: 'GB-T18488-2026-v3.pdf', chunkCount: 186, createdAt: '2026-08-12 16:30', createdBy: '平台运营-林岚' },
  { id: 'ver_001_2', knowledgeId: 'pik_001', version: 2, status: 'history', changeSummary: '更新 2025 版标准正文', fileName: 'GB-T18488-2025-v2.pdf', chunkCount: 172, createdAt: '2026-05-20 10:10', createdBy: '平台运营-林岚' },
  { id: 'ver_001_1', knowledgeId: 'pik_001', version: 1, status: 'history', changeSummary: '首次录入', fileName: 'GB-T18488-2015-v1.pdf', chunkCount: 156, createdAt: '2025-08-01 09:00', createdBy: '平台运营-张伟' },
  { id: 'ver_002_2', knowledgeId: 'pik_002', version: 2, status: 'current', changeSummary: '新增 12 个实践案例', fileName: '智能制造白皮书-v2.pdf', chunkCount: 224, createdAt: '2026-08-10 09:20', createdBy: '平台运营-王芳' },
  { id: 'ver_002_1', knowledgeId: 'pik_002', version: 1, status: 'history', changeSummary: '平台首发版本', fileName: '智能制造白皮书-v1.pdf', chunkCount: 198, createdAt: '2026-03-18 14:00', createdBy: '平台运营-王芳' },
  { id: 'ver_003_1', knowledgeId: 'pik_003', version: 1, status: 'current', changeSummary: '平台首发版本', fileName: '医院智慧服务指南-v1.pdf', chunkCount: 98, createdAt: '2026-08-08 11:05', createdBy: '平台运营-李明' },
];

const mockTenantPushTargetsData: TenantPushTarget[] = [
  { tenantId: 'tenant_001', tenantName: '安维智能制造', industry: '机械设备 / 数控机床', currentVersion: 1, receiveMode: 'follow_latest' },
  { tenantId: 'tenant_002', tenantName: '华东装备集团', industry: '机械设备 / 工程机械', currentVersion: 2, receiveMode: 'follow_latest' },
  { tenantId: 'tenant_003', tenantName: '精工零部件', industry: '机械设备 / 工程机械', currentVersion: 1, receiveMode: 'fixed_version' },
  { tenantId: 'tenant_004', tenantName: '智造云科技', industry: '机械设备 / 数控机床', currentVersion: null, receiveMode: 'not_adopted' },
];

// ACTION: 获取平台行业知识列表 [GET] /api/platform/industry-knowledge
function handleFetchPlatformIndustryKnowledge(params: { keyword?: string; primaryIndustry?: string; secondaryIndustry?: string; primaryCategory?: string; secondaryCategory?: string; contentFormat?: string; validityStatus?: string; timeliness?: string; audience?: string; language?: string; tag?: string; status?: string; page?: number; pageSize?: number }) {
  console.log('fetch platform industry knowledge', params);
}

// ACTION: 新增平台行业知识 [POST] /api/platform/industry-knowledge
function handleCreatePlatformIndustryKnowledge(payload: KnowledgeDraft) {
  console.log('create platform industry knowledge', payload);
}

// ACTION: 更新平台行业知识 [PUT] /api/platform/industry-knowledge/{id}
function handleUpdatePlatformIndustryKnowledge(payload: { id: string; form: KnowledgeDraft }) {
  console.log('update platform industry knowledge', payload);
}

// ACTION: 发布行业知识新版本 [POST] /api/platform/industry-knowledge/{id}/versions
function handlePublishIndustryKnowledgeVersion(payload: { id: string; fileName: string; changeSummary: string }) {
  console.log('publish industry knowledge version', payload);
}

// ACTION: 推送行业知识到企业 [POST] /api/platform/industry-knowledge/{id}/push
function handlePushIndustryKnowledge(payload: { id: string; tenantIds: string[] }) {
  console.log('push industry knowledge', payload);
}

// ACTION: 下线平台行业知识 [PATCH] /api/platform/industry-knowledge/{id}/archive
function handleArchivePlatformIndustryKnowledge(id: string) {
  console.log('archive platform industry knowledge', id);
}

// ACTION: 开启或关闭行业知识检索 [PATCH] /api/platform/industry-knowledge/{id}/enabled
function handleTogglePlatformIndustryKnowledge(payload: { id: string; enabled: boolean }) {
  console.log('toggle platform industry knowledge', payload);
}

// ACTION: 批量更新行业知识状态 [PATCH] /api/platform/industry-knowledge/batch/status
function handleBatchPlatformIndustryKnowledgeStatus(payload: { ids: string[]; status: KnowledgeStatus }) {
  console.log('batch platform industry knowledge status', payload);
}

// ACTION: 批量开启或关闭行业知识检索 [PATCH] /api/platform/industry-knowledge/batch/enabled
function handleBatchTogglePlatformIndustryKnowledge(payload: { ids: string[]; enabled: boolean }) {
  console.log('batch toggle platform industry knowledge', payload);
}

// ACTION: 批量重新学习行业知识 [POST] /api/platform/industry-knowledge/batch/relearn
function handleBatchRelearnPlatformIndustryKnowledge(ids: string[]) {
  console.log('batch relearn platform industry knowledge', ids);
}

// ACTION: 批量推送行业知识 [POST] /api/platform/industry-knowledge/batch/push
function handleBatchPushPlatformIndustryKnowledge(ids: string[]) {
  console.log('batch push platform industry knowledge', ids);
}

// ACTION: 批量删除行业知识 [DELETE] /api/platform/industry-knowledge/batch
function handleBatchDeletePlatformIndustryKnowledge(ids: string[]) {
  console.log('batch delete platform industry knowledge', ids);
}

// ACTION: 批量修改行业知识目录与元数据 [PATCH] /api/platform/industry-knowledge/batch/metadata
function handleBatchUpdatePlatformIndustryKnowledgeMetadata(payload: { ids: string[]; fields: Record<string, unknown> }) {
  console.log('batch update platform industry knowledge metadata', payload);
}

const emptyDraft = (): KnowledgeDraft => ({ title: '', primaryIndustry: '', secondaryIndustry: '', primaryCategory: '', secondaryCategory: '', contentFormat: '报告', audience: '企业内部', validityStatus: '现行有效', language: '简体中文', source: '', summary: '', tags: '', fileName: '', timeliness: '静态', enabled: false, folderId: '', portalSites: [], note: '', sourceRef: '', customFields: {} });

export default function IndustryKnowledgePlatformPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState(mockPlatformIndustryKnowledgeData);
  const [keyword, setKeyword] = useState('');
  const [primaryIndustryFilter, setPrimaryIndustryFilter] = useState('all');
  const [secondaryIndustryFilter, setSecondaryIndustryFilter] = useState('all');
  const [primaryCategoryFilter, setPrimaryCategoryFilter] = useState('all');
  const [secondaryCategoryFilter, setSecondaryCategoryFilter] = useState('all');
  const [contentFormatFilter, setContentFormatFilter] = useState('all');
  const [validityStatusFilter, setValidityStatusFilter] = useState('all');
  const [timelinessFilter, setTimelinessFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [commonEditOpen, setCommonEditOpen] = useState(false);
  const [draft, setDraft] = useState<KnowledgeDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [versionEditorItem, setVersionEditorItem] = useState<PlatformIndustryKnowledge | null>(null);
  const [versionFile, setVersionFile] = useState('');
  const [versionSummary, setVersionSummary] = useState('');
  const [pushItem, setPushItem] = useState<PlatformIndustryKnowledge | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<PlatformIndustryKnowledge | null>(null);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [batchEditDraft, setBatchEditDraft] = useState<KnowledgeDraft>(emptyDraft());
  const [batchEditFields, setBatchEditFields] = useState<Set<BatchEditField>>(new Set());

  const filtered = useMemo(() => rows.filter((item) =>
    (!keyword || `${item.title}${item.source}${item.tags.join('')}`.toLowerCase().includes(keyword.toLowerCase())) &&
    (primaryIndustryFilter === 'all' || item.primaryIndustry === primaryIndustryFilter) &&
    (secondaryIndustryFilter === 'all' || item.secondaryIndustry === secondaryIndustryFilter) &&
    (primaryCategoryFilter === 'all' || item.primaryCategory === primaryCategoryFilter) &&
    (secondaryCategoryFilter === 'all' || item.secondaryCategory === secondaryCategoryFilter) &&
    (contentFormatFilter === 'all' || item.contentFormat === contentFormatFilter) &&
    (validityStatusFilter === 'all' || (item.validityStatus || '现行有效') === validityStatusFilter) &&
    (timelinessFilter === 'all' || (item.timeliness || '静态') === timelinessFilter) &&
    (audienceFilter === 'all' || (item.audience || '企业内部') === audienceFilter) &&
    (languageFilter === 'all' || (item.language || '简体中文') === languageFilter) &&
    (!tagFilter || item.tags.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()))) &&
    (statusFilter === 'all' || item.status === statusFilter)), [rows, keyword, primaryIndustryFilter, secondaryIndustryFilter, primaryCategoryFilter, secondaryCategoryFilter, contentFormatFilter, validityStatusFilter, timelinessFilter, audienceFilter, languageFilter, tagFilter, statusFilter]);
  const publishedCount = rows.filter((item) => item.status === 'published').length;
  const pendingPushCount = rows.filter((item) => item.status === 'published' && item.pushStatus !== 'synced').length;
  const pushedTenantCount = new Set(mockTenantPushTargetsData.filter((item) => item.currentVersion !== null).map((item) => item.tenantId)).size;
  const secondaryIndustries = secondaryIndustriesOf(draft.primaryIndustry);
  const secondaryCategories = draft.primaryCategory === '标准规范' ? ['国家标准', '行业标准'] : draft.primaryCategory === '政策法规' ? ['国家政策', '地方政策', '行业政策'] : [];
  const selectedItems = rows.filter((item) => selectedIds.has(item.id));
  const selectedAllDraft = selectedItems.length > 0 && selectedItems.every((item) => item.status === 'draft');
  const selectedAllPublished = selectedItems.length > 0 && selectedItems.every((item) => item.status === 'published');
  const selectedAllArchived = selectedItems.length > 0 && selectedItems.every((item) => item.status === 'archived');
  const industrySection = SECTION_MAP.industry;
  const inheritedChunkRule = mockExtraChunkRules.industry?.find((rule) => rule.contentFormat === draft.contentFormat) || generalChunkRule(industrySection);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const item = rows.find((row) => row.id === editId);
    if (item) openCreate(item);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (detailItem) navigate(`/platform/industry-knowledge/${detailItem.id}`);
  }, [detailItem, navigate]);

  function fetchWith(next: Partial<Parameters<typeof handleFetchPlatformIndustryKnowledge>[0]>) {
    handleFetchPlatformIndustryKnowledge({ keyword, primaryIndustry: primaryIndustryFilter, secondaryIndustry: secondaryIndustryFilter, primaryCategory: primaryCategoryFilter, secondaryCategory: secondaryCategoryFilter, contentFormat: contentFormatFilter, validityStatus: validityStatusFilter, timeliness: timelinessFilter, audience: audienceFilter, language: languageFilter, tag: tagFilter, status: statusFilter, page: 1, pageSize: 20, ...next });
  }
  function openCreate(item?: PlatformIndustryKnowledge) {
    if (item) {
      setEditingId(item.id);
      setDraft({ title: item.title, primaryIndustry: item.primaryIndustry, secondaryIndustry: item.secondaryIndustry, primaryCategory: item.primaryCategory, secondaryCategory: item.secondaryCategory, contentFormat: item.contentFormat, audience: item.audience || '企业内部', validityStatus: item.validityStatus || '现行有效', language: item.language || '简体中文', source: item.source, summary: item.summary, tags: item.tags.join('、'), fileName: '', timeliness: item.timeliness || '静态', enabled: item.enabled ?? item.status === 'published', folderId: item.folderId || '', portalSites: item.portalSites || [], note: item.note || '', sourceRef: item.sourceRef || item.source, customFields: item.customFields || {} });
    } else { setEditingId(null); setDraft(emptyDraft()); }
    setCommonEditOpen(true);
  }
  function saveDraft(publish: boolean) {
    if (!draft.title.trim() || !draft.primaryIndustry || !draft.secondaryIndustry || !draft.primaryCategory || !draft.source.trim()) { alert('请填写知识名称、所属行业、一级分类和来源'); return; }
    if (publish && !draft.fileName) { alert('发布行业知识前请先上传原始文件'); return; }
    if (editingId) {
      handleUpdatePlatformIndustryKnowledge({ id: editingId, form: draft });
      setRows((prev) => prev.map((item) => item.id === editingId ? { ...item, ...draft, tags: draft.tags.split(/[、,，]/).filter(Boolean), status: publish ? 'published' : item.status, updatedAt: '2026-08-13 15:30', updatedBy: '当前平台用户' } : item));
    } else {
      handleCreatePlatformIndustryKnowledge(draft);
      setRows((prev) => [{ id: `pik_${Date.now()}`, ...draft, tags: draft.tags.split(/[、,，]/).filter(Boolean), currentVersion: 1, status: publish ? 'published' : 'draft', pushStatus: 'not_pushed', pushedTenants: 0, matchedTenants: 0, chunkCount: publish ? 1 : 0, updatedAt: '2026-08-13 15:30', updatedBy: '当前平台用户' }, ...prev]);
    }
    setCommonEditOpen(false);
  }
  function publishVersion() {
    if (!versionEditorItem || !versionFile || !versionSummary.trim()) { alert('请上传新版本文件并填写版本说明'); return; }
    handlePublishIndustryKnowledgeVersion({ id: versionEditorItem.id, fileName: versionFile, changeSummary: versionSummary });
    setRows((prev) => prev.map((item) => item.id === versionEditorItem.id ? { ...item, currentVersion: item.currentVersion + 1, pushStatus: 'partial', updatedAt: '2026-08-13 15:35', updatedBy: '当前平台用户' } : item));
    setVersionEditorItem(null); setVersionFile(''); setVersionSummary('');
  }
  function openPush(item: PlatformIndustryKnowledge) {
    setPushItem(item);
    setSelectedTenants(new Set(mockTenantPushTargetsData.map((tenant) => tenant.tenantId)));
  }
  function pushKnowledge() {
    if (!pushItem || selectedTenants.size === 0) return;
    handlePushIndustryKnowledge({ id: pushItem.id, tenantIds: Array.from(selectedTenants) });
    setRows((prev) => prev.map((item) => item.id === pushItem.id ? { ...item, pushedTenants: selectedTenants.size, pushStatus: selectedTenants.size >= item.matchedTenants ? 'synced' : 'partial' } : item));
    setPushItem(null);
  }
  function archive(item: PlatformIndustryKnowledge) {
    if (!confirm(`确认下线「${item.title}」？企业已经导入的独立知识不受影响。`)) return;
    handleArchivePlatformIndustryKnowledge(item.id);
    setRows((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'archived' } : row));
  }
  function toggleEnabled(item: PlatformIndustryKnowledge, enabled: boolean) {
    handleTogglePlatformIndustryKnowledge({ id: item.id, enabled });
    setRows((prev) => prev.map((row) => row.id === item.id ? { ...row, enabled } : row));
  }
  function toggleSelected(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleSelectAll() {
    setSelectedIds(filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id)) ? new Set() : new Set(filtered.map((item) => item.id)));
  }
  function batchStatus(status: KnowledgeStatus) {
    const ids = Array.from(selectedIds);
    handleBatchPlatformIndustryKnowledgeStatus({ ids, status });
    setRows((prev) => prev.map((item) => selectedIds.has(item.id) ? { ...item, status, enabled: status === 'published' ? item.enabled : false } : item));
    setSelectedIds(new Set());
  }
  function batchToggle(enabled: boolean) {
    const ids = Array.from(selectedIds);
    handleBatchTogglePlatformIndustryKnowledge({ ids, enabled });
    setRows((prev) => prev.map((item) => selectedIds.has(item.id) && item.status === 'published' ? { ...item, enabled } : item));
  }
  function batchRelearn() {
    handleBatchRelearnPlatformIndustryKnowledge(Array.from(selectedIds));
    alert(`已提交 ${selectedIds.size} 条行业知识重新学习`);
    setSelectedIds(new Set());
  }
  function batchPush() {
    handleBatchPushPlatformIndustryKnowledge(Array.from(selectedIds));
    setRows((prev) => prev.map((item) => selectedIds.has(item.id) && item.status === 'published' ? { ...item, pushStatus: item.matchedTenants > 0 ? 'synced' : 'not_pushed', pushedTenants: item.matchedTenants } : item));
    setSelectedIds(new Set());
  }
  function batchDelete() {
    const ids = Array.from(selectedIds);
    if (!confirm(`删除选中的 ${ids.length} 条知识？`)) return;
    handleBatchDeletePlatformIndustryKnowledge(ids);
    setRows((prev) => prev.filter((item) => !selectedIds.has(item.id) || item.status === 'published'));
    setSelectedIds(new Set());
  }
  function toggleBatchEditField(field: BatchEditField) {
    setBatchEditFields((prev) => { const next = new Set(prev); next.has(field) ? next.delete(field) : next.add(field); return next; });
  }
  function applyBatchEdit() {
    if (batchEditFields.size === 0) return;
    const fields: Record<string, unknown> = {};
    batchEditFields.forEach((field) => { fields[field] = field === 'tags' ? batchEditDraft.tags.split(/[、,，]/).filter(Boolean) : batchEditDraft[field]; });
    handleBatchUpdatePlatformIndustryKnowledgeMetadata({ ids: Array.from(selectedIds), fields });
    setRows((prev) => prev.map((item) => {
      if (!selectedIds.has(item.id)) return item;
      const next = { ...item } as PlatformIndustryKnowledge;
      batchEditFields.forEach((field) => {
        if (field === 'tags') next.tags = batchEditDraft.tags.split(/[、,，]/).filter(Boolean);
        else (next as unknown as Record<string, unknown>)[field] = batchEditDraft[field];
      });
      return { ...next, updatedAt: '2026-08-13 16:10', updatedBy: '当前平台用户' };
    }));
    setBatchEditOpen(false); setBatchEditFields(new Set()); setSelectedIds(new Set());
  }
  function transitionOne(item: PlatformIndustryKnowledge, status: KnowledgeStatus) {
    handleBatchPlatformIndustryKnowledgeStatus({ ids: [item.id], status });
    setRows((prev) => prev.map((row) => row.id === item.id ? { ...row, status, enabled: status === 'published' ? row.enabled : false } : row));
  }
  function deleteOne(item: PlatformIndustryKnowledge) {
    if (!confirm(`删除「${item.title}」？`)) return;
    handleBatchDeletePlatformIndustryKnowledge([item.id]);
    setRows((prev) => prev.filter((row) => row.id !== item.id));
  }

  return <div className="n14-page p-6 space-y-5">
    <div className="flex items-start justify-between"><div><div className="text-xs font-medium text-blue-600">N14 · 产品后台</div><h1 className="mt-1 text-2xl font-semibold text-gray-900">行业知识运营</h1><p className="mt-1 text-sm text-gray-500">平台统一录入和维护行业知识，企业可从新增知识页面导入到自己的行业知识库。</p></div><Button onClick={() => navigate('/platform/industry-knowledge/new')}>+ 新增行业知识</Button></div>

    <div className="grid grid-cols-4 gap-3"><Card><CardContent className="p-4"><div className="text-xs text-gray-500">知识总数</div><div className="mt-1 text-2xl font-semibold">{rows.length}</div></CardContent></Card><Card><CardContent className="p-4"><div className="text-xs text-gray-500">已发布</div><div className="mt-1 text-2xl font-semibold text-green-600">{publishedCount}</div></CardContent></Card><Card><CardContent className="p-4"><div className="text-xs text-gray-500">待开放导入</div><div className="mt-1 text-2xl font-semibold text-amber-600">{pendingPushCount}</div></CardContent></Card><Card><CardContent className="p-4"><div className="text-xs text-gray-500">已覆盖企业</div><div className="mt-1 text-2xl font-semibold text-blue-600">{pushedTenantCount}</div></CardContent></Card></div>

    <Card className="border-violet-100 bg-violet-50/40"><CardHeader className="pb-2"><CardTitle className="text-sm">企业导入规则</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3 text-xs text-gray-600"><div><span className="font-medium text-gray-800">可见范围：</span>企业选择行业后，可浏览全部已发布平台行业知识。</div><div><span className="font-medium text-gray-800">导入方式：</span>不选择版本，直接导入当前内容到企业行业知识库。</div><div><span className="font-medium text-gray-800">导入结果：</span>生成企业独立草稿，后续编辑和发布不受平台版本限制。</div></CardContent></Card>

    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div><CardTitle className="text-base">行业知识列表</CardTitle><p className="mt-1 text-xs text-gray-500">通用字段、筛选、批量处理和编辑复用知识资产目录；已发布内容可供企业直接导入，不设置企业版本限制。</p></div>
          <div className="flex gap-2">
            <Input className="w-64" value={keyword} onChange={(event) => { setKeyword(event.target.value); fetchWith({ keyword: event.target.value }); }} placeholder="搜索知识名称、来源、标签" />
            <Select value={primaryIndustryFilter} onValueChange={(value) => { setPrimaryIndustryFilter(value); setSecondaryIndustryFilter('all'); fetchWith({ primaryIndustry: value, secondaryIndustry: 'all' }); }}><SelectTrigger className="w-36"><SelectValue placeholder="一级行业" /></SelectTrigger><SelectContent><SelectItem value="all">全部一级行业</SelectItem>{INDUSTRY_TREE.map((industry) => <SelectItem key={industry.primary} value={industry.primary}>{industry.primary}</SelectItem>)}</SelectContent></Select>
            <Select value={secondaryIndustryFilter} disabled={primaryIndustryFilter === 'all'} onValueChange={(value) => { setSecondaryIndustryFilter(value); fetchWith({ secondaryIndustry: value }); }}><SelectTrigger className="w-36"><SelectValue placeholder="二级行业" /></SelectTrigger><SelectContent><SelectItem value="all">全部二级行业</SelectItem>{secondaryIndustriesOf(primaryIndustryFilter).map((industry) => <SelectItem key={industry} value={industry}>{industry}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); fetchWith({ status: value }); }}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部状态</SelectItem><SelectItem value="draft">草稿</SelectItem><SelectItem value="published">已发布</SelectItem><SelectItem value="archived">已下线</SelectItem></SelectContent></Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="flex flex-wrap items-center gap-2 border-t border-b bg-gray-50/60 px-4 py-3">
          <Select value={primaryCategoryFilter} onValueChange={(value) => { setPrimaryCategoryFilter(value); setSecondaryCategoryFilter('all'); fetchWith({ primaryCategory: value, secondaryCategory: 'all' }); }}><SelectTrigger className="w-32 bg-white"><SelectValue placeholder="一级分类" /></SelectTrigger><SelectContent><SelectItem value="all">全部一级分类</SelectItem>{PRIMARY_CATEGORIES['行业知识库'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={secondaryCategoryFilter} onValueChange={(value) => { setSecondaryCategoryFilter(value); fetchWith({ secondaryCategory: value }); }}><SelectTrigger className="w-32 bg-white"><SelectValue placeholder="二级分类" /></SelectTrigger><SelectContent><SelectItem value="all">全部二级分类</SelectItem>{Array.from(new Set(rows.map((item) => item.secondaryCategory).filter(Boolean))).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={contentFormatFilter} onValueChange={(value) => { setContentFormatFilter(value); fetchWith({ contentFormat: value }); }}><SelectTrigger className="w-32 bg-white"><SelectValue placeholder="内容形式" /></SelectTrigger><SelectContent><SelectItem value="all">全部内容形式</SelectItem>{CONTENT_FORMATS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={validityStatusFilter} onValueChange={(value) => { setValidityStatusFilter(value); fetchWith({ validityStatus: value }); }}><SelectTrigger className="w-32 bg-white"><SelectValue placeholder="有效状态" /></SelectTrigger><SelectContent><SelectItem value="all">全部有效状态</SelectItem>{VALIDITY_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={timelinessFilter} onValueChange={(value) => { setTimelinessFilter(value); fetchWith({ timeliness: value }); }}><SelectTrigger className="w-28 bg-white"><SelectValue placeholder="时效" /></SelectTrigger><SelectContent><SelectItem value="all">全部时效</SelectItem>{TIMELINESS_OPTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={audienceFilter} onValueChange={(value) => { setAudienceFilter(value); fetchWith({ audience: value }); }}><SelectTrigger className="w-32 bg-white"><SelectValue placeholder="适用对象" /></SelectTrigger><SelectContent><SelectItem value="all">全部适用对象</SelectItem>{AUDIENCE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Select value={languageFilter} onValueChange={(value) => { setLanguageFilter(value); fetchWith({ language: value }); }}><SelectTrigger className="w-28 bg-white"><SelectValue placeholder="语言" /></SelectTrigger><SelectContent><SelectItem value="all">全部语言</SelectItem>{LANGUAGE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Input className="w-36 bg-white" value={tagFilter} onChange={(event) => { setTagFilter(event.target.value); fetchWith({ tag: event.target.value }); }} placeholder="标签" />
          <Button size="sm" variant="outline" onClick={() => { setPrimaryCategoryFilter('all'); setSecondaryCategoryFilter('all'); setContentFormatFilter('all'); setValidityStatusFilter('all'); setTimelinessFilter('all'); setAudienceFilter('all'); setLanguageFilter('all'); setTagFilter(''); }}>重置</Button>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs text-gray-400">共 {filtered.length} 条</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedIds(new Set(filtered.map((item) => item.id)))}>全选当前筛选（跨页）</Button>
        </div>
        {selectedIds.size > 0 && <div className="flex flex-wrap items-center gap-2 border-y border-blue-100 bg-blue-50 px-4 py-2">
          <Badge className="bg-blue-600 text-white">已选 {selectedIds.size} 条</Badge>
          <Button size="sm" variant="outline" onClick={() => { setBatchEditDraft(emptyDraft()); setBatchEditFields(new Set()); setBatchEditOpen(true); }}>批量修改知识目录与元数据</Button>
          {selectedAllDraft && <Button size="sm" onClick={() => batchStatus('published')}>批量发布</Button>}
          {selectedAllPublished && <><Button size="sm" variant="outline" onClick={batchRelearn}>批量重新学习</Button><Button size="sm" variant="outline" onClick={() => batchToggle(true)}>批量开启检索</Button><Button size="sm" variant="outline" onClick={() => batchToggle(false)}>批量关闭检索</Button><Button size="sm" variant="outline" onClick={batchPush}>批量开放导入</Button><Button size="sm" variant="outline" onClick={() => batchStatus('archived')}>批量下线</Button></>}
          {selectedAllArchived && <Button size="sm" variant="outline" onClick={() => batchStatus('draft')}>批量恢复为草稿</Button>}
          {(selectedAllDraft || selectedAllArchived) && <Button size="sm" variant="outline" className="text-red-500" onClick={batchDelete}>批量删除</Button>}
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
          {!selectedAllDraft && !selectedAllPublished && !selectedAllArchived && <span className="text-xs text-gray-500">不同状态仅保留共同可用操作</span>}
        </div>}
        <Table>
          <TableHeader><TableRow><TableHead className="w-10"><input type="checkbox" checked={filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id))} onChange={toggleSelectAll} /></TableHead><TableHead>知识资产</TableHead><TableHead>状态</TableHead><TableHead>知识板块</TableHead><TableHead>行业</TableHead><TableHead>知识库类型</TableHead><TableHead>一级分类</TableHead><TableHead>二级分类</TableHead><TableHead>内容形式</TableHead><TableHead>有效状态</TableHead><TableHead>时效</TableHead><TableHead>适用对象</TableHead><TableHead>标签</TableHead><TableHead>创建时间</TableHead><TableHead>更新时间</TableHead><TableHead>是否开启</TableHead><TableHead>体检结论</TableHead><TableHead>版本</TableHead><TableHead>企业推送</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((item) => {
            const healthLabel = item.status === 'draft' ? '未评估' : item.status === 'archived' ? '已失效' : (item.health ?? 85) >= 80 ? '健康' : '需优化';
            return <TableRow key={item.id} className={selectedIds.has(item.id) ? 'bg-blue-50' : ''}>
              <TableCell><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelected(item.id)} /></TableCell>
              <TableCell className="min-w-[220px]"><button className="text-left font-medium text-blue-600 hover:underline" onClick={() => setDetailItem(item)}>{item.title}</button><div className="mt-1 text-xs text-gray-400">{item.source} · {item.chunkCount} 个切片</div></TableCell>
              <TableCell><Badge className={STATUS_CONFIG[item.status].cls}>{STATUS_CONFIG[item.status].label}</Badge></TableCell>
              <TableCell><Badge className="bg-violet-50 text-violet-700">行业知识</Badge></TableCell>
              <TableCell className="min-w-[120px]"><div>{item.primaryIndustry}</div><div className="text-xs text-gray-400">{item.secondaryIndustry}</div></TableCell>
              <TableCell className="text-xs">行业知识库</TableCell><TableCell className="text-xs">{item.primaryCategory}</TableCell><TableCell className="text-xs">{item.secondaryCategory || '未指定'}</TableCell>
              <TableCell><Badge className="bg-blue-50 text-blue-600">{item.contentFormat}</Badge></TableCell><TableCell className="text-xs">{item.validityStatus || '现行有效'}</TableCell><TableCell className="text-xs">{item.timeliness || '静态'}</TableCell><TableCell className="text-xs">{item.audience || '企业内部'}</TableCell>
              <TableCell><div className="flex max-w-[160px] flex-wrap gap-1">{item.tags.map((tag) => <Badge key={tag} className="bg-gray-100 text-gray-600 font-normal">{tag}</Badge>)}</div></TableCell>
              <TableCell className="text-xs text-gray-400">{item.createdAt || item.updatedAt}</TableCell><TableCell className="text-xs text-gray-400">{item.updatedAt}</TableCell><TableCell><Switch checked={item.enabled ?? item.status === 'published'} disabled={item.status !== 'published'} onCheckedChange={(enabled) => toggleEnabled(item, enabled)} /></TableCell>
              <TableCell><Badge className={healthLabel === '健康' ? 'bg-green-50 text-green-700' : healthLabel === '未评估' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700'}>{healthLabel}</Badge></TableCell>
              <TableCell><button onClick={() => setVersionEditorItem(item)}><Badge className="bg-violet-50 text-violet-700">v{item.currentVersion}</Badge></button></TableCell><TableCell><Badge className={PUSH_CONFIG[item.pushStatus].cls}>{PUSH_CONFIG[item.pushStatus].label}</Badge><div className="mt-1 text-xs text-gray-400">{item.pushedTenants}/{item.matchedTenants} 家</div></TableCell>
              <TableCell><div className="flex justify-end gap-2">{item.status !== 'archived' && <button className="text-xs text-blue-600" onClick={() => openCreate(item)}>编辑</button>}<button className="text-xs text-violet-600" onClick={() => setVersionEditorItem(item)}>更新记录</button>{item.status === 'draft' && <button className="text-xs text-blue-600" onClick={() => transitionOne(item, 'published')}>发布</button>}{item.status === 'published' && <><button className="text-xs text-blue-600" onClick={() => { handleBatchRelearnPlatformIndustryKnowledge([item.id]); alert('已提交重新学习'); }}>重新学习</button><button className="text-xs text-green-600" onClick={() => openPush(item)}>开放导入</button><button className="text-xs text-red-500" onClick={() => archive(item)}>下线</button></>}{item.status === 'archived' && <><button className="text-xs text-blue-600" onClick={() => transitionOne(item, 'draft')}>恢复为草稿</button><button className="text-xs text-red-500" onClick={() => deleteOne(item)}>删除</button></>}</div></TableCell>
            </TableRow>;
          })}{filtered.length === 0 && <TableRow><TableCell colSpan={20} className="h-28 text-center text-gray-400">没有匹配的行业知识</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={commonEditOpen} onOpenChange={setCommonEditOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>编辑知识资产</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 space-y-1 text-sm"><span>知识名称 *</span><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="space-y-1 text-sm"><span>知识板块</span><Input value="行业知识" disabled /></label><label className="space-y-1 text-sm"><span>来源方式</span><Input value="平台" disabled /></label>
          <label className="space-y-1 text-sm"><span>一级行业 *</span><Select value={draft.primaryIndustry} onValueChange={(value) => setDraft({ ...draft, primaryIndustry: value, secondaryIndustry: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INDUSTRY_TREE.map((item) => <SelectItem key={item.primary} value={item.primary}>{item.primary}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>二级行业 *</span><Select value={draft.secondaryIndustry} onValueChange={(value) => setDraft({ ...draft, secondaryIndustry: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{secondaryIndustries.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>知识库类型</span><Input value="行业知识库" disabled /></label><label className="space-y-1 text-sm"><span>一级分类 *</span><Select value={draft.primaryCategory} onValueChange={(value) => setDraft({ ...draft, primaryCategory: value, secondaryCategory: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIMARY_CATEGORIES['行业知识库'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>二级分类</span><Select value={draft.secondaryCategory || 'unspecified'} onValueChange={(value) => setDraft({ ...draft, secondaryCategory: value === 'unspecified' ? '' : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unspecified">未指定</SelectItem>{secondaryCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>内容形式</span><Select value={draft.contentFormat} onValueChange={(value) => setDraft({ ...draft, contentFormat: value as ContentFormat })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTENT_FORMATS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>适用对象</span><Select value={draft.audience} onValueChange={(value) => setDraft({ ...draft, audience: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>有效状态</span><Select value={draft.validityStatus} onValueChange={(value) => setDraft({ ...draft, validityStatus: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VALIDITY_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>语言</span><Select value={draft.language} onValueChange={(value) => setDraft({ ...draft, language: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>时效</span><Select value={draft.timeliness} onValueChange={(value) => setDraft({ ...draft, timeliness: value as Timeliness })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMELINESS_OPTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span>是否开启</span><div className="h-9 flex items-center"><Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} /></div></label>
          <label className="space-y-1 text-sm"><span>所属分组</span><Input value={draft.folderId} onChange={(event) => setDraft({ ...draft, folderId: event.target.value })} placeholder="未指定" /></label><label className="space-y-1 text-sm"><span>来源</span><Input value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} /></label>
          <label className="col-span-2 space-y-1 text-sm"><span>适用门户网站</span><div className="flex min-h-9 items-center gap-4">{mockPortalSites.map((site) => <label key={site.id} className="flex items-center gap-1.5"><input type="checkbox" checked={draft.portalSites.includes(site.id)} onChange={() => setDraft({ ...draft, portalSites: draft.portalSites.includes(site.id) ? draft.portalSites.filter((id) => id !== site.id) : [...draft.portalSites, site.id] })} />{site.name}</label>)}</div></label>
          <label className="col-span-2 space-y-1 text-sm"><span>文档标签</span><Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} /></label><label className="col-span-2 space-y-1 text-sm"><span>知识摘要</span><Textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} rows={2} /></label><label className="col-span-2 space-y-1 text-sm"><span>备注</span><Textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={2} /></label><label className="col-span-2 space-y-1 text-sm"><span>来源引用</span><Input value={draft.sourceRef} onChange={(event) => setDraft({ ...draft, sourceRef: event.target.value })} /></label>
          {mockCustomSchemaFields.map((field) => <label key={field.field} className="space-y-1 text-sm"><span>{field.meaning || field.field}</span><Input value={draft.customFields[field.field] || ''} onChange={(event) => setDraft({ ...draft, customFields: { ...draft.customFields, [field.field]: event.target.value } })} /></label>)}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setCommonEditOpen(false)}>取消</Button><Button onClick={() => saveDraft(false)}>保存修改</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={batchEditOpen} onOpenChange={setBatchEditOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>批量修改知识目录与元数据</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('folderId')} onChange={() => toggleBatchEditField('folderId')} />知识目录</span><Input disabled={!batchEditFields.has('folderId')} value={batchEditDraft.folderId} onChange={(event) => setBatchEditDraft({ ...batchEditDraft, folderId: event.target.value })} placeholder="未指定" /></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('primaryCategory')} onChange={() => toggleBatchEditField('primaryCategory')} />一级分类</span><Select disabled={!batchEditFields.has('primaryCategory')} value={batchEditDraft.primaryCategory} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, primaryCategory: value, secondaryCategory: '' })}><SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger><SelectContent>{PRIMARY_CATEGORIES['行业知识库'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('secondaryCategory')} onChange={() => toggleBatchEditField('secondaryCategory')} />二级分类</span><Input disabled={!batchEditFields.has('secondaryCategory')} value={batchEditDraft.secondaryCategory} onChange={(event) => setBatchEditDraft({ ...batchEditDraft, secondaryCategory: event.target.value })} placeholder="未指定" /></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('contentFormat')} onChange={() => toggleBatchEditField('contentFormat')} />内容形式</span><Select disabled={!batchEditFields.has('contentFormat')} value={batchEditDraft.contentFormat} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, contentFormat: value as ContentFormat })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTENT_FORMATS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('validityStatus')} onChange={() => toggleBatchEditField('validityStatus')} />有效状态</span><Select disabled={!batchEditFields.has('validityStatus')} value={batchEditDraft.validityStatus} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, validityStatus: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VALIDITY_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('timeliness')} onChange={() => toggleBatchEditField('timeliness')} />时效</span><Select disabled={!batchEditFields.has('timeliness')} value={batchEditDraft.timeliness} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, timeliness: value as Timeliness })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIMELINESS_OPTS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('audience')} onChange={() => toggleBatchEditField('audience')} />适用对象</span><Select disabled={!batchEditFields.has('audience')} value={batchEditDraft.audience} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, audience: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('language')} onChange={() => toggleBatchEditField('language')} />语言</span><Select disabled={!batchEditFields.has('language')} value={batchEditDraft.language} onValueChange={(value) => setBatchEditDraft({ ...batchEditDraft, language: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LANGUAGE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label className="col-span-2 space-y-1 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={batchEditFields.has('tags')} onChange={() => toggleBatchEditField('tags')} />文档标签</span><Input disabled={!batchEditFields.has('tags')} value={batchEditDraft.tags} onChange={(event) => setBatchEditDraft({ ...batchEditDraft, tags: event.target.value })} placeholder="使用逗号分隔；保存后替换所选知识的标签" /></label>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setBatchEditOpen(false)}>取消</Button><Button disabled={batchEditFields.size === 0} onClick={applyBatchEdit}>保存修改</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!versionEditorItem} onOpenChange={(open) => { if (!open) { setVersionEditorItem(null); setVersionFile(''); setVersionSummary(''); } }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>版本维护 · {versionEditorItem?.title}</DialogTitle></DialogHeader>
        <div className="rounded border p-3">
          <div className="text-sm font-medium">发布新版本</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm"><span>版本文件 *</span><Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md" onChange={(event) => setVersionFile(event.target.files?.[0]?.name || '')} /></label>
            <label className="space-y-1 text-sm"><span>版本说明 *</span><Input value={versionSummary} onChange={(event) => setVersionSummary(event.target.value)} placeholder="说明本次更新内容" /></label>
          </div>
          <div className="mt-2 text-xs text-amber-600">发布后按行业知识板块配置重新处理；企业后续导入当前内容，已导入的企业独立知识不会被自动覆盖。</div>
          <Button className="mt-3" size="sm" disabled={!versionFile || !versionSummary.trim()} onClick={publishVersion}>发布 v{(versionEditorItem?.currentVersion || 0) + 1}</Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>版本</TableHead><TableHead>状态</TableHead><TableHead>变更说明</TableHead><TableHead>文件</TableHead><TableHead>发布时间</TableHead></TableRow></TableHeader>
          <TableBody>{mockIndustryKnowledgeVersionsData.filter((version) => version.knowledgeId === versionEditorItem?.id).map((version) => <TableRow key={version.id}><TableCell><Badge className="bg-violet-50 text-violet-700">v{version.version}</Badge></TableCell><TableCell>{version.status === 'current' ? '当前版本' : version.status === 'draft' ? '草稿' : '历史版本'}</TableCell><TableCell>{version.changeSummary}</TableCell><TableCell>{version.fileName}</TableCell><TableCell>{version.createdAt}<div className="text-xs text-gray-400">{version.createdBy}</div></TableCell></TableRow>)}</TableBody>
        </Table>
      </DialogContent>
    </Dialog>

    <Dialog open={!!pushItem} onOpenChange={(open) => !open && setPushItem(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>提供给企业导入 · {pushItem?.title}</DialogTitle></DialogHeader><div className="rounded bg-blue-50 p-3 text-sm text-blue-700">不限制企业版本。所选企业可以把当前内容导入自己的行业知识库，导入后形成独立知识。</div><div className="max-h-72 overflow-auto rounded border divide-y">{mockTenantPushTargetsData.map((tenant) => <label key={tenant.tenantId} className="flex items-center gap-3 p-3 text-sm hover:bg-blue-50"><input type="checkbox" checked={selectedTenants.has(tenant.tenantId)} onChange={() => setSelectedTenants((prev) => { const next = new Set(prev); next.has(tenant.tenantId) ? next.delete(tenant.tenantId) : next.add(tenant.tenantId); return next; })} /><div className="flex-1"><div className="font-medium">{tenant.tenantName}</div><div className="text-xs text-gray-400">{tenant.industry}</div></div><Badge className="bg-gray-100 text-gray-600">{tenant.currentVersion === null ? '未导入' : '已导入'}</Badge></label>)}</div><DialogFooter><Button variant="outline" onClick={() => setPushItem(null)}>取消</Button><Button disabled={selectedTenants.size === 0} onClick={pushKnowledge}>开放导入（{selectedTenants.size}）</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{detailItem?.title}</DialogTitle></DialogHeader>{detailItem && <div className="space-y-3 text-sm"><div className="flex gap-2"><Badge className="bg-violet-50 text-violet-700">v{detailItem.currentVersion}</Badge><Badge className={STATUS_CONFIG[detailItem.status].cls}>{STATUS_CONFIG[detailItem.status].label}</Badge></div><div className="grid grid-cols-2 gap-3 rounded bg-gray-50 p-3"><div><span className="text-gray-400">行业：</span>{detailItem.primaryIndustry} / {detailItem.secondaryIndustry}</div><div><span className="text-gray-400">分类：</span>{detailItem.primaryCategory} / {detailItem.secondaryCategory || '未指定'}</div><div><span className="text-gray-400">来源：</span>{detailItem.source}</div><div><span className="text-gray-400">切片：</span>{detailItem.chunkCount}</div></div><p className="leading-6 text-gray-600">{detailItem.summary}</p><div className="flex gap-2">{detailItem.tags.map((tag) => <Badge key={tag} className="bg-gray-100 text-gray-600">{tag}</Badge>)}</div></div>}</DialogContent></Dialog>
  </div>;
}
