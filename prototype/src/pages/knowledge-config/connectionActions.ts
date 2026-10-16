export type ConnectionBatchAction = 'detect' | 'sync' | 'autoOn' | 'autoOff' | 'pause' | 'resume';
export const CONNECTION_ACTIONS: Record<ConnectionBatchAction, string> = {
  detect: '检测变化', sync: '同步新增', autoOn: '开启定时更新', autoOff: '关闭定时更新', pause: '关闭使用', resume: '恢复使用',
};
export function canRunConnectionAction(status: string, action: ConnectionBatchAction, detecting = false): boolean {
  if (detecting || status === 'syncing') return false;
  if (action === 'resume') return status === 'paused';
  return status !== 'paused';
}

export function canSyncNewBackendRecords(source: { kind: string; status: string; added: number }, detecting = false): boolean {
  return source.kind === '后台页面' && source.added > 0 && source.status !== 'failed' && canRunConnectionAction(source.status, 'sync', detecting);
}
