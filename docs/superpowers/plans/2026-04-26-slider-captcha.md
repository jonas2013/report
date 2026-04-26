# Slider Captcha Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-built puzzle slider captcha to the login page, requiring users to drag a puzzle piece into position before they can log in.

**Architecture:** Backend generates a random background image with a puzzle piece cutout using `canvas` (node-canvas). The correct x-position is stored in an in-memory Map. Frontend renders the puzzle and lets the user drag to match. On verify, backend issues a short-lived JWT captchaToken that the login endpoint validates.

**Tech Stack:** `canvas` (node-canvas) for image generation, JWT for captchaToken, React drag events for slider.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/backend/src/routes/captcha.ts` | Captcha puzzle + verify endpoints |
| Create | `packages/backend/src/services/captcha.ts` | Image generation, puzzle logic, store |
| Modify | `packages/backend/src/index.ts` | Register captcha routes |
| Modify | `packages/backend/src/routes/auth.ts` | Require captchaToken on login |
| Modify | `packages/backend/src/config/env.ts` | Add CAPTCHA_SECRET |
| Modify | `packages/backend/package.json` | Add canvas dependency |
| Modify | `packages/backend/Dockerfile` | Add canvas native deps |
| Create | `packages/frontend/src/components/Common/SliderCaptcha.tsx` | Slider captcha UI component |
| Modify | `packages/frontend/src/pages/auth/LoginPage.tsx` | Integrate captcha into login flow |
| Modify | `packages/frontend/src/index.css` | Slider captcha animations |

---

### Task 1: Backend captcha service — image generation and store

**Files:**
- Create: `packages/backend/src/services/captcha.ts`
- Modify: `packages/backend/src/config/env.ts`
- Modify: `packages/backend/package.json`

- [ ] **Step 1: Install canvas dependency**

Run from repo root:
```bash
cd packages/backend && pnpm add canvas && pnpm add -D @types/canvas
```

- [ ] **Step 2: Add CAPTCHA_SECRET to env config**

In `packages/backend/src/config/env.ts`, add `CAPTCHA_SECRET`:
```typescript
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '2h',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  CAPTCHA_SECRET: process.env.CAPTCHA_SECRET || 'dev-captcha-secret',
};
```

- [ ] **Step 3: Create the captcha service**

Create `packages/backend/src/services/captcha.ts`:
```typescript
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

interface CaptchaEntry {
  correctX: number;
  fails: number;
  expiresAt: number;
}

const store = new Map<string, CaptchaEntry>();
const WIDTH = 300;
const HEIGHT = 150;
const PIECE_SIZE = 44;
const PROTRUSION = 8;
const TOLERANCE = 5;
const MAX_FAILS = 5;
const TTL_MS = 5 * 60 * 1000;

// Cleanup expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt < now) store.delete(id);
  }
}, 60_000).unref();

function randomColor(): string {
  const r = Math.floor(Math.random() * 100 + 80);
  const g = Math.floor(Math.random() * 100 + 80);
  const b = Math.floor(Math.random() * 100 + 80);
  return `rgb(${r},${g},${b})`;
}

function drawPuzzlePath(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const s = PIECE_SIZE;
  const p = PROTRUSION;
  ctx.beginPath();
  ctx.moveTo(x, y);
  // Top edge with circle protrusion
  ctx.lineTo(x + s / 3, y);
  ctx.arc(x + s / 2, y, p, Math.PI, 0, false);
  ctx.lineTo(x + s, y);
  // Right edge with circle protrusion
  ctx.lineTo(x + s, y + s / 3);
  ctx.arc(x + s, y + s / 2, p, Math.PI * 1.5, Math.PI * 0.5, false);
  ctx.lineTo(x + s, y + s);
  // Bottom edge
  ctx.lineTo(x, y + s);
  // Left edge
  ctx.closePath();
  ctx.clip();
}

