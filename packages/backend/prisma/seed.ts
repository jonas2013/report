import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const testPasswordHash = await bcrypt.hash('Test@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: '超级管理员', email: 'admin@example.com', password: passwordHash, role: 'ADMIN' },
  });

  const zhang = await prisma.user.upsert({
    where: { email: 'zhang@example.com' },
    update: {},
    create: { name: '张三', email: 'zhang@example.com', password: testPasswordHash, role: 'MEMBER' },
  });

  const li = await prisma.user.upsert({
    where: { email: 'li@example.com' },
    update: {},
    create: { name: '李四', email: 'li@example.com', password: testPasswordHash, role: 'MEMBER' },
  });

  const wang = await prisma.user.upsert({
    where: { email: 'wang@example.com' },
    update: {},
    create: { name: '王五', email: 'wang@example.com', password: testPasswordHash, role: 'MEMBER' },
  });

  const zhao = await prisma.user.upsert({
    where: { email: 'zhao@example.com' },
    update: {},
    create: { name: '赵六', email: 'zhao@example.com', password: testPasswordHash, role: 'MEMBER' },
  });

  // Create projects
  const ecommerce = await prisma.project.upsert({
    where: { id: 'ecommerce-rebuild' },
    update: {},
    create: {
      id: 'ecommerce-rebuild',
      name: '电商平台改版',
      description: '对现有电商平台进行全面改版升级',
      status: 'ACTIVE',
      ownerId: zhang.id,
    },
  });

  const dataPlatform = await prisma.project.upsert({
    where: { id: 'data-platform' },
    update: {},
    create: {
      id: 'data-platform',
      name: '数据中台建设',
      description: '构建企业级数据中台基础设施',
      status: 'ACTIVE',
      ownerId: li.id,
    },
  });

  const mobile = await prisma.project.upsert({
    where: { id: 'mobile-optimize' },
    update: {},
    create: {
      id: 'mobile-optimize',
      name: '移动端优化',
      description: '移动端性能优化与体验提升',
      status: 'ACTIVE',
      ownerId: zhang.id,
    },
  });

  // Add members
  const members = [
    { projectId: ecommerce.id, userId: zhang.id, role: 'OWNER' as const },
    { projectId: ecommerce.id, userId: wang.id, role: 'MEMBER' as const },
    { projectId: ecommerce.id, userId: zhao.id, role: 'MEMBER' as const },
    { projectId: dataPlatform.id, userId: li.id, role: 'OWNER' as const },
    { projectId: dataPlatform.id, userId: wang.id, role: 'MEMBER' as const },
    { projectId: mobile.id, userId: zhang.id, role: 'OWNER' as const },
    { projectId: mobile.id, userId: zhao.id, role: 'MEMBER' as const },
  ];

  for (const m of members) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
      update: {},
      create: m,
    });
  }

  // Generate daily reports for past 7 days
  const allMemberships = [
    { userId: zhang.id, projectId: ecommerce.id },
    { userId: wang.id, projectId: ecommerce.id },
    { userId: zhao.id, projectId: ecommerce.id },
    { userId: li.id, projectId: dataPlatform.id },
    { userId: wang.id, projectId: dataPlatform.id },
    { userId: zhang.id, projectId: mobile.id },
    { userId: zhao.id, projectId: mobile.id },
  ];

  const sampleContents = [
    '完成了用户模块的接口开发和单元测试',
    '修复了登录页面的样式问题，优化了响应式布局',
    '与产品经理对接需求，确认了下个迭代的功能范围',
    '完成了数据库索引优化，查询性能提升30%',
    '编写了自动化测试脚本，覆盖率提升至85%',
    '参与了代码审查，修复了3个潜在的内存泄漏问题',
    '完成了CI/CD流水线配置，部署效率提升50%',
  ];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setUTCHours(0, 0, 0, 0);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const m of allMemberships) {
      const content = sampleContents[Math.floor(Math.random() * sampleContents.length)];
      const hours = Math.round((4 + Math.random() * 5) * 2) / 2;

      await prisma.dailyReport.upsert({
        where: {
          projectId_userId_date: {
            projectId: m.projectId,
            userId: m.userId,
            date,
          },
        },
        update: {},
        create: {
          projectId: m.projectId,
          userId: m.userId,
          date,
          content: `<p>${content}</p>`,
          todayDone: content,
          tomorrowPlan: '继续推进开发任务',
          hours,
          progress: Math.min(100, Math.floor(Math.random() * 40) + dayOffset * 10),
          status: Math.random() > 0.15 ? 'SUBMITTED' : 'DRAFT',
          submittedAt: Math.random() > 0.15 ? new Date(date.getTime() + 8 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log('Users:');
  console.log('  admin@example.com / Admin@123 (ADMIN)');
  console.log('  zhang@example.com / Test@123 (MEMBER, leads 电商+移动端)');
  console.log('  li@example.com / Test@123 (MEMBER, leads 数据中台)');
  console.log('  wang@example.com / Test@123 (MEMBER)');
  console.log('  zhao@example.com / Test@123 (MEMBER)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
