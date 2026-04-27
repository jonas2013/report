import { Router, Request, Response } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';
import { canAccessReport } from '../services/report-permission';
import { prisma } from '../config/prisma';
import { success, error, paginate } from '../utils/response';

const router = Router();
router.use(authenticate);

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['h2', 'h3', 'b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'code', 'pre', 'p', 'br', 'div', 'span', 'blockquote', 'input', 'task-list'],
  allowedAttributes: { input: ['type', 'checked'], '*': ['class'] },
};

const createReportSchema = z.object({
  date: z.string(),
  content: z.string().min(1),
  todayDone: z.string().optional(),
  tomorrowPlan: z.string().optional(),
  blockers: z.string().optional(),
  hours: z.number().min(0).max(24).optional(),
  progress: z.number().min(0).max(100).optional(),
});

function toUTCDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// My reports (cross-project)
router.get('/my', async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const { date, projectId, page = '1', limit = '20' } = req.query;
  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);

  const where: any = { userId: user.id };
  if (date) where.date = toUTCDate(date as string);
  if (projectId) where.projectId = projectId;

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: { project: { select: { id: true, name: true, status: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.dailyReport.count({ where }),
  ]);
  return paginate(res, reports, total, p, l);
});

// Today's report status for all my projects
router.get('/my/today', async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id, project: { status: 'ACTIVE', deletedAt: null } },
    include: { project: { select: { id: true, name: true } } },
  });

  const projects = await Promise.all(
    memberships.map(async (m) => {
      const report = await prisma.dailyReport.findUnique({
        where: { projectId_userId_date: { projectId: m.projectId, userId: user.id, date: todayUTC } },
        select: { id: true, status: true },
      });
      return { id: m.project.id, name: m.project.name, hasReport: !!report, status: report?.status || null };
    })
  );
  return success(res, { projects });
});

// Project reports
router.get('/:projectId', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const { projectId } = req.params;
  const { userId, startDate, endDate, status, page = '1', limit = '20' } = req.query;
  const p = parseInt(page as string, 10);
  const l = parseInt(limit as string, 10);

  const where: any = { projectId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as any).gte = toUTCDate(startDate as string);
    if (endDate) (where.date as any).lte = toUTCDate(endDate as string);
  }
  if (status) where.status = status;

  // Non-admin non-owner can only see own reports
  if (user.role !== 'ADMIN') {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (membership?.role !== 'OWNER' && !userId) {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }
  } else if (userId) {
    where.userId = userId as string;
  }

  const [reports, total] = await Promise.all([
    prisma.dailyReport.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: [{ date: 'desc' }, { user: { name: 'asc' } }],
      skip: (p - 1) * l,
      take: l,
    }),
    prisma.dailyReport.count({ where }),
  ]);
  return paginate(res, reports, total, p, l);
});

