import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { Env } from '../config/env.js';
import { getDb } from '../db/index.js';
import { users } from '../db/schema.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import type { AuthTokens, User } from '@oftmp/shared';

export async function seedDatabase(env: Env) {
  const db = getDb(env.DATABASE_URL);
  const existing = await db.select().from(users).limit(1);

  if (existing.length > 0) {
    return;
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUsers = [
    { name: 'Demo User', email: 'demo@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
    { name: 'John Doe', email: 'john@example.com' },
  ];

  for (const user of demoUsers) {
    await db.insert(users).values({
      id: uuidv4(),
      name: user.name,
      email: user.email,
      passwordHash,
      createdAt: now,
    });
  }

  console.log('Database seeded with demo users (password: password123)');
}

export function mapUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.createdAt,
  };
}

export async function authenticateUser(
  env: Env,
  email: string,
  password: string,
): Promise<AuthTokens | null> {
  const db = getDb(env.DATABASE_URL);
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!row) {
    return null;
  }

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) {
    return null;
  }

  const user = mapUser(row);
  const accessToken = signAccessToken(env, user);
  const refreshToken = signRefreshToken(env, user);

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN,
    user,
  };
}

export async function getUserById(env: Env, id: string): Promise<User | null> {
  const db = getDb(env.DATABASE_URL);
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? mapUser(row) : null;
}

