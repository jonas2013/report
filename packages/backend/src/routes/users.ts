import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth';
import { prisma } from '../config/prisma';
import { hashPassword } from '../services/auth';
import { success, error, paginate } from '../utils/response';

const router = Router();
router.use(authenticate, requireAdmin);

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

router.get('/', async (req: Request, res: Response) => {
  const { search = '', role, page = '1', limit = '20', status } = req.query;

  const where: any = {};
  if (search) where.OR = [{ name: { contains: search as string } }, { email: { contains: search as string } }];
  if (role) where.role = role;
  if (status === 'active') where.isActive = true;
  if (status === 'inactive') where.isActive = false;

  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLoginAt: true, createdAt: true,
        _count: { select: { projectMembers: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.user.count({ where }),
  ]);

  return paginate(res, users, total, p, l);
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return error(res, '邮箱已存在', 409);

  const hash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, password: hash, role: parsed.data.role },
    select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, createdAt: true },
  });
  return success(res, user, '用户已创建', 201);
});

router.get('/:id', async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
      projectMembers: { select: { project: { select: { id: true, name: true, status: true } }, role: true } },
    },
  });
  if (!user) return error(res, '用户不存在', 404);
  return success(res, user);
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  isActive: z.boolean().optional(),
});

router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  if (parsed.data.email) {
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists && exists.id !== req.params.id) return error(res, '邮箱已被占用', 409);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, avatar: true, isActive: true },
  });
  return success(res, user);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false, deletedAt: new Date() } });
  return success(res, null, '用户已停用');
});

router.put('/:id/reset-password', async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password || password.length < 6) return error(res, '密码至少6位', 422);

  const hash = await hashPassword(password);
  await prisma.user.update({ where: { id: req.params.id }, data: { password: hash } });
  return success(res, null, '密码已重置');
});

export default router;
