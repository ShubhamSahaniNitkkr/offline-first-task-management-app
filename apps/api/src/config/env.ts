import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.coerce.number().default(3600),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(604800),
  DATABASE_URL: z.string().default('./data/app.db'),
  CORS_ORIGIN: z.string().default('http://localhost:4321'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}
