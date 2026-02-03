import type { Article, CreateArticleRequest } from '../types/article';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const articlesApi = {
  getAll: () => request<Article[]>('/articles'),
  getById: (id: string) => request<Article>(`/articles/${id}`),
  create: (data: CreateArticleRequest) =>
    request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/articles/${id}`, { method: 'DELETE' }),
  markAsRead: (id: string) =>
    request<void>(`/articles/${id}/read`, { method: 'PATCH' }),
  archive: (id: string) =>
    request<void>(`/articles/${id}/archive`, { method: 'PATCH' }),
  toggleFavorite: (id: string) =>
    request<void>(`/articles/${id}/favorite`, { method: 'PATCH' }),
};
