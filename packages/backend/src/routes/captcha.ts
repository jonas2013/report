import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generatePuzzle, verifyCaptcha, validateCaptchaToken } from '../services/captcha';
import { success, error } from '../utils/response';

const router = Router();

const puzzleLimiter = new Map<string, { count: number; resetAt: number }>();

router.get('/puzzle', (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = puzzleLimiter.get(ip);
  if (entry && entry.resetAt > now) {
    if (entry.count >= 10) {
      return error(res, '请求过于频繁，请稍后再试', 429);
    }
    entry.count += 1;
  } else {
    puzzleLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
  }

  const puzzle = generatePuzzle();
  return success(res, puzzle);
});

const verifySchema = z.object({
  captchaId: z.string().min(1),
  x: z.number(),
});

router.post('/verify', (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return error(res, '参数校验失败', 422);

  const result = verifyCaptcha(parsed.data.captchaId, parsed.data.x);
  if (result.success) {
    return success(res, { token: result.token }, '验证成功');
  }
  return error(res, '验证失败，请重试', 400);
});

export { validateCaptchaToken };

export default router;
