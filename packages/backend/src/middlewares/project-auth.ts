import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from './auth';
import { error } from '../utils/response';

export const requireProjectAccess = (requiredRole?: 'OWNER' | 'MEMBER') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const projectId = (req.params as any).id || (req.params as any).projectId;
    const userId = (req as AuthRequest).user.id;
    const userRole = (req as AuthRequest).user.role;

    if (userRole === 'ADMIN') return next();

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) return error(res, '无权访问该项目', 403);

    if (requiredRole === 'OWNER' && member.role !== 'OWNER') {
      return error(res, '仅项目负责人可操作', 403);
    }

    (req as any).projectMember = member;
    next();
  };
};
