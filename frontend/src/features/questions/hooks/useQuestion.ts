import { useCallback, useEffect, useState } from 'react';
import { questionApi, Thread, Answer, Reply } from '../services/questionApi';

export function useQuestion(id?: number) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThread = useCallback(async () => {
    if (!id) return;
    try {
      console.log('[useQuestion] 載入討論 id=', id);
      const data = await questionApi.getThread(id);
      setThread(data);
      const a = await questionApi.getAnswers(id);
      setAnswers(a);
    } catch (err) {
      console.error('[useQuestion] 載入失敗:', err);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchThread().finally(() => setLoading(false));
  }, [fetchThread]);

  const addAnswer = useCallback(async (content: string) => {
    if (!id) return;
    console.log(`[useQuestion] 新增回答 threadId=${id}`);
    const answer = await questionApi.createAnswer(id, content);
    console.log(`[useQuestion] 回答新增成功 id=${answer.id}`);
    setAnswers((prev) => [...prev, answer]);
    setThread((prev) => prev ? { ...prev, _count: { answers: (prev._count?.answers ?? 0) + 1 } } : prev);
    return answer;
  }, [id]);

  const addReply = useCallback(async (answerId: number, content: string) => {
    if (!id) return;
    console.log(`[useQuestion] 新增回覆 answerId=${answerId}`);
    const reply = await questionApi.createReply(id, answerId, content);
    console.log(`[useQuestion] 回覆新增成功 id=${reply.id}`);
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.id === answerId
          ? { ...ans, comments: [...(ans.comments ?? []), reply] }
          : ans,
      ),
    );
    return reply;
  }, [id]);

  const toggleResolve = useCallback(async () => {
    if (!id || !thread) return;
    const next = !thread.resolved;
    console.log(`[useQuestion] 切換解決狀態 id=${id} resolved=${next}`);
    try {
      const updated = await questionApi.resolveThread(id, next);
      setThread(updated);
    } catch (err) {
      console.error('[useQuestion] 切換解決狀態失敗:', err);
    }
  }, [id, thread]);

  const toggleUpvote = useCallback(async (answerId: number) => {
    if (!id) return;
    const answer = answers.find((a) => a.id === answerId);
    if (!answer) return;
    const wasUpvoted = answer.hasUpvoted ?? false;

    // Optimistic update
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.id === answerId
          ? { ...ans, hasUpvoted: !wasUpvoted, _count: { upvotes: (ans._count?.upvotes ?? 0) + (wasUpvoted ? -1 : 1) } }
          : ans,
      ),
    );

    try {
      if (wasUpvoted) {
        await questionApi.unupvoteAnswer(id, answerId);
      } else {
        await questionApi.upvoteAnswer(id, answerId);
      }
    } catch (err) {
      console.error('[useQuestion] upvote 失敗:', err);
      // Revert on failure
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === answerId
            ? { ...ans, hasUpvoted: wasUpvoted, _count: { upvotes: (ans._count?.upvotes ?? 0) + (wasUpvoted ? 1 : -1) } }
            : ans,
        ),
      );
    }
  }, [id, answers]);

  return { thread, answers, loading, refetch: fetchThread, addAnswer, addReply, toggleResolve, toggleUpvote };
}
