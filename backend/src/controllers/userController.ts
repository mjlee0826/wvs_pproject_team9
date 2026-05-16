import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export const upsertMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName, email } = req.body as { displayName: string; email: string };
    console.log(`[User] upsertMe sub=${req.user!.sub} email=${email} displayName=${displayName}`);
    const user = await userService.upsertMe({ id: req.user!.sub, displayName, email });
    console.log(`[User] upsertMe 完成 id=${user.id}`);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[User] getMe sub=${req.user!.sub}`);
    const user = await userService.getMe(req.user!.sub);
    if (!user) console.warn(`[User] getMe 找不到使用者 sub=${req.user!.sub}`);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { displayName } = req.body as { displayName?: string };
    const avatar = req.file ? `/uploads/${req.file.filename}` : undefined;
    console.log(`[User] updateMe sub=${req.user!.sub} displayName=${displayName} avatar=${avatar}`);
    const user = await userService.updateMe(req.user!.sub, { displayName, avatar });
    console.log(`[User] updateMe 完成`);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    console.log(`[User] getUserById id=${id}`);
    const user = await userService.getUserById(id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    console.log(`[User] getUserPosts id=${id} cursor=${cursor} limit=${limit}`);
    const result = await userService.getUserPosts(id, cursor, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
