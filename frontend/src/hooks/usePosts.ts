import { useState, useEffect, useCallback } from 'react';
import { postApi, Post } from '../services/postApi';
import { getCachedPosts, setCachedPosts } from '../utils/asyncStorage';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFirst = useCallback(async (fromCache = false) => {
    if (fromCache) {
      const cached = await getCachedPosts();
      if (cached) {
        console.log(`[usePosts] 從快取載入 ${cached.length} 篇貼文`);
        setPosts(cached);
      }
    }
    try {
      console.log('[usePosts] 從 API 載入第一頁貼文...');
      const result = await postApi.getPosts();
      console.log(`[usePosts] 取得 ${result.items.length} 篇貼文，hasNextPage=${result.hasNextPage}`);
      setPosts(result.items);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
      setCachedPosts(result.items);
    } catch (err) {
      console.error('[usePosts] 載入貼文失敗:', err);
    }
  }, []);

  useEffect(() => {
    console.log('[usePosts] 初始化，開始載入貼文');
    setLoading(true);
    fetchFirst(true).finally(() => setLoading(false));
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loading || nextCursor === null) return;
    console.log(`[usePosts] 載入更多貼文，cursor=${nextCursor}`);
    setLoading(true);
    try {
      const result = await postApi.getPosts(nextCursor);
      console.log(`[usePosts] 追加 ${result.items.length} 篇貼文`);
      setPosts((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.error('[usePosts] 載入更多失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [hasNextPage, loading, nextCursor]);

  const refresh = useCallback(async () => {
    console.log('[usePosts] 重新整理貼文列表');
    setRefreshing(true);
    setNextCursor(null);
    setHasNextPage(true);
    await fetchFirst(false);
    setRefreshing(false);
  }, [fetchFirst]);

  const silentRefresh = useCallback(async () => {
    await fetchFirst(false);
  }, [fetchFirst]);

  return { posts, loading, refreshing, hasNextPage, loadMore, refresh, silentRefresh };
}
