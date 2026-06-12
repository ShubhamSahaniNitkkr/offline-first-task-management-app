import type { SyncPushOperation, SyncPushResult } from '@oftmp/shared';
import { createOrderSchema } from '@oftmp/shared';
import type { Env } from '../config/env.js';
import { createOrder } from './order.service.js';
import { getProductsSince } from './product.service.js';

export async function pushOperations(
  env: Env,
  userId: string,
  operations: SyncPushOperation[],
): Promise<SyncPushResult[]> {
  const results: SyncPushResult[] = [];

  for (const op of operations) {
    try {
      if (op.type === 'CREATE_ORDER') {
        const input = createOrderSchema.parse(op.payload);
        const entity = await createOrder(env, userId, {
          ...input,
          idempotencyKey: op.idempotencyKey,
          clientId: op.entityId,
        });
        results.push({ idempotencyKey: op.idempotencyKey, status: 'success', entity });
      } else {
        results.push({
          idempotencyKey: op.idempotencyKey,
          status: 'success',
        });
      }
    } catch (error) {
      results.push({
        idempotencyKey: op.idempotencyKey,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

export async function pullChanges(env: Env, _userId: string, since: string) {
  const products = await getProductsSince(env, since);
  return { products };
}
