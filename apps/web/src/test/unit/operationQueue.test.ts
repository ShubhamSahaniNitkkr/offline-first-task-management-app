import { describe, expect, it, beforeEach } from 'vitest';
import { db } from '../../offline/db/database.js';
import {
  enqueueOperation,
  getPendingOperations,
  getQueueCount,
  markOperationCompleted,
} from '../../offline/queue/operationQueue.js';

describe('operationQueue', () => {
  beforeEach(async () => {
    await db.pendingOperations.clear();
  });

  it('enqueues and retrieves pending operations', async () => {
    await enqueueOperation('ADD_TO_CART', 'cart', 'cart-1', { productId: 'p-1' });
    const ops = await getPendingOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0]?.type).toBe('ADD_TO_CART');
    expect(ops[0]?.entityId).toBe('cart-1');
  });

  it('tracks queue count', async () => {
    expect(await getQueueCount()).toBe(0);
    await enqueueOperation('UPDATE_CART_ITEM', 'cart', 'cart-1', { quantity: 2 });
    expect(await getQueueCount()).toBe(1);
  });

  it('removes completed operations', async () => {
    const op = await enqueueOperation('REMOVE_FROM_CART', 'cart', 'cart-1', {});
    await markOperationCompleted(op.id);
    expect(await getQueueCount()).toBe(0);
  });
});
