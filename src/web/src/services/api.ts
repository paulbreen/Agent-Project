import type { Article, CreateArticleRequest, Tag } from '../types/article';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

const BASE_URL = '/api';
const TOKEN_KEY = 'readwise_access_token';
const REFRESH_KEY = 'readwise_refresh_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

  // If 401, attempt token refresh
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getStoredToken()}`;
      response = await fetch(`${BASE_URL}${url}`, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data: AuthResponse = await response.json();
    storeTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? 'Registration failed');
    }
    const auth: AuthResponse = await response.json();
    storeTokens(auth.accessToken, auth.refreshToken);
    return auth;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.detail ?? 'Login failed');
    }
    const auth: AuthResponse = await response.json();
    storeTokens(auth.accessToken, auth.refreshToken);
    return auth;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    clearTokens();
  },
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const articlesApi = {
  getAll: (page = 1, pageSize = 20, status?: string, search?: string, tags?: string[]) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (tags && tags.length > 0) params.set('tags', tags.join(','));
    return request<PagedResult<Article>>(`/articles?${params}`);
  },
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
  setTags: (id: string, tags: string[]) =>
    request<Tag[]>(`/articles/${id}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    }),
  getTags: (id: string) =>
    request<Tag[]>(`/articles/${id}/tags`),
};

export const tagsApi = {
  getAll: () => request<Tag[]>('/tags'),
  delete: (id: string) => request<void>(`/tags/${id}`, { method: 'DELETE' }),
};
