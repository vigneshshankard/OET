/**
 * Health check routes for User Service
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

router.get('/live', asyncHandler(async (req, res) => {
  res.json({
    status: 'alive',
    service: 'user-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}));

router.get('/ready', asyncHandler(async (req, res) => {
  // TODO: Add actual readiness checks
  // - Database connectivity
  // - Redis connectivity
  const checks = {
    database: 'healthy',
    redis: 'healthy',
  };

  const allHealthy = Object.values(checks).every(status => status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    service: 'user-service',
    checks,
    timestamp: new Date().toISOString(),
  });
}));

export default router;