import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('x-request-id');
  const id = header && /^[\w-]{1,64}$/.test(header) ? header : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
