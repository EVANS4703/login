import { Router } from 'express';
import type { ApiSuccess } from '../types/api.js';

interface HealthData {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export const healthRouter: Router = Router();

healthRouter.get('/', (_req, res) => {
  const body: ApiSuccess<HealthData> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
    error: null,
  };
  res.json(body);
});
