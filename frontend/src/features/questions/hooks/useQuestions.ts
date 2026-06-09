import { useCallback, useEffect, useState } from 'react';
import { questionApi, Thread } from '../services/questionApi';

export function useQuestions(initialSubject?: string) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subject, setSubject] = useState<string | undefined>(initialSubject);

  const fetchFirst = useCallback(async () => {
    try {
      console.log('[useQuestions] 從 API 載入第一頁問題');
      const result = await questionApi.getThreads(subject);
      console.log(`[useQuestions] 取得 ${result.items.length} 筆討論，hasNextPage=${result.hasNextPage}`);
      setThreads(result.items);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.error('[useQuestions] 載入問題失敗:', err);
    }
  }, [subject]);

  useEffect(() => {
    setLoading(true);
    fetchFirst().finally(() => setLoading(false));
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (!hasNextPage || loading || nextCursor === null) return;
    console.log('[useQuestions] 載入更多問題 cursor=', nextCursor);
    setLoading(true);
    try {
      const result = await questionApi.getThreads(subject, nextCursor);
      setThreads((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasNextPage(result.hasNextPage);
    } catch (err) {
      console.error('[useQuestions] 載入更多失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [hasNextPage, loading, nextCursor, subject]);

  const refresh = useCallback(async () => {
    console.log('[useQuestions] 重新整理問題列表');
    setRefreshing(true);
    setNextCursor(null);
    setHasNextPage(true);
    await fetchFirst();
    setRefreshing(false);
  }, [fetchFirst]);

  const createThread = useCallback(async (payload: { subject: string; title: string; content: string }) => {
    const thread = await questionApi.createThread(payload);
    setThreads((prev) => [thread, ...prev]);
    return thread;
  }, []);

  return { threads, loading, refreshing, hasNextPage, loadMore, refresh, subject, setSubject, createThread };
}
