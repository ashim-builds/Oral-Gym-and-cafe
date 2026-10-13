import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Middleware]:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, formattedErrors[0]?.message || 'Validation error', 422, formattedErrors);
    return;
  }

  const statusCode = err.statusCode || 400;
  const message = err.message || 'Internal server error';

  sendError(res, message, statusCode);
};
