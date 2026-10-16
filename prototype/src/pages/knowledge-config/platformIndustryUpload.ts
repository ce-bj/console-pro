export const PLATFORM_UPLOAD_BOARDS = ['document', 'faq', 'structured'] as const;
export type PlatformUploadBoard = typeof PLATFORM_UPLOAD_BOARDS[number];

export const PLATFORM_UPLOAD_ACCEPT: Record<PlatformUploadBoard, string> = {
  document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png',
  faq: '.xlsx,.csv,.json,.jsonl',
  structured: '.xls,.xlsx,.csv,.json,.jsonl',
};
