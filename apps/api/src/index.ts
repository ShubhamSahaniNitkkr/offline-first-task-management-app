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
  app.listen(env.PORT, () => {
    console.log(`API server running on http://localhost:${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
  });
}

main().catch(console.error);
