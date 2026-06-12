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
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error(
      'Required on Render: JWT_SECRET (min 16 chars), CORS_ORIGIN (your static site URL).',
    );
    process.exit(1);
  }
  return result.data;
}
