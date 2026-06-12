import { Router } from 'express';
import type { Env } from '../config/env.js';
import { authMiddleware, getAuthReq } from '../middleware/index.js';
import { listUsers } from '../services/auth.service.js';
import { pullChanges, pushOperations } from '../services/sync.service.js';

export function createUserRoutes(env: Env) {
  const router = Router();
  router.use(authMiddleware(env));

  router.get('/', async (_req, res, next) => {
    try {
      const users = await listUsers(env);
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createSyncRoutes(env: Env) {
  const router = Router();
  router.use(authMiddleware(env));

  router.post('/push', async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const { operations } = req.body as { operations: Parameters<typeof pushOperations>[2] };
      const results = await pushOperations(env, userId, operations ?? []);
      res.json({ data: { results } });
    } catch (error) {
      next(error);
    }
  });

  router.get('/pull', async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const since = (req.query.since as string) ?? new Date(0).toISOString();
      const data = await pullChanges(env, userId, since);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
