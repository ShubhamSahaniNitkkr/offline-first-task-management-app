import { Router } from 'express';
import { createOrderSchema } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { authMiddleware, getAuthReq } from '../middleware/index.js';
import { validateBody } from '../middleware/validate.js';
import { createOrder, getOrderById, listOrders } from '../services/order.service.js';

export function createOrderRoutes(env: Env) {
  const router = Router();
  router.use(authMiddleware(env));

  router.get('/', async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const data = await listOrders(env, userId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const order = await getOrderById(env, userId, String(req.params.id));
      res.json({ data: order });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', validateBody(createOrderSchema), async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const order = await createOrder(env, userId, req.body);
      res.status(201).json({ data: order });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
