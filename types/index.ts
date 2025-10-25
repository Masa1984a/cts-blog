import { PostStatus } from '@prisma/client';

export interface Post {
  id: string;
  content_ja: string;
  content_en: string | null;
  content_es: string | null;
  content_pt: string | null;
  content_ko: string | null;
  content_zh: string | null;
  content_tw: string | null;
  content_th: string | null;
  image_url: string | null;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  deleted_at: Date | null;
}

export interface PostCreateInput {
  content_ja: string;
  image_url?: string;
}

export interface PostUpdateInput {
  content_ja?: string;
  image_url?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export type LanguageCode = 'ja' | 'en' | 'es' | 'pt' | 'ko' | 'zh' | 'tw' | 'th';

export interface PostListResponse {
  posts: Array<{
    id: string;
    title: string;
    image_url: string | null;
    status: PostStatus;
    created_at: string;
    updated_at: string;
  }>;
  total: number;
}

export interface PostDetailResponse {
  id: string;
  content: string;
  image_url: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
}
