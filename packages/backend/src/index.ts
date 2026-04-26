import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { error } from './utils/response';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import reportRoutes from './routes/reports';
import statsRoutes from './routes/stats';
import captchaRoutes from './routes/captcha';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Health check
app.get('/health', async (_req, res) => {
  let database: string;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database, version: '1.0.0' });
});

// Routes
app.use('/api/v1/captcha', captchaRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/stats', statsRoutes);

// 404 handler
app.use((_req, res) => {
  error(res, '接口不存在', 404);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[Error] ${err.message || err}`);
  if (err.code === 'P2025') return error(res, '记录不存在', 404);
  if (err.code === 'P2002') return error(res, '数据重复', 409);
  return error(res, '服务器内部错误', 500);
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

export default app;
