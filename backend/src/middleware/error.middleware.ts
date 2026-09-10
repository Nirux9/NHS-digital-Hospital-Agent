import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error Handler]', err);

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const message = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error';
    return sendError(res, 'VALIDATION_ERROR', message, 400);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return sendError(res, 'DUPLICATE_ENTRY', `A record with this ${field} already exists.`, 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'NOT_FOUND', 'Requested record not found.', 404);
    }
  }

  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return sendError(res, 'INTERNAL_SERVER_ERROR', message, 500);
}
