import cors from 'cors';
import express from 'express';
import type { Env } from './config/env.js';
import { errorHandler } from './middleware/index.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createOrderRoutes } from './routes/orders.routes.js';
import { createProductRoutes, createShopRoutes } from './routes/products.routes.js';
import { createSyncRoutes } from './routes/sync.routes.js';

export function createApp(env: Env) {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const api = express.Router();
  api.use('/auth', createAuthRoutes(env));
  api.use('/products', createProductRoutes(env));
  api.use('/orders', createOrderRoutes(env));
  api.use('/shop', createShopRoutes(env));
  api.use('/sync', createSyncRoutes(env));

  app.use('/api/v1', api);
  app.use(errorHandler);

  return app;
}
