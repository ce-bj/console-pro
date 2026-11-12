import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProfileKnowledgeLinks from './ProfileKnowledgeLinks';
import ProfileSourceAction from './ProfileSourceAction';
import { resolveProfileEvidence } from './profileKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { mockPortalSites } from './data';
import { mockWebsiteProfilesData as initialProfiles, PROFILE_GROUPS, reconcileWebsiteProfiles, regenerateFields, buildProfilePromptContext, saveManualProfileField,
  addProfileGroup, editProfileGroup, removeProfileGroup, addProfileField, editProfileField, removeProfileField,
  profileFieldKind, profileFieldStatus, PROFILE_FIELD_KIND_DESC, PROFILE_STATUS_LABEL, mockProfileUpdateLogsData, isDirectField,
  resolveProfileConflict, applyProfileSuggestion,
  type ProfileField, type ProfileGenerationScope, type ProfileFieldKind } from './websiteProfile';

const KIND_CLS: Record<ProfileFieldKind, string> = { 直取: 'bg-sky-50 text-sky-700', 总结: 'bg-violet-50 text-violet-700', 手动: 'bg-amber-50 text-amber-700' };
type StatusFilter = 'all' | 'ready' | 'missing' | 'pending' | 'conflict' | 'error' | 'stale';
const STATUS_FILTER_LABEL: Record<StatusFilter, string> = { all: '全部状态', ready: '可用', missing: '资料不足', pending: '知识学习中', conflict: '来源冲突', error: '读取失败', stale: '可能过期' };
// DataSlot: 画像自动更新记录
const mockUpdateLogsData = mockProfileUpdateLogsData;

// DataSlot: 当前账号有权访问的门户与各门户知识画像。
const mockProfilesData = initialProfiles;
const profileTemplates = initialProfiles.map(profile => ({ ...profile, groups: profile.groups.map(group => ({ ...group })), fields: profile.fields.map(field => ({ ...field })) }));
const mockSitesData = mockPortalSites;
type Editor = { field: ProfileField; draft: string };
type ConfigEditor = { kind: 'group' | 'field'; id?: string; title: string; description: string };
type DeleteTarget = { kind: 'group' | 'field'; id: string; title: string };

