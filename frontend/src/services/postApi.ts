import { apiClient } from '../utils/api';

export interface Author {
  id: string;
  displayName: string;
  avatar: string | null;
  role: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  authorId: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  likes: { teacherId: string }[];
  _count?: { comments: number };
}

export interface Comment {
  id: number;
  content: string;
  authorId: string;
  author: { id: string; displayName: string; avatar: string | null };
  postId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetail extends Post {
  comments: Comment[];
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: number | null;
  hasNextPage: boolean;
}

export const postApi = {
  getPosts: async (cursor?: number, limit = 10) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set('cursor', String(cursor));
    const { data } = await apiClient.get<PaginatedResult<Post>>(`/posts?${params}`);
    return data;
  },

  getPost: async (id: number) => {
    const { data } = await apiClient.get<PostDetail>(`/posts/${id}`);
    return data;
  },

  createPost: async (formData: FormData) => {
    const { data } = await apiClient.post<Post>('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updatePost: async (id: number, body: { title?: string; content?: string; imageUrl?: string }) => {
    const { data } = await apiClient.patch<Post>(`/posts/${id}`, body);
    return data;
  },

  deletePost: async (id: number) => {
    await apiClient.delete(`/posts/${id}`);
  },

  createComment: async (postId: number, content: string) => {
    const { data } = await apiClient.post<Comment>('/comments', { postId, content });
    return data;
  },

  updateComment: async (id: number, content: string) => {
    const { data } = await apiClient.patch<Comment>(`/comments/${id}`, { content });
    return data;
  },

  deleteComment: async (id: number) => {
    await apiClient.delete(`/comments/${id}`);
  },

  likePost: async (id: number) => {
    await apiClient.post(`/posts/${id}/like`);
  },

  unlikePost: async (id: number) => {
    await apiClient.delete(`/posts/${id}/like`);
  },
};
