export const replacementFormats = (section: string) => section === 'structured' ? '.xls,.xlsx,.csv,.json,.jsonl' : section === 'faq' ? '.xlsx,.csv,.json,.jsonl' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png';
export function validateReplacement(section: string, file: { name: string; size: number }): string {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!replacementFormats(section).split(',').includes(extension)) return '文件格式不支持，请选择支持的格式。';
  if (file.size === 0) return '文件为空，请重新选择。';
  if (file.size > 100 * 1024 * 1024) return '文件不能超过 100 MB。';
  return '';
}
export function replacementStatus(status: string): 'draft' | 'archived' | 'learning' {
  return status === 'draft' || status === 'archived' ? status : 'learning';
}
