import { v4 as uuidv4 } from 'uuid';
import type { OperationType, PendingOperation } from '@oftmp/shared';
import { MAX_RETRIES } from '@oftmp/shared';
import { db } from '../db/database.js';

export async function enqueueOperation(
  type: OperationType,
  entityType: 'cart' | 'wishlist' | 'order' | 'product',
  entityId: string,
  payload: Record<string, unknown>,
): Promise<PendingOperation> {
  const operation: PendingOperation = {
    id: uuidv4(),
    type,
    entityType,
    entityId,
    payload,
    idempotencyKey: uuidv4(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: null,
    status: 'pending',
    createdAt: Date.now(),
  };

  await db.pendingOperations.add(operation);
  return operation;
}

function isActionable(op: PendingOperation): boolean {
  return op.status === 'pending' || (op.status === 'failed' && op.retryCount < op.maxRetries);
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  const ops = await db.pendingOperations
    .where('status')
    .anyOf(['pending', 'failed'])
    .sortBy('createdAt');
  return ops.filter(isActionable);
}

export async function getQueueCount(): Promise<number> {
  const ops = await db.pendingOperations.where('status').anyOf(['pending', 'failed']).toArray();
  return ops.filter(isActionable).length;
}

/** Recover operations left in `processing` after an interrupted sync. */
export async function resetStuckOperations() {
  await db.pendingOperations.where('status').equals('processing').modify({ status: 'pending' });
}

const CART_OP_TYPES = new Set(['ADD_TO_CART', 'UPDATE_CART_ITEM', 'REMOVE_FROM_CART']);
const WISHLIST_OP_TYPES = new Set(['ADD_TO_WISHLIST', 'REMOVE_FROM_WISHLIST']);

/** Cart mutations are local-only when online — drop stale cart ops from the queue. */
export async function purgeCartOperations() {
  const ops = await db.pendingOperations.toArray();
  await Promise.all(
    ops
      .filter((op) => op.entityType === 'cart' && CART_OP_TYPES.has(op.type))
      .map((op) => db.pendingOperations.delete(op.id)),
  );
}

/** Wishlist is local-first when online — drop stale wishlist ops from the queue. */
export async function purgeWishlistOperations() {
  const ops = await db.pendingOperations.toArray();
  await Promise.all(
    ops
      .filter((op) => op.entityType === 'wishlist' && WISHLIST_OP_TYPES.has(op.type))
      .map((op) => db.pendingOperations.delete(op.id)),
  );
}

export async function markOperationProcessing(id: string) {
  await db.pendingOperations.update(id, { status: 'processing' });
}

export async function markOperationCompleted(id: string) {
  await db.pendingOperations.update(id, { status: 'completed' });
  await db.pendingOperations.delete(id);
}

export async function markOperationFailed(id: string, error: string, nextRetryAt: number | null) {
  const op = await db.pendingOperations.get(id);
  if (!op) return;

  const retryCount = op.retryCount + 1;
  const status = retryCount >= op.maxRetries ? 'failed' : 'pending';

  await db.pendingOperations.update(id, {
    status,
    retryCount,
    lastError: error,
    nextRetryAt,
  });
}

export async function clearCompletedOperations() {
  await db.pendingOperations.where('status').equals('completed').delete();
}
