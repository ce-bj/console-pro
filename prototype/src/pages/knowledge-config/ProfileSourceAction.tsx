import { Button } from '@/components/ui/button';

// DataSlot: 由网站/应用服务提供已授权的编辑入口；不能用前台公开URL冒充后台编辑地址。
const mockSourceEditorLinksData: Record<string, string> = {};

export default function ProfileSourceAction({ siteId, sourceId, location }: { siteId: string; sourceId: string; location: string }) {
  if (!location) return null;
  const href = mockSourceEditorLinksData[`${siteId}:${sourceId}`];
  // 原型尚未接入客户后台路由，只演示跳转目标；上线后使用已授权的编辑地址。
  return href
    ? <Button asChild size="sm" variant="outline" className="h-7 text-xs"><a href={href} title={location} target="_blank" rel="noreferrer">去后台编辑 ↗</a></Button>
    : <Button size="sm" variant="outline" className="h-7 text-xs" title={location} onClick={() => window.alert(`跳转示意：${location}\n当前原型未连接实际后台。`)}>去后台编辑 ↗</Button>;
}
