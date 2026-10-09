import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '../types/api.js';
import { logger } from '../lib/logger.js';

interface HttpError extends Error {
  status?: number;
  code?: string;
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiError = {
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'The requested resource does not exist.' },
  };
  res.status(404).json(body);
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred.';

  if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'The request payload is invalid.';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    code = 'BAD_JSON';
    message = 'The request body is not valid JSON.';
  } else if (err instanceof Error && typeof (err as HttpError).status === 'number') {
    const httpErr = err as HttpError;
    status = httpErr.status as number;
    code = httpErr.code ?? 'REQUEST_ERROR';
    message = httpErr.message;
  }

  if (status >= 500) {
    logger.error('request_failed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const body: ApiError = { success: false, data: null, error: { code, message } };
  res.status(status).json(body);
}