function drawPuzzleBorder(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const s = PIECE_SIZE;
  const p = PROTRUSION;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + s / 3, y);
  ctx.arc(x + s / 2, y, p, Math.PI, 0, false);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + s, y + s / 3);
  ctx.arc(x + s, y + s / 2, p, Math.PI * 1.5, Math.PI * 0.5, false);
  ctx.lineTo(x + s, y + s);
  ctx.lineTo(x, y + s);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function generatePuzzle() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const colors = [randomColor(), randomColor()];
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Random shapes for texture
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = randomColor();
    ctx.globalAlpha = 0.3;
    const sx = Math.random() * WIDTH;
    const sy = Math.random() * HEIGHT;
    const size = Math.random() * 40 + 10;
    if (Math.random() > 0.5) {
      ctx.fillRect(sx, sy, size, size);
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Puzzle piece position (leave margin for protrusion)
  const pieceX = Math.floor(Math.random() * (WIDTH - PIECE_SIZE - PROTRUSION * 2 - 40)) + PROTRUSION + 20;
  const pieceY = Math.floor(Math.random() * (HEIGHT - PIECE_SIZE - PROTRUSION * 2 - 20)) + PROTRUSION + 10;

  // Draw cutout shadow on background
  ctx.save();
  drawPuzzlePath(ctx, pieceX, pieceY);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();

  // Draw puzzle border on background
  drawPuzzleBorder(ctx, pieceX, pieceY);

  // Create slider piece image
  const sliderCanvas = createCanvas(PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2);
  const sliderCtx = sliderCanvas.getContext('2d');

  // Draw original background portion onto slider
  sliderCtx.save();
  drawPuzzlePath(sliderCtx, PROTRUSION, PROTRUSION);
  sliderCtx.drawImage(canvas, pieceX - PROTRUSION, pieceY - PROTRUSION,
    PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2,
    0, 0, PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2);
  sliderCtx.restore();

  // Draw border on slider piece
  drawPuzzleBorder(sliderCtx, PROTRUSION, PROTRUSION);

  const captchaId = crypto.randomUUID();
  store.set(captchaId, {
    correctX: pieceX,
    fails: 0,
    expiresAt: Date.now() + TTL_MS,
  });

  return {
    bgImage: canvas.toDataURL('image/png'),
    sliderImage: sliderCanvas.toDataURL('image/png'),
    captchaId,
    sliderY: pieceY,
  };
}

export function verifyCaptcha(captchaId: string, userX: number): { success: boolean; token?: string } {
  const entry = store.get(captchaId);
  if (!entry) return { success: false };

  if (Date.now() > entry.expiresAt) {
    store.delete(captchaId);
    return { success: false };
  }

  if (Math.abs(userX - entry.correctX) <= TOLERANCE) {
    store.delete(captchaId);
    const token = jwt.sign(
      { type: 'captcha', id: captchaId },
      env.CAPTCHA_SECRET,
      { expiresIn: '30s' }
    );
    return { success: true, token };
  }

  entry.fails += 1;
  if (entry.fails >= MAX_FAILS) {
    store.delete(captchaId);
  }
  return { success: false };
}