router.post('/:projectId', requireProjectAccess(), async (req: Request, res: Response) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const user = (req as AuthRequest).user;
  const { projectId } = req.params;
  const dateUTC = toUTCDate(parsed.data.date);

  const existing = await prisma.dailyReport.findUnique({
    where: { projectId_userId_date: { projectId, userId: user.id, date: dateUTC } },
  });
  if (existing) return error(res, '今日日报已存在', 409);

  const report = await prisma.dailyReport.create({
    data: {
      projectId,
      userId: user.id,
      date: dateUTC,
      content: sanitizeHtml(parsed.data.content, SANITIZE_OPTIONS),
      todayDone: parsed.data.todayDone ? sanitizeHtml(parsed.data.todayDone, SANITIZE_OPTIONS) : undefined,
      tomorrowPlan: parsed.data.tomorrowPlan ? sanitizeHtml(parsed.data.tomorrowPlan, SANITIZE_OPTIONS) : undefined,
      blockers: parsed.data.blockers ? sanitizeHtml(parsed.data.blockers, SANITIZE_OPTIONS) : undefined,
      hours: parsed.data.hours,
      progress: parsed.data.progress,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  return success(res, report, '日报已创建', 201);
});

router.get('/:projectId/:reportId', requireProjectAccess(), async (req: Request, res: Response) => {
  const report = await prisma.dailyReport.findUnique({
    where: { id: req.params.reportId },
    include: { user: { select: { id: true, name: true, avatar: true } }, project: { select: { id: true, name: true } } },
  });
  if (!report || report.projectId !== req.params.projectId) return error(res, '日报不存在', 404);

  const user = (req as AuthRequest).user;
  const canAccess = await canAccessReport(user.id, user.role, { userId: report.userId, projectId: report.projectId });
  if (!canAccess) return error(res, '无权查看该日报', 403);

  return success(res, report);
});

router.put('/:projectId/:reportId', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const report = await prisma.dailyReport.findUnique({ where: { id: req.params.reportId } });
  if (!report) return error(res, '日报不存在', 404);

  if (user.role !== 'ADMIN' && report.userId !== user.id) return error(res, '只能编辑自己的日报', 403);

  const parsed = createReportSchema.partial().safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const data: any = { ...parsed.data, version: { increment: 1 } };
  if (parsed.data.content) data.content = sanitizeHtml(parsed.data.content, SANITIZE_OPTIONS);
  if (parsed.data.date) data.date = toUTCDate(parsed.data.date);

  const updated = await prisma.dailyReport.update({
    where: { id: req.params.reportId },
    data,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  return success(res, updated);
});

router.delete('/:projectId/:reportId', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const report = await prisma.dailyReport.findUnique({ where: { id: req.params.reportId } });
  if (!report) return error(res, '日报不存在', 404);

  if (user.role !== 'ADMIN' && report.userId !== user.id) return error(res, '只能删除自己的日报', 403);

  await prisma.dailyReport.delete({ where: { id: req.params.reportId } });
  return success(res, null, '日报已删除');
});

router.put('/:projectId/:reportId/submit', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const report = await prisma.dailyReport.findUnique({ where: { id: req.params.reportId } });
  if (!report) return error(res, '日报不存在', 404);

  if (user.role !== 'ADMIN' && report.userId !== user.id) return error(res, '只能提交自己的日报', 403);
  if (report.status === 'SUBMITTED') return error(res, '日报已提交', 400);

  const updated = await prisma.dailyReport.update({
    where: { id: req.params.reportId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  });
  return success(res, updated, '日报已提交');
});

router.put('/:projectId/:reportId/recall', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const report = await prisma.dailyReport.findUnique({ where: { id: req.params.reportId } });
  if (!report) return error(res, '日报不存在', 404);

  if (user.role !== 'ADMIN' && report.userId !== user.id) return error(res, '只能撤回自己的日报', 403);
  if (report.status !== 'SUBMITTED') return error(res, '只能撤回已提交的日报', 400);

  // Only allow recall on same day
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (report.date.getTime() !== todayUTC.getTime()) return error(res, '只能撤回当天的日报', 400);

  const updated = await prisma.dailyReport.update({
    where: { id: req.params.reportId },
    data: { status: 'DRAFT', submittedAt: null },
  });
  return success(res, updated, '日报已撤回');
});

// Stats
router.get('/:projectId/stats', requireProjectAccess(), async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const { projectId } = req.params;

  const canViewAll = user.role === 'ADMIN' ||
    (await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } }))?.role === 'OWNER';

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const where: any = { projectId, date: { gte: thirtyDaysAgo } };
  if (!canViewAll) where.userId = user.id;

  const [totalReports, totalHours, members] = await Promise.all([
    prisma.dailyReport.count({ where: { ...where, status: 'SUBMITTED' } }),
    prisma.dailyReport.aggregate({ where, _sum: { hours: true } }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
  ]);

  // Per-member stats
  const memberStats = await Promise.all(
    members.map(async (m) => {
      const memberWhere = { ...where, userId: m.userId };
      const [count, hours] = await Promise.all([
        prisma.dailyReport.count({ where: { ...memberWhere, status: 'SUBMITTED' } }),
        prisma.dailyReport.aggregate({ where: memberWhere, _sum: { hours: true } }),
      ]);
      return { user: m.user, submittedCount: count, totalHours: hours._sum.hours || 0 };
    })
  );

  return success(res, {
    totalReports,
    totalHours: totalHours._sum.hours || 0,
    memberStats: canViewAll ? memberStats : memberStats.filter((s) => s.user.id === user.id),
  });
});

export default router;
