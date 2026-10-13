export type ConnectionBatchAction = 'detect' | 'sync' | 'autoOn' | 'autoOff' | 'frequency' | 'pause' | 'resume';
export const CONNECTION_ACTIONS: Record<ConnectionBatchAction, string> = {
  detect: '检测变化', sync: '立即同步', autoOn: '开启自动更新', autoOff: '关闭自动更新', frequency: '修改更新频率', pause: '关闭使用', resume: '恢复使用',
};
export function canRunConnectionAction(status: string, action: ConnectionBatchAction, detecting = false): boolean {
  if (detecting || status === 'syncing') return false;
  if (action === 'resume') return status === 'paused';
  return status !== 'paused';
}
