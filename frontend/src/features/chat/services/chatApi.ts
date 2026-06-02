import { apiClient } from '../../../utils/api';

export interface MessageAuthor {
  id: string;
  displayName: string;
  avatar: string | null;
  role: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  roomId: number;
  authorId: string;
  author: MessageAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
  messages: ChatMessage[];
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

export const chatApi = {
  getRooms: async () => {
    const { data } = await apiClient.get<ChatRoom[]>('/chat/rooms');
    return data;
  },

  getMessages: async (roomId: number, cursor?: number, limit = 30) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', String(cursor));
    const { data } = await apiClient.get<PaginatedResult<ChatMessage>>(
      `/chat/rooms/${roomId}/messages?${params}`,
    );
    return data;
  },

  sendMessage: async (roomId: number, content: string) => {
    const { data } = await apiClient.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, { content });
    return data;
  },
};