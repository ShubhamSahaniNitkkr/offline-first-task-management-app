import type { Order, Product } from '@oftmp/shared';
import { BROADCAST_CHANNEL_NAME } from '@oftmp/shared';
import { db, setSyncMetadata } from '../db/database.js';
import {
  getPendingOperations,
  markOperationCompleted,
  markOperationFailed,
  markOperationProcessing,
  resetStuckOperations,
} from '../queue/operationQueue.js';
import { detectConflict } from './conflictResolver.js';
import { isEffectivelyOnline } from '../networkGate.js';
import { logOfflineStep } from '../offlineActivityLogger.js';
import { getNextRetryTimestamp, isNonRetryableStatus, isRetryableStatus } from './retryStrategy.js';
import { resolveApiBaseUrl } from '../../lib/apiUrl.js';
const SYNC_FETCH_TIMEOUT_MS = 15_000;
const TAB_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tab-${Date.now()}`;

type SyncListener = (event: SyncEvent) => void;

export type SyncEvent =
  | { type: 'sync_started' }
  | { type: 'sync_completed'; syncedCount: number }
  | { type: 'sync_failed'; error: string }
  | { type: 'conflict_detected'; conflict: ReturnType<typeof detectConflict> }
  | { type: 'offline_mode' }
  | { type: 'back_online' };

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = SYNC_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

class SyncEngine {
  private syncing = false;
  private initialized = false;
  private listeners = new Set<SyncListener>();
  private broadcast: BroadcastChannel | null = null;

  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.broadcast.onmessage = (event) => {
      const payload = event.data as { event?: SyncEvent; tabId?: string };
      if (!payload.event || payload.tabId === TAB_ID) return;
      this.listeners.forEach((l) => l(payload.event!));
    };

    window.addEventListener('online', () => {
      this.emit({ type: 'back_online' });
      void this.sync();
    });

    window.addEventListener('offline', () => {
      this.emit({ type: 'offline_mode' });
    });

    void this.syncIfNeeded();
  }

  private async syncIfNeeded() {
    if (!isEffectivelyOnline()) return;
    const operations = await getPendingOperations();
    if (operations.length > 0) void this.sync();
  }

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SyncEvent) {
    this.listeners.forEach((l) => l(event));
    this.broadcast?.postMessage({ event, tabId: TAB_ID });
  }

  async sync(): Promise<void> {
    if (this.syncing || !isEffectivelyOnline()) return;

    const token = await db.syncMetadata.get('accessToken');
    if (!token?.value) return;

    this.syncing = true;
    this.emit({ type: 'sync_started' });
    logOfflineStep('Sync engine', 'Started — processing operation queue', 'running');

    try {
      await resetStuckOperations();

      const operations = await getPendingOperations();
      const readyOps = operations.filter(
        (op) => !op.nextRetryAt || op.nextRetryAt <= Date.now(),
      );

      if (readyOps.length === 0) {
        await this.pullChanges(token.value);
        await setSyncMetadata('lastSyncAt', new Date().toISOString());
        this.emit({ type: 'sync_completed', syncedCount: 0 });
        logOfflineStep('Sync engine', 'No pending operations — pulled remote changes', 'completed');
        return;
      }

      let syncedCount = 0;

      for (const op of readyOps) {
        await markOperationProcessing(op.id);

        try {
          const response = await fetchWithTimeout(`${resolveApiBaseUrl()}/sync/push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.value}`,
            },
            body: JSON.stringify({
              operations: [
                {
                  type: op.type,
                  entityId: op.entityId,
                  payload: op.payload,
                  idempotencyKey: op.idempotencyKey,
                  clientTimestamp: new Date(op.createdAt).toISOString(),
                },
              ],
            }),
          });

          if (!response.ok) {
            if (response.status === 409) {
              const body = await response.json();
              const conflict = detectConflict(body.error?.details);
              if (conflict) {
                await db.orders.update(conflict.entityId, { syncStatus: 'conflict' });
                this.emit({ type: 'conflict_detected', conflict });
              }
              await markOperationFailed(op.id, 'Conflict detected', null);
              continue;
            }

            if (isNonRetryableStatus(response.status)) {
              await markOperationFailed(op.id, `HTTP ${response.status}`, null);
              continue;
            }

            if (isRetryableStatus(response.status)) {
              await markOperationFailed(
                op.id,
                `HTTP ${response.status}`,
                getNextRetryTimestamp(op.retryCount),
              );
              continue;
            }

            await markOperationFailed(
              op.id,
              `HTTP ${response.status}`,
              getNextRetryTimestamp(op.retryCount),
            );
            continue;
          }

          const result = await response.json();
          const opResult = result.data?.results?.[0];

          if (opResult?.status === 'success') {
            if (opResult.entity) {
              await this.applyServerEntity(op, opResult.entity);
            }
            await markOperationCompleted(op.id);
            syncedCount++;
          } else if (opResult?.status === 'conflict') {
            await db.orders.update(op.entityId, { syncStatus: 'conflict' });
            this.emit({ type: 'conflict_detected', conflict: opResult.conflict });
            await markOperationFailed(op.id, 'Conflict', null);
          } else {
            await markOperationFailed(
              op.id,
              opResult?.error ?? 'Unknown error',
              getNextRetryTimestamp(op.retryCount),
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Network error';
          const isTimeout = error instanceof Error && error.name === 'AbortError';
          await markOperationFailed(
            op.id,
            isTimeout ? 'Request timed out' : message,
            getNextRetryTimestamp(op.retryCount),
          );
        }
      }

      await this.pullChanges(token.value);
      await setSyncMetadata('lastSyncAt', new Date().toISOString());
      this.emit({ type: 'sync_completed', syncedCount });
      logOfflineStep(
        'Sync engine',
        syncedCount > 0
          ? `Completed — ${syncedCount} operation(s) synced to server`
          : 'Completed — queue drained',
        'completed',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      logOfflineStep('Sync engine', message, 'error');
      this.emit({ type: 'sync_failed', error: message });
    } finally {
      this.syncing = false;
    }
  }

  private async applyServerEntity(
    op: { entityId: string; type: string },
    entity: Order | Product,
  ) {
    if ('items' in entity && 'total' in entity) {
      const existing = await db.orders.get(op.entityId);
      if (existing?.clientId && existing.id !== entity.id) {
        await db.orders.delete(existing.id);
      }
      await db.orders.put({ ...entity, syncStatus: 'synced' });
    } else if ('price' in entity && 'category' in entity) {
      await db.products.put(entity as Product);
    }
  }

  private async pullChanges(token: string) {
    const lastSync = await db.syncMetadata.get('lastSyncAt');
    const since = lastSync?.value ?? new Date(0).toISOString();

    const response = await fetchWithTimeout(
      `${resolveApiBaseUrl()}/sync/pull?since=${encodeURIComponent(since)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) return;

    const { data } = await response.json();
    if (data?.products) {
      for (const product of data.products as Product[]) {
        await db.products.put(product);
      }
    }
  }
}

export const syncEngine = new SyncEngine();
