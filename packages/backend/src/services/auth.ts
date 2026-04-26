import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES } as any);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES } as any);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = signRefreshToken(userId);
  const decoded = jwt.decode(token) as any;
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt: new Date(decoded.exp * 1000) },
  });
  return token;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new Error('账号不存在或已停用');

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('密码错误');

  const accessToken = signAccessToken(user.id);
  const refreshToken = await createRefreshToken(user.id);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!record || record.expiresAt < new Date()) throw new Error('Refresh token 无效或已过期');

  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) throw new Error('用户不存在或已停用');

  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  const newAccessToken = signAccessToken(user.id);
  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
}
