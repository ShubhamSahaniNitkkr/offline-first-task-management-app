import { Router } from 'express';
import { productQuerySchema } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { authMiddleware } from '../middleware/index.js';
import { validateQuery } from '../middleware/validate.js';
import { getProductById, getShopStats, listProducts } from '../services/product.service.js';

export function createProductRoutes(env: Env) {
  const router = Router();

  router.get('/', validateQuery(productQuerySchema), async (req, res, next) => {
    try {
      const result = await listProducts(env, req.query as never);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const product = await getProductById(env, String(req.params.id));
      res.json({ data: product });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createShopRoutes(env: Env) {
  const router = Router();
  router.use(authMiddleware(env));

  router.get('/stats', async (_req, res, next) => {
    try {
      const stats = await getShopStats(env);
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
