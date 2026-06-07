import { Request, Response, NextFunction } from 'express';
import * as postService from './postService';

export const getPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    console.log(`[Post] getPosts cursor=${cursor} limit=${limit}`);
    const result = await postService.getPosts(cursor, limit);
    console.log(`[Post] 回傳 ${result.items.length} 篇貼文，hasNextPage=${result.hasNextPage}`);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Post] getPostById id=${id}`);
    const post = await postService.getPostById(id);
    console.log(`[Post] 取得貼文成功 id=${id} 留言數=${post?.comments?.length ?? 0}`);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body as { title: string; content: string };
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    console.log(`[Post] createPost sub=${req.user!.sub} title="${title}" 有圖片=${!!imageUrl}`);
    const post = await postService.createPost({ title, content, imageUrl, authorId: req.user!.sub });
    console.log(`[Post] 貼文建立成功 id=${post.id}`);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Post] updatePost id=${id} sub=${req.user!.sub}`);
    const post = await postService.updatePost(id, req.user!.sub, req.body);
    console.log(`[Post] 貼文更新成功 id=${id}`);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Post] deletePost id=${id} sub=${req.user!.sub}`);
    await postService.deletePost(id, req.user!.sub);
    console.log(`[Post] 貼文刪除成功 id=${id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const likePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Post] likePost id=${id} teacher=${req.user!.sub}`);
    await postService.likePost(id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const unlikePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    console.log(`[Post] unlikePost id=${id} teacher=${req.user!.sub}`);
    await postService.unlikePost(id, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};