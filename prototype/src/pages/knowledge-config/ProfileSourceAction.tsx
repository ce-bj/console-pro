import { Button } from '@/components/ui/button';

// DataSlot: 由网站/应用服务提供已授权的编辑入口；不能用前台公开URL冒充后台编辑地址。
const mockSourceEditorLinksData: Record<string, string> = {};

export default function ProfileSourceAction({ siteId, sourceId, location }: { siteId: string; sourceId: string; location: string }) {
  const href = mockSourceEditorLinksData[`${siteId}:${sourceId}`];
  return href ? <Button asChild size="sm" variant="outline" className="h-7 text-xs"><a href={href} target="_blank" rel="noreferrer">去后台补充 ↗</a></Button>
    : <span title={location}><Button disabled size="sm" variant="outline" className="h-7 text-xs">去后台补充 ↗</Button></span>;
}
