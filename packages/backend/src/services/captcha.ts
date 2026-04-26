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
  ctx.lineTo(x + s / 3, y);
  ctx.arc(x + s / 2, y, p, Math.PI, 0, false);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x + s, y + s / 3);
  ctx.arc(x + s, y + s / 2, p, Math.PI * 1.5, Math.PI * 0.5, false);
  ctx.lineTo(x + s, y + s);
  ctx.lineTo(x, y + s);
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

  const colors = [randomColor(), randomColor()];
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

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

  const pieceX = Math.floor(Math.random() * (WIDTH - PIECE_SIZE - PROTRUSION * 2 - 40)) + PROTRUSION + 20;
  const pieceY = Math.floor(Math.random() * (HEIGHT - PIECE_SIZE - PROTRUSION * 2 - 20)) + PROTRUSION + 10;

  // Extract slider piece from CLEAN background before overlay
  const sliderCanvas = createCanvas(PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2);
  const sliderCtx = sliderCanvas.getContext('2d');
  sliderCtx.save();
  drawPuzzlePath(sliderCtx, PROTRUSION, PROTRUSION);
  sliderCtx.drawImage(canvas, pieceX - PROTRUSION, pieceY - PROTRUSION,
    PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2,
    0, 0, PIECE_SIZE + PROTRUSION * 2, PIECE_SIZE + PROTRUSION * 2);
  sliderCtx.restore();
  drawPuzzleBorder(sliderCtx, PROTRUSION, PROTRUSION);

  // Now apply hole overlay on background
  ctx.save();
  drawPuzzlePath(ctx, pieceX, pieceY);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
  drawPuzzleBorder(ctx, pieceX, pieceY);

  const captchaId = crypto.randomUUID();
  store.set(captchaId, {
    // Slider piece image has PROTRUSION padding, so visual alignment
    // happens at sliderX = pieceX - PROTRUSION
    correctX: pieceX - PROTRUSION,
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
