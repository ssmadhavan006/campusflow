import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.url} :`, err);

  res.status(status).json({
    status: 'error',
    message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
