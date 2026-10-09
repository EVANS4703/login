import express, { type Express } from 'express';
import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Env } from './config/env.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';

function parseAllowlist(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  );
}

export function createApp(env: Env): Express {
  const app = express();
  const allowlist = parseAllowlist(env.FRONTEND_ORIGIN);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(requestId);
  app.use(express.json({ limit: '100kb' }));

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      callback(null, !origin || allowlist.has(origin));
    },
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    maxAge: 600,
  };
  app.use(cors(corsOptions));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        success: false,
        data: null,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      },
    }),
  );

  app.use('/api/v1/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
