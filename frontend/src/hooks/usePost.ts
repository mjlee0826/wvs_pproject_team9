import { useState, useEffect, useCallback } from 'react';
import { postApi, PostDetail, Comment } from '../services/postApi';

export function usePost(postId: number) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    console.log(`[usePost] 載入貼文 id=${postId}`);
    try {
      const data = await postApi.getPost(postId);
      console.log(`[usePost] 貼文載入成功，留言數=${data.comments.length}`);
      setPost(data);
    } catch (err) {
      console.error(`[usePost] 載入貼文失敗 id=${postId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const addComment = useCallback(async (content: string) => {
    console.log(`[usePost] 新增留言 postId=${postId}`);
    const comment = await postApi.createComment(postId, content);
    console.log(`[usePost] 留言新增成功 id=${comment.id}`);
    setPost((prev) =>
      prev ? { ...prev, comments: [...prev.comments, comment] } : prev,
    );
    return comment;
  }, [postId]);

  const deleteComment = useCallback(async (commentId: number) => {
    console.log(`[usePost] 刪除留言 id=${commentId}`);
    await postApi.deleteComment(commentId);
    console.log(`[usePost] 留言刪除成功 id=${commentId}`);
    setPost((prev) =>
      prev
        ? { ...prev, comments: prev.comments.filter((c: Comment) => c.id !== commentId) }
        : prev,
    );
  }, []);

  return { post, loading, addComment, deleteComment, refresh: fetchPost };
}
