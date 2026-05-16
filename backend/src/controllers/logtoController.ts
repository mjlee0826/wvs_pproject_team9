import { Request, Response, NextFunction } from 'express';
import * as logtoService from '../services/logtoService';
import { ApiError } from '../utils/apiError';
import { prisma } from '../utils/prismaClient';

export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body as { role: 'student' | 'admin' };
    console.log(`[Logto] assignRole 請求 sub=${req.user!.sub} role=${role}`);

    if (!['student', 'admin'].includes(role)) {
      throw new ApiError('Invalid role', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) {
      console.warn(`[Logto] 找不到使用者，請先呼叫 POST /users/me sub=${req.user!.sub}`);
      throw new ApiError('User not found. Call POST /users/me first.', 404);
    }

    console.log(`[Logto] 找到使用者 email=${user.email}，開始指派角色`);
    await logtoService.assignRole(req.user!.sub, user.email, role);
    console.log(`[Logto] assignRole 完成 sub=${req.user!.sub} role=${role}`);
    res.json({ message: 'Role assigned successfully', role });
  } catch (err) {
    next(err);
  }
};
