import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middlewares/auth';
import { login, refreshAccessToken, logout } from '../services/auth';
import { prisma } from '../config/prisma';
import { success, error } from '../utils/response';
import { validateCaptchaToken } from './captcha';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  if (!validateCaptchaToken(parsed.data.captchaToken)) {
    return error(res, '验证码已过期，请重新验证', 400);
  }

  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });
    return success(res, result, '登录成功');
  } catch (e: any) {
    return error(res, e.message, 401);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) return error(res, '缺少 refresh token', 401);

  try {
    const result = await refreshAccessToken(refreshToken);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });
    return success(res, result);
  } catch (e: any) {
    return error(res, e.message, 401);
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  await logout(refreshToken);
  res.clearCookie('refreshToken');
  return success(res, null, '已登出');
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
  return success(res, full);
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().optional(),
});

router.put('/me', authenticate, async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const user = (req as AuthRequest).user;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });
  return success(res, updated);
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.put('/me/password', authenticate, async (req: Request, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const user = (req as AuthRequest).user;
  const full = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
  const bcrypt = require('bcrypt');
  const valid = await bcrypt.compare(parsed.data.oldPassword, full!.password);
  if (!valid) return error(res, '原密码错误', 400);

  const hash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  return success(res, null, '密码已修改');
});

export default router;
