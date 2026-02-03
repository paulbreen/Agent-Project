export interface Article {
  id: string;
  userId: string;
  url: string;
  title: string;
  author?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string;
  domain?: string;
  wordCount: number;
  estimatedReadingTimeMinutes: number;
  isContentParsed: boolean;
  isRead: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  savedAt: string;
  readAt?: string;
  archivedAt?: string;
}

export interface CreateArticleRequest {
  url: string;
  title?: string;
}
