import { Request, Response, NextFunction } from 'express';
import { JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose';
import { ApiError } from '../utils/apiError';
import { prisma } from '../utils/prismaClient';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; scope?: string };
    }
  }
}

const getJWKS = () =>
  createRemoteJWKSet(new URL(`${process.env.LOGTO_ENDPOINT}/oidc/jwks`));

let JWKS = getJWKS();

function parseBearerToken(header?: string) {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function verifyAccessToken(rawToken?: string, authHeader?: string): Promise<JWTPayload> {
  const token = rawToken ?? parseBearerToken(authHeader ?? undefined);
  if (!token) throw new ApiError('Unauthorized', 401);

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${process.env.LOGTO_ENDPOINT}/oidc`,
    audience: process.env.LOGTO_API_RESOURCE,
  });

  return payload;
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const payload = await verifyAccessToken(undefined, req.headers.authorization);
    req.user = {
      sub: payload.sub as string,
      scope: payload.scope as string | undefined,
    };
    console.log(`[Auth] 驗證成功 sub=${req.user.sub} path=${req.path}`);
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    console.error('[Auth] JWT 驗證失敗:', err instanceof Error ? err.message : err);
    next(new ApiError('Unauthorized', 401));
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const payload = await verifyAccessToken(undefined, authHeader);
    req.user = {
      sub: payload.sub as string,
      scope: payload.scope as string | undefined,
    };
  } catch {
    // Silently ignore — caller didn't require auth
  }
  next();
};

export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (user?.role !== 'admin') {
      console.warn(`[Auth] 權限不足，非 admin sub=${req.user!.sub}`);
      throw new ApiError('Forbidden', 403);
    }
    console.log(`[Auth] Admin 驗證通過 sub=${req.user!.sub}`);
    next();
  } catch (err) {
    next(err);
  }
};
