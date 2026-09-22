// 对话质量运营 — 当前客户智能客服对话分析：每条对话是否命中知识、是否回复、用户是否满意
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  mockCallLogs, mockBlindSpots, CallLog, DateRangeKey, DATE_RANGE_OPTS, inDateRange,
} from './data';
import { SectionTag, KpiCard, PageHeader, DateRangeChips, HelpIcon } from './shared';

const CURRENT_CUSTOMER = { id: 'cust_001', name: '某科技公司' };

type QualityLogFetchParams = {
  dateRange: DateRangeKey;
  scene: string;
};

// ACTION: 获取当前客户智能客服对话质量记录 [GET] /api/kb/conversation-quality/logs
function handleFetchQualityLogs(params: QualityLogFetchParams) {
  console.log('fetch conversation quality logs', params);
}

// ACTION: 盲区转补录 [POST] /api/kb/from-blindspot
function fillBlindSpot(id: string, navigate: any) {
  // 跳转到知识资产目录，预置板块为"问答知识"，并带上问题内容
  navigate(`/knowledge-config/catalog?section=faq&fromBlindspot=${id}`);
}

// ACTION: 忽略盲区问题 [POST] /api/kb/blindspot/{id}/ignore
function ignoreBlindSpot(id: string) {
  alert(`已忽略问题「${id}」，不再提示补录`);
}

const SCENE_CLS: Record<string, string> = {
  在线客服: 'bg-blue-50 text-blue-600', 网站搜索: 'bg-emerald-50 text-emerald-600', 内容生成: 'bg-purple-50 text-purple-600',
};

