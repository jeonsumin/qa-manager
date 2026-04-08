import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  console.error(`[${code}] ${err.message}`);
  res.status(status).json(errorResponse(code, err.message));
};

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}
