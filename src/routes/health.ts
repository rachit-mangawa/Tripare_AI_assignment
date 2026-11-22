import { Router, Request, Response } from 'express';
import { getSupplierStatus } from '../suppliers/routes';
import { checkRedisHealth } from '../redis/hotelStore';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  const suppliers = getSupplierStatus();
  const redisHealthy = await checkRedisHealth();

  const allSuppliersHealthy =
    suppliers.supplierA === 'UP' && suppliers.supplierB === 'UP';

  const status = allSuppliersHealthy && redisHealthy ? 'healthy' : 'degraded';

  return res.status(allSuppliersHealthy ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    suppliers,
    redis: redisHealthy ? 'UP' : 'DOWN',
  });
});
