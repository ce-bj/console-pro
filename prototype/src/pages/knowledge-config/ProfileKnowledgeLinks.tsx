import { Link } from 'react-router-dom';
import type { ProfileField } from './websiteProfile';
import { resolveProfileEvidence } from './profileKnowledge';
import ProfileSourceAction from './ProfileSourceAction';

export default function ProfileKnowledgeLinks({ field, siteId }: { field: ProfileField; siteId: string }) {
  const evidence = field.evidence.map(ref => resolveProfileEvidence(ref, siteId)).filter(item => item !== null);
  const returnTo = `/knowledge-config?profileSite=${siteId}&profileGroup=${encodeURIComponent(field.group)}`;
  const context = `returnTo=${encodeURIComponent(returnTo)}`;
  return <div className="space-y-4 text-sm">
    {evidence.length > 0 && <div className="space-y-3">
      {evidence.map(item => <div key={`${item.asset.id}:${item.location}`} className="border rounded p-3 space-y-2">
        <div className="flex justify-between gap-2"><Link className="font-medium text-blue-600" to={`/knowledge-config/catalog/${item.asset.id}?${context}`}>{item.asset.name} ↗</Link><span className={`text-xs shrink-0 ${item.eligible ? 'text-green-700' : 'text-amber-700'}`}>{item.status}</span></div>
        <p className="text-xs text-gray-500">{item.section} · {item.asset.connect} · {item.location}</p>
        <p className="text-xs leading-5 text-gray-700 whitespace-pre-line">{item.excerpt}</p>
        <p className="text-xs text-gray-500">入库来源：{item.asset.sourceRef} · 最近学习：{item.asset.lastSync || '—'}</p>
        <div className="flex gap-3 items-center">{(item.asset.connect === '前台页面' || item.asset.connect === '后台页面') && <ProfileSourceAction siteId={siteId} sourceId={item.asset.backendPageId || item.asset.frontendPageId || item.asset.id} location={field.maintenancePath} />}<Link className="inline-block text-xs text-blue-600" to={`/knowledge-config/sync?tab=updates&keyword=${encodeURIComponent(item.asset.name)}&${context}`}>{item.asset.connect === '上传文件' ? '更新文件' : '更新与学习'}</Link></div>
      </div>)}
    </div>}
  </div>;
}
