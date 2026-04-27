import { Router, Request, Response } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';
import { prisma } from '../config/prisma';
import { success, error, paginate } from '../utils/response';

const router = Router();
router.use(authenticate);

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h2', 'h3', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'p', 'br', 'div', 'span', 'blockquote'],
  allowedAttributes: { '*': ['class'] },
};

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const { page = '1', limit = '20', status } = req.query;
  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);

  const where: any = { deletedAt: null };
  if (status) where.status = status;

  if (user.role !== 'ADMIN') {
    where.OR = [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id: true, name: true, description: true, status: true, startDate: true, endDate: true, createdAt: true,
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, reports: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.project.count({ where }),
  ]);

  return paginate(res, projects, total, p, l);
});

router.post('/', async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const user = (req as AuthRequest).user;
  const description = parsed.data.description ? sanitizeHtml(parsed.data.description, SANITIZE_OPTIONS) : undefined;
  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
    include: { owner: { select: { id: true, name: true } }, members: true },
  });
  return success(res, project, '项目已创建', 201);
});

router.get('/:id', requireProjectAccess(), async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } }, orderBy: { joinedAt: 'asc' } },
    },
  });
  if (!project) return error(res, '项目不存在', 404);
  return success(res, project);
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

router.put('/:id', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const data: any = { ...parsed.data };
  if (parsed.data.description) data.description = sanitizeHtml(parsed.data.description, SANITIZE_OPTIONS);
  if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
  if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data,
    include: { owner: { select: { id: true, name: true } } },
  });
  return success(res, project);
});

router.delete('/:id', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
  return success(res, null, '项目已归档');
});

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'COMPLETED']) });

router.put('/:id/status', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
  });
  return success(res, project);
});

// Members
router.get('/:id/members', requireProjectAccess(), async (req: Request, res: Response) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  return success(res, members);
});

const addMemberSchema = z.object({ userId: z.string().min(1) });

router.post('/:id/members', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const exists = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: req.params.id, userId: parsed.data.userId } } });
  if (exists) return error(res, '用户已是项目成员', 409);

  const member = await prisma.projectMember.create({
    data: { projectId: req.params.id, userId: parsed.data.userId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return success(res, member, '成员已添加', 201);
});

const updateRoleSchema = z.object({ role: z.enum(['OWNER', 'MEMBER']) });

router.put('/:id/members/:userId/role', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const projectId = req.params.id;
  const targetUserId = req.params.userId;
  const newRole = parsed.data.role;

  await prisma.$transaction(async (tx) => {
    if (newRole === 'OWNER') {
      const currentOwner = await tx.projectMember.findFirst({
        where: { projectId, role: 'OWNER' },
      });
      if (currentOwner && currentOwner.userId !== targetUserId) {
        await tx.projectMember.update({
          where: { projectId_userId: { projectId, userId: currentOwner.userId } },
          data: { role: 'MEMBER' },
        });
      }
      await tx.project.update({ where: { id: projectId }, data: { ownerId: targetUserId } });
    }

    await tx.projectMember.update({
      where: { projectId_userId: { projectId, userId: targetUserId } },
      data: { role: newRole },
    });
  });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });
  return success(res, member);
});

router.delete('/:id/members/:userId', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  });
  return success(res, null, '成员已移除');
});

export default router;
