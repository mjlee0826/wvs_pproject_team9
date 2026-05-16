import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/commentService';

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, postId } = req.body as { content: string; postId: number };
    console.log(`[Comment] createComment postId=${postId} sub=${req.user!.sub}`);
    const comment = await commentService.createComment({
      content,
      postId: Number(postId),
      authorId: req.user!.sub,
    });
    console.log(`[Comment] 留言建立成功 id=${comment.id}`);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body as { content: string };
    console.log(`[Comment] updateComment id=${id} sub=${req.user!.sub}`);
    const comment = await commentService.updateComment(id, req.user!.sub, content);
    console.log(`[Comment] 留言更新成功 id=${id}`);
    res.json(comment);
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Comment] deleteComment id=${id} sub=${req.user!.sub}`);
    await commentService.deleteComment(id, req.user!.sub);
    console.log(`[Comment] 留言刪除成功 id=${id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
