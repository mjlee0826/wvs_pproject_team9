import { apiClient } from '../utils/api';
import { Post } from './postApi';

export interface User {
  id: string;
  displayName: string;
  email?: string;
  avatar: string | null;
  role: string;
  coins: number;
  createdAt?: string;
  _count?: { posts: number };
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

export const userApi = {
  upsertMe: async (data: { displayName: string; email: string }) => {
    const { data: user } = await apiClient.post<User>('/users/me', data);
    return user;
  },

  getMe: async () => {
    const { data } = await apiClient.get<User>('/users/me');
    return data;
  },

  updateMe: async (formData: FormData) => {
    const { data } = await apiClient.patch<User>('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getUserById: async (id: string) => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  getUserPosts: async (id: string, cursor?: number, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', String(cursor));
    const { data } = await apiClient.get<PaginatedResult<Post>>(`/users/${id}/posts?${params}`);
    return data;
  },

  assignRole: async (role: 'student' | 'admin') => {
    const { data } = await apiClient.post<{ message: string; role: string }>(
      '/logto/users/role',
      { role },
    );
    return data;
  },
};
