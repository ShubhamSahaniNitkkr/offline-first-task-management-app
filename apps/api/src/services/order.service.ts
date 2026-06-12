import { and, count, desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { CreateOrderInput, Order, OrderItem } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { getDb } from '../db/index.js';
import { idempotencyKeys, orders } from '../db/schema.js';
import { AppError } from '../lib/errors.js';

function mapOrder(row: typeof orders.$inferSelect): Order {
  return {
    id: row.id,
    clientId: row.clientId ?? undefined,
    userId: row.userId,
    items: JSON.parse(row.items) as OrderItem[],
    total: row.total,
    status: row.status as Order['status'],
    syncStatus: 'synced',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getIdempotentResponse<T>(env: Env, key: string): Promise<T | null> {
  const db = getDb(env.DATABASE_URL);
  const [row] = await db.select().from(idempotencyKeys).where(eq(idempotencyKeys.key, key)).limit(1);
  if (!row) return null;
  return JSON.parse(row.response) as T;
}

async function storeIdempotentResponse(env: Env, key: string, response: unknown) {
  const db = getDb(env.DATABASE_URL);
  await db.insert(idempotencyKeys).values({
    key,
    response: JSON.stringify(response),
    createdAt: new Date().toISOString(),
  });
}

export async function createOrder(
  env: Env,
  userId: string,
  input: CreateOrderInput,
): Promise<Order> {
  if (input.idempotencyKey) {
    const cached = await getIdempotentResponse<Order>(env, input.idempotencyKey);
    if (cached) return cached;
  }

  const db = getDb(env.DATABASE_URL);
  const now = new Date().toISOString();
  const id = uuidv4();

  const [row] = await db
    .insert(orders)
    .values({
      id,
      clientId: input.clientId ?? null,
      userId,
      items: JSON.stringify(input.items),
      total: input.total,
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const order = mapOrder(row!);
  if (input.idempotencyKey) {
    await storeIdempotentResponse(env, input.idempotencyKey, order);
  }
  return order;
}

export async function listOrders(env: Env, userId: string): Promise<Order[]> {
  const db = getDb(env.DATABASE_URL);
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
  return rows.map(mapOrder);
}

export async function getOrderById(env: Env, userId: string, id: string): Promise<Order> {
  const db = getDb(env.DATABASE_URL);
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .limit(1);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return mapOrder(row);
}

export async function getPendingOrderCount(env: Env, userId: string): Promise<number> {
  const db = getDb(env.DATABASE_URL);
  const [result] = await db
    .select({ value: count() })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'pending')));
  return result?.value ?? 0;
}
