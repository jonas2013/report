import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth';
import { requireProjectAccess } from '../middlewares/project-auth';
import { prisma } from '../config/prisma';
import { success, error } from '../utils/response';

const router = Router();
router.use(authenticate);

// Global overview (admin only)
router.get('/overview', requireAdmin, async (req: Request, res: Response) => {
  const [projectCount, userCount, todayReports] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.dailyReport.count({
      where: {
        status: 'SUBMITTED',
        date: new Date(new Date().setUTCHours(0, 0, 0, 0)),
      },
    }),
  ]);

  // 7-day trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const trend = await prisma.dailyReport.groupBy({
    by: ['date'],
    where: { status: 'SUBMITTED', date: { gte: sevenDaysAgo } },
    _count: { id: true },
    orderBy: { date: 'asc' },
  });

  return success(res, { projectCount, userCount, todayReports, trend });
});

// Project activity
router.get('/projects/:id/activity', requireProjectAccess(), async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const activity = await prisma.dailyReport.groupBy({
    by: ['date'],
    where: { projectId: req.params.id, status: 'SUBMITTED', date: { gte: thirtyDaysAgo } },
    _count: { id: true },
    orderBy: { date: 'asc' },
  });

  return success(res, activity);
});

// Member stats for project
router.get('/projects/:id/members', requireProjectAccess('OWNER'), async (req: Request, res: Response) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const stats = await Promise.all(
    members.map(async (m) => {
      const [submitted, totalHours] = await Promise.all([
        prisma.dailyReport.count({
          where: { projectId: req.params.id, userId: m.userId, status: 'SUBMITTED', date: { gte: startOfMonth } },
        }),
        prisma.dailyReport.aggregate({
          where: { projectId: req.params.id, userId: m.userId, date: { gte: startOfMonth } },
          _sum: { hours: true },
        }),
      ]);

      const workingDays = Math.ceil((Date.now() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
      return {
        user: m.user,
        submittedDays: submitted,
        workingDays,
        submitRate: workingDays > 0 ? Math.round((submitted / workingDays) * 100) : 0,
        totalHours: totalHours._sum.hours || 0,
      };
    })
  );

  return success(res, stats);
});

export default router;
