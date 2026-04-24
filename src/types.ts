export interface UploadResult {
  name: string;
  duration: string;
  url: string;
}

export interface FileItem {
  originalName: string;
  size: number;
  type: string;
  result: UploadResult;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  files?: FileItem[];
  // Legacy fields for backward compatibility
  originalName?: string;
  size?: number;
  type?: string;
  result?: UploadResult;
}

export interface ShortLinkItem {
  id: string;
  originalUrl: string;
  shortUrl: string;
  code: string;
  timestamp: number;
}
