import { useState, useEffect, useCallback } from 'react';
import { userApi, User } from '../services/userApi';
import { Post } from '../features/post/services/postApi';
import { getCachedUser, setCachedUser } from '../utils/asyncStorage';

export function useUser(userId: 'me' | string) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      if (userId === 'me') {
        const cached = await getCachedUser();
        if (cached) {
          console.log('[useUser] 從快取載入自己的資料:', cached.displayName);
          setUser(cached);
        }
        console.log('[useUser] 從 API 載入自己的資料...');
        const data = await userApi.getMe();
        console.log('[useUser] 取得自己資料成功:', data.displayName, 'role:', data.role);
        setUser(data);
        setCachedUser(data);
      } else {
        console.log(`[useUser] 從 API 載入使用者資料 id=${userId}`);
        const data = await userApi.getUserById(userId);
        console.log('[useUser] 取得使用者資料成功:', data.displayName);
        setUser(data);
      }
    } catch (err) {
      console.error(`[useUser] 載入使用者資料失敗 userId=${userId}:`, err);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    try {
      const id = userId === 'me' ? user?.id : userId;
      if (!id) return;
      console.log(`[useUser] 載入使用者貼文 id=${id}`);
      const result = await userApi.getUserPosts(id);
      console.log(`[useUser] 取得 ${result.items.length} 篇貼文`);
      setPosts(result.items);
    } catch (err) {
      console.error(`[useUser] 載入使用者貼文失敗:`, err);
    }
  }, [userId, user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  useEffect(() => {
    if (user?.id) fetchPosts();
  }, [user?.id, fetchPosts]);

  return { user, posts, loading, refetch: fetchUser, refetchPosts: fetchPosts };
}
