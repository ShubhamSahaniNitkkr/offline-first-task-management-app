import { useMemo } from 'react';
import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.js';
import { useNetworkStatus } from '../hooks/useSyncStatus.js';
import { setOfflinePipelineMinimized } from '../../../store/slices/syncSlice.js';

const PIPELINE_META = [
  {
    title: 'Save on device',
    concept: 'Dexie · IndexedDB',
    behind: 'Offline-first write — UI updates before the server',
  },
  {
    title: 'Queue changes',
    concept: 'Operation queue',
    behind: 'pendingOperations in IndexedDB with idempotency keys',
  },
  {
    title: 'Go online',
    concept: 'Network gate',
    behind: 'navigator.onLine + RTK Query reads local cache when offline',
  },
  {
    title: 'Sync to server',
    concept: 'Sync engine',
    behind: 'POST /sync/push then GET /sync/pull with retry backoff',
  },
] as const;

export function OfflineProcessCard() {
  const dispatch = useAppDispatch();
  const { isOffline, manualOffline } = useNetworkStatus();
  const { queueCount, isSyncing, offlinePipelineVisible, offlinePipelineMinimized } =
    useAppSelector((s) => s.sync);

  const { steps, activeIndex } = useMemo(() => {
    const statusDesc = [
      isOffline
        ? 'Cart & favourites are stored on this phone'
        : 'Your data is on this device',
      queueCount > 0
        ? `${queueCount} change${queueCount !== 1 ? 's' : ''} waiting to upload`
        : 'No changes waiting',
      isOffline
        ? manualOffline
          ? 'Tap Go online in the header'
          : 'Turn internet back on'
        : 'Internet is connected',
      isOffline
        ? 'Paused until you are online'
        : isSyncing
          ? 'Uploading your queued changes…'
          : queueCount > 0
            ? 'Ready to upload'
            : 'All changes synced',
    ];

    const list = PIPELINE_META.map((meta, index) => ({
      ...meta,
      desc: statusDesc[index],
    }));

    let active = 0;
    if (isOffline) {
      active = queueCount > 0 ? 1 : 0;
    } else if (isSyncing) {
      active = 3;
    } else if (queueCount > 0) {
      active = 2;
    } else {
      active = 3;
    }

    return { steps: list, activeIndex: active };
  }, [isOffline, manualOffline, queueCount, isSyncing]);

  if (!offlinePipelineVisible) return null;

  return (
    <Card
      withBorder
      shadow="md"
      padding={offlinePipelineMinimized ? { base: 'xs', sm: 'sm' } : { base: 'sm', sm: 'md' }}
      radius="md"
      className="offline-process-card"
      role="region"
      aria-label="What happens when offline"
      aria-live="polite"
    >
      <Group
        justify="space-between"
        mb={offlinePipelineMinimized ? 0 : 'sm'}
        wrap="wrap"
        gap="xs"
        className="offline-process-card__header"
      >
        <Group gap="xs" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
          {isOffline ? <IconWifiOff size={18} /> : <IconWifi size={18} />}
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Title order={5} className="offline-process-card__title">
              {isOffline ? 'You are offline' : 'Back online — what happens next'}
            </Title>
            {offlinePipelineMinimized && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                Step {activeIndex + 1} of 4: {steps[activeIndex]?.title}
                {isSyncing ? ' (syncing…)' : ''}
              </Text>
            )}
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap" className="offline-process-card__actions">
          {manualOffline && (
            <Badge color="orange" variant="light" size="sm">
              Demo
            </Badge>
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => dispatch(setOfflinePipelineMinimized(!offlinePipelineMinimized))}
            aria-label={offlinePipelineMinimized ? 'Expand panel' : 'Minimise panel'}
            aria-expanded={!offlinePipelineMinimized}
          >
            {offlinePipelineMinimized ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
          </ActionIcon>
        </Group>
      </Group>

      {!offlinePipelineMinimized && (
        <>
          <Text size="sm" c="dimmed" mb="sm" className="offline-process-card__intro">
            {isOffline
              ? 'Add to cart or favourites — they save here first. When you go online, they sync automatically.'
              : 'You went online. Watch steps 3 and 4 — your queued changes upload to the server.'}
          </Text>

          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Behind the scenes
          </Text>

          <div className="pipeline-row" role="list">
            {steps.map((step, index) => (
              <div
                key={step.title}
                role="listitem"
                className={`pipeline-row__step${
                  index === activeIndex ? ' pipeline-row__step--active' : ''
                }${index < activeIndex ? ' pipeline-row__step--done' : ''}`}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                  <div className="pipeline-row__num">{index + 1}</div>
                  <Badge
                    size="xs"
                    variant="light"
                    color={index === activeIndex ? 'brand' : 'gray'}
                    className="pipeline-row__concept"
                  >
                    {step.concept}
                  </Badge>
                </Group>
                <Text size="sm" fw={600} className="pipeline-row__title">
                  {step.title}
                </Text>
                <Text size="xs" c="dimmed" className="pipeline-row__behind">
                  {step.behind}
                </Text>
                <Text size="xs" mt={4} className="pipeline-row__desc">
                  {step.desc}
                </Text>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
