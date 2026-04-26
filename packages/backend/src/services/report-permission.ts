import { prisma } from '../config/prisma';

export async function canAccessReport(
  userId: string,
  userRole: string,
  report: { userId: string; projectId: string }
): Promise<boolean> {
  if (userRole === 'ADMIN') return true;
  if (report.userId === userId) return true;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: report.projectId, userId } },
  });
  return membership?.role === 'OWNER';
}
