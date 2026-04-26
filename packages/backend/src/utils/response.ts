import { Response } from 'express';

export function success<T>(res: Response, data: T, message?: string, status = 200) {
  return res.status(status).json({ success: true, data, ...(message && { message }) });
}

export function error(res: Response, error: string, status = 400, code?: string) {
  return res.status(status).json({ success: false, error, ...(code && { code }) });
}

export function paginate(res: Response, data: any[], total: number, page: number, limit: number) {
  return success(res, {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
