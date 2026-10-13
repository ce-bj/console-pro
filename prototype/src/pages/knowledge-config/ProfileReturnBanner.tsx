import { Link, useSearchParams } from 'react-router-dom';
import { mockPortalSites } from './data';

export default function ProfileReturnBanner() {
  const [params] = useSearchParams();
  const returnTo = params.get('returnTo');
  if (!returnTo?.startsWith('/knowledge-config?profileSite=')) return null;
  const site = mockPortalSites.find(item => item.id === params.get('profileSite'));
  const label = params.get('profileLabel');
  return <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-gray-500"><span>{site && label ? `${site.name} / ${label}` : '知识画像'}</span><Link to={returnTo} className="text-blue-600">返回画像</Link></div>;
}
