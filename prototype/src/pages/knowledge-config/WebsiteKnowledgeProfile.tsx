import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProfileKnowledgeLinks from './ProfileKnowledgeLinks';
import ProfileSourceAction from './ProfileSourceAction';
import { resolveProfileEvidence } from './profileKnowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { mockPortalSites, getKnowledgeAsset, STATUS_LABEL } from './data';
import { mockWebsiteProfilesData as initialProfiles, PROFILE_GROUPS, regenerateFields, profileSupplementAssets, type ProfileField } from './websiteProfile';

// DataSlot: 当前账号有权访问的门户与各门户知识画像。
const mockProfilesData = initialProfiles;
const mockSitesData = mockPortalSites;
type Editor = { field: ProfileField; mode: 'source'; draft: string };

export default function WebsiteKnowledgeProfile() {
  const [params] = useSearchParams();
  const [profiles, setProfiles] = useState(mockProfilesData);
  const [siteId, setSiteId] = useState(mockSitesData.some(site => site.id === params.get('profileSite')) ? params.get('profileSite')! : mockSitesData[0].id);
  const [group, setGroup] = useState(PROFILE_GROUPS.includes(params.get('profileGroup') || '') ? params.get('profileGroup')! : PROFILE_GROUPS[0]);
  const [missingOnly, setMissingOnly] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { mockProfilesData.splice(0, mockProfilesData.length, ...profiles); }, [profiles]);
  const profile = profiles.find(item => item.siteId === siteId)!;
  const site = mockSitesData.find(item => item.id === siteId)!;
  const filled = profile.fields.filter(field => field.value).length;
  const fields = profile.fields.filter(field => field.group === group && (!missingOnly || !field.value));
  const supplementUrl = (field: ProfileField) => `/knowledge-config/catalog/new?${new URLSearchParams({ from: 'website-profile', profileSite: siteId, profileField: field.id, profileLabel: field.label, profileGroup: field.group, returnTo: `/knowledge-config?profileSite=${siteId}&profileGroup=${encodeURIComponent(field.group)}` })}`;


  // ACTION: 获取门户知识画像 [GET] /api/kb/website-profile
  function handleFetchProfile(id: string) {
    setSiteId(id); setEditor(null); setNotice(''); setMissingOnly(false);
  }
  // ACTION: 根据知识重新生成画像 [POST] /api/kb/website-profile/regenerate
  async function handleRegenerate(fieldId?: string) {
    if (busy) return;
    const targetSite = siteId;
    setBusy(true); setConfirmGenerate(false); setNotice('正在融合总结知识库内容…');
    await new Promise(resolve => setTimeout(resolve, 600));
    setProfiles(items => items.map(item => item.siteId === targetSite ? { ...item, fields: regenerateFields(item.fields.map(field => {
      if (fieldId && field.id !== fieldId) return field;
      const additions = (profileSupplementAssets[`${targetSite}:${field.id}`] || []).map(assetId => ({ assetId }))
        .map(ref => ({ ref, resolved: resolveProfileEvidence(ref, targetSite) })).filter(entry => entry.resolved?.eligible);
      // 原型仅对手工问答演示生成；文件解析和多来源融合由正式服务完成。
      const latest = additions[additions.length - 1];
      if (latest?.resolved) return { ...field, sourceValue: latest.resolved.excerpt, evidence: [latest.ref], manual: false };
      return { ...field, sourceValue: field.evidence.length > 0 && field.evidence.every(ref => resolveProfileEvidence(ref, targetSite)?.eligible) ? field.sourceValue : '' };
    }), fieldId), updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) } : item));
    setBusy(false); setNotice('已根据生效知识重新整理，缺少依据的字段仍为空。');
  }

  return <Card>
    <CardHeader className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><CardTitle className="text-base">网站知识画像</CardTitle><p className="mt-1 text-xs text-gray-500">融合总结本门户适用的知识库内容，形成企业知识画像。</p></div>
        <div className="flex flex-wrap gap-2">
          <Select value={siteId} onValueChange={handleFetchProfile} disabled={busy}><SelectTrigger className="w-32 h-8" aria-label="画像所属门户网站"><SelectValue /></SelectTrigger><SelectContent>{mockSitesData.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmGenerate(true)}>{busy ? '正在生成…' : '重新生成'}</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-gray-500">
        <span>{site.domain}</span><span>已整理 <strong className="text-gray-800">{filled}</strong> / {profile.fields.length} 项</span>
        <span>待补充 <strong className="text-amber-700">{profile.fields.length - filled}</strong> 项</span>
        <span>最近整理：{profile.updatedAt || '尚未生成'}</span>
      </div>
    </CardHeader>
    <CardContent>
      <div className="border rounded-lg overflow-hidden flex flex-col md:flex-row">
        <nav aria-label="画像信息分组" className="md:w-44 shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r p-2 flex md:flex-col flex-wrap gap-1">
          {PROFILE_GROUPS.map(name => {
            const members = profile.fields.filter(field => field.group === name);
            return <Button key={name} variant="ghost" size="sm" aria-pressed={group === name} className={`justify-between text-xs ${group === name ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`} onClick={() => setGroup(name)}>{name}<span className="ml-3 text-gray-500">{members.filter(field => field.value).length}/{members.length}</span></Button>;
          })}
        </nav>
        <div className="flex-1 min-w-0 p-4" aria-busy={busy}>
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-medium">{group}</h3><Button variant="ghost" size="sm" aria-pressed={missingOnly} className="text-xs h-7" onClick={() => setMissingOnly(!missingOnly)}>{missingOnly ? '显示全部字段' : '只看待补充'}</Button></div>
          {fields.length === 0 && <p className="py-10 text-sm text-gray-500 text-center">本组字段已完整，无待补充内容。</p>}
          <dl className="divide-y">{fields.map(field => <div key={field.id} className="py-4 space-y-2">
            <dt className="flex items-center gap-2 text-xs text-gray-500">{field.label}</dt>
            <dd className="text-sm text-gray-800 whitespace-pre-line leading-6">{field.value || <span className="text-gray-400">暂未从知识库中找到相关内容</span>}</dd>
            {(profileSupplementAssets[`${siteId}:${field.id}`] || []).map(id => {
              const asset = getKnowledgeAsset(id);
              if (!asset) return null;
              const returnTo = `/knowledge-config?profileSite=${siteId}&profileGroup=${encodeURIComponent(field.group)}`;
              return <dd key={id} className="text-xs text-gray-500">已补充：{asset.name} · {STATUS_LABEL[asset.status].label} · {asset.status === 'published' ? '可重新生成' : asset.status === 'learning' ? '等待学习完成' : '请先启用并完成学习'} <Link className="text-blue-600" to={`/knowledge-config/catalog?edit=${id}&returnTo=${encodeURIComponent(returnTo)}`}>查看知识 →</Link></dd>;
            })}
            <dd className="flex flex-wrap items-center justify-between gap-2">
              {field.evidence.length > 0 ? <Button variant="link" className="h-auto p-0 text-xs text-gray-500" onClick={() => setEditor({ field, mode: 'source', draft: '' })}>知识库依据 · {field.evidence.length} 条</Button> : <span className="text-xs text-gray-400">暂无知识库依据</span>}
              <div className="flex gap-3">
                <ProfileSourceAction siteId={siteId} sourceId={field.id} location={field.maintenancePath} />
                <Link className="text-xs text-blue-600 hover:underline" to={supplementUrl(field)}>新增资料</Link>
                <Button variant="link" className="h-auto p-0 text-xs" disabled={busy} onClick={() => handleRegenerate(field.id)}>重新生成</Button>
              </div>
            </dd>
          </div>)}</dl>
        </div>
      </div>
      {notice && <p role="status" className="text-xs text-gray-500 mt-3">{notice}</p>}
    </CardContent>
    <Dialog open={confirmGenerate} onOpenChange={setConfirmGenerate}><DialogContent><DialogHeader><DialogTitle>重新生成网站知识画像</DialogTitle><DialogDescription>根据{site.name}已学习的知识重新整理。仅使用已启用且学习完成的内容；不会自动启用草稿或同步尚未更新的来源。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmGenerate(false)}>取消</Button><Button onClick={() => handleRegenerate()}>开始生成</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!editor} onOpenChange={open => !open && setEditor(null)}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>知识库依据 · {editor?.field.label}</DialogTitle><DialogDescription>综合已入库的文本、问答及结构化记录生成。修改请进入原知识维护。</DialogDescription></DialogHeader>
      {editor && <ProfileKnowledgeLinks field={editor.field} siteId={siteId} />}
      <DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>关闭</Button>{editor && <Button asChild><Link to={supplementUrl(editor.field)}>补充知识</Link></Button>}</DialogFooter>
    </DialogContent></Dialog>
  </Card>;
}