export default function WebsiteKnowledgeProfile() {
  const [params] = useSearchParams();
  const [profiles, setProfiles] = useState(() => reconcileWebsiteProfiles(mockProfilesData, profileTemplates));
  const [siteId, setSiteId] = useState(mockSitesData.some(site => site.id === params.get('profileSite')) ? params.get('profileSite')! : mockSitesData[0].id);
  const [group, setGroup] = useState(() => mockProfilesData.find(item => item.siteId === siteId)?.groups.some(item => item.title === params.get('profileGroup')) ? params.get('profileGroup')! : PROFILE_GROUPS[0]);
  const [kindFilter, setKindFilter] = useState<'all' | ProfileFieldKind>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [logOpen, setLogOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [contentError, setContentError] = useState('');
  const [configEditor, setConfigEditor] = useState<ConfigEditor | null>(null);
  const [configError, setConfigError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<string | undefined>();
  const [generateScope, setGenerateScope] = useState<ProfileGenerationScope>('system');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    setProfiles(current => reconcileWebsiteProfiles(current, profileTemplates));
    setGroup(current => profiles.find(item => item.siteId === siteId)?.groups.some(item => item.title === current) ? current : ({ 品牌信息: '品牌', 荣誉与资质: '资质证书', 案例与客户: '真实客户案例', 联系与咨询: '联系方式与地址' }[current] || PROFILE_GROUPS[0]));
  }, [siteId]);
  useEffect(() => { mockProfilesData.splice(0, mockProfilesData.length, ...profiles); }, [profiles]);
  const profile = reconcileWebsiteProfiles(profiles, profileTemplates).find(item => item.siteId === siteId)!;
  const site = mockSitesData.find(item => item.id === siteId)!;
  const selectedGroup = profile.groups.find(item => item.title === group);
  const filled = profile.fields.filter(field => profileFieldStatus(field) === 'ready').length;
  const manualCount = profile.fields.filter(field => field.manual).length;
  const matchStatus = (field: ProfileField) => statusFilter === 'all' || (statusFilter === 'stale' ? !!field.stale : profileFieldStatus(field) === statusFilter);
  const matchKind = (field: ProfileField) => kindFilter === 'all' || profileFieldKind(field) === kindFilter;
  const fields = profile.fields.filter(field => field.group === group && matchKind(field) && matchStatus(field));
  const countStatus = (status: StatusFilter) => profile.fields.filter(field => status === 'stale' ? field.stale : profileFieldStatus(field) === status).length;
  const siteLogs = mockUpdateLogsData.filter(log => log.siteId === siteId);
  // ACTION: 解决来源冲突（采用所选候选值）[PATCH] /api/kb/website-profile/fields/{id}/conflict
  function handleResolveConflict(field: ProfileField, value: string) {
    setProfiles(current => current.map(item => item.siteId === siteId ? resolveProfileConflict(profile, field.id, value) : item));
    setNotice(`「${field.label}」已采用所选内容，冲突已解决。`);
  }
  // ACTION: 处理手动字段的建议更新（采纳 / 忽略）[PATCH] /api/kb/website-profile/fields/{id}/suggestion
  function handleSuggestion(field: ProfileField, accept: boolean) {
    setProfiles(current => current.map(item => item.siteId === siteId ? applyProfileSuggestion(profile, field.id, accept) : item));
    setNotice(accept ? `「${field.label}」已采纳建议更新，仍为手动维护。` : `已忽略「${field.label}」的建议更新，保留原内容。`);
  }
  // ACTION: 获取门户知识画像 [GET] /api/kb/website-profile
  function handleFetchProfile(id: string) {
    setSiteId(id); setEditor(null); setConfigEditor(null); setDeleteTarget(null); setNotice(''); setKindFilter('all'); setStatusFilter('all');
  }
  function openContentEditor(field: ProfileField) {
    setEditor({ field, draft: field.value }); setContentError('');
  }
  // ACTION: 手动保存画像内容 [PATCH] /api/kb/website-profile/fields/{id}/content
  function handleSaveProfileContent() {
    if (!editor) return;
    try {
      const next = saveManualProfileField(profile, editor.field.id, editor.draft);
      setProfiles(current => current.map(item => item.siteId === siteId ? next : item));
      setEditor(null); setNotice('内容已保存，标记为手动维护。');
    } catch (error) {
      setContentError(error instanceof Error ? error.message : '保存失败，请重试');
    }
  }
  function requestRegeneration(field?: ProfileField) {
    if (field && !field.manual) { void handleRegenerate(field.id); return; }
    setGenerateTarget(field?.id);
    setGenerateScope(field ? 'all' : 'system');
    setConfirmGenerate(true);
  }
  function openConfig(kind: ConfigEditor['kind'], id?: string) {
    const item = kind === 'group' ? profile.groups.find(group => group.id === id) : profile.fields.find(field => field.id === id);
    setConfigEditor({ kind, id, title: item ? ('title' in item ? item.title : item.label) : '', description: item?.description || '' });
    setConfigError('');
  }
  function saveConfig(operation: 'create' | 'edit') {
    if (!configEditor) return;
    const { kind, id, title, description } = configEditor;
    try {
      const next = kind === 'group'
        ? operation === 'create' ? addProfileGroup(profile, crypto.randomUUID(), title, description) : editProfileGroup(profile, id!, title, description)
        : operation === 'create' ? addProfileField(profile, crypto.randomUUID(), group, title, description) : editProfileField(profile, id!, title, description);
      setProfiles(current => current.map(item => item.siteId === siteId ? next : item));
      if (kind === 'group') setGroup(title.trim());
      setConfigEditor(null);
      setConfigError('');
      setNotice(`画像${kind === 'group' ? '分组' : '字段'}已${operation === 'create' ? '新增' : '更新'}。`);
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : '保存失败，请重试');
    }
  }
  // ACTION: 新增画像分组 [POST] /api/kb/website-profile/groups
  function handleCreateProfileGroup() {
    saveConfig('create');
  }
  // ACTION: 编辑画像分组 [PATCH] /api/kb/website-profile/groups/{id}
  function handleUpdateProfileGroup() {
    saveConfig('edit');
  }
  // ACTION: 删除画像分组 [DELETE] /api/kb/website-profile/groups/{id}
  function handleDeleteProfileGroup() {
    if (!deleteTarget) return;
    const next = removeProfileGroup(profile, deleteTarget.id);
    setProfiles(current => current.map(item => item.siteId === siteId ? next : item));
    setGroup(PROFILE_GROUPS[0]); setDeleteTarget(null); setNotice('自定义分组及组内字段已删除。');
  }
  // ACTION: 新增画像字段 [POST] /api/kb/website-profile/fields
  function handleCreateProfileField() {
    saveConfig('create');
  }
  // ACTION: 编辑画像字段 [PATCH] /api/kb/website-profile/fields/{id}
  function handleUpdateProfileField() {
    saveConfig('edit');
  }
  // ACTION: 删除画像字段 [DELETE] /api/kb/website-profile/fields/{id}
  function handleDeleteProfileField() {
    if (!deleteTarget) return;
    const next = removeProfileField(profile, deleteTarget.id);
    setProfiles(current => current.map(item => item.siteId === siteId ? next : item));
    setDeleteTarget(null); setNotice('自定义字段已删除。');
  }
  // ACTION: 根据知识重新生成画像 [POST] /api/kb/website-profile/regenerate
  async function handleRegenerate(fieldId?: string, scope: ProfileGenerationScope = 'system') {
    if (busy) return;
    const targetSite = siteId;
    const task = buildProfilePromptContext(profile, scope, fieldId);
    const targetIds = new Set(task.targetFieldIds);
    // ACTION: 直取字段通过后台接口重新同步 [POST] /api/kb/website-profile/sync
    const directIds = profile.fields.filter(field => isDirectField(field) && (!fieldId || field.id === fieldId)).map(field => field.id);
    if (targetIds.size === 0 && directIds.length === 0) { setConfirmGenerate(false); setNotice('没有需要重新生成的系统维护字段。'); return; }
    setBusy(true); setConfirmGenerate(false); setNotice(targetIds.size ? '正在融合总结知识库内容…' : '正在通过后台接口同步…');
    await new Promise(resolve => setTimeout(resolve, 600));
    setProfiles(items => reconcileWebsiteProfiles(items, profileTemplates).map(item => item.siteId === targetSite ? { ...item, fields: regenerateFields(item.fields.map(field => {
      if (!targetIds.has(field.id)) return field;
      // 原型复用可追溯示例结果，正式服务接收 task 中的动态标题、描述后取数生成。
      return { ...field, sourceValue: field.evidence.length > 0 && field.evidence.every(ref => resolveProfileEvidence(ref, targetSite)?.eligible) ? field.sourceValue : '' };
    }), fieldId, scope), updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : item));
    setBusy(false); setNotice(targetIds.size === 0 ? '已通过后台接口重新同步。' : scope === 'system' ? '系统维护内容已重新生成，直取字段已同步，手动内容已保留。' : '所选内容已重新生成，缺少依据的字段为空。');
  }

  return <Card>
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><CardTitle className="text-base">网站知识画像</CardTitle><p className="mt-1 text-xs text-gray-500">汇总本门户的后台信息与知识库内容，供本门户的智能体使用（只提供“可用”状态的内容）；支持手动维护。</p></div>
        <div className="flex flex-wrap gap-2">
          <Select value={siteId} onValueChange={handleFetchProfile} disabled={busy}><SelectTrigger className="w-32 h-8" aria-label="画像所属门户网站"><SelectValue /></SelectTrigger><SelectContent>{mockSitesData.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => requestRegeneration()}>{busy ? '正在生成…' : '全部重新生成'}</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-gray-500">
        <span>{site.domain}</span><span>可用 <strong className="text-gray-800">{filled}</strong> / {profile.fields.length} 项</span>
        <span>资料不足 <strong className="text-amber-700">{profile.fields.filter(field => profileFieldStatus(field) === 'missing').length}</strong> 项</span>
        <span>手动维护 <strong className="text-gray-800">{manualCount}</strong> 项</span>
        {countStatus('conflict') > 0 && <span>来源冲突 <strong className="text-red-600">{countStatus('conflict')}</strong> 项</span>}
        {countStatus('error') > 0 && <span>读取失败 <strong className="text-red-600">{countStatus('error')}</strong> 项</span>}
        {countStatus('stale') > 0 && <span>可能过期 <strong className="text-amber-700">{countStatus('stale')}</strong> 项</span>}
        <span>最近整理：{profile.updatedAt || '尚未生成'}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <span className="font-medium text-gray-800">自动更新</span>
        <span>直取字段随后台保存实时同步；作为依据的知识学习成功、停用或删除后，于每日 00:00 只更新受影响的字段；手动维护的字段不覆盖，只给出建议更新。</span>
        <span className="text-gray-500">最近一次：{siteLogs[0]?.time || '暂无'}</span>
        <Button variant="link" className="h-auto p-0 text-xs" onClick={() => setLogOpen(true)}>更新记录</Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg overflow-hidden flex flex-col md:flex-row">
        <nav aria-label="画像信息分组" className="md:w-60 shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r p-2 flex md:flex-col flex-wrap gap-1">
          {profile.groups.map(item => {
            const name = item.title;
            const members = profile.fields.filter(field => field.group === name);
            return <div key={item.id} className={`flex items-center rounded-md ${group === name ? 'bg-blue-50' : ''}`}>
              <Button variant="ghost" size="sm" aria-pressed={group === name} className={`flex-1 min-w-0 justify-between px-2 text-xs ${group === name ? 'text-blue-700' : 'text-gray-600'}`} onClick={() => setGroup(name)}><span className="truncate">{name}</span><span className="ml-2 flex shrink-0 items-center gap-1 text-gray-500">{members.some(field => ['conflict', 'error'].includes(profileFieldStatus(field)) || field.stale || field.suggestion) && <span className="h-1.5 w-1.5 rounded-full bg-red-500" title="有待处理的冲突、失败、过期或建议更新" />}{members.filter(field => profileFieldStatus(field) === 'ready').length}/{members.length}</span></Button>
              {item.custom && <div className="flex shrink-0 pr-1"><Button variant="ghost" size="sm" disabled={busy} className="h-7 px-1 text-xs" aria-label={`编辑分组${name}`} onClick={() => openConfig('group', item.id)}>编辑</Button><Button variant="ghost" size="sm" disabled={busy} className="h-7 px-1 text-xs text-red-600" aria-label={`删除分组${name}`} onClick={() => setDeleteTarget({ kind: 'group', id: item.id, title: name })}>删除</Button></div>}
            </div>;
          })}
          <Button variant="outline" size="sm" disabled={busy} className="mt-2 w-full text-xs" onClick={() => openConfig('group')}>+ 新增分组</Button>
        </nav>
        <div className="flex-1 min-w-0 p-4" aria-busy={busy}>
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2"><div><h3 className="text-sm font-medium">{group}</h3>{selectedGroup?.description && <p className="mt-1 text-xs text-gray-500">{selectedGroup.description}</p>}</div><div className="flex flex-wrap gap-1">
            <Select value={kindFilter} onValueChange={value => setKindFilter(value as 'all' | ProfileFieldKind)}><SelectTrigger className="h-7 w-28 text-xs" aria-label="按字段类型筛选"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">全部类型</SelectItem>{(['直取', '总结', '手动'] as ProfileFieldKind[]).map(kind => <SelectItem key={kind} value={kind}>{kind}</SelectItem>)}</SelectContent></Select>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilter)}><SelectTrigger className="h-7 w-28 text-xs" aria-label="按状态筛选"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(STATUS_FILTER_LABEL) as StatusFilter[]).map(key => <SelectItem key={key} value={key}>{STATUS_FILTER_LABEL[key]}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" disabled={busy} className="text-xs h-7" onClick={() => openConfig('field')}>+ 新增字段</Button>
          </div></div>
          {fields.length === 0 && <p className="py-10 text-sm text-gray-500 text-center">{profile.fields.some(field => field.group === group) ? '本组没有符合筛选条件的字段。' : '本组还没有画像字段，点击“新增字段”开始配置。'}</p>}
          <dl className="divide-y">{fields.map(field => {
            const kind = profileFieldKind(field);
            const status = profileFieldStatus(field);
            const direct = isDirectField(field);
            return <div key={field.id} className="py-4 space-y-2">
            <dt className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span className="flex flex-wrap items-center gap-2">{field.label}
                <span title={PROFILE_FIELD_KIND_DESC[kind]} className={`rounded px-1.5 py-0.5 ${KIND_CLS[kind]}`}>{kind}</span>
                {status !== 'ready' && <span className={`rounded px-1.5 py-0.5 ${PROFILE_STATUS_LABEL[status].cls}`}>{PROFILE_STATUS_LABEL[status].label}</span>}
                {field.stale && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">可能过期</span>}
                {field.suggestion && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">有建议更新</span>}
                {!field.manual && field.pendingRegeneration && <span className="text-amber-700">待重新生成</span>}
              </span>
              <span className="flex items-center gap-3">{field.updatedAt && <span className="text-gray-400">{kind === '直取' ? '同步于' : kind === '手动' ? '保存于' : '整理于'} {field.updatedAt}</span>}{field.custom && <><Button variant="link" disabled={busy} className="h-auto p-0 text-xs" onClick={() => openConfig('field', field.id)}>编辑字段</Button><Button variant="link" disabled={busy} className="h-auto p-0 text-xs text-red-600" onClick={() => setDeleteTarget({ kind: 'field', id: field.id, title: field.label })}>删除字段</Button></>}</span>
            </dt>
            {field.description && <dd className="text-xs text-gray-500">{field.description}</dd>}
            {status === 'conflict' && field.conflict ? <dd className="space-y-2 rounded border border-red-100 bg-red-50/40 p-3">
              <p className="text-xs text-red-700">多份知识对同一事实说法不一致，确认前不提供给智能体。请选择采用哪一个：</p>
              {field.conflict.map(option => <div key={option.source} className="flex items-start justify-between gap-3 rounded border bg-white p-2"><div><p className="text-sm text-gray-800">{option.value}</p><p className="mt-1 text-xs text-gray-500">{option.source}</p></div><Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" disabled={busy} onClick={() => handleResolveConflict(field, option.value)}>采用</Button></div>)}
            </dd> : <dd className="text-sm text-gray-800 whitespace-pre-line leading-6">{field.value || <span className="text-gray-400">{status === 'pending' ? '相关知识正在学习，学习成功后自动生成。' : status === 'error' ? `读取失败（${field.errorReason || '服务异常'}），不代表企业没有该信息，可重试。` : direct ? '后台未填写，请去后台编辑，保存后自动同步。' : '知识库中没有找到依据，可手动填写；相关知识学习成功后也会自动补全。'}</span>}</dd>}
            {status === 'error' && field.value && <dd className="text-xs text-red-600">最近一次读取失败（{field.errorReason || '服务异常'}），已保留原内容。</dd>}
            {field.stale && <dd className="text-xs text-amber-700">依据在整理后有变化，下一次自动更新（每日 00:00）会处理，也可立即重新生成。</dd>}
            {field.suggestion && <dd className="rounded border border-amber-200 bg-amber-50/50 p-3"><p className="text-xs text-amber-800">建议更新 · {field.suggestionSource}</p><p className="mt-1 text-sm text-gray-800">{field.suggestion}</p><div className="mt-2 flex gap-2"><Button size="sm" className="h-7 text-xs" disabled={busy} onClick={() => handleSuggestion(field, true)}>采纳</Button><Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy} onClick={() => handleSuggestion(field, false)}>忽略</Button></div></dd>}
            {direct && <dd className="text-xs text-gray-500">后台来源：{field.maintenancePath}（通过后台接口读取，画像中只读）</dd>}
            {!direct && !field.manual && field.value && field.evidence.length > 0 && status !== 'conflict' && <dd><details className="rounded border bg-gray-50 p-3"><summary className="cursor-pointer text-xs text-blue-600">知识库依据 · {field.evidence.length} 条</summary><div className="mt-3"><ProfileKnowledgeLinks field={field} siteId={siteId} /></div></details></dd>}
            <dd className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex gap-3">
                {/* 直取字段只读：在后台修改，画像只提供去后台编辑与重新同步 */}
                <ProfileSourceAction siteId={siteId} sourceId={field.id} location={field.maintenancePath} />
                {!direct && <Button variant="link" className="h-auto p-0 text-xs" disabled={busy} onClick={() => openContentEditor(field)}>{field.value ? '编辑内容' : '手动填写'}</Button>}
                <Button variant="link" className="h-auto p-0 text-xs" disabled={busy} onClick={() => requestRegeneration(field)}>{status === 'error' ? '重试' : direct ? '重新同步' : '重新生成'}</Button>
              </div>
            </dd>
          </div>; })}</dl>
        </div>
      </div>
      {notice && <p role="status" className="text-xs text-gray-500 mt-3">{notice}</p>}
    </CardContent>
    <Dialog open={confirmGenerate} onOpenChange={setConfirmGenerate}><DialogContent><DialogHeader><DialogTitle>{generateTarget ? `重新生成「${profile.fields.find(field => field.id === generateTarget)?.label}」` : '重新生成网站知识画像'}</DialogTitle><DialogDescription>{generateTarget ? '将覆盖该项手动内容并恢复系统维护；未找到依据时将留空。' : `选择${site.name}本次重新生成的范围。`}</DialogDescription></DialogHeader>
      {!generateTarget && <fieldset className="space-y-3"><legend className="sr-only">重新生成范围</legend>
        <label className={`flex items-start gap-3 rounded border p-3 cursor-pointer ${generateScope === 'system' ? 'border-blue-500 bg-blue-50' : ''}`}><input className="mt-1" type="radio" name="profile-generate-scope" value="system" checked={generateScope === 'system'} onChange={() => setGenerateScope('system')} /><span><span className="block text-sm font-medium">仅重新生成系统维护的内容（{profile.fields.length - manualCount} 项）</span><span className="mt-1 block text-xs text-gray-500">保留 {manualCount} 项手动内容，包含未手动填写的自定义字段。</span></span></label>
        <label className={`flex items-start gap-3 rounded border p-3 cursor-pointer ${generateScope === 'all' ? 'border-blue-500 bg-blue-50' : ''}`}><input className="mt-1" type="radio" name="profile-generate-scope" value="all" checked={generateScope === 'all'} onChange={() => setGenerateScope('all')} /><span><span className="block text-sm font-medium">全部重新生成（{profile.fields.length} 项）</span><span className="mt-1 block text-xs text-gray-500">覆盖手动内容，恢复系统维护；未找到依据的字段将留空。</span></span></label>
      </fieldset>}
      <DialogFooter><Button variant="outline" onClick={() => setConfirmGenerate(false)}>取消</Button><Button onClick={() => handleRegenerate(generateTarget, generateScope)}>确认重新生成</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={!!configEditor} onOpenChange={open => { if (!open) { setConfigEditor(null); setConfigError(''); } }}><DialogContent><DialogHeader><DialogTitle>{configEditor?.id ? '编辑' : '新增'}画像{configEditor?.kind === 'group' ? '分组' : '字段'}</DialogTitle><DialogDescription>{configEditor?.kind === 'field' ? `归属分组：${group}` : `适用于当前门户：${site.name}`}</DialogDescription></DialogHeader>
      {configEditor && <div className="space-y-4"><div className="space-y-1"><label htmlFor="profile-config-title" className="text-sm font-medium">标题 <span className="text-red-600">*</span></label><Input id="profile-config-title" value={configEditor.title} onChange={event => { setConfigEditor({ ...configEditor, title: event.target.value }); setConfigError(''); }} placeholder={configEditor.kind === 'group' ? '如：服务政策' : '如：质保范围'} required /></div><div className="space-y-1"><label htmlFor="profile-config-description" className="text-sm font-medium">描述 <span className="text-red-600">*</span></label><Textarea id="profile-config-description" value={configEditor.description} onChange={event => { setConfigEditor({ ...configEditor, description: event.target.value }); setConfigError(''); }} placeholder="说明希望从知识库总结哪些内容" required /></div>{configError && <p role="alert" className="text-sm text-red-600">{configError}</p>}</div>}
      <DialogFooter><Button variant="outline" onClick={() => setConfigEditor(null)}>取消</Button><Button onClick={configEditor?.kind === 'group' ? configEditor.id ? handleUpdateProfileGroup : handleCreateProfileGroup : configEditor?.id ? handleUpdateProfileField : handleCreateProfileField}>保存</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>删除{deleteTarget?.title}？</DialogTitle><DialogDescription>{deleteTarget?.kind === 'group' ? `将同时删除该分组下的 ${profile.fields.filter(field => field.group === deleteTarget.title).length} 个画像字段及其总结。` : '该字段的画像总结与知识依据展示将一并移除，原知识资产不会被删除。'}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button><Button variant="destructive" onClick={deleteTarget?.kind === 'group' ? handleDeleteProfileGroup : handleDeleteProfileField}>删除</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!editor} onOpenChange={open => !open && setEditor(null)}><DialogContent><DialogHeader><DialogTitle>{editor?.field.value ? '编辑' : '填写'} · {editor?.field.label}</DialogTitle><DialogDescription>{editor?.field.description}</DialogDescription></DialogHeader>
      {editor && <div className="space-y-2"><label htmlFor="profile-manual-content" className="text-sm font-medium">内容 <span className="text-red-600">*</span></label><Textarea id="profile-manual-content" rows={5} value={editor.draft} onChange={event => { setEditor({ ...editor, draft: event.target.value }); setContentError(''); }} placeholder="填写该项内容" required />{contentError && <p role="alert" className="text-sm text-red-600">{contentError}</p>}<p className="text-xs text-gray-500">保存后标记为手动维护。</p></div>}
      <DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>取消</Button><Button onClick={handleSaveProfileContent}>保存</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={logOpen} onOpenChange={setLogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>自动更新记录 · {site.name}</DialogTitle><DialogDescription>由后台保存、知识学习成功 / 停用 / 删除等事件触发，只更新受影响的字段。</DialogDescription></DialogHeader>
      <div className="max-h-96 space-y-2 overflow-auto">{siteLogs.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">暂无自动更新记录</p> : siteLogs.map((log, index) => <div key={index} className="rounded border p-3 text-sm"><div className="flex justify-between gap-3"><span className="font-medium text-gray-800">{log.trigger}</span><span className="shrink-0 text-xs text-gray-400">{log.time}</span></div><p className="mt-1 text-xs text-gray-600">{log.action}</p><p className="mt-1 text-xs text-gray-500">涉及字段：{log.fields.join('、')}</p></div>)}</div>
    </DialogContent></Dialog>
  </Card>;
}
