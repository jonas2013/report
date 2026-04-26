import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { error } from '../utils/response';

interface JwtPayload {
  userId: string;
}

export interface AuthRequest extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return error(res, '未登录', 401);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) return error(res, '账号不存在或已停用', 401);

    (req as AuthRequest).user = user;
    next();
  } catch {
    return error(res, 'Token 已过期，请重新登录', 401);
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthRequest).user;
  if (user.role !== 'ADMIN') return error(res, '需要管理员权限', 403);
  next();
};
