/** Kiểu dữ liệu dùng chung giữa trợ lý AI và màn hình fanpage (khớp với API copee-nest). */

export type AiActionKind = 'PUBLISH_POST' | 'DELETE_PAGE_POST' | 'GENERATE_IMAGE' | 'CREATE_VIDEO' | 'UPLOAD_PRODUCT';
export type AiActionStatus = 'PROPOSED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export const ACTION_KIND_LABEL: Record<AiActionKind, string> = {
  PUBLISH_POST: 'Đăng bài',
  DELETE_PAGE_POST: 'Xoá bài trên Page',
  GENERATE_IMAGE: 'Tạo ảnh bằng AI',
  CREATE_VIDEO: 'Tạo video',
  UPLOAD_PRODUCT: 'Đăng sản phẩm lên site',
};

export const ACTION_STATUS_LABEL: Record<AiActionStatus, string> = {
  PROPOSED: 'Chờ xác nhận',
  EXECUTING: 'Đang thực hiện',
  EXECUTED: 'Đã thực hiện',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã huỷ',
  EXPIRED: 'Đã hết hạn',
};

export interface ActionItem {
  label: string;
  before?: string;
  after?: string;
  ok?: boolean;
  error?: string;
}

export interface AiAction {
  id: string;
  kind: AiActionKind;
  status: AiActionStatus;
  source: 'CHAT' | 'MCP' | 'UI';
  summary: string;
  items: ActionItem[];
  warnings: string[];
  costPoints: number;
  error: string | null;
  expiresAt: string;
  executedAt: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls: { name: string; summary: string }[];
  actions: AiAction[];
  cost: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface FacebookPage {
  id: string;
  externalId: string;
  name: string;
  category: string | null;
  pictureUrl: string | null;
  canPublish: boolean;
}

export interface SocialConnection {
  id: string;
  displayName: string;
  status: string;
  scopes: string[];
  tokenExpiresAt: string | null;
  pageCount: number;
  lastError: string | null;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  source: 'UPLOAD' | 'AI_GENERATED' | 'PRODUCT';
  url: string;
  width: number;
  height: number;
  bytes: number;
  prompt: string | null;
  productId: string | null;
  createdAt: string;
}

export type ContentPostStatus = 'DRAFT' | 'PUBLISHING' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export const POST_STATUS_LABEL: Record<ContentPostStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHING: 'Đang đăng',
  SCHEDULED: 'Đã hẹn giờ',
  PUBLISHED: 'Đã đăng',
  FAILED: 'Đăng lỗi',
};

export interface ContentPost {
  id: string;
  pageId: string | null;
  pageName: string | null;
  productId: string | null;
  message: string;
  link: string | null;
  media: MediaAsset[];
  status: ContentPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  permalink: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagePost {
  id: string;
  message: string;
  createdAt: string;
  permalink: string | null;
  picture: string | null;
  imageCount: number;
  type: string;
  link: string | null;
  reactions: number;
  comments: number;
  shares: number;
  localPostId: string | null;
}

// ───────────── Video AI ─────────────

export type VideoKind = 'PRODUCT' | 'STORY';
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang dựng',
  DONE: 'Xong',
  FAILED: 'Lỗi',
};

export interface StoryScene {
  spoken: string;
  visual: string;
}

/** Kịch bản AI viết ở bước 1, người dùng sửa rồi mới bấm dựng video. */
export interface StoryScript {
  title: string;
  scenes: (StoryScene & { words: number })[];
  caption: string;
  spokenText: string;
  warnings: string[];
  cost: number;
}

export interface StoryOptions {
  styles: { value: string; label: string }[];
  settings: { value: string; label: string }[];
  maxWordsPerClip: number;
}

export interface VideoJob {
  id: string;
  kind: VideoKind;
  status: VideoStatus;
  title: string | null;
  caption: string | null;
  spokenText: string | null;
  clips: number;
  durationSec: number | null;
  cost: number;
  errorMessage: string | null;
  createdAt: string;
  product?: { title: string; sourceUrl: string } | null;
}

export interface VideoListResponse {
  items: VideoJob[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** File mp4 đi qua proxy BFF để giữ nguyên việc kiểm tra quyền ở backend. */
export function videoFileUrl(jobId: string): string {
  return `/api/proxy/video/${jobId}/file`;
}

export interface Product {
  id: string;
  title: string;
  status: string;
  price: number | null;
  images?: string[] | null;
}

/** Ảnh của thư viện đi qua proxy BFF giống mọi request khác. */
export function mediaUrl(asset: Pick<MediaAsset, 'url'>): string {
  return `/api/proxy${asset.url}`;
}

export function formatPoints(value: number): string {
  return `${value.toLocaleString('vi-VN')} điểm`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
