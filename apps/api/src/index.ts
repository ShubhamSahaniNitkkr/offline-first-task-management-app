import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { initDb } from './db/index.js';
import { createApp } from './app.js';
import { seedDatabase } from './services/auth.service.js';
import { seedProducts } from './services/product.service.js';

async function main() {
  const env = loadEnv();
  initDb(env.DATABASE_URL);
  await seedDatabase(env);
  await seedProducts(env);

  const app = createApp(env);
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`API server running on port ${env.PORT}`);
    console.log(`Health: /health and /api/v1/health`);
    console.log(`Products: /api/v1/products`);
    console.log(`CORS origin: ${env.CORS_ORIGIN}`);
  });
}

main().catch((err) => {
  console.error('Failed to start API server:', err);
  process.exit(1);
});