export function validateCaptchaToken(token: string): boolean {
  try {
    const payload = jwt.verify(token, env.CAPTCHA_SECRET) as { type: string };
    return payload.type === 'captcha';
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/backend/src/services/captcha.ts packages/backend/src/config/env.ts packages/backend/package.json pnpm-lock.yaml
git commit -m "feat: add captcha service with puzzle image generation and verification"
```

---

### Task 2: Backend captcha routes

**Files:**
- Create: `packages/backend/src/routes/captcha.ts`
- Modify: `packages/backend/src/index.ts`

- [ ] **Step 1: Create captcha routes**

Create `packages/backend/src/routes/captcha.ts`:
```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generatePuzzle, verifyCaptcha, validateCaptchaToken } from '../services/captcha';
import { success, error } from '../utils/response';

const router = Router();

// Simple in-memory rate limiter for puzzle generation
const puzzleLimiter = new Map<string, { count: number; resetAt: number }>();

router.get('/puzzle', (req: Request, res: Response) => {
  // Rate limit: 10 requests per minute per IP
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

// Internal utility — not exposed as a route, but exported for auth route
export { validateCaptchaToken };

export default router;
```

- [ ] **Step 2: Register captcha routes in index.ts**

In `packages/backend/src/index.ts`, add the import and route registration:
```typescript
import captchaRoutes from './routes/captcha';
```
And add before the auth routes line:
```typescript
app.use('/api/v1/captcha', captchaRoutes);
```

The full route section should look like:
```typescript
// Routes
app.use('/api/v1/captcha', captchaRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/stats', statsRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add packages/backend/src/routes/captcha.ts packages/backend/src/index.ts
git commit -m "feat: add captcha puzzle and verify API endpoints"
```

---

### Task 3: Modify login endpoint to require captchaToken

**Files:**
- Modify: `packages/backend/src/routes/auth.ts`

- [ ] **Step 1: Add captchaToken validation to login**

In `packages/backend/src/routes/auth.ts`, add the import at the top:
```typescript
import { validateCaptchaToken } from './captcha';
```

Change the `loginSchema` to require `captchaToken`:
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().min(1),
});
```

In the `router.post('/login', ...)` handler, add captcha validation after schema parse and before the `login()` call:
```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/backend/src/routes/auth.ts
git commit -m "feat: require captchaToken on login endpoint"
```

---

### Task 4: Update backend Dockerfile for canvas native dependencies

**Files:**
- Modify: `packages/backend/Dockerfile`

- [ ] **Step 1: Add canvas native deps to Dockerfile**

`canvas` requires `cairo`, `pango`, and related libraries. Update the `builder` and `runner` stages:

In `packages/backend/Dockerfile`, change the builder `apk add` line:
```dockerfile
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev
```

Add a runtime deps install in the `runner` stage, before the `COPY` lines:
```dockerfile
RUN apk add --no-cache cairo pango libjpeg-turbo giflib
```

The full Dockerfile becomes:
```dockerfile
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .
RUN npx prisma generate
RUN npm rebuild bcrypt
RUN pnpm build

FROM node:20-alpine AS runner

RUN apk add --no-cache cairo pango libjpeg-turbo giflib

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

- [ ] **Step 2: Commit**

```bash
git add packages/backend/Dockerfile
git commit -m "feat: add canvas native deps to backend Dockerfile"
```

---

### Task 5: Frontend SliderCaptcha component

**Files:**
- Create: `packages/frontend/src/components/Common/SliderCaptcha.tsx`
- Modify: `packages/frontend/src/index.css`

- [ ] **Step 1: Add slider captcha CSS animations**

In `packages/frontend/src/index.css`, append at the end:
```css
@keyframes captcha-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.captcha-shake {
  animation: captcha-shake 0.4s ease-in-out;
}

@keyframes captcha-success {
  0% { box-shadow: 0 0 0 0 rgba(47, 158, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(47, 158, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(47, 158, 68, 0); }
}

.captcha-success {
  animation: captcha-success 0.6s ease-out;
}
```

- [ ] **Step 2: Create SliderCaptcha component**

Create `packages/frontend/src/components/Common/SliderCaptcha.tsx`:
```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface Props {
  onSuccess: (token: string) => void;
}

interface PuzzleData {
  bgImage: string;
  sliderImage: string;
  captchaId: string;
  sliderY: number;
}

const SLIDER_WIDTH = 300;
const TRACK_HEIGHT = 40;

export function SliderCaptcha({ onSuccess }: Props) {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'fail'>('idle');
  const [failCount, setFailCount] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setStatus('idle');
    setSliderX(0);
    try {
      const { data } = await api.get('/captcha/puzzle');
      setPuzzle(data.data);
    } catch {
      setStatus('fail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const handleDragStart = (clientX: number) => {
    if (status === 'success' || !puzzle) return;
    setDragging(true);
    startXRef.current = clientX;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const diff = clientX - startXRef.current;
    const maxX = SLIDER_WIDTH - 44;
    const x = Math.max(0, Math.min(diff, maxX));
    setSliderX(x);
  }, [dragging]);

  const handleDragEnd = useCallback(async () => {
    if (!dragging || !puzzle) return;
    setDragging(false);

    try {
      const { data } = await api.post('/captcha/verify', {
        captchaId: puzzle.captchaId,
        x: Math.round(sliderX),
      });
      if (data.success) {
        setStatus('success');
        onSuccess(data.data.token);
      }
    } catch {
      setStatus('fail');
      setFailCount((c) => {
        const next = c + 1;
        if (next >= 3) {
          setTimeout(fetchPuzzle, 800);
          return 0;
        }
        return next;
      });
      setTimeout(() => setStatus('idle'), 400);
      setSliderX(0);
    }
  }, [dragging, puzzle, sliderX, onSuccess, fetchPuzzle]);

  // Mouse events
  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  // Touch events
  useEffect(() => {
    if (!dragging) return;
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
    const onTouchEnd = () => handleDragEnd();
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  if (loading || !puzzle) {
    return (
      <div className="w-[300px] h-[190px] flex items-center justify-center bg-surface-container rounded-lg border border-outline-variant">
        <span className="text-on-surface-variant text-sm">加载中...</span>
      </div>
    );
  }

  const statusBorder = status === 'success'
    ? 'border-green-600 captcha-success'
    : status === 'fail'
    ? 'border-red-600 captcha-shake'
    : 'border-outline-variant';

  return (
    <div className={`w-[300px] rounded-lg border-2 ${statusBorder} overflow-hidden bg-surface-container-lowest`}>
      {/* Puzzle area */}
      <div className="relative w-[300px] h-[150px] select-none">
        <img src={puzzle.bgImage} alt="" className="w-full h-full" draggable={false} />
        <img
          src={puzzle.sliderImage}
          alt=""
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${sliderX}px, ${puzzle.sliderY - 8}px)`,
            height: 60,
            width: 60,
          }}
          draggable={false}
        />
        {/* Refresh button */}
        <button
          type="button"
          onClick={fetchPuzzle}
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/30 rounded text-white hover:bg-black/50"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative h-[40px] bg-surface-container flex items-center px-2"
      >
        {/* Filled track */}
        <div
          className="absolute left-0 top-0 h-full bg-primary/20 rounded-l"
          style={{ width: sliderX + 10 }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant pointer-events-none select-none">
          {status === 'success' ? '验证成功' : '向右拖动滑块完成验证'}
        </span>
        {/* Draggable handle */}
        <div
          className="relative z-10 w-10 h-8 bg-primary rounded flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm select-none"
          style={{ transform: `translateX(${sliderX}px)` }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        >
          <span className="material-symbols-outlined text-on-primary text-sm">
            {status === 'success' ? 'check' : 'chevron_right'}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/components/Common/SliderCaptcha.tsx packages/frontend/src/index.css
git commit -m "feat: add SliderCaptcha component with drag verification"
```

---

### Task 6: Integrate captcha into LoginPage

**Files:**
- Modify: `packages/frontend/src/pages/auth/LoginPage.tsx`

- [ ] **Step 1: Update LoginPage with captcha flow**

Replace the full content of `packages/frontend/src/pages/auth/LoginPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { SliderCaptcha } from '../../components/Common/SliderCaptcha';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!showCaptcha) {
      setShowCaptcha(true);
      return;
    }

    if (!captchaToken) {
      setErr('请完成滑块验证');
      return;
    }

    try {
      const { user } = await login(email, password, captchaToken);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.error || '登录失败');
      setCaptchaToken('');
      setShowCaptcha(false);
    }
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-xl">
        <div className="text-center mb-lg">
          <div className="w-12 h-12 mx-auto rounded-xl bg-primary-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-on-primary-container">description</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">项目日报系统</h1>
          <p className="text-on-surface-variant mt-1">登录以管理您的日报</p>
        </div>

        {err && (
          <div className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                if (!showCaptcha && email && password) setShowCaptcha(true);
              }}
              className="w-full border border-outline-variant rounded h-10 px-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="请输入密码"
              required
            />
          </div>

          {showCaptcha && (
            <div className="flex justify-center">
              <SliderCaptcha onSuccess={handleCaptchaSuccess} />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-on-primary h-10 rounded font-medium hover:bg-inverse-surface transition-colors disabled:opacity-50"
            disabled={showCaptcha && !captchaToken}
          >
            {showCaptcha ? '登录' : '下一步'}
          </button>
        </form>

        <div className="mt-lg p-md bg-surface-container rounded-lg text-xs text-on-surface-variant">
          <div className="font-semibold mb-1">测试账号：</div>
          <div>管理员：admin@example.com / Admin@123</div>
          <div>负责人：zhang@example.com / Test@123</div>
          <div>成员：wang@example.com / Test@123</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update useAuth hook to pass captchaToken**

In `packages/frontend/src/hooks/useAuth.ts`, update the `login` function to accept and send `captchaToken`. Read the file first, then modify the login call to include captchaToken as a parameter.

- [ ] **Step 3: Update authStore login call**

In `packages/frontend/src/stores/authStore.ts`, make sure the login action accepts `captchaToken` and passes it through to the API.

- [ ] **Step 4: Commit**

```bash
git add packages/frontend/src/pages/auth/LoginPage.tsx packages/frontend/src/hooks/useAuth.ts packages/frontend/src/stores/authStore.ts
git commit -m "feat: integrate slider captcha into login page"
```

---

### Task 7: Rebuild and test

**Files:**
- None (validation only)

- [ ] **Step 1: Rebuild Docker containers**

```bash
cd /Users/jonas/report && docker compose up --build -d
```

- [ ] **Step 2: Verify captcha puzzle endpoint**

```bash
curl -s http://localhost:3001/api/v1/captcha/puzzle | python3 -m json.tool
```

Expected: JSON with `bgImage` (base64), `sliderImage` (base64), `captchaId`, `sliderY`.

- [ ] **Step 3: Verify login rejects without captchaToken**

```bash
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}' | python3 -m json.tool
```

Expected: 422 error (captchaToken missing).

- [ ] **Step 4: Open browser and test full flow**

Open http://localhost, enter credentials, complete slider captcha, verify successful login.

- [ ] **Step 5: Commit any fixes if needed**
