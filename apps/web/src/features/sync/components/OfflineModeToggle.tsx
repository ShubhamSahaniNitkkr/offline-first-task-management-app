import { Button, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.js';
import {
  clearOfflineActivities,
  logOfflineActivity,
  setManualOffline,
  setQueueCount,
  showOfflinePipeline,
} from '../../../store/slices/syncSlice.js';
import { setManualOfflineGate } from '../../../offline/networkGate.js';
import { syncEngine } from '../../../offline/sync/syncEngine.js';
import { getQueueCount } from '../../../offline/queue/operationQueue.js';
import { reconcileOnlineCartQueue } from '../../cart/hooks/useCartMutations.js';

export function OfflineModeToggle() {
  const dispatch = useAppDispatch();
  const manualOffline = useAppSelector((s) => s.sync.manualOffline);

  const toggle = async () => {
    const next = !manualOffline;
    dispatch(setManualOffline(next));
    setManualOfflineGate(next);
    dispatch(showOfflinePipeline());

    if (next) {
      dispatch(clearOfflineActivities());
      dispatch(
        logOfflineActivity({
          step: 'Manual offline',
          detail: 'Simulated disconnect enabled — network calls blocked',
          status: 'completed',
        }),
      );
      dispatch(
        logOfflineActivity({
          step: 'RTK Query',
          detail: 'GET requests will read from IndexedDB cache',
          status: 'waiting',
        }),
      );
      dispatch(
        logOfflineActivity({
          step: 'Sync engine',
          detail: 'Paused — pending operations stay in queue',
          status: 'waiting',
        }),
      );
      const count = await getQueueCount();
      dispatch(setQueueCount(count));
      dispatch(
        logOfflineActivity({
          step: 'Operation queue',
          detail: `${count} operation(s) waiting to sync`,
          status: count > 0 ? 'waiting' : 'completed',
        }),
      );
    } else {
      dispatch(
        logOfflineActivity({
          step: 'Network layer',
          detail: 'Back online — connectivity restored',
          status: 'completed',
        }),
      );
      dispatch(
        logOfflineActivity({
          step: 'Sync engine',
          detail: 'Starting push/pull sync…',
          status: 'running',
        }),
      );
      void reconcileOnlineCartQueue(dispatch).then(() => getQueueCount()).then((count) => {
        dispatch(setQueueCount(count));
        if (count > 0) void syncEngine.sync();
      });
    }
  };

  return (
    <Tooltip
      label={manualOffline ? 'Go online (resume sync)' : 'Simulate offline mode'}
      withArrow
    >
      <Button
        size="xs"
        variant={manualOffline ? 'filled' : 'light'}
        color={manualOffline ? 'orange' : 'brand'}
        leftSection={manualOffline ? <IconWifiOff size={14} /> : <IconWifi size={14} />}
        onClick={() => void toggle()}
        aria-pressed={manualOffline}
        aria-label={manualOffline ? 'Disable offline simulation' : 'Simulate offline mode'}
      >
        {manualOffline ? 'Offline' : 'Go offline'}
      </Button>
    </Tooltip>
  );
}
