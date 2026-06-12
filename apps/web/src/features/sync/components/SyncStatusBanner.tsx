import { Alert, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCloudOff, IconRefresh, IconWifiOff } from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.js';
import { useNetworkStatus } from '../hooks/useSyncStatus.js';
import { syncEngine } from '../../../offline/sync/syncEngine.js';
import { logOfflineActivity } from '../../../store/slices/syncSlice.js';
import { isEffectivelyOnline } from '../../../offline/networkGate.js';

export function SyncStatusBanner() {
  const dispatch = useAppDispatch();
  const isSyncing = useAppSelector((s) => s.sync.isSyncing);
  const queueCount = useAppSelector((s) => s.sync.queueCount);
  const { isOffline } = useNetworkStatus();

  // Online with no pending work — normal shopping, no sync UI.
  if (!isOffline) return null;
  if (queueCount === 0 && !isSyncing) return null;

  const handleSyncNow = () => {
    if (!isEffectivelyOnline()) {
      dispatch(
        logOfflineActivity({
          step: 'Sync now',
          detail: 'Failed — device is offline. Go online to sync.',
          status: 'error',
        }),
      );
      notifications.show({
        title: 'Sync failed',
        message: 'You are offline. Turn connection back on, then tap Sync now.',
        color: 'red',
      });
      return;
    }
    void syncEngine.sync();
  };

  return (
    <Alert
      variant="light"
      color="orange"
      icon={<IconWifiOff size={18} />}
      role="status"
      aria-live="polite"
      mb="md"
      title="Offline changes pending"
    >
      <Group justify="space-between">
        <span>
          {isSyncing
            ? 'Synchronizing queued changes…'
            : `${queueCount} change${queueCount !== 1 ? 's' : ''} need to sync when you are back online.`}
        </span>
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            color="orange"
            leftSection={<IconRefresh size={14} />}
            onClick={handleSyncNow}
            loading={isSyncing}
            aria-label="Sync now"
          >
            Sync now
          </Button>
          <IconCloudOff size={18} aria-hidden />
        </Group>
      </Group>
    </Alert>
  );
}

export function OfflineBanner() {
  const { isOffline, manualOffline } = useNetworkStatus();
  if (!isOffline) return null;

  return (
    <Alert
      color="orange"
      variant="filled"
      icon={<IconWifiOff size={18} />}
      role="alert"
      aria-live="assertive"
      mb="md"
    >
      {manualOffline
        ? 'Simulated offline — changes save to IndexedDB and queue for sync when you go online.'
        : 'You are offline — changes save locally and will sync when connection returns.'}
    </Alert>
  );
}
