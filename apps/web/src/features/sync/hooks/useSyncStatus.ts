import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.js';
import {
  addConflict,
  setLastSyncAt,
  setOnline,
  setQueueCount,
  setSyncing,
} from '../../../store/slices/syncSlice.js';
import { syncEngine } from '../../../offline/sync/syncEngine.js';
import { getQueueCount } from '../../../offline/queue/operationQueue.js';
import { getSyncMetadata } from '../../../offline/db/database.js';
import { reconcileOnlineCartQueue } from '../../cart/hooks/useCartMutations.js';
import { subscribeCrossTab } from '../../../offline/crossTab/broadcastSync.js';
import { isEffectivelyOnline } from '../../../offline/networkGate.js';
import { api } from '../../../store/api/index.js';

export function useSyncStatus() {
  const dispatch = useAppDispatch();
  const syncState = useAppSelector((s) => s.sync);

  useEffect(() => {
    syncEngine.init();

    // Clear stale syncing flag from a prior interrupted session (e.g. React strict mode).
    dispatch(setSyncing(false));

    void reconcileOnlineCartQueue(dispatch).then(() => getQueueCount()).then((count) => {
      dispatch(setQueueCount(count));
    });
    void getSyncMetadata('lastSyncAt').then((val) => dispatch(setLastSyncAt(val)));

    const unsubscribe = syncEngine.subscribe((event) => {
      switch (event.type) {
        case 'sync_started':
          dispatch(setSyncing(true));
          break;
        case 'sync_completed':
          dispatch(setSyncing(false));
          dispatch(setLastSyncAt(new Date().toISOString()));
          void getQueueCount().then((count) => dispatch(setQueueCount(count)));
          dispatch(api.util.invalidateTags(['Product', 'Cart', 'Orders', 'Shop']));
          break;
        case 'sync_failed':
          dispatch(setSyncing(false));
          break;
        case 'conflict_detected':
          if (event.conflict && typeof event.conflict === 'object' && 'entityId' in event.conflict) {
            dispatch(addConflict((event.conflict as { entityId: string }).entityId));
          }
          break;
        case 'offline_mode':
          dispatch(setOnline(false));
          break;
        case 'back_online':
          dispatch(setOnline(true));
          void reconcileOnlineCartQueue(dispatch).then(() => getQueueCount()).then((count) => {
            dispatch(setQueueCount(count));
            if (count > 0) void syncEngine.sync();
          });
          break;
      }
    });

    const unsubCrossTab = subscribeCrossTab((msg) => {
      if (msg.type === 'QUEUE_CHANGED') {
        dispatch(api.util.invalidateTags(['Product', 'Cart', 'Orders', 'Shop']));
      }
    });

    const handleOnline = () => {
      dispatch(setOnline(true));
      void reconcileOnlineCartQueue(dispatch).then(() => getQueueCount()).then((count) => {
        dispatch(setQueueCount(count));
        if (count > 0) void syncEngine.sync();
      });
    };
    const handleOffline = () => dispatch(setOnline(false));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (!isEffectivelyOnline()) return;
      void getQueueCount().then((count) => {
        if (count > 0) void syncEngine.sync();
      });
    }, 30000);

    return () => {
      unsubscribe();
      unsubCrossTab();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [dispatch]);

  return syncState;
}

export function useNetworkStatus() {
  const browserOnline = useAppSelector((s) => s.sync.isOnline);
  const manualOffline = useAppSelector((s) => s.sync.manualOffline);
  const isOnline = browserOnline && !manualOffline;
  return { isOnline, isOffline: !isOnline, manualOffline, browserOnline };
}