export default function QualityPage() {
  const navigate = useNavigate();
  const [sceneFilter, setSceneFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState<DateRangeKey>('7d');
  const [docQuery, setDocQuery] = useState('');
  const [detail, setDetail] = useState<CallLog | null>(null);

  // 调用记录和未回答：默认近一周，可展开查看更多
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showAllBlindspots, setShowAllBlindspots] = useState(false);

  const rangeLabel = DATE_RANGE_OPTS.find((o) => o.key === dateRange)?.label ?? '';
  const customerLogs = mockCallLogs.filter((l) => l.customer_id === CURRENT_CUSTOMER.id);
  const rangedLogs = customerLogs.filter((l) => inDateRange(l.date, dateRange));
  const scopedLogs = rangedLogs.filter((l) => sceneFilter === 'all' || l.scene === sceneFilter);

  // 智能客服 Pro 对齐：新增 AI 质量指标计算
  const totalCalls = scopedLogs.length;
  const hitCalls = scopedLogs.filter((l) => l.hitBoard !== null).length;
  const recallRate = totalCalls === 0 ? 0 : Math.round((hitCalls / totalCalls) * 100); // 知识库召回率
  const repliedCalls = scopedLogs.filter((l) => l.is_replied).length;
  const replyRate = totalCalls === 0 ? 0 : Math.round((repliedCalls / totalCalls) * 100); // AI 回复率
  const accurateCalls = scopedLogs.filter((l) => l.hitBoard !== null && l.is_replied && l.feedback !== 'down' && !l.is_handoff).length;
  const ragAccuracy = hitCalls === 0 ? 0 : Math.round((accurateCalls / hitCalls) * 100); // RAG 准确率

  const upCount = scopedLogs.filter((l) => l.feedback === 'up').length;
  const downCount = scopedLogs.filter((l) => l.feedback === 'down').length;
  const satisfactionRate = upCount + downCount === 0 ? 0 : Math.round((upCount / (upCount + downCount)) * 100);
  const replyLoss = Math.max(0, recallRate - replyRate);
  const noReplyReasonCounts = scopedLogs.reduce<Record<string, number>>((acc, l) => {
    if (!l.is_replied && l.no_reply_reason) acc[l.no_reply_reason] = (acc[l.no_reply_reason] ?? 0) + 1;
    return acc;
  }, {});

  const logs = scopedLogs.filter((l) => docQuery === '' || l.hitDoc.toLowerCase().includes(docQuery.toLowerCase()));

  // 默认只显示近一周的数据
  const recentLogs = showAllLogs ? logs : logs.filter((l) => inDateRange(l.date, '7d'));

  // 覆盖盲区：当前客户后台只展示本客户受影响的问题聚类
  const scopedBlindspots = mockBlindSpots.filter((b) => b.customer_impacts.some((impact) => impact.customer_id === CURRENT_CUSTOMER.id));
  const sortedBlindspots = [...scopedBlindspots].sort((a, b) => b.priority - a.priority);
  const recentBlindspots = showAllBlindspots ? sortedBlindspots : sortedBlindspots.filter((b) => inDateRange(b.lastAsked, '7d'));

  function updateDateRange(nextRange: DateRangeKey) {
    setDateRange(nextRange);
    handleFetchQualityLogs({ dateRange: nextRange, scene: sceneFilter });
  }

  function updateSceneFilter(nextScene: string) {
    setSceneFilter(nextScene);
    handleFetchQualityLogs({ dateRange, scene: nextScene });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="对话质量运营"
        sub={`${CURRENT_CUSTOMER.name} · 仅展示本客户对话数据`}
        actions={<Button variant="outline" size="sm" onClick={() => navigate('/knowledge-config/catalog?check=1')}>知识健康体检</Button>}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">统计范围</span>
        <DateRangeChips value={dateRange} onChange={updateDateRange} />
      </div>

      {/* 指标 */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="对话轮次" value={totalCalls.toLocaleString()} sub={rangeLabel} cls="text-gray-900" tooltip="当前筛选范围内的智能客服用户提问轮次数。" />
        <KpiCard label="知识库召回率" value={`${recallRate}%`} sub={rangeLabel} cls="text-green-600" tooltip="命中知识的对话轮次 / 对话轮次 × 100%。" />
        <KpiCard label="AI 回复率" value={`${replyRate}%`} sub={rangeLabel} cls="text-blue-600" tooltip="已回复对话轮次 / 对话轮次 × 100%。" />
        <KpiCard label="RAG 准确率" value={`${ragAccuracy}%`} sub={rangeLabel} cls="text-purple-600" tooltip="命中且已回复、未点踩、未转人工的轮次 / 命中知识轮次 × 100%。" />
        <KpiCard label="满意度" value={`${satisfactionRate}%`} sub={`赞 ${upCount} · 踩 ${downCount}`} cls="text-amber-600" tooltip="点赞轮次 / (点赞轮次 + 点踩轮次) × 100%，无反馈不计入分母。" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm inline-flex items-center gap-1">
              回复率损耗归因
              <HelpIcon text="回复率损耗 = 知识库召回率 - AI 回复率；未回复记录按原因分组。" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
              <div>
                <div className="text-2xl font-bold text-orange-600">{replyLoss}pt</div>
                <div className="text-xs text-gray-400 mt-1">{recallRate}% / {replyRate}%</div>
              </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                ['knowledge_missing', '知识缺失'],
                ['low_recall', '召回低'],
                ['rule_blocked', '规则拦截'],
                ['model_refused', '模型拒答'],
                ['system_error', '系统异常'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between text-sm rounded border bg-gray-50 px-3 py-2">
                  <span className="text-gray-600">{label}</span>
                  <Badge className="text-xs bg-gray-100 text-gray-600">{noReplyReasonCounts[key] ?? 0} 次</Badge>
                </div>
              ))}
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 按场景统计 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">各场景对话质量</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {['在线客服', '网站搜索', '内容生成'].map((scene) => {
              const sceneLogs = rangedLogs.filter((l) => l.scene === scene);
              const sceneHits = sceneLogs.filter((l) => l.hitBoard !== null).length;
              const hitRate = sceneLogs.length === 0 ? 0 : Math.round((sceneHits / sceneLogs.length) * 100);
              return (
                <div key={scene} className="p-3 rounded-lg border bg-white">
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${SCENE_CLS[scene]}`}>{scene}</Badge>
                    <span className="text-xs text-gray-400">召回率 {hitRate}%</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-1.5">{sceneLogs.length.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">轮对话</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 调用记录 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">对话记录</CardTitle>
            {!showAllLogs && <span className="text-xs text-gray-400">（近一周）</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowAllLogs(!showAllLogs)}>
              {showAllLogs ? '仅显示近一周' : '查看更多'}
            </Button>
            <Input value={docQuery} onChange={(e) => setDocQuery(e.target.value)} placeholder="🔍 按命中知识名称搜索…" className="h-8 text-xs w-48" />
            <div className="flex gap-1">
              {['all', '在线客服', '网站搜索', '内容生成'].map((s) => (
                <button key={s} onClick={() => updateSceneFilter(s)} className={`px-2.5 py-1 rounded text-xs ${sceneFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === 'all' ? '全部' : s}</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead><TableHead>场景</TableHead><TableHead>用户问题</TableHead>
                <TableHead>命中知识</TableHead><TableHead>相似度</TableHead><TableHead>是否回复</TableHead><TableHead>未回复原因</TableHead><TableHead>转人工</TableHead><TableHead>反馈</TableHead><TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-sm text-gray-400 py-8">
                  {showAllLogs ? '当前范围内无匹配记录' : '近一周无匹配记录，点击右上角"查看更多"查看全部'}
                </TableCell></TableRow>
              )}
              {recentLogs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-gray-400">{l.date}</TableCell>
                  <TableCell><Badge className={`text-xs ${SCENE_CLS[l.scene]}`}>{l.scene}</Badge></TableCell>
                  <TableCell className="text-sm">{l.query}</TableCell>
                  <TableCell>
                    {l.hitBoard ? (
                      <div className="flex items-center gap-1.5"><SectionTag k={l.hitBoard} /><span className="text-xs text-gray-500 truncate max-w-[160px]">{l.hitDoc}</span></div>
                    ) : <Badge className="text-xs bg-red-50 text-red-500">未命中</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{l.score > 0 ? `${Math.round(l.score * 100)}%` : '—'}</TableCell>
                  <TableCell>
                    {l.is_replied ? (
                      <Badge className="text-xs bg-green-50 text-green-600">已回复</Badge>
                    ) : (
                      <Badge className="text-xs bg-red-50 text-red-500">未回复</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {l.no_reply_reason ? (
                      l.no_reply_reason === 'knowledge_missing' ? '知识缺失' :
                      l.no_reply_reason === 'low_recall' ? '召回低' :
                      l.no_reply_reason === 'rule_blocked' ? '规则拦截' :
                      l.no_reply_reason === 'model_refused' ? '模型拒答' : '系统异常'
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {l.is_handoff ? (
                      <Badge className="text-xs bg-amber-50 text-amber-600">已转人工</Badge>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>{l.feedback === 'up' ? '👍' : l.feedback === 'down' ? '👎' : <span className="text-gray-300">—</span>}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDetail(l)}>原始对话</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 覆盖盲区 */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              用户问了但答不上
              <Badge className="text-xs bg-orange-50 text-orange-600">{recentBlindspots.length} 类待补</Badge>
              <HelpIcon text="本客户待处理的问题聚类，按优先级展示，可直接补录或忽略。" />
            </CardTitle>
            {!showAllBlindspots && <span className="text-xs text-gray-400">（近一周）</span>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAllBlindspots(!showAllBlindspots)}>
            {showAllBlindspots ? '仅显示近一周' : '查看更多'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>优先级</TableHead><TableHead>用户在问什么</TableHead><TableHead>本客户出现次数</TableHead><TableHead>影响会话数</TableHead><TableHead>最近提问</TableHead><TableHead>建议补到哪个板块</TableHead><TableHead>处理状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {recentBlindspots.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-sm text-gray-400 py-8">
                  {showAllBlindspots ? '暂无未回答问题' : '近一周无未回答问题，点击右上角"查看更多"查看全部'}
                </TableCell></TableRow>
              )}
              {recentBlindspots.map((b) => (
                <TableRow key={b.id}>
                  {(() => {
                    const impact = b.customer_impacts.find((i) => i.customer_id === CURRENT_CUSTOMER.id);
                    return (
                      <>
                  <TableCell>
                    <Badge className={`text-xs ${b.priority >= 4 ? 'bg-red-50 text-red-600' : b.priority === 3 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                      P{b.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{b.cluster}</TableCell>
                  <TableCell><Badge className="text-xs bg-gray-100 text-gray-600">{impact?.occurrence_count ?? 0} 次</Badge></TableCell>
                  <TableCell><Badge className="text-xs bg-blue-50 text-blue-600">{impact?.session_count ?? 0} 个会话</Badge></TableCell>
                  <TableCell className="text-xs text-gray-400">{impact?.lastAsked ?? b.lastAsked}</TableCell>
                  <TableCell><SectionTag k={b.suggestBoard} /></TableCell>
                  <TableCell>
                    {b.handling_status === 'pending' ? (
                      <Badge className="text-xs bg-orange-50 text-orange-600">待处理</Badge>
                    ) : b.handling_status === 'recorded' ? (
                      <Badge className="text-xs bg-green-50 text-green-600">已补录</Badge>
                    ) : (
                      <Badge className="text-xs bg-gray-100 text-gray-600">已忽略</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" className="h-7 text-xs bg-blue-600" onClick={() => fillBlindSpot(b.id, navigate)} disabled={b.handling_status !== 'pending'}>补录</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => ignoreBlindSpot(b.id)} disabled={b.handling_status !== 'pending'}>忽略</Button>
                    </div>
                  </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 原始对话弹窗 */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>原始对话</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Badge className={`text-xs ${SCENE_CLS[detail.scene]}`}>{detail.scene}</Badge>
                <span>{detail.date}</span>
                <span>·</span>
                <span>{detail.tool}</span>
                {detail.feedback && <span>· 用户反馈 {detail.feedback === 'up' ? '👍 满意' : '👎 不满意'}</span>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-line">{detail.dialog}</div>
              <div className="text-xs text-gray-500">
                命中知识：{detail.hitBoard ? `${detail.hitDoc}（相似度 ${Math.round(detail.score * 100)}%）` : '未命中（已记入覆盖盲区）'}
              </div>
              {detail.hitBoard && (
                <Button size="sm" variant="outline" onClick={() => { setDetail(null); navigate('/knowledge-config/catalog'); }}>查看该知识</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
