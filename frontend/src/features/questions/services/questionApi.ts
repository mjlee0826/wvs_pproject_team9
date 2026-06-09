import { apiClient } from '../../../utils/api';

export interface Author {
  id: string;
  displayName: string;
  avatar: string | null;
  role: string;
}

export interface Thread {
  id: number;
  subject: string;
  title: string;
  content: string;
  authorId: string;
  author: Author;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { answers: number };
}

export interface Answer {
  id: number;
  content: string;
  isOfficial: boolean;
  threadId: number;
  authorId: string;
  author: Author;
  createdAt: string;
  comments?: { id: number; content: string; author: Author; createdAt: string }[];
  _count?: { upvotes: number };
  hasUpvoted?: boolean;
}

export interface Reply {
  id: number;
  content: string;
  authorId: string;
  author: Author;
  answerId: number;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

export const questionApi = {
  getThreads: async (subject?: string, cursor?: number, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', String(cursor));
    if (subject && subject !== '全部') params.set('subject', subject);
    const { data } = await apiClient.get<PaginatedResult<Thread>>(`/questions?${params}`);
    return data;
  },

  getUserThreads: async (userId: string) => {
    const params = new URLSearchParams({ authorId: userId, limit: '50' });
    const { data } = await apiClient.get<PaginatedResult<Thread>>(`/questions?${params}`);
    return data;
  },

  getThread: async (id: number) => {
    const { data } = await apiClient.get<Thread>(`/questions/${id}`);
    return data;
  },

  getAnswers: async (threadId: number) => {
    const { data } = await apiClient.get<Answer[]>(`/questions/${threadId}/answers`);
    return data;
  },

  createThread: async (payload: { subject: string; title: string; content: string }) => {
    const { data } = await apiClient.post<Thread>('/questions', payload);
    return data;
  },

  resolveThread: async (id: number, resolved: boolean) => {
    const { data } = await apiClient.patch<Thread>(`/questions/${id}/resolve`, { resolved });
    return data;
  },

  createAnswer: async (threadId: number, content: string) => {
    const { data } = await apiClient.post<Answer>(`/questions/${threadId}/answers`, { content });
    return data;
  },

  createReply: async (threadId: number, answerId: number, content: string) => {
    const { data } = await apiClient.post<Reply>(
      `/questions/${threadId}/answers/${answerId}/replies`,
      { content },
    );
    return data;
  },

  upvoteAnswer: async (threadId: number, answerId: number) => {
    await apiClient.post(`/questions/${threadId}/answers/${answerId}/upvote`);
  },

  unupvoteAnswer: async (threadId: number, answerId: number) => {
    await apiClient.delete(`/questions/${threadId}/answers/${answerId}/upvote`);
  },
};