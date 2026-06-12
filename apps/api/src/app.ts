import cors from 'cors';
import express, { type Request, type Response } from 'express';
import type { Env } from './config/env.js';
import { buildCorsOptions } from './lib/cors.js';
import { errorHandler } from './middleware/index.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createOrderRoutes } from './routes/orders.routes.js';
import { createProductRoutes, createShopRoutes } from './routes/products.routes.js';
import { createSyncRoutes } from './routes/sync.routes.js';

export function createApp(env: Env) {
  const app = express();

  app.use(cors(buildCorsOptions(env.CORS_ORIGIN)));
  app.use(express.json());

  const healthHandler = (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  };

  app.get('/health', healthHandler);

  const api = express.Router();
  api.get('/health', healthHandler);
  api.use('/auth', createAuthRoutes(env));
  api.use('/products', createProductRoutes(env));
  api.use('/orders', createOrderRoutes(env));
  api.use('/shop', createShopRoutes(env));
  api.use('/sync', createSyncRoutes(env));

  app.use('/api/v1', api);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `No route for ${_req.method} ${_req.path}` },
    });
  });

  app.use(errorHandler);

  return app;
}
