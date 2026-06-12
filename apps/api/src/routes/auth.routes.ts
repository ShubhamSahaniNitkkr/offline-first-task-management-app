import { Router } from 'express';
import { loginSchema } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { validateBody } from '../middleware/validate.js';
import { authMiddleware, getAuthReq } from '../middleware/index.js';
import { authenticateUser, getUserById } from '../services/auth.service.js';
import { AppError } from '../lib/errors.js';

export function createAuthRoutes(env: Env) {
  const router = Router();

  router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authenticateUser(env, email, password);
      if (!result) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', (_req, res) => {
    res.status(204).send();
  });

  router.get('/me', authMiddleware(env), async (req, res, next) => {
    try {
      const { userId } = getAuthReq(req);
      const user = await getUserById(env, userId);
      if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
      }
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
